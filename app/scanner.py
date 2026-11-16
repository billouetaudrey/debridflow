import asyncio
import html
import json
import os
import re
import time
import urllib.parse
from pathlib import Path
from typing import Any, Dict, List, Optional, Set

import httpx

from app.config import logger
from app.state import settings_db, state_lock

SCANNER_CACHE_FILE = Path("/data/scanner_cache.json") if Path("/data").is_dir() else Path(__file__).resolve().parent.parent / "data" / "scanner_cache.json"


def simplify_name(name: str) -> str:
    name_lower = name.strip().lower()
    for ext in (".mkv", ".mp4", ".avi", ".ts", ".wmv", ".m4v", ".mov"):
        if name_lower.endswith(ext):
            name_lower = name_lower[: -len(ext)]
            break
    return re.sub(r"[^a-z0-9]", "", name_lower)


def normalize_filename(filename: str) -> str:
    name = urllib.parse.unquote(filename)
    name = html.unescape(name)
    name = re.sub(r"[._\-]", " ", name)

    m = re.search(r"^(.*?)(?:\s)(19\d{2}|20\d{2}|S\d{2}E\d{2}|S\d{2})(?:\s|$)", name, flags=re.IGNORECASE)
    if m:
        name = f"{m.group(1)} {m.group(2)}"
    else:
        tags = [
            "mkv", "mp4", "avi", "1080p", "720p", "2160p", "4k", "web", "webrip",
            "bluray", "remux", "multi", "french", "vff", "vostfr", "x265", "h265",
            "truefrench", "proper", "repack", "ac3", "dts", "eac3", "x264", "h264"
        ]
        regex = r"\b(" + "|".join(tags) + r")\b"
        name = re.sub(regex, " ", name, flags=re.IGNORECASE)

    name = name.lower()
    name = re.sub(r"[^\w\s]", " ", name)
    name = re.sub(r"\s+", " ", name).strip()
    return name.title() if name else filename


class ScannerService:
    def __init__(self):
        self.status: str = "idle"  # idle, scanning, ready, error
        self.last_update: int = 0
        self.error_msg: str = ""
        self.local_cache: Dict[str, List[str]] = {}
        self.dead_symlinks: List[Dict[str, Any]] = []
        self.grouped_magnets: Dict[str, List[Dict[str, Any]]] = {}
        self.total_magnets: int = 0
        self.stats: Dict[str, int] = {
            "dead_symlinks": 0,
            "total_magnets": 0,
            "duplicates": 0,
            "unlinked": 0,
            "api_dead": 0,
            "local_links": 0,
        }
        self.progress: Dict[str, Any] = {
            "stage": "",
            "percent": 0,
            "files_scanned": 0,
            "dead_found": 0,
            "current_folder": "",
        }
        self._load_cache()

    def _load_cache(self) -> None:
        if SCANNER_CACHE_FILE.exists():
            try:
                with open(SCANNER_CACHE_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    saved_status = data.get("status", "idle")
                    # Ne jamais rester bloqué sur "scanning" après un redémarrage
                    self.status = "ready" if saved_status == "ready" else "idle"
                    self.last_update = data.get("last_update", 0)
                    self.local_cache = data.get("local_cache", {})
                    self.dead_symlinks = data.get("dead_symlinks", [])
                    self.grouped_magnets = data.get("grouped_magnets", {})
                    self.total_magnets = data.get("total_magnets", 0)
                    self.stats = data.get("stats", self.stats)
            except Exception as e:
                logger.warning(f"Erreur chargement cache scanner : {e}")

    def _save_cache(self) -> None:
        try:
            SCANNER_CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
            payload = {
                "status": "ready" if self.status == "ready" else "idle",
                "last_update": self.last_update,
                "local_cache": self.local_cache,
                "dead_symlinks": self.dead_symlinks,
                "grouped_magnets": self.grouped_magnets,
                "total_magnets": self.total_magnets,
                "stats": self.stats,
            }
            with open(SCANNER_CACHE_FILE, "w", encoding="utf-8") as f:
                json.dump(payload, f, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Erreur sauvegarde cache scanner : {e}")

    def _scan_filesystem_sync(self, scan_paths: List[Path]) -> tuple[Dict[str, List[str]], List[Dict[str, Any]]]:
        cache: Dict[str, List[str]] = {}
        dead: List[Dict[str, Any]] = []
        total_folders = len(scan_paths)
        files_scanned = 0
        dead_found = 0

        def add_to_cache(key: str, p: str):
            if not key:
                return
            if key not in cache:
                cache[key] = []
            if p not in cache[key]:
                cache[key].append(p)

        for f_idx, base_path in enumerate(scan_paths):
            if not base_path.is_dir() or not os.access(base_path, os.R_OK):
                continue

            folder_name = base_path.name
            self.progress["current_folder"] = folder_name
            self.progress["stage"] = f"Analyse des dossiers ({folder_name})..."

            try:
                # Parcours avec limitation de profondeur
                for root, dirs, files in os.walk(base_path, followlinks=False):
                    rel = Path(root).relative_to(base_path)
                    if len(rel.parts) > 5:
                        dirs.clear()
                        continue

                    # Vérifier dossiers et fichiers
                    all_entries = files + dirs
                    for entry_name in all_entries:
                        files_scanned += 1
                        if files_scanned % 30 == 0:
                            folder_pct = (f_idx / total_folders) if total_folders else 0
                            self.progress["percent"] = min(60, int(5 + folder_pct * 55))
                            self.progress["files_scanned"] = files_scanned
                            self.progress["dead_found"] = dead_found
                            self.progress["stage"] = f"Analyse {folder_name} : {files_scanned} fichiers ({dead_found} liens morts)..."

                        full_path = Path(root) / entry_name
                        try:
                            path_str = str(full_path)
                            simp = simplify_name(entry_name)
                            add_to_cache(simp, path_str)

                            if full_path.is_symlink():
                                target = ""
                                try:
                                    target = os.readlink(full_path)
                                    target_name = Path(target).name
                                    add_to_cache(simplify_name(target_name), path_str)

                                    # Découpage du chemin cible pour Season Packs
                                    for part in Path(target).parts:
                                        part_lower = part.lower()
                                        if part_lower not in ("/", "mnt", "alldebrid", "magnets", "virtual", "medias", "films", "series"):
                                            add_to_cache(simplify_name(part), path_str)
                                except OSError:
                                    pass

                                # Lien mort ?
                                if not os.path.exists(full_path):
                                    dead_found += 1
                                    self.progress["dead_found"] = dead_found
                                    dead.append({
                                        "path": path_str,
                                        "filename": entry_name,
                                        "target": target,
                                        "media_type": "unknown",
                                        "media_id": None,
                                        "media_title": "",
                                    })
                        except Exception:
                            continue
            except Exception as exc:
                logger.warning(f"Erreur lors du scan de {base_path} : {exc}")

        self.progress["files_scanned"] = files_scanned
        self.progress["dead_found"] = dead_found
        self.progress["percent"] = 65
        return cache, dead

    async def _match_arr_media(self, dead_symlinks: List[Dict[str, Any]]) -> None:
        radarr_url = settings_db.get("radarr_url", "http://127.0.0.1:7878").rstrip("/")
        radarr_key = settings_db.get("radarr_api_key", "").strip()
        sonarr_url = settings_db.get("sonarr_url", "http://127.0.0.1:8989").rstrip("/")
        sonarr_key = settings_db.get("sonarr_api_key", "").strip()

        movies = []
        series = []

        async with httpx.AsyncClient(timeout=15.0) as client:
            if radarr_key:
                try:
                    r = await client.get(f"{radarr_url}/api/v3/movie", headers={"X-Api-Key": radarr_key})
                    if r.status_code == 200:
                        movies = r.json()
                except Exception as e:
                    logger.debug(f"Scanner: impossible de joindre Radarr ({e})")

            if sonarr_key:
                try:
                    r = await client.get(f"{sonarr_url}/api/v3/series", headers={"X-Api-Key": sonarr_key})
                    if r.status_code == 200:
                        series = r.json()
                except Exception as e:
                    logger.debug(f"Scanner: impossible de joindre Sonarr ({e})")

        # Correspondance avec les chemins de liens morts
        for item in dead_symlinks:
            p = item["path"]
            matched = False

            # Test Radarr
            for m in movies:
                m_path = m.get("path")
                if m_path and (p.startswith(m_path + "/") or p == m_path):
                    item["media_type"] = "radarr"
                    item["media_id"] = m["id"]
                    item["media_title"] = m.get("title", "")
                    matched = True
                    break

            if matched:
                continue

            # Test Sonarr
            for s in series:
                s_path = s.get("path")
                if s_path and (p.startswith(s_path + "/") or p == s_path):
                    item["media_type"] = "sonarr"
                    item["media_id"] = s["id"]
                    item["media_title"] = s.get("title", "")
                    break

    async def start_scan(self) -> None:
        if self.status == "scanning":
            return

        self.status = "scanning"
        self.error_msg = ""
        self.progress = {
            "stage": "Démarrage de l'analyse...",
            "percent": 5,
            "files_scanned": 0,
            "dead_found": 0,
            "current_folder": "",
        }
        self._save_cache()

        async def _run():
            try:
                # 1. Chemins à scanner
                raw_paths = settings_db.get(
                    "media_scan_paths",
                    "/mnt/virtual/Medias/Films,/mnt/virtual/Medias/Series,/mnt/virtual/Medias/Replay,/mnt/virtual/Medias/Enfants,/mnt/virtual/Medias/Animes",
                )
                paths = [Path(p.strip()) for p in raw_paths.split(",") if p.strip()]

                # 2. Scan fichiers en thread
                cache, dead = await asyncio.to_thread(self._scan_filesystem_sync, paths)

                # 3. Réconciliation Radarr / Sonarr
                self.progress["stage"] = "Interrogation et réconciliation Radarr & Sonarr..."
                self.progress["percent"] = 68
                await self._match_arr_media(dead)

                # 4. Récupération des magnets AllDebrid
                api_key = settings_db.get("api_key", "").strip()
                agent = settings_db.get("agent", "PyRDT")
                grouped: Dict[str, List[Dict[str, Any]]] = {}
                total_mags = 0

                if api_key:
                    self.progress["stage"] = "Téléchargement de la liste des magnets AllDebrid..."
                    self.progress["percent"] = 78
                    async with httpx.AsyncClient(timeout=30.0) as client:
                        r = await client.get(
                            "https://api.alldebrid.com/v4.1/magnet/status",
                            params={"agent": agent, "apikey": api_key},
                        )
                        if r.status_code == 200:
                            data = r.json()
                            if data.get("status") == "success":
                                raw_mags = data.get("data", {}).get("magnets", [])
                                total_mags = len(raw_mags)
                                self.progress["stage"] = f"Traitement de {total_mags} magnets et détection des doublons..."
                                self.progress["percent"] = 88
                                for mag in raw_mags:
                                    orig_name = mag.get("filename") or mag.get("name") or "Nom indisponible"
                                    norm_name = normalize_filename(orig_name) or orig_name

                                    # Présent en local ?
                                    simp = simplify_name(orig_name)
                                    is_local = bool(cache.get(simp))

                                    mag_entry = {
                                        "id": mag.get("id"),
                                        "name": orig_name,
                                        "size": mag.get("size", 0),
                                        "statusCode": int(mag.get("statusCode") or 0),
                                        "status": mag.get("status", ""),
                                        "is_local": is_local,
                                        "is_dead": int(mag.get("statusCode") or 0) > 4,
                                        "downloaded": mag.get("downloaded", 0),
                                        "seeders": mag.get("seeders", 0),
                                    }

                                    if norm_name not in grouped:
                                        grouped[norm_name] = []
                                    grouped[norm_name].append(mag_entry)

                                # Trier chaque groupe : local en premier, statut 4 (ready), puis taille décroissante
                                for norm_name in grouped:
                                    grouped[norm_name].sort(
                                        key=lambda x: (
                                            1 if x["is_local"] else 0,
                                            1 if x["statusCode"] == 4 else 0,
                                            x["size"],
                                        ),
                                        reverse=True,
                                    )

                # Calcul des statistiques
                self.progress["stage"] = "Finalisation et calcul des statistiques..."
                self.progress["percent"] = 95
                duplicates_count = sum(len(mags) - 1 for mags in grouped.values() if len(mags) > 1)
                unlinked_count = sum(1 for mags in grouped.values() for m in mags if not m["is_local"])
                api_dead_count = sum(1 for mags in grouped.values() for m in mags if m["is_dead"])

                self.local_cache = cache
                self.dead_symlinks = dead
                self.grouped_magnets = grouped
                self.total_magnets = total_mags
                self.stats = {
                    "dead_symlinks": len(dead),
                    "total_magnets": total_mags,
                    "duplicates": duplicates_count,
                    "unlinked": unlinked_count,
                    "api_dead": api_dead_count,
                    "local_links": len(cache),
                }
                self.last_update = int(time.time())
                self.status = "ready"
                self.progress["stage"] = "Scan terminé avec succès"
                self.progress["percent"] = 100
                self._save_cache()
                logger.info(
                    f"Scan médiathèque terminé : {len(dead)} lien(s) mort(s), {total_mags} magnet(s), {duplicates_count} doublon(s)."
                )
            except Exception as e:
                logger.error(f"Erreur durant le scan scanner : {e}")
                self.status = "error"
                self.error_msg = str(e)
                self.progress["stage"] = f"Erreur : {e}"
                self.progress["percent"] = 0
                self._save_cache()

        asyncio.create_task(_run())

    async def clean_dead_symlinks(self, target_paths: Optional[List[str]] = None) -> int:
        deleted = 0
        paths_to_clean = target_paths if target_paths else [d["path"] for d in self.dead_symlinks]
        for p_str in paths_to_clean:
            try:
                p = Path(p_str)
                if p.is_symlink() and not p.exists():
                    p.unlink(missing_ok=True)
                    deleted += 1
            except OSError:
                pass

        # Mettre à jour la liste des liens morts
        cleaned_set = set(paths_to_clean)
        self.dead_symlinks = [d for d in self.dead_symlinks if d["path"] not in cleaned_set]
        self.stats["dead_symlinks"] = len(self.dead_symlinks)
        self._save_cache()
        return deleted

    async def delete_magnets(self, magnet_ids_and_names: List[Dict[str, Any]]) -> int:
        api_key = settings_db.get("api_key", "").strip()
        agent = settings_db.get("agent", "PyRDT")
        deleted_count = 0
        deleted_ids: Set[str] = set()

        async with httpx.AsyncClient(timeout=15.0) as client:
            for item in magnet_ids_and_names:
                mag_id = item.get("id")
                if not mag_id:
                    continue
                raw_name = item.get("name", "")

                # 1. Suppression AllDebrid
                try:
                    r = await client.get(
                        "https://api.alldebrid.com/v4.1/magnet/delete",
                        params={"agent": agent, "apikey": api_key, "id": mag_id},
                    )
                    if r.status_code == 200:
                        data = r.json()
                        if data.get("status") == "success":
                            deleted_count += 1
                            deleted_ids.add(str(mag_id))
                        elif data.get("error", {}).get("code") == "MAGNET_INVALID_ID":
                            deleted_count += 1
                            deleted_ids.add(str(mag_id))
                        else:
                            logger.warning(f"AllDebrid delete magnet {mag_id} returned: {data}")
                    else:
                        logger.warning(f"AllDebrid delete magnet {mag_id} HTTP error: {r.status_code}")
                except Exception as e:
                    logger.error(f"Erreur requête AllDebrid delete magnet {mag_id} : {e}")

                # 2. Suppression locale simultanée des symlinks associés
                simp = simplify_name(raw_name)
                for path_str in self.local_cache.get(simp, []):
                    try:
                        p = Path(path_str)
                        if p.is_symlink():
                            p.unlink(missing_ok=True)
                    except OSError:
                        pass

        # 3. Mettre à jour immédiatement la mémoire et le cache disque
        if deleted_ids:
            new_grouped: Dict[str, List[Dict[str, Any]]] = {}
            for norm_name, mags in self.grouped_magnets.items():
                remaining = [m for m in mags if str(m.get("id")) not in deleted_ids]
                if remaining:
                    new_grouped[norm_name] = remaining
            self.grouped_magnets = new_grouped
            self.total_magnets = sum(len(mags) for mags in self.grouped_magnets.values())
            self.stats["total_magnets"] = self.total_magnets
            self.stats["duplicates"] = sum(len(mags) - 1 for mags in self.grouped_magnets.values() if len(mags) > 1)
            self.stats["unlinked"] = sum(1 for mags in self.grouped_magnets.values() for m in mags if not m.get("is_local"))
            self.stats["api_dead"] = sum(1 for mags in self.grouped_magnets.values() for m in mags if m.get("is_dead"))
            self._save_cache()

        # 4. Lancer une réconciliation complète en tâche de fond
        await self.start_scan()
        return deleted_count

    async def trigger_research_arr(self, media_type: str, media_id: int, dead_path: Optional[str] = None) -> Dict[str, Any]:
        # Si un chemin de lien mort est spécifié, on le purge d'abord
        if dead_path:
            try:
                p = Path(dead_path)
                if p.is_symlink():
                    p.unlink(missing_ok=True)
            except OSError:
                pass

        radarr_url = settings_db.get("radarr_url", "http://127.0.0.1:7878").rstrip("/")
        radarr_key = settings_db.get("radarr_api_key", "").strip()
        sonarr_url = settings_db.get("sonarr_url", "http://127.0.0.1:8989").rstrip("/")
        sonarr_key = settings_db.get("sonarr_api_key", "").strip()

        async with httpx.AsyncClient(timeout=20.0) as client:
            if media_type == "radarr" and radarr_key:
                # 1. Rescan du film pour actualiser l'absence du fichier
                await client.post(
                    f"{radarr_url}/api/v3/command",
                    headers={"X-Api-Key": radarr_key},
                    json={"name": "RescanMovie", "movieId": int(media_id)},
                )
                await asyncio.sleep(1)
                # 2. Déclenchement de la recherche automatique
                r = await client.post(
                    f"{radarr_url}/api/v3/command",
                    headers={"X-Api-Key": radarr_key},
                    json={"name": "MoviesSearch", "movieIds": [int(media_id)]},
                )
                return {"status": "success", "message": "Recherche Radarr lancée avec succès", "data": r.json()}

            elif media_type == "sonarr" and sonarr_key:
                # 1. Rescan de la série
                await client.post(
                    f"{sonarr_url}/api/v3/command",
                    headers={"X-Api-Key": sonarr_key},
                    json={"name": "RescanSeries", "seriesId": int(media_id)},
                )
                await asyncio.sleep(1)
                # 2. Recherche automatique de la série
                r = await client.post(
                    f"{sonarr_url}/api/v3/command",
                    headers={"X-Api-Key": sonarr_key},
                    json={"name": "SeriesSearch", "seriesId": int(media_id)},
                )
                return {"status": "success", "message": "Recherche Sonarr lancée avec succès", "data": r.json()}

        return {"status": "error", "message": "Configuration Radarr ou Sonarr manquante ou invalide"}


scanner_service = ScannerService()

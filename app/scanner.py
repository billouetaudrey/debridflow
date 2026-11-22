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
        self._pending_scan: bool = False
        self._last_scan_end: float = 0.0
        self._min_cooldown: float = 45.0
        self._debounce_task: Optional[asyncio.Task] = None
        self._stop_requested: bool = False
        self._current_scan_task: Optional[asyncio.Task] = None
        self.dir_mtimes: Dict[str, float] = {}
        self.file_entries: Dict[str, List[Dict[str, Any]]] = {}
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
                    self.dir_mtimes = data.get("dir_mtimes", {})
                    self.file_entries = data.get("file_entries", {})
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
                "dir_mtimes": self.dir_mtimes,
                "file_entries": self.file_entries,
            }
            with open(SCANNER_CACHE_FILE, "w", encoding="utf-8") as f:
                json.dump(payload, f, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Erreur sauvegarde cache scanner : {e}")

    def _scan_filesystem_sync(
        self, scan_paths: List[Path], force_full: bool = False
    ) -> tuple[Dict[str, List[str]], List[Dict[str, Any]]]:
        # 1. Charger la liste des magnets montés dans rclone en 0.3s (évite des milliers d'appels réseau)
        rclone_mount = Path(settings_db.get("rclone_mount_dir", "/mnt/alldebrid/magnets"))
        active_magnets: Set[str] = set()
        try:
            if rclone_mount.is_dir():
                active_magnets = set(os.listdir(rclone_mount))
        except Exception as e:
            logger.warning(f"Scanner: impossible de lister le dossier rclone {rclone_mount} : {e}")

        # Si un scan complet est forcé, vider le cache de répertoires
        if force_full:
            self.dir_mtimes.clear()
            self.file_entries.clear()

        reused_folders = 0
        updated_folders = 0

        # 2. Parcours incrémental par horodatage (mtime)
        for f_idx, base_path in enumerate(scan_paths):
            if not base_path.is_dir() or not os.access(base_path, os.R_OK):
                continue

            folder_name = base_path.name
            self.progress["current_folder"] = folder_name
            self.progress["stage"] = f"Vérification des dossiers ({folder_name})..."

            try:
                with os.scandir(base_path) as it:
                    entries_list = list(it)

                total_entries = len(entries_list)
                for e_idx, entry in enumerate(entries_list):
                    if self._stop_requested:
                        logger.info("Scanner: arrêt anticipé (interruption demandée).")
                        break

                    if e_idx % 25 == 0:
                        pct = min(58, int(10 + (e_idx / max(1, total_entries)) * 48))
                        self.progress["percent"] = pct
                        self.progress["stage"] = f"Indexation {folder_name} ({e_idx}/{total_entries})..."

                    entry_path_str = entry.path

                    # Cas 1 : Sous-dossier (ex: dossier de film ou série)
                    if entry.is_dir(follow_symlinks=False):
                        try:
                            st = entry.stat()
                            mtime = st.st_mtime
                            # Détecter également les changements dans les sous-dossiers immédiats (ex: Saison 02, etc.)
                            try:
                                with os.scandir(entry.path) as sub_it:
                                    for sub_entry in sub_it:
                                        if sub_entry.is_dir(follow_symlinks=False):
                                            try:
                                                sub_mtime = sub_entry.stat().st_mtime
                                                if sub_mtime > mtime:
                                                    mtime = sub_mtime
                                            except OSError:
                                                pass
                            except OSError:
                                pass
                        except OSError:
                            continue

                        cached_mtime = self.dir_mtimes.get(entry_path_str, 0.0)

                        # Si le dossier est inchangé et déjà en cache -> réutilisation instantanée !
                        if not force_full and cached_mtime > 0 and mtime <= cached_mtime and entry_path_str in self.file_entries:
                            reused_folders += 1
                            continue

                        # Le dossier est nouveau ou modifié -> indexation de ses fichiers
                        updated_folders += 1
                        dir_items: List[Dict[str, Any]] = []
                        try:
                            for root, dirs, files in os.walk(entry.path, followlinks=False):
                                if self._stop_requested:
                                    break
                                rel = Path(root).relative_to(entry.path)
                                if len(rel.parts) > 4:
                                    dirs.clear()
                                    continue
                                for fname in files + dirs:
                                    fpath = Path(root) / fname
                                    fpath_str = str(fpath)
                                    is_link = fpath.is_symlink()
                                    target = ""
                                    if is_link:
                                        try:
                                            target = os.readlink(fpath)
                                        except OSError:
                                            target = ""

                                    simp_keys = [simplify_name(fname)]
                                    if target:
                                        simp_keys.append(simplify_name(Path(target).name))
                                        for part in Path(target).parts:
                                            pl = part.lower()
                                            if pl not in ("/", "mnt", "alldebrid", "magnets", "virtual", "medias", "films", "series"):
                                                simp_keys.append(simplify_name(part))

                                    dir_items.append({
                                        "path": fpath_str,
                                        "name": fname,
                                        "is_symlink": is_link,
                                        "target": target,
                                        "simp_keys": [k for k in set(simp_keys) if k],
                                    })
                        except Exception as e:
                            logger.warning(f"Scanner: erreur indexation dossier {entry_path_str} : {e}")

                        self.file_entries[entry_path_str] = dir_items
                        self.dir_mtimes[entry_path_str] = mtime

                    # Cas 2 : Fichier direct à la racine
                    elif entry.is_file(follow_symlinks=False) or entry.is_symlink():
                        is_link = entry.is_symlink()
                        target = ""
                        if is_link:
                            try:
                                target = os.readlink(entry.path)
                            except OSError:
                                target = ""
                        simp_keys = [simplify_name(entry.name)]
                        if target:
                            simp_keys.append(simplify_name(Path(target).name))
                        self.file_entries[entry_path_str] = [{
                            "path": entry_path_str,
                            "name": entry.name,
                            "is_symlink": is_link,
                            "target": target,
                            "simp_keys": [k for k in set(simp_keys) if k],
                        }]

            except Exception as exc:
                logger.warning(f"Erreur lors du scan de {base_path} : {exc}")

        # Nettoyage des dossiers supprimés du disque
        all_cached_dirs = list(self.file_entries.keys())
        for cdir in all_cached_dirs:
            if not os.path.exists(cdir):
                self.file_entries.pop(cdir, None)
                self.dir_mtimes.pop(cdir, None)

        # 3. Assembler le cache de recherche et valider les liens morts
        self.progress["stage"] = "Validation des liens symboliques..."
        self.progress["percent"] = 62

        cache: Dict[str, List[str]] = {}
        dead: List[Dict[str, Any]] = []

        def add_to_cache(key: str, p: str):
            if not key:
                return
            if key not in cache:
                cache[key] = []
            if p not in cache[key]:
                cache[key].append(p)

        dead_found = 0
        total_files = sum(len(items) for items in self.file_entries.values())
        rclone_parts = rclone_mount.parts

        for dir_path, items in self.file_entries.items():
            for item in items:
                p_str = item["path"]
                for sk in item["simp_keys"]:
                    add_to_cache(sk, p_str)

                # Validation rapide des liens morts
                if item["is_symlink"]:
                    target = item["target"]
                    is_dead = False
                    if not target:
                        is_dead = True
                    else:
                        t_parts = Path(target).parts
                        # Si le lien pointe vers rclone_mount (ex: /mnt/alldebrid/magnets/<release>/...)
                        if len(t_parts) > len(rclone_parts) and t_parts[:len(rclone_parts)] == rclone_parts:
                            magnet_folder_name = t_parts[len(rclone_parts)]
                            if active_magnets and magnet_folder_name not in active_magnets:
                                is_dead = True
                        else:
                            # Cible externe à rclone -> test exists
                            if not os.path.exists(p_str):
                                is_dead = True

                    if is_dead:
                        dead_found += 1
                        dead.append({
                            "path": p_str,
                            "filename": item["name"],
                            "target": target,
                            "media_type": "unknown",
                            "media_id": None,
                            "media_title": "",
                        })

        self.progress["files_scanned"] = total_files
        self.progress["dead_found"] = dead_found
        self.progress["percent"] = 65
        logger.info(
            f"Scanner [Incrémental] : {total_files} fichiers indexés "
            f"({reused_folders} dossiers en cache réutilisés, {updated_folders} analysés). "
            f"{dead_found} lien(s) mort(s)."
        )
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

    async def start_scan(self, force: bool = False, force_full: bool = False) -> Dict[str, Any]:
        now = time.time()

        # 1. Si un scan est déjà en cours, on regroupe (coalescing)
        if self.status == "scanning":
            self._pending_scan = True
            logger.info("Scanner: scan déjà en cours, prochaine demande mise en file d'attente (coalescing).")
            return {"status": "scanning", "queued": True}

        # 2. Sécurité anti-flood / Cooldown pour les appels automatiques (webhooks multiples)
        elapsed = now - self._last_scan_end
        if not force and self._last_scan_end > 0 and elapsed < self._min_cooldown:
            remaining = int(self._min_cooldown - elapsed)
            logger.info(f"Scanner: cooldown actif ({remaining}s restantes). Demande différée.")
            self._pending_scan = True
            if not self._debounce_task or self._debounce_task.done():
                async def _delayed():
                    await asyncio.sleep(remaining + 2)
                    if self._pending_scan and self.status != "scanning":
                        self._pending_scan = False
                        await self.start_scan(force=True)
                self._debounce_task = asyncio.create_task(_delayed())
            return {"status": "delayed", "cooldown_remaining": remaining}

        # Annuler toute tâche différée car on démarre maintenant
        if self._debounce_task and not self._debounce_task.done():
            self._debounce_task.cancel()
            self._debounce_task = None
        self._pending_scan = False
        self._stop_requested = False

        self.status = "scanning"
        self.error_msg = ""
        self.progress = {
            "stage": "Démarrage de l'analyse (Mode incrémental rapide)..." if not force_full else "Démarrage de l'analyse (Scan complet forcé)...",
            "percent": 5,
            "files_scanned": 0,
            "dead_found": 0,
            "current_folder": "",
        }
        self._save_cache()

        async def _run():
            try:
                if self._stop_requested:
                    self._abort_scan()
                    return

                # 1. Chemins à scanner
                raw_paths = settings_db.get(
                    "media_scan_paths",
                    "/mnt/virtual/Medias/Films,/mnt/virtual/Medias/Series,/mnt/virtual/Medias/Replay,/mnt/virtual/Medias/Enfants,/mnt/virtual/Medias/Animes",
                )
                paths = [Path(p.strip()) for p in raw_paths.split(",") if p.strip()]
                scan_start_time = time.time()
                try:
                    from app.notifications import notifier
                    await notifier.notify_scan_start(is_full=force_full, paths=paths)
                except Exception as notif_err:
                    logger.warning(f"Scanner: erreur notif scan start : {notif_err}")

                # 2. Scan fichiers en thread avec cache incrémental
                cache, dead = await asyncio.to_thread(self._scan_filesystem_sync, paths, force_full)

                if self._stop_requested:
                    self._abort_scan()
                    return

                # 3. Réconciliation Radarr / Sonarr
                self.progress["stage"] = "Interrogation et réconciliation Radarr & Sonarr..."
                self.progress["percent"] = 68
                await self._match_arr_media(dead)

                if dead:
                    try:
                        from app.notifications import notifier
                        await notifier.notify_dead_links_detected(len(dead), dead)
                    except Exception as notif_err:
                        logger.warning(f"Scanner: erreur notif dead links : {notif_err}")

                if self._stop_requested:
                    self._abort_scan()
                    return

                # 4. Récupération des magnets AllDebrid
                api_key = settings_db.get("api_key", "").strip()
                agent = settings_db.get("agent", "OmniSym")
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
                                    if self._stop_requested:
                                        self._abort_scan()
                                        return
                                    orig_name = mag.get("filename") or mag.get("name") or "Nom indisponible"
                                    norm_name = normalize_filename(orig_name) or orig_name

                                    # Présent en local ?
                                    simp = simplify_name(orig_name)
                                    is_local = bool(cache.get(simp))

                                    mag_entry = {
                                        "id": mag.get("id"),
                                        "name": orig_name,
                                        "hash": mag.get("hash") or "",
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

                if self._stop_requested:
                    self._abort_scan()
                    return

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
                self._last_scan_end = time.time()
                self.progress["stage"] = "Scan terminé avec succès"
                self.progress["percent"] = 100
                self._save_cache()
                scan_duration = time.time() - scan_start_time
                try:
                    from app.notifications import notifier
                    await notifier.notify_scan_complete(stats=self.stats, duration=scan_duration)
                except Exception as notif_err:
                    logger.warning(f"Scanner: erreur notif scan complete : {notif_err}")
                logger.info(
                    f"Scan médiathèque terminé : {len(dead)} lien(s) mort(s), {total_mags} magnet(s), {duplicates_count} doublon(s)."
                )

                # Si de nouveaux téléchargements sont arrivés pendant l'analyse
                if self._pending_scan:
                    self._pending_scan = False
                    async def _run_pending_delayed():
                        logger.info("Scanner: exécution différée du scan pour les téléchargements reçus pendant le scan précédent (tampon 15s)...")
                        await asyncio.sleep(15)
                        await self.start_scan(force=True)
                    asyncio.create_task(_run_pending_delayed())
            except asyncio.CancelledError:
                logger.info("Scanner: tâche de scan annulée.")
                self._abort_scan()
            except Exception as e:
                logger.error(f"Erreur durant le scan scanner : {e}")
                self.status = "error"
                self.error_msg = str(e)
                self._last_scan_end = time.time()
                self.progress["stage"] = f"Erreur : {e}"
                self.progress["percent"] = 0
                self._save_cache()
                try:
                    from app.notifications import notifier
                    await notifier.notify_error("Scan de Médiathèque", str(e))
                except Exception:
                    pass

        self._current_scan_task = asyncio.create_task(_run())
        return {"status": "scanning"}

    def _abort_scan(self) -> None:
        self.status = "ready"
        self._pending_scan = False
        self._stop_requested = False
        self.progress["stage"] = "Scan interrompu par l'utilisateur."
        self.progress["percent"] = 0
        self._save_cache()
        logger.info("Scanner: scan interrompu avec succès.")

    async def stop_scan(self) -> Dict[str, Any]:
        logger.info("Scanner: demande d'interruption du scan reçue.")
        self._stop_requested = True
        self._pending_scan = False
        if self._debounce_task and not self._debounce_task.done():
            self._debounce_task.cancel()
            self._debounce_task = None
        if self._current_scan_task and not self._current_scan_task.done():
            self._current_scan_task.cancel()
        self._abort_scan()
        return {"status": "stopped", "message": "Scan interrompu"}

    async def clean_dead_symlinks(
        self,
        target_paths: Optional[List[str]] = None,
        delete_from_arr: bool = False
    ) -> Dict[str, Any]:
        paths_to_clean = target_paths if target_paths else [d["path"] for d in self.dead_symlinks]
        dead_map = {d["path"]: d for d in self.dead_symlinks}
        deleted_local = 0

        # 1. Suppression des symlinks locaux
        for p_str in paths_to_clean:
            try:
                p = Path(p_str)
                if p.is_symlink() and not p.exists():
                    p.unlink(missing_ok=True)
                    deleted_local += 1
            except OSError:
                pass

        # 2. Suppression dans Radarr / Sonarr si demandée
        arr_deleted = 0
        if delete_from_arr:
            radarr_url = settings_db.get("radarr_url", "http://127.0.0.1:7878").rstrip("/")
            radarr_key = settings_db.get("radarr_api_key", "").strip()
            sonarr_url = settings_db.get("sonarr_url", "http://127.0.0.1:8989").rstrip("/")
            sonarr_key = settings_db.get("sonarr_api_key", "").strip()

            async with httpx.AsyncClient(timeout=15.0) as client:
                for p_str in paths_to_clean:
                    item = dead_map.get(p_str)
                    if not item:
                        continue
                    m_type = item.get("media_type")
                    m_id = item.get("media_id")
                    if not m_id:
                        continue

                    if m_type == "radarr" and radarr_key:
                        try:
                            r = await client.delete(
                                f"{radarr_url}/api/v3/movie/{m_id}",
                                headers={"X-Api-Key": radarr_key},
                                params={"deleteFiles": "false", "addImportExclusion": "false"},
                            )
                            if r.status_code in (200, 204):
                                arr_deleted += 1
                                logger.info(f"Scanner: film supprimé de Radarr (ID: {m_id}, Titre: {item.get('media_title')})")
                            else:
                                logger.warning(f"Scanner: suppression Radarr movie {m_id} statut: {r.status_code}")
                        except Exception as e:
                            logger.error(f"Scanner: erreur suppression Radarr : {e}")

                    elif m_type == "sonarr" and sonarr_key:
                        try:
                            r_ep = await client.get(
                                f"{sonarr_url}/api/v3/episodefile",
                                headers={"X-Api-Key": sonarr_key},
                                params={"seriesId": m_id},
                            )
                            deleted_ep = False
                            if r_ep.status_code == 200:
                                ep_files = r_ep.json()
                                p_name = Path(p_str).name
                                matched_ep = next(
                                    (ef for ef in ep_files if ef.get("path") == p_str or Path(ef.get("path", "")).name == p_name),
                                    None,
                                )
                                if matched_ep:
                                    r_del = await client.delete(
                                        f"{sonarr_url}/api/v3/episodefile/{matched_ep['id']}",
                                        headers={"X-Api-Key": sonarr_key},
                                    )
                                    if r_del.status_code in (200, 204):
                                        arr_deleted += 1
                                        deleted_ep = True
                                        logger.info(f"Scanner: fichier d'épisode {matched_ep['id']} supprimé de Sonarr")
                                    if len(ep_files) <= 1:
                                        await client.delete(
                                            f"{sonarr_url}/api/v3/series/{m_id}",
                                            headers={"X-Api-Key": sonarr_key},
                                            params={"deleteFiles": "false", "addImportListExclusion": "false"},
                                        )
                                        logger.info(f"Scanner: série vide {m_id} supprimée de Sonarr.")
                                    else:
                                        await client.post(
                                            f"{sonarr_url}/api/v3/command",
                                            headers={"X-Api-Key": sonarr_key},
                                            json={"name": "RescanSeries", "seriesId": int(m_id)},
                                        )

                            if not deleted_ep:
                                r_s = await client.delete(
                                    f"{sonarr_url}/api/v3/series/{m_id}",
                                    headers={"X-Api-Key": sonarr_key},
                                    params={"deleteFiles": "false", "addImportListExclusion": "false"},
                                )
                                if r_s.status_code in (200, 204):
                                    arr_deleted += 1
                                    logger.info(f"Scanner: série {m_id} supprimée de Sonarr ({item.get('media_title')})")
                        except Exception as e:
                            logger.error(f"Scanner: erreur suppression Sonarr : {e}")

        # 3. Suppression sur AllDebrid si le magnet existe encore sur AllDebrid
        ad_deleted = 0
        api_key = settings_db.get("api_key", "").strip()
        agent = settings_db.get("agent", "OmniSym")
        rclone_mount = Path(settings_db.get("rclone_mount_dir", "/mnt/alldebrid/magnets"))
        rclone_parts = rclone_mount.parts

        mags_to_delete_on_ad: Set[str] = set()
        for p_str in paths_to_clean:
            item = dead_map.get(p_str)
            if not item:
                continue
            target = item.get("target", "")
            if not target:
                continue
            t_parts = Path(target).parts
            if len(t_parts) > len(rclone_parts) and t_parts[:len(rclone_parts)] == rclone_parts:
                mag_folder_name = t_parts[len(rclone_parts)]
                simp_folder = simplify_name(mag_folder_name)
                for norm_name, mags in self.grouped_magnets.items():
                    for mag in mags:
                        if mag.get("name") == mag_folder_name or simplify_name(mag.get("name", "")) == simp_folder:
                            mags_to_delete_on_ad.add(str(mag.get("id")))

        if mags_to_delete_on_ad and api_key:
            async with httpx.AsyncClient(timeout=15.0) as client:
                for mag_id in mags_to_delete_on_ad:
                    try:
                        r = await client.get(
                            "https://api.alldebrid.com/v4.1/magnet/delete",
                            params={"agent": agent, "apikey": api_key, "id": mag_id},
                        )
                        if r.status_code == 200:
                            data = r.json()
                            if data.get("status") == "success" or data.get("error", {}).get("code") == "MAGNET_INVALID_ID":
                                ad_deleted += 1
                                logger.info(f"Scanner: magnet orphelin {mag_id} purgé sur AllDebrid.")
                    except Exception as e:
                        logger.warning(f"Scanner: erreur suppression AllDebrid magnet {mag_id} : {e}")

        # 4. Mettre à jour la liste des liens morts
        cleaned_set = set(paths_to_clean)
        self.dead_symlinks = [d for d in self.dead_symlinks if d["path"] not in cleaned_set]
        self.stats["dead_symlinks"] = len(self.dead_symlinks)
        self._save_cache()
        if deleted_local > 0:
            try:
                from app.notifications import notifier
                await notifier.notify_dead_links_cleaned(deleted_local, deleted_arr=arr_deleted > 0)
            except Exception as notif_err:
                logger.warning(f"Scanner: erreur notif clean dead : {notif_err}")
        return {"deleted": deleted_local, "deleted_arr": arr_deleted, "deleted_ad": ad_deleted}

    async def delete_magnets(
        self,
        magnet_ids_and_names: List[Dict[str, Any]],
        delete_local: bool = True
    ) -> int:
        api_key = settings_db.get("api_key", "").strip()
        agent = settings_db.get("agent", "OmniSym")
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

                # 2. Suppression locale simultanée des symlinks associés (uniquement si delete_local=True)
                if delete_local:
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

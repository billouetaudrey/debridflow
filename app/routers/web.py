import hashlib
import html
import re
import time
import urllib.parse
from pathlib import Path
from typing import Any, Dict, List, Optional

import httpx
from fastapi import APIRouter, File, Form, Request, Response, UploadFile
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse

from app.alldebrid import (
    alldebrid_get_statuses,
    alldebrid_upload_file,
    alldebrid_upload_magnet,
    check_alldebrid_api_health,
)
from app.bencode import parse_magnet_uri, parse_torrent_bytes, sanitize_filename
from app.config import DEFAULT_SERVICES, DEFAULT_SETTINGS, logger
from app.providers import SUPPORTED_PROVIDERS, get_provider, normalize_provider_name
from app.state import (
    api_health,
    get_services_config,
    rebuild_categories,
    resolve_service,
    save_state,
    settings_db,
    state_lock,
    torrents_db,
)

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"
TEMPLATES_DIR = BASE_DIR / "templates"


@router.get("/api/ui/queue")
async def ui_queue_feed():
    async with state_lock:
        items_sorted = sorted(torrents_db.items(), key=lambda kv: kv[1].get("added_on", 0), reverse=True)
        payload = [
            {
                "hash": h,
                "ad_id": item.get("ad_id", "-"),
                "name": item.get("name") or h,
                "size": int(item.get("size") or 0),
                "category": item.get("category") or "",
                "transfer_mode": item.get("transfer_mode") or resolve_service(item.get("category", ""))[0],
                "save_path": item.get("save_path") or "",
                "state": item.get("state") or "downloading",
                "progress": float(item.get("progress") or 0.0),
                "dlspeed": int(item.get("dlspeed") or 0),
                "avg_speed": int(item.get("avg_speed") or 0),
                "error_msg": item.get("error_msg") or "",
                "is_ddl": bool(item.get("is_ddl", False)),
                "download_url": item.get("download_url") or "",
                "is_debrided": bool(
                    item.get("is_debrided")
                    or item.get("state") in ("copying", "checkingDL", "pausedUP", "stalledUP")
                    or (item.get("is_ddl") and bool(item.get("download_url")))
                ),
                "debrid_cached": bool(item.get("debrid_cached", False)),
                "seeders": int(item.get("seeders") or 0),
                "cloud_status": str(item.get("cloud_status") or ""),
            }
            for h, item in items_sorted
        ]
        last_stat = dict(settings_db.get("last_download_stat", {}))
        max_concurrent = int(settings_db.get("max_concurrent_downloads", 3))
        active_dl_count = sum(
            1 for it in torrents_db.values()
            if it.get("state") == "copying" or (it.get("is_ddl") and it.get("state") in ("copying", "downloading"))
        )
    return JSONResponse(
        {
            "items": payload,
            "api_health": dict(api_health),
            "last_download_stat": last_stat,
            "download_speed_limit": float(settings_db.get("download_speed_limit", 0)),
            "max_concurrent_downloads": max_concurrent,
            "active_downloads_count": active_dl_count,
            "hide_last_download_name": bool(settings_db.get("hide_last_download_name", True)),
        },
        headers={"Cache-Control": "no-store"},
    )


@router.post("/api/queue/force-sync")
async def api_force_sync():
    """Force une actualisation immédiate de tous les torrents auprès du débrideur et notifie les Arrs."""
    results: Dict[str, Any] = {
        "ok": True,
        "debrid_synced": 0,
        "arr_synced": [],
        "errors": [],
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        # 1. Vérification santé API Débrideur
        try:
            await check_alldebrid_api_health(client)
        except Exception as e:
            results["errors"].append(f"Debrid health: {e}")

        # 2. Interrogation directe AllDebrid pour tous les torrents actifs
        if settings_db.get("api_key"):
            try:
                async with state_lock:
                    active_items = [
                        (h, dict(item))
                        for h, item in torrents_db.items()
                        if item.get("state") not in ("pausedUP", "stalledUP", "pausedDL", "error")
                    ]
                tracked_ids = [
                    int(item["ad_id"])
                    for _, item in active_items
                    if item.get("ad_id") and str(item.get("ad_id")).isdigit()
                ]
                if tracked_ids:
                    statuses = await alldebrid_get_statuses(client, tracked_ids)
                    async with state_lock:
                        for info_hash, item in active_items:
                            ad_id = int(item.get("ad_id") or 0)
                            if ad_id in statuses:
                                ad_info = statuses[ad_id]
                                status_code = int(ad_info.get("statusCode", 0))
                                ad_filename = ad_info.get("filename") or item.get("name")
                                ad_size = int(ad_info.get("size") or item.get("size") or 0)
                                ad_status_str = str(ad_info.get("status") or "").strip()

                                if status_code == 4:
                                    torrents_db[info_hash]["name"] = ad_filename
                                    torrents_db[info_hash]["size"] = ad_size
                                    torrents_db[info_hash]["progress"] = 0.99
                                    torrents_db[info_hash]["is_debrided"] = True
                                    torrents_db[info_hash]["cloud_status"] = "Débridé"
                                    if torrents_db[info_hash].get("state") not in ("copying", "pausedUP", "stalledUP"):
                                        torrents_db[info_hash]["state"] = "checkingDL"
                                else:
                                    downloaded = int(ad_info.get("downloaded") or 0)
                                    progress = (downloaded / ad_size) if ad_size > 0 else 0.1
                                    seeders = int(ad_info.get("seeders") or 0)
                                    cloud_speed = int(ad_info.get("downloadSpeed") or 0)
                                    torrents_db[info_hash]["name"] = ad_filename
                                    torrents_db[info_hash]["size"] = ad_size
                                    torrents_db[info_hash]["progress"] = min(0.99, round(progress, 4))
                                    torrents_db[info_hash]["is_debrided"] = False
                                    torrents_db[info_hash]["seeders"] = seeders
                                    torrents_db[info_hash]["cloud_speed"] = cloud_speed
                                    torrents_db[info_hash]["cloud_status"] = ad_status_str or "Téléchargement cloud"
                        save_state()
                    results["debrid_synced"] = len(statuses)
            except Exception as exc:
                logger.warning(f"Erreur force_sync debrid: {exc}")
                results["errors"].append(f"Debrid: {exc}")

        # 3. Notification aux applications *Arr (Radarr, Sonarr, Whisparr)
        arr_targets = [
            ("Radarr", settings_db.get("radarr_url", "http://127.0.0.1:7878"), settings_db.get("radarr_api_key", "")),
            ("Sonarr", settings_db.get("sonarr_url", "http://127.0.0.1:8989"), settings_db.get("sonarr_api_key", "")),
            ("Whisparr", settings_db.get("whisparr_url", "http://127.0.0.1:6969"), settings_db.get("whisparr_api_key", "")),
        ]
        for arr_name, arr_url, arr_key in arr_targets:
            if arr_key and arr_url:
                clean_url = arr_url.rstrip("/")
                try:
                    r = await client.post(
                        f"{clean_url}/api/v3/command",
                        headers={"X-Api-Key": arr_key},
                        json={"name": "RefreshMonitoredDownloads"},
                        timeout=3.5,
                    )
                    if r.status_code in (200, 201):
                        results["arr_synced"].append(arr_name)
                    else:
                        results["errors"].append(f"{arr_name}: HTTP {r.status_code}")
                except Exception as arr_err:
                    results["errors"].append(f"{arr_name}: {str(arr_err)}")

    return JSONResponse(results)


@router.post("/api/torrents/upload")
async def api_upload_torrent(
    magnet: Optional[str] = Form(None),
    category: Optional[str] = Form("torrent-direct"),
    transfer_mode: Optional[str] = Form("auto"),
    torrent_files: Optional[List[UploadFile]] = File(None),
    torrent_file: Optional[UploadFile] = File(None),
    ddl_links: Optional[str] = Form(None),
    ddl_password: Optional[str] = Form(None),
    ddl_destination: Optional[str] = Form(None),
    ddl_remember_default: Optional[str] = Form(None),
):
    api_key = settings_db.get("api_key", "").strip()
    if not api_key:
        return JSONResponse(
            {"status": "error", "message": "Clé API non configurée dans les paramètres."},
            status_code=400,
        )

    cat = (category or "torrent-direct").strip()
    cfg_mode, configured_dir = resolve_service(cat)
    mode = cfg_mode
    if transfer_mode in ("download", "symlink"):
        mode = transfer_mode
    save_dir = configured_dir
    save_dir.mkdir(parents=True, exist_ok=True)

    magnet_list: List[str] = []
    if magnet:
        for line in magnet.splitlines():
            line_str = line.strip()
            if line_str:
                magnet_list.append(line_str)

    files_to_process: List[UploadFile] = []
    if torrent_files:
        files_to_process.extend([f for f in torrent_files if f and f.filename])
    if torrent_file and torrent_file.filename:
        if torrent_file not in files_to_process:
            files_to_process.append(torrent_file)

    ddl_list: List[str] = []
    if ddl_links:
        for line in ddl_links.splitlines():
            line_str = line.strip()
            if line_str and not line_str.startswith("#"):
                ddl_list.append(line_str)

    if not magnet_list and not files_to_process and not ddl_list:
        return JSONResponse(
            {"status": "error", "message": "Veuillez fournir un lien magnet, des liens DDL ou sélectionner un fichier .torrent."},
            status_code=400,
        )

    added_items: List[Dict[str, Any]] = []
    errors: List[str] = []

    if ddl_list:
        if ddl_destination and ddl_destination.strip():
            ddl_save_dir = Path(ddl_destination.strip())
        else:
            custom_ddl_dir = settings_db.get("ddl_download_dir")
            ddl_save_dir = Path(custom_ddl_dir) if custom_ddl_dir else save_dir
        ddl_save_dir.mkdir(parents=True, exist_ok=True)

        if str(ddl_remember_default).lower() in ("true", "1", "on"):
            async with state_lock:
                settings_db["ddl_download_dir"] = str(ddl_save_dir)
                save_state()
            logger.info(f"Nouveau dossier DDL par défaut retenu : {ddl_save_dir}")

        now_ts = int(time.time())
        async with state_lock:
            for raw_url in ddl_list:
                info_hash = hashlib.sha1(raw_url.encode("utf-8")).hexdigest()
                raw_fname = Path(raw_url.split("?")[0]).name or "fichier_ddl"
                torrents_db[info_hash] = {
                    "hash": info_hash,
                    "ad_id": "DDL",
                    "name": sanitize_filename(raw_fname) or "fichier_ddl",
                    "category": cat,
                    "transfer_mode": "download",
                    "save_path": str(ddl_save_dir),
                    "content_path": str(ddl_save_dir / sanitize_filename(raw_fname)),
                    "linked_paths": [],
                    "size": 0,
                    "progress": 0.0,
                    "state": "resolving",
                    "added_on": now_ts,
                    "completion_on": -1,
                    "deleted_on_ad": False,
                    "missing_count": 0,
                    "is_ddl": True,
                    "original_url": raw_url,
                    "password": (ddl_password or "").strip(),
                    "download_url": "",
                    "error_msg": "",
                    "is_debrided": False,
                    "debrid_cached": False,
                    "seeders": 0,
                    "cloud_status": "En attente de débridage",
                }
                added_items.append({"hash": info_hash, "name": raw_fname, "type": "ddl"})
            save_state()
        logger.info(f"{len(ddl_list)} lien(s) DDL ajouté(s) (dest={ddl_save_dir}).")

    async with httpx.AsyncClient() as client:
        for raw_url in magnet_list:
            try:
                info_hash, parsed_name = parse_magnet_uri(raw_url)
                ad_data = await alldebrid_upload_magnet(client, raw_url)
                ad_id = ad_data.get("id")
                if str(ad_id).isdigit():
                    ad_id = int(ad_id)
                ad_name = ad_data.get("name") or parsed_name
                real_hash = str(ad_data.get("hash") or "").strip().lower()
                if real_hash:
                    info_hash = real_hash

                async with state_lock:
                    torrents_db[info_hash] = {
                        "hash": info_hash,
                        "ad_id": ad_id,
                        "name": ad_name,
                        "magnet_uri": raw_url,
                        "category": cat,
                        "transfer_mode": mode,
                        "save_path": str(save_dir),
                        "content_path": str(save_dir / sanitize_filename(ad_name)),
                        "linked_paths": [],
                        "size": int(ad_data.get("size") or 0),
                        "progress": 0.0,
                        "state": "downloading",
                        "added_on": int(time.time()),
                        "completion_on": -1,
                        "deleted_on_ad": False,
                        "error_msg": "",
                        "is_debrided": bool(ad_data.get("ready", False)),
                        "debrid_cached": bool(ad_data.get("ready", False)),
                        "seeders": 0,
                        "cloud_status": "Débridé (Cache)" if ad_data.get("ready") else "En attente débridage",
                    }
                    save_state()
                logger.info(f"Magnet ajouté manuellement [{cat} | {mode} -> {save_dir}] ID={ad_id} ({info_hash[:8]}) : {ad_name}")
                added_items.append({"name": ad_name, "hash": info_hash, "id": str(ad_id)})
            except Exception as exc:
                logger.error(f"Erreur upload magnet manuel ({raw_url[:40]}...) : {exc}")
                errors.append(f"Magnet: {exc}")

        for up_file in files_to_process:
            try:
                raw_bytes = await up_file.read()
                if not raw_bytes:
                    continue
                info_hash, parsed_name = parse_torrent_bytes(raw_bytes)
                filename = up_file.filename or f"{info_hash}.torrent"
                ad_data = await alldebrid_upload_file(client, filename, raw_bytes)
                ad_id = ad_data.get("id")
                if str(ad_id).isdigit():
                    ad_id = int(ad_id)
                ad_name = ad_data.get("name") or parsed_name
                real_hash = str(ad_data.get("hash") or "").strip().lower()
                if real_hash:
                    info_hash = real_hash

                async with state_lock:
                    torrents_db[info_hash] = {
                        "hash": info_hash,
                        "ad_id": ad_id,
                        "name": ad_name,
                        "magnet_uri": raw_url,
                        "category": cat,
                        "transfer_mode": mode,
                        "save_path": str(save_dir),
                        "content_path": str(save_dir / sanitize_filename(ad_name)),
                        "linked_paths": [],
                        "size": int(ad_data.get("size") or 0),
                        "progress": 0.0,
                        "state": "downloading",
                        "added_on": int(time.time()),
                        "completion_on": -1,
                        "deleted_on_ad": False,
                        "error_msg": "",
                        "is_debrided": bool(ad_data.get("ready", False)),
                        "debrid_cached": bool(ad_data.get("ready", False)),
                        "seeders": 0,
                        "cloud_status": "Débridé (Cache)" if ad_data.get("ready") else "En attente débridage",
                    }
                    save_state()
                logger.info(f"Fichier .torrent ajouté manuellement [{cat} | {mode} -> {save_dir}] ID={ad_id} ({info_hash[:8]}) : {ad_name}")
                added_items.append({"name": ad_name, "hash": info_hash, "id": str(ad_id)})
            except Exception as exc:
                logger.error(f"Erreur upload .torrent manuel ({up_file.filename}) : {exc}")
                errors.append(f"{up_file.filename}: {exc}")

    if not added_items and errors:
        return JSONResponse(
            {"status": "error", "message": "; ".join(errors)},
            status_code=400,
        )

    return JSONResponse(
        {
            "status": "success",
            "count": len(added_items),
            "items": added_items,
            "errors": errors if errors else [],
        }
    )


@router.post("/api/ddl/upload")
async def api_upload_ddl(
    links: str = Form(...),
    password: Optional[str] = Form(None),
    category: Optional[str] = Form("torrent-direct"),
    destination: Optional[str] = Form(None),
    remember_default: Optional[str] = Form(None),
):
    api_key = settings_db.get("api_key", "").strip()
    if not api_key:
        return JSONResponse(
            {"status": "error", "message": "Clé API non configurée dans les paramètres."},
            status_code=400,
        )

    cat = (category or "torrent-direct").strip()
    _, configured_dir = resolve_service(cat)
    if destination and destination.strip():
        save_dir = Path(destination.strip())
    else:
        custom_ddl_dir = settings_db.get("ddl_download_dir")
        save_dir = Path(custom_ddl_dir) if custom_ddl_dir else configured_dir
    save_dir.mkdir(parents=True, exist_ok=True)

    if str(remember_default).lower() in ("true", "1", "on"):
        async with state_lock:
            settings_db["ddl_download_dir"] = str(save_dir)
            save_state()
        logger.info(f"Nouveau dossier DDL par défaut retenu : {save_dir}")

    ddl_list: List[str] = []
    for line in (links or "").splitlines():
        line_str = line.strip()
        if line_str and not line_str.startswith("#"):
            ddl_list.append(line_str)

    if not ddl_list:
        return JSONResponse(
            {"status": "error", "message": "Veuillez fournir au moins un lien direct à débrider."},
            status_code=400,
        )

    added_items: List[Dict[str, Any]] = []
    now_ts = int(time.time())
    async with state_lock:
        for raw_url in ddl_list:
            info_hash = hashlib.sha1(raw_url.encode("utf-8")).hexdigest()
            raw_fname = Path(raw_url.split("?")[0]).name or "fichier_ddl"
            torrents_db[info_hash] = {
                "hash": info_hash,
                "ad_id": "DDL",
                "name": sanitize_filename(raw_fname) or "fichier_ddl",
                "category": cat,
                "transfer_mode": "download",
                "save_path": str(save_dir),
                "content_path": str(save_dir / sanitize_filename(raw_fname)),
                "linked_paths": [],
                "size": 0,
                "progress": 0.0,
                "state": "resolving",
                "added_on": now_ts,
                "completion_on": -1,
                "deleted_on_ad": False,
                "missing_count": 0,
                "is_ddl": True,
                "original_url": raw_url,
                "password": (password or "").strip(),
                "download_url": "",
                "error_msg": "",
            }
            added_items.append({"hash": info_hash, "name": raw_fname, "type": "ddl"})
        save_state()

    logger.info(f"{len(added_items)} lien(s) DDL ajouté(s) (cat={cat}).")
    return JSONResponse(
        {
            "status": "ok",
            "added": len(added_items),
            "items": added_items,
            "message": f"{len(added_items)} lien(s) DDL ajouté(s) avec succès !",
        }
    )


@router.api_route("/share-target", methods=["GET", "POST", "HEAD"])
async def pwa_share_target(
    request: Request,
    title: Optional[str] = Form(None),
    text: Optional[str] = Form(None),
    url: Optional[str] = Form(None),
    torrent_file: Optional[UploadFile] = File(None),
):
    """Réception native des partages Android (menu Partager) et Protocol Handlers magnet."""
    raw_text = f"{url or ''} {text or ''} {title or ''}".strip()
    if request.method == "GET" or not raw_text:
        q = dict(request.query_params)
        raw_text += f" {q.get('url', '')} {q.get('text', '')} {q.get('magnet', '')}".strip()

    cat = "torrent-direct"
    cfg_mode, configured_dir = resolve_service(cat)
    save_dir = configured_dir
    save_dir.mkdir(parents=True, exist_ok=True)
    added_name = ""

    # 1. Fichier .torrent partagé
    if torrent_file and torrent_file.filename:
        try:
            raw_bytes = await torrent_file.read()
            if raw_bytes:
                info_hash, parsed_name = parse_torrent_bytes(raw_bytes)
                filename = torrent_file.filename or f"{info_hash}.torrent"
                async with httpx.AsyncClient() as client:
                    ad_data = await alldebrid_upload_file(client, filename, raw_bytes)
                ad_id = ad_data.get("id")
                if str(ad_id).isdigit():
                    ad_id = int(ad_id)
                ad_name = ad_data.get("name") or parsed_name
                real_hash = str(ad_data.get("hash") or "").strip().lower()
                if real_hash:
                    info_hash = real_hash
                async with state_lock:
                    torrents_db[info_hash] = {
                        "hash": info_hash,
                        "ad_id": ad_id,
                        "name": ad_name,
                        "magnet_uri": "",
                        "category": cat,
                        "transfer_mode": cfg_mode,
                        "save_path": str(save_dir),
                        "content_path": str(save_dir / sanitize_filename(ad_name)),
                        "linked_paths": [],
                        "size": int(ad_data.get("size") or 0),
                        "progress": 0.0,
                        "state": "downloading",
                        "added_on": int(time.time()),
                        "completion_on": -1,
                        "deleted_on_ad": False,
                        "error_msg": "",
                        "is_debrided": bool(ad_data.get("ready", False)),
                        "debrid_cached": bool(ad_data.get("ready", False)),
                        "seeders": 0,
                        "cloud_status": "Débridé (Cache)" if ad_data.get("ready") else "En attente débridage",
                    }
                    save_state()
                added_name = ad_name
                logger.info(f"[PWA Share] Fichier .torrent ajouté : {ad_name}")
        except Exception as exc:
            logger.error(f"[PWA Share] Erreur upload .torrent : {exc}")

    # 2. Magnets extraits du texte
    if not added_name:
        magnets = re.findall(r"(magnet:\?[^\s\"'<>]+)", raw_text, re.IGNORECASE)
        if magnets:
            for mag in magnets:
                try:
                    info_hash, parsed_name = parse_magnet_uri(mag)
                    async with httpx.AsyncClient() as client:
                        ad_data = await alldebrid_upload_magnet(client, mag)
                    ad_id = ad_data.get("id")
                    if str(ad_id).isdigit():
                        ad_id = int(ad_id)
                    ad_name = ad_data.get("name") or parsed_name
                    real_hash = str(ad_data.get("hash") or "").strip().lower()
                    if real_hash:
                        info_hash = real_hash
                    async with state_lock:
                        torrents_db[info_hash] = {
                            "hash": info_hash,
                            "ad_id": ad_id,
                            "name": ad_name,
                            "magnet_uri": mag,
                            "category": cat,
                            "transfer_mode": cfg_mode,
                            "save_path": str(save_dir),
                            "content_path": str(save_dir / sanitize_filename(ad_name)),
                            "linked_paths": [],
                            "size": int(ad_data.get("size") or 0),
                            "progress": 0.0,
                            "state": "downloading",
                            "added_on": int(time.time()),
                            "completion_on": -1,
                            "deleted_on_ad": False,
                            "error_msg": "",
                            "is_debrided": bool(ad_data.get("ready", False)),
                            "debrid_cached": bool(ad_data.get("ready", False)),
                            "seeders": 0,
                            "cloud_status": "Débridé (Cache)" if ad_data.get("ready") else "En attente débridage",
                        }
                        save_state()
                    added_name = ad_name
                    logger.info(f"[PWA Share] Magnet ajouté : {ad_name}")
                except Exception as exc:
                    logger.error(f"[PWA Share] Erreur upload magnet : {exc}")

    # 3. Liens HTTP DDL extraits du texte
    if not added_name:
        urls = re.findall(r"(https?://[^\s\"'<>]+)", raw_text, re.IGNORECASE)
        if urls:
            custom_ddl_dir = settings_db.get("ddl_download_dir")
            ddl_save_dir = Path(custom_ddl_dir) if custom_ddl_dir else save_dir
            ddl_save_dir.mkdir(parents=True, exist_ok=True)
            now_ts = int(time.time())
            for u in urls:
                info_hash = hashlib.sha1(u.encode("utf-8")).hexdigest()
                raw_fname = Path(u.split("?")[0]).name or "fichier_ddl"
                async with state_lock:
                    torrents_db[info_hash] = {
                        "hash": info_hash,
                        "ad_id": "DDL",
                        "name": sanitize_filename(raw_fname) or "fichier_ddl",
                        "category": cat,
                        "transfer_mode": "download",
                        "save_path": str(ddl_save_dir),
                        "content_path": str(ddl_save_dir / sanitize_filename(raw_fname)),
                        "linked_paths": [],
                        "size": 0,
                        "progress": 0.0,
                        "state": "resolving",
                        "added_on": now_ts,
                        "completion_on": -1,
                        "deleted_on_ad": False,
                        "missing_count": 0,
                        "is_ddl": True,
                        "original_url": u,
                        "password": "",
                        "download_url": "",
                        "error_msg": "",
                    }
                    save_state()
                added_name = raw_fname
                logger.info(f"[PWA Share] Lien DDL ajouté : {raw_fname}")

    redirect_url = "/"
    if added_name:
        redirect_url = f"/?shared=1&name={urllib.parse.quote(added_name)}"

    return RedirectResponse(url=redirect_url, status_code=303)


@router.post("/api/test")
async def test_api_connection(
    provider: str = Form("alldebrid"),
    api_key: str = Form(""),
    api_base: str = Form(""),
    agent: str = Form("OmniSym-Billou"),
    rclone_mount_dir: str = Form("/mnt/alldebrid/magnets"),
):
    mount_path = Path(rclone_mount_dir.strip() or "/mnt/alldebrid/magnets")

    if mount_path.exists() and mount_path.is_dir():
        try:
            nb_items = len(list(mount_path.iterdir()))
            mount_status = f"Montage rclone OK ({nb_items} élément(s) détecté(s))"
        except Exception as exc:
            mount_status = f"Montage rclone illisible ({exc})"
    else:
        mount_status = f"Dossier rclone introuvable ({mount_path})"

    prov_inst = get_provider(provider)
    resolved_base = api_base.strip() or prov_inst.default_api_base

    async with httpx.AsyncClient() as client:
        health = await prov_inst.check_health(client, api_key=api_key, api_base=resolved_base, agent=agent)

    if health["ok"]:
        return JSONResponse(
            {
                "ok": True,
                "message": f"Connexion {prov_inst.display_name} réussie — {health['detail']} | {mount_status}",
            }
        )
    return JSONResponse(
        {
            "ok": False,
            "message": f"Échec {prov_inst.display_name} : {health['detail']} | {mount_status}",
        }
    )


@router.post("/api/settings/test-telegram")
async def test_telegram_connection(
    bot_token: str = Form(""),
    chat_id: str = Form(""),
):
    from app.notifications import notifier
    res = await notifier.test_notification(bot_token=bot_token, chat_id=chat_id)
    return JSONResponse(res)


@router.post("/api/settings")
async def update_settings(
    provider: str = Form("alldebrid"),
    api_key: str = Form(""),
    api_base: str = Form(""),
    agent: str = Form("OmniSym-Billou"),
    rclone_mount_dir: str = Form("/mnt/alldebrid/magnets"),
    download_base_dir: str = Form("/mnt/virtual/Medias/DL"),
    poll_interval: float = Form(3.0),
    mount_timeout: int = Form(60),
    auto_clean_import: Optional[str] = Form(None),
    delete_on_provider: Optional[str] = Form(None),
    delete_on_dl_complete: Optional[str] = Form(None),
    download_speed_limit: float = Form(0.0),
    max_concurrent_downloads: int = Form(3),
    ddl_download_dir: str = Form("/mnt/virtual/Medias/DL/DDL"),
    hide_last_download_name: Optional[str] = Form(None),
    enable_queue_tab: Optional[str] = Form(None),
    enable_ddl_tab: Optional[str] = Form(None),
    enable_finder_tab: Optional[str] = Form(None),
    enable_scanner_tab: Optional[str] = Form(None),
    allowed_exts: str = Form(""),
    username: str = Form(""),
    password: str = Form(""),
    ui_language: str = Form("fr"),
    ui_theme: str = Form("dark"),
    media_scan_paths: List[str] = Form(default=[]),
    radarr_url: str = Form(""),
    radarr_api_key: str = Form(""),
    sonarr_url: str = Form(""),
    sonarr_api_key: str = Form(""),
    whisparr_url: str = Form(""),
    whisparr_api_key: str = Form(""),
    telegram_enabled: Optional[str] = Form(None),
    telegram_bot_token: str = Form(""),
    telegram_chat_id: str = Form(""),
    telegram_notify_scan_start: Optional[str] = Form(None),
    telegram_notify_scan_complete: Optional[str] = Form(None),
    telegram_notify_dead_link: Optional[str] = Form(None),
    telegram_notify_download_complete: Optional[str] = Form(None),
    telegram_notify_clean_dead: Optional[str] = Form(None),
    telegram_notify_error: Optional[str] = Form(None),
    service_names: Optional[List[str]] = Form(None),
    service_modes_list: Optional[List[str]] = Form(None),
    service_subpaths: Optional[List[str]] = Form(None),
    onboarding_completed: Optional[str] = Form(None),
):
    new_services: Dict[str, Dict[str, str]] = {}
    if service_names and service_modes_list:
        subpaths_safe = service_subpaths or []
        for idx, (s_name, s_mode) in enumerate(zip(service_names, service_modes_list)):
            clean_name = sanitize_filename(s_name.strip())
            if clean_name:
                raw_sub = subpaths_safe[idx].strip() if idx < len(subpaths_safe) else ""
                new_services[clean_name] = {
                    "mode": "download" if s_mode == "download" else "symlink",
                    "subpath": raw_sub or clean_name,
                }
    if not new_services:
        new_services = {k: dict(v) for k, v in DEFAULT_SERVICES.items()}

    clean_lang = ui_language.strip().lower()
    if clean_lang not in ("fr", "en"):
        clean_lang = "fr"

    clean_theme = ui_theme.strip().lower()
    if clean_theme not in ("dark", "light"):
        clean_theme = "dark"

    clean_prov = normalize_provider_name(provider)
    prov_obj = get_provider(clean_prov)

    async with state_lock:
        settings_db["provider"] = clean_prov
        settings_db["api_key"] = api_key.strip()
        settings_db["api_base"] = api_base.strip().rstrip("/") or prov_obj.default_api_base
        settings_db["agent"] = agent.strip() or "OmniSym-Billou"
        settings_db["rclone_mount_dir"] = rclone_mount_dir.strip() or "/mnt/alldebrid/magnets"
        settings_db["download_base_dir"] = download_base_dir.strip() or "/mnt/virtual/Medias/DL"
        settings_db["poll_interval"] = max(1.5, float(poll_interval))
        settings_db["mount_timeout"] = max(5, int(mount_timeout))
        settings_db["auto_clean_import"] = auto_clean_import == "on"
        settings_db["delete_on_provider"] = delete_on_provider == "on"
        settings_db["delete_on_dl_complete"] = delete_on_dl_complete == "on"
        settings_db["download_speed_limit"] = max(0.0, float(download_speed_limit))
        settings_db["max_concurrent_downloads"] = max(1, int(max_concurrent_downloads))
        settings_db["hide_last_download_name"] = hide_last_download_name == "on"
        settings_db["allowed_exts"] = allowed_exts.strip() or DEFAULT_SETTINGS["allowed_exts"]
        settings_db["username"] = username.strip()
        settings_db["password"] = password.strip()
        settings_db["ui_language"] = clean_lang
        settings_db["ui_theme"] = clean_theme
        parsed_paths = []
        for p in media_scan_paths:
            for sub in p.split(","):
                sub = sub.strip()
                if sub and sub not in parsed_paths:
                    parsed_paths.append(sub)
        if parsed_paths:
            settings_db["media_scan_paths"] = ",".join(parsed_paths)
        settings_db["radarr_url"] = radarr_url.strip() or "http://127.0.0.1:7878"
        settings_db["radarr_api_key"] = radarr_api_key.strip()
        settings_db["sonarr_url"] = sonarr_url.strip() or "http://127.0.0.1:8989"
        settings_db["sonarr_api_key"] = sonarr_api_key.strip()
        settings_db["whisparr_url"] = whisparr_url.strip() or "http://127.0.0.1:6969"
        settings_db["whisparr_api_key"] = whisparr_api_key.strip()
        settings_db["ddl_download_dir"] = ddl_download_dir.strip() or "/mnt/virtual/Medias/DL/DDL"
        # Visibilité des onglets
        q_tab = enable_queue_tab == "on"
        d_tab = enable_ddl_tab == "on"
        f_tab = enable_finder_tab == "on"
        s_tab = enable_scanner_tab == "on"
        if not (q_tab or d_tab or f_tab or s_tab):
            q_tab = True
        settings_db["enable_queue_tab"] = q_tab
        settings_db["enable_ddl_tab"] = d_tab
        settings_db["enable_finder_tab"] = f_tab
        settings_db["enable_scanner_tab"] = s_tab
        settings_db["telegram_enabled"] = telegram_enabled == "on"
        settings_db["telegram_bot_token"] = telegram_bot_token.strip()
        settings_db["telegram_chat_id"] = telegram_chat_id.strip()
        settings_db["telegram_notify_scan_start"] = telegram_notify_scan_start == "on"
        settings_db["telegram_notify_scan_complete"] = telegram_notify_scan_complete == "on"
        settings_db["telegram_notify_dead_link"] = telegram_notify_dead_link == "on"
        settings_db["telegram_notify_download_complete"] = telegram_notify_download_complete == "on"
        settings_db["telegram_notify_clean_dead"] = telegram_notify_clean_dead == "on"
        settings_db["telegram_notify_error"] = telegram_notify_error == "on"
        if onboarding_completed == "on":
            settings_db["onboarding_completed"] = True
        settings_db["services"] = new_services
        rebuild_categories()
        save_state()

    async with httpx.AsyncClient() as client:
        await check_alldebrid_api_health(client, provider_name=clean_prov)

    logger.info(f"Paramètres mis à jour via l'interface web (fournisseur={clean_prov}, {len(new_services)} service(s), langue={clean_lang}, thème={clean_theme}).")
    return RedirectResponse(url="/?saved=1", status_code=303)


@router.post("/api/settings/onboarding-complete")
async def complete_onboarding():
    async with state_lock:
        settings_db["onboarding_completed"] = True
        save_state()
    return JSONResponse({"ok": True, "message": "Onboarding terminé"})


@router.post("/api/settings/reset")
async def reset_settings():
    async with state_lock:
        settings_db.clear()
        for k, v in DEFAULT_SETTINGS.items():
            if k == "services":
                settings_db["services"] = {k2: dict(v2) for k2, v2 in DEFAULT_SERVICES.items()}
            elif isinstance(v, dict):
                settings_db[k] = dict(v)
            else:
                settings_db[k] = v
        settings_db["onboarding_completed"] = False
        rebuild_categories()
        save_state()
    logger.info("Paramètres réinitialisés aux valeurs d'usine et onboarding réactivé.")
    return JSONResponse({"ok": True, "message": "Paramètres réinitialisés avec succès"})


@router.get("/", response_class=HTMLResponse)
async def web_dashboard(saved: Optional[str] = None):
    rows = []
    service_rows = []
    scan_path_rows = []
    services_options = []
    active_dl_count = 0
    active_sym_count = 0

    async with state_lock:
        s = dict(settings_db)
        health = dict(api_health)
        svcs = dict(get_services_config())

        for svc_name, svc_cfg in svcs.items():
            svc_mode = svc_cfg.get("mode", "symlink")
            svc_sub = svc_cfg.get("subpath") or svc_name
            sel_sym = "selected" if svc_mode != "download" else ""
            sel_dl = "selected" if svc_mode == "download" else ""
            service_rows.append(
                f'<div class="svc-row">'
                f'<input type="text" name="service_names" value="{html.escape(svc_name)}" placeholder="Catégorie" required>'
                f'<select name="service_modes_list">'
                f'<option value="symlink" {sel_sym} data-i18n="opt_mode_symlink">Symlink (instantané)</option>'
                f'<option value="download" {sel_dl} data-i18n="opt_mode_download">Téléchargement réel (copie locale)</option>'
                f'</select>'
                f'<input type="text" name="service_subpaths" value="{html.escape(svc_sub)}" placeholder="Sous-dossier dans DL" data-edited="1">'
                f'<button type="button" class="btn-del" onclick="this.parentElement.remove()" data-i18n="btn_remove">Retirer</button>'
                f'</div>'
            )
            is_direct = svc_name in ("torrent-direct", "direct")
            sel_opt = "selected" if is_direct else ""
            mode_lbl = "DL réel" if svc_mode == "download" else "Symlink"
            display_name = "Torrent Direct" if is_direct else svc_name
            services_options.append(
                f'<option value="{html.escape(svc_name)}" data-mode="{svc_mode}" data-subpath="{html.escape(svc_sub)}" {sel_opt}>{html.escape(display_name)} ({mode_lbl})</option>'
            )

        scan_paths_raw = s.get("media_scan_paths", "")
        scan_paths_list = [p.strip() for p in scan_paths_raw.split(",") if p.strip()]
        if not scan_paths_list:
            scan_paths_list = ["/mnt/virtual/Medias/Films", "/mnt/virtual/Medias/Series"]
        for p in scan_paths_list:
            scan_path_rows.append(
                f'<div class="scan-path-row">'
                f'<input type="text" name="media_scan_paths" value="{html.escape(p)}" placeholder="Ex: /mnt/virtual/Medias/Films" style="flex:1;" required>'
                f'<button type="button" class="btn-del" onclick="this.parentElement.remove()" style="padding:7px 12px;" title="Supprimer">✕</button>'
                f'</div>'
            )

        items_sorted = sorted(torrents_db.items(), key=lambda kv: kv[1].get("added_on", 0), reverse=True)
        for h, item in items_sorted:
            pct = int(float(item.get("progress", 0)) * 100)
            state = item.get("state", "downloading")
            err = item.get("error_msg", "")
            mode = item.get("transfer_mode") or resolve_service(item.get("category", ""))[0]

            if state in ("downloading", "checkingDL", "copying"):
                if mode == "download":
                    active_dl_count += 1
                else:
                    active_sym_count += 1

            save_path_txt = html.escape(str(item.get("save_path") or ""))
            mode_badge = (
                '<span class="tag dl">DL réel</span>'
                if mode == "download"
                else '<span class="tag sym">Symlink</span>'
            )

            if state in ("pausedUP", "stalledUP"):
                badge_cls = "ok"
                state_txt = f"Terminé ({pct}%)"
            elif state == "pausedDL":
                badge_cls = "pause"
                state_txt = f"En pause ({pct}%)"
            elif state == "error":
                badge_cls = "err"
                state_txt = f"Erreur — {html.escape(err)}"
            elif state == "checkingDL":
                badge_cls = "run"
                state_txt = f"Montage rclone ({pct}%)"
            elif state == "copying":
                badge_cls = "run"
                state_txt = f"Copie locale ({pct}%)"
            else:
                badge_cls = "run"
                state_txt = f"{state} ({pct}%)"

            short_id = html.escape(h[:8])
            full_id = html.escape(h)
            ad_id = html.escape(str(item.get("ad_id", "-")))
            name_esc = html.escape(str(item.get("name", h)))
            cat_esc = html.escape(str(item.get("category", "")))

            pause_btn = (
                f'<button class="btn-sec" onclick="batchAction(\'resume\', [\'{full_id}\'])">Reprendre</button>'
                if state == "pausedDL"
                else f'<button class="btn-warn" onclick="batchAction(\'pause\', [\'{full_id}\'])">Pause</button>'
            )

            is_deb = bool(
                item.get("is_debrided")
                or state in ("copying", "checkingDL", "pausedUP", "stalledUP")
                or item.get("is_ddl")
            )
            is_cached = bool(item.get("debrid_cached", False))

            if is_deb:
                if is_cached:
                    debrid_badge = '<span class="tag debrid-cache" title="Fichier déjà présent sur les serveurs Debrid (Instantané)">⚡ Déjà débridé (Cache)</span>'
                else:
                    debrid_badge = '<span class="tag debrid-ready" title="Fichier débridé et disponible sur le cloud">⚡ Débridé</span>'
            else:
                seeders_cnt = int(item.get("seeders") or 0)
                seeders_txt = f" • {seeders_cnt} src" if seeders_cnt > 0 else ""
                debrid_badge = f'<span class="tag debrid-pending" title="Fichier en cours de téléchargement chez le fournisseur (non débridé)">⏳ Non débridé{seeders_txt}</span>'

            rows.append(
                f'<tr>'
                f'<td class="col-chk"><input type="checkbox" class="row-chk" value="{full_id}" onchange="updateSelection()"></td>'
                f'<td class="mono col-id"><div>#{ad_id}</div><small title="{full_id}" onclick="copyId(\'{full_id}\')" style="cursor:pointer;color:#8b949e">{short_id} 📋</small></td>'
                f'<td class="col-name">{name_esc}<div style="color:#8b949e;font-size:11px;margin-top:2px;">{save_path_txt}</div></td>'
                f'<td class="col-cat"><span class="tag">{cat_esc}</span> {mode_badge}</td>'
                f'<td class="col-status">'
                f'<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:4px;">'
                f'<span class="badge {badge_cls}">{state_txt}</span>'
                f'{debrid_badge}'
                f'</div>'
                f'<div class="pbar"><div class="pbar-fill {badge_cls}" style="width:{pct}%"></div></div>'
                f'</td>'
                f'<td class="actions col-actions">'
                f'<button class="btn-sec" onclick="batchAction(\'retry\', [\'{full_id}\'])">Relancer</button> '
                f'{pause_btn} '
                f'<button class="btn-del" onclick="openDeleteModal([\'{full_id}\'])">Supprimer</button>'
                f'</td></tr>'
            )

    api_ok = bool(health.get("ok"))
    base_label = health.get("label") or ("Test API OK" if api_ok else "Échec Test API")
    api_detail = html.escape(str(health.get("detail") or ""))

    if active_dl_count > 0:
        orb_cls = "dl"
        api_label = f"DL en cours ({active_dl_count}) — {base_label}"
    elif active_sym_count > 0:
        orb_cls = "sym"
        api_label = f"Symlink en cours ({active_sym_count}) — {base_label}"
    elif api_ok:
        orb_cls = "ok"
        api_label = base_label
    else:
        orb_cls = "err"
        api_label = base_label

    table_body = "".join(rows) or "<tr><td colspan='6' style='color:#8b949e;text-align:center'>Aucun torrent en file</td></tr>"
    banner = "<div class='alert' data-i18n='alert_saved'>Paramètres enregistrés et appliqués immédiatement.</div>" if saved else ""

    template_file = TEMPLATES_DIR / "index.html"
    raw_template = template_file.read_text(encoding="utf-8")

    ui_lang = s.get("ui_language") or "fr"
    ui_theme = s.get("ui_theme") or "dark"
    if ui_theme not in ("dark", "light"):
        ui_theme = "dark"
    onboarding_auto = "false" if s.get("onboarding_completed", False) else "true"
    current_prov = normalize_provider_name(s.get("provider", "alldebrid"))
    prov_meta = SUPPORTED_PROVIDERS.get(current_prov, SUPPORTED_PROVIDERS["alldebrid"])

    prov_options = []
    for pid, pdata in SUPPORTED_PROVIDERS.items():
        is_sel = "selected" if pid == current_prov else ""
        prov_options.append(f'<option value="{pid}" {is_sel}>{pdata["name"]}</option>')

    page = (
        raw_template.replace("__BANNER__", banner)
        .replace("__ORB_CLS__", orb_cls)
        .replace("__API_LABEL__", html.escape(api_label))
        .replace("__API_DETAIL__", api_detail)
        .replace("__PROVIDER__", current_prov)
        .replace("__PROVIDER_NAME__", html.escape(prov_meta["name"]))
        .replace("__PROVIDER_OPTIONS__", "".join(prov_options))
        .replace("__KEY_LABEL__", html.escape(prov_meta["key_label"]))
        .replace("__KEY_HINT__", html.escape(prov_meta["key_hint"]))
        .replace("__RCLONE_MOUNT_DIR__", html.escape(s["rclone_mount_dir"]))
        .replace("__DOWNLOAD_BASE_DIR__", html.escape(s["download_base_dir"]))
        .replace("__DOWNLOAD_SPEED_LIMIT__", str(s.get("download_speed_limit", 0)))
        .replace("__MAX_CONCURRENT_DOWNLOADS__", str(s.get("max_concurrent_downloads", 3)))
        .replace("__CHECKED_HIDE_LAST_DL_NAME__", "checked" if s.get("hide_last_download_name", True) else "")
        .replace("__TABLE_BODY__", table_body)
        .replace("__SERVICE_ROWS__", "".join(service_rows))
        .replace("__SERVICES_OPTIONS__", "".join(services_options))
        .replace("__SCAN_PATH_ROWS__", "".join(scan_path_rows))
        .replace("__API_KEY__", html.escape(s["api_key"]))
        .replace("__AGENT__", html.escape(s["agent"]))
        .replace("__POLL_INTERVAL__", str(s["poll_interval"]))
        .replace("__MOUNT_TIMEOUT__", str(s["mount_timeout"]))
        .replace("__USERNAME__", html.escape(s["username"]))
        .replace("__PASSWORD__", html.escape(s["password"]))
        .replace("__UI_LANGUAGE__", html.escape(ui_lang))
        .replace("__UI_THEME__", html.escape(ui_theme))
        .replace("__ONBOARDING_AUTO_OPEN__", onboarding_auto)
        .replace("__SELECTED_THEME_DARK__", "selected" if ui_theme == "dark" else "")
        .replace("__SELECTED_THEME_LIGHT__", "selected" if ui_theme == "light" else "")
        .replace("__SELECTED_LANG_FR__", "selected" if ui_lang == "fr" else "")
        .replace("__SELECTED_LANG_EN__", "selected" if ui_lang == "en" else "")
        .replace("__ALLOWED_EXTS__", html.escape(s["allowed_exts"]))
        .replace("__API_BASE__", html.escape(s["api_base"]))
        .replace("__MEDIA_SCAN_PATHS__", html.escape(s.get("media_scan_paths", "")))
        .replace("__RADARR_URL__", html.escape(s.get("radarr_url", "http://127.0.0.1:7878")))
        .replace("__RADARR_API_KEY__", html.escape(s.get("radarr_api_key", "")))
        .replace("__SONARR_URL__", html.escape(s.get("sonarr_url", "http://127.0.0.1:8989")))
        .replace("__SONARR_API_KEY__", html.escape(s.get("sonarr_api_key", "")))
        .replace("__WHISPARR_URL__", html.escape(s.get("whisparr_url", "http://127.0.0.1:6969")))
        .replace("__WHISPARR_API_KEY__", html.escape(s.get("whisparr_api_key", "")))
        .replace("__DDL_DOWNLOAD_DIR__", html.escape(str(s.get("ddl_download_dir", "/mnt/virtual/Medias/DL/DDL"))))
        .replace("__CHECKED_QUEUE_TAB__", "checked" if s.get("enable_queue_tab", True) else "")
        .replace("__QUEUE_TAB_DISPLAY__", "" if s.get("enable_queue_tab", True) else "display:none;")
        .replace("__CHECKED_DDL_TAB__", "checked" if s.get("enable_ddl_tab", False) else "")
        .replace("__DDL_TAB_DISPLAY__", "" if s.get("enable_ddl_tab", False) else "display:none;")
        .replace("__CHECKED_FINDER_TAB__", "checked" if s.get("enable_finder_tab", True) else "")
        .replace("__FINDER_TAB_DISPLAY__", "" if s.get("enable_finder_tab", True) else "display:none;")
        .replace("__CHECKED_SCANNER_TAB__", "checked" if s.get("enable_scanner_tab", True) else "")
        .replace("__SCANNER_TAB_DISPLAY__", "" if s.get("enable_scanner_tab", True) else "display:none;")
        .replace("__CHECKED_DL_DONE__", "checked" if s.get("delete_on_dl_complete") else "")
        .replace("__CHECKED_AUTO__", "checked" if s.get("auto_clean_import") else "")
        .replace("__CHECKED_DEL__", "checked" if s.get("delete_on_provider") else "")
        .replace("__TELEGRAM_BOT_TOKEN__", html.escape(str(s.get("telegram_bot_token", ""))))
        .replace("__TELEGRAM_CHAT_ID__", html.escape(str(s.get("telegram_chat_id", ""))))
        .replace("__CHECKED_TG_ENABLED__", "checked" if s.get("telegram_enabled", False) else "")
        .replace("__CHECKED_TG_SCAN_START__", "checked" if s.get("telegram_notify_scan_start", True) else "")
        .replace("__CHECKED_TG_SCAN_COMPLETE__", "checked" if s.get("telegram_notify_scan_complete", True) else "")
        .replace("__CHECKED_TG_DEAD_LINK__", "checked" if s.get("telegram_notify_dead_link", True) else "")
        .replace("__CHECKED_TG_DL_COMPLETE__", "checked" if s.get("telegram_notify_download_complete", True) else "")
        .replace("__CHECKED_TG_CLEAN_DEAD__", "checked" if s.get("telegram_notify_clean_dead", True) else "")
        .replace("__CHECKED_TG_ERROR__", "checked" if s.get("telegram_notify_error", True) else "")
    )
    return HTMLResponse(page)

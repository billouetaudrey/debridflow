import hashlib
import secrets
import time
from pathlib import Path
from typing import List, Optional

import httpx
from fastapi import APIRouter, File, Form, Request, UploadFile
from fastapi.responses import JSONResponse, PlainTextResponse

from app.alldebrid import (
    alldebrid_delete_magnet,
    alldebrid_upload_file,
    alldebrid_upload_magnet,
)
from app.bencode import parse_magnet_uri, parse_torrent_bytes, sanitize_filename
from app.config import logger
from app.state import (
    categories_db,
    get_services_config,
    resolve_service,
    save_state,
    settings_db,
    state_lock,
    torrents_db,
)
from app.storage import is_already_imported_by_arr, remove_local_artifacts

router = APIRouter()


@router.post("/api/v2/auth/login")
async def qb_login(username: str = Form(""), password: str = Form("")):
    req_user = settings_db.get("username", "").strip()
    req_pass = settings_db.get("password", "").strip()
    if req_user and req_pass:
        if not (secrets.compare_digest(username, req_user) and secrets.compare_digest(password, req_pass)):
            return PlainTextResponse("Fails.", status_code=403)
    token = hashlib.sha256(f"{req_user}:{req_pass}".encode()).hexdigest()[:32]
    resp = PlainTextResponse("Ok.")
    resp.set_cookie("SID", token, httponly=True)
    return resp


@router.get("/api/v2/app/version")
async def qb_version():
    return PlainTextResponse("v4.6.5")


@router.get("/api/v2/app/webapiVersion")
async def qb_webapi_version():
    return PlainTextResponse("2.9.3")


@router.get("/api/v2/app/preferences")
async def qb_preferences():
    return JSONResponse(
        {
            "save_path": str(settings_db["download_base_dir"]),
            "temp_path_enabled": False,
            "create_subfolder_enabled": True,
            "max_ratio_enabled": True,
            "max_ratio": 1.0,
            "max_ratio_act": 0,
        }
    )


@router.get("/api/v2/torrents/categories")
async def qb_categories():
    return JSONResponse(categories_db)


@router.post("/api/v2/torrents/createCategory")
async def qb_create_category(category: str = Form(...), savePath: str = Form("")):
    cat = category.strip()
    async with state_lock:
        svcs = get_services_config()
        if cat not in svcs:
            default_mode = "download" if "whisparr" in cat.lower() else "symlink"
            svcs[cat] = {"mode": default_mode, "subpath": savePath.strip() or cat}
            save_state()
        _, target_dir = resolve_service(cat)
        target_dir.mkdir(parents=True, exist_ok=True)
        categories_db[cat] = {"name": cat, "savePath": str(target_dir)}
    return PlainTextResponse("Ok.")


@router.post("/api/v2/torrents/add")
async def qb_add_torrent(
    request: Request,
    urls: Optional[str] = Form(None),
    category: Optional[str] = Form("tv-sonarr"),
    savepath: Optional[str] = Form(None),
    torrents: Optional[List[UploadFile]] = File(None),
):
    cat = (category or "tv-sonarr").strip()
    mode, configured_dir = resolve_service(cat)
    save_dir = Path(savepath.strip()) if (savepath and savepath.strip()) else configured_dir
    save_dir.mkdir(parents=True, exist_ok=True)

    async with httpx.AsyncClient() as client:
        if urls:
            for raw_url in [u.strip() for u in urls.splitlines() if u.strip()]:
                info_hash, name = parse_magnet_uri(raw_url)
                ad_data = await alldebrid_upload_magnet(client, raw_url)
                ad_id = int(ad_data["id"])
                ad_name = ad_data.get("name") or name
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
                logger.info(f"Magnet ajouté [{cat} | {mode} -> {save_dir}] ID={ad_id} ({info_hash[:8]}) : {ad_name}")

        if torrents:
            for up_file in torrents:
                raw_bytes = await up_file.read()
                info_hash, name = parse_torrent_bytes(raw_bytes)
                ad_data = await alldebrid_upload_file(client, up_file.filename or f"{info_hash}.torrent", raw_bytes)
                ad_id = int(ad_data["id"])
                ad_name = ad_data.get("name") or name
                async with state_lock:
                    torrents_db[info_hash] = {
                        "hash": info_hash,
                        "ad_id": ad_id,
                        "name": ad_name,
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
                logger.info(f"Fichier .torrent ajouté [{cat} | {mode} -> {save_dir}] ID={ad_id} ({info_hash[:8]}) : {ad_name}")

    return PlainTextResponse("Ok.")


@router.get("/api/v2/torrents/info")
async def qb_torrents_info(category: Optional[str] = None, hashes: Optional[str] = None):
    hash_filter = {h.strip().lower() for h in hashes.split("|")} if hashes else None
    result = []
    async with state_lock:
        for h, item in torrents_db.items():
            if category and item.get("category") != category:
                continue
            if hash_filter and h.lower() not in hash_filter:
                continue
            size = int(item.get("size") or 0)
            progress = float(item.get("progress") or 0.0)
            downloaded = size if progress >= 1.0 else int(size * progress)
            raw_state = item.get("state") or "downloading"
            if raw_state == "error":
                qb_state = "error"
            elif raw_state == "copying":
                qb_state = "checkingDL"
            elif raw_state in ("stalledUP", "uploading", "completed", "pausedUP") or progress >= 1.0:
                qb_state = "pausedUP"
            else:
                qb_state = raw_state

            result.append(
                {
                    "hash": h,
                    "name": item.get("name") or h,
                    "size": size,
                    "progress": progress,
                    "dlspeed": int(item.get("dlspeed") or item.get("cloud_speed") or 0),
                    "upspeed": 0,
                    "priority": 1,
                    "num_seeds": 0 if raw_state == "error" else 1,
                    "num_leechs": 0,
                    "ratio": 1.0,
                    "ratio_limit": 1.0,
                    "max_ratio": 1.0,
                    "seeding_time": 86400,
                    "seeding_time_limit": 0,
                    "max_seeding_time": 0,
                    "time_active": 86400,
                    "has_seed_limit_reached": True,
                    "eta": 86400 if raw_state == "error" else (0 if progress >= 1.0 else 10),
                    "state": qb_state,
                    "category": item.get("category") or "",
                    "save_path": item.get("save_path") or str(settings_db["download_base_dir"]),
                    "content_path": item.get("content_path") or str(settings_db["download_base_dir"]),
                    "added_on": item.get("added_on", 0),
                    "completion_on": item.get("completion_on", -1),
                    "amount_left": max(0, size - downloaded),
                    "completed": downloaded,
                    "total_size": size,
                }
            )
    return JSONResponse(result)


@router.get("/api/v2/torrents/files")
async def qb_torrents_files(hash: str):
    item = torrents_db.get(hash.lower())
    if not item:
        return JSONResponse([])
    cpath = Path(item.get("content_path", ""))
    files_list = []
    if cpath.is_file():
        files_list.append({"index": 0, "name": cpath.name, "size": item.get("size", 0), "progress": 1.0, "priority": 1})
    elif cpath.is_dir():
        for idx, f in enumerate(sorted(cpath.iterdir())):
            files_list.append({"index": idx, "name": f"{cpath.name}/{f.name}", "size": 0, "progress": 1.0, "priority": 1})
    return JSONResponse(files_list)


@router.post("/api/v2/torrents/delete")
async def qb_torrents_delete(
    hashes: str = Form(...),
    deleteFiles: Optional[str] = Form(None),
    deleteProvider: Optional[str] = Form(None),
):
    target_hashes = [h.strip().lower() for h in hashes.split("|") if h.strip()]
    ad_ids_to_delete: List[int] = []

    if deleteProvider is not None:
        explicit_del_ad = deleteProvider.lower() == "true"
        should_delete_local = (deleteFiles or "false").lower() == "true"
    else:
        explicit_del_ad = None
        should_delete_local = bool(settings_db.get("auto_clean_import")) or (
            (deleteFiles or "false").lower() == "true"
        )

    global_del_provider = bool(settings_db.get("delete_on_provider"))

    async with state_lock:
        for h in target_hashes:
            item = torrents_db.pop(h, None)
            if item:
                if explicit_del_ad is not None:
                    should_del_ad = explicit_del_ad
                else:
                    is_completed = (
                        float(item.get("progress", 0.0)) >= 1.0
                        and item.get("state") in ("completed", "uploading", "pausedUP", "stalledUP")
                        and int(item.get("completion_on") or 0) > 0
                    )
                    # Supprimer sur le provider (AllDebrid / RealDebrid / etc.) si :
                    # 1. Option globale delete_on_provider activée
                    # 2. OU torrent non terminé (échec, bloqué, non-caché, annulé/blocklisté par *arr)
                    # 3. OU suppression locale demandée et torrent jamais importé dans la médiathèque
                    should_del_ad = (
                        global_del_provider
                        or (not is_completed)
                        or (should_delete_local and not is_already_imported_by_arr(item))
                    )

                ad_id_raw = item.get("ad_id")
                if should_del_ad and ad_id_raw and str(ad_id_raw).isdigit() and not item.get("deleted_on_ad"):
                    ad_ids_to_delete.append(int(ad_id_raw))

                if should_delete_local:
                    remove_local_artifacts(item)
        save_state()

    logger.info(
        f"Suppression demandée pour {len(target_hashes)} torrent(s) (local={should_delete_local}, ad_ids={ad_ids_to_delete})."
    )

    if ad_ids_to_delete and settings_db.get("api_key"):
        async with httpx.AsyncClient() as client:
            for ad_id in dict.fromkeys(ad_ids_to_delete):
                await alldebrid_delete_magnet(client, ad_id)

    return PlainTextResponse("Ok.")


@router.post("/api/v2/torrents/pause")
async def qb_torrents_pause(hashes: str = Form(...)):
    target_hashes = [h.strip().lower() for h in hashes.split("|") if h.strip()]
    async with state_lock:
        for h in target_hashes:
            if h in torrents_db and torrents_db[h]["state"] not in ("pausedUP", "stalledUP"):
                torrents_db[h]["state"] = "pausedDL"
        save_state()
    return PlainTextResponse("Ok.")


@router.post("/api/v2/torrents/resume")
async def qb_torrents_resume(hashes: str = Form(...)):
    target_hashes = [h.strip().lower() for h in hashes.split("|") if h.strip()]
    now_ts = int(time.time())
    async with state_lock:
        for h in target_hashes:
            if h in torrents_db:
                torrents_db[h]["state"] = "downloading"
                torrents_db[h]["error_msg"] = ""
                torrents_db[h]["ready_since"] = now_ts
        save_state()
    return PlainTextResponse("Ok.")


@router.post("/api/v2/torrents/retry")
async def qb_torrents_retry(hashes: str = Form(...)):
    target_hashes = [h.strip().lower() for h in hashes.split("|") if h.strip()]
    now_ts = int(time.time())
    async with httpx.AsyncClient() as client:
        async with state_lock:
            for h in target_hashes:
                if h in torrents_db:
                    item = torrents_db[h]
                    item["error_msg"] = ""
                    item["ready_since"] = now_ts
                    item["missing_count"] = 0
                    if item.get("is_ddl"):
                        item["state"] = "resolving"
                        item["download_url"] = ""
                    else:
                        old_ad_id = item.get("ad_id")
                        # Retenter le débridage AllDebrid depuis le magnet
                        mag = item.get("magnet_uri") or f"magnet:?xt=urn:btih:{h}&dn={item.get('name') or h}"
                        try:
                            if old_ad_id and str(old_ad_id).isdigit():
                                try:
                                    await alldebrid_delete_magnet(client, int(old_ad_id))
                                except Exception:
                                    pass
                            ad_data = await alldebrid_upload_magnet(client, mag)
                            if ad_data and ad_data.get("id"):
                                item["ad_id"] = int(ad_data["id"])
                                if ad_data.get("name") and not item.get("name"):
                                    item["name"] = ad_data["name"]
                                is_rdy = bool(ad_data.get("ready", False))
                                item["is_debrided"] = is_rdy
                                item["debrid_cached"] = is_rdy
                                item["cloud_status"] = "Débridé (Cache)" if is_rdy else "En attente débridage"
                                logger.info(f"Relance débridage AllDebrid [{h[:8]}] -> nouvel ID={item['ad_id']} (ready={is_rdy})")
                        except Exception as e:
                            logger.warning(f"Échec ré-upload magnet pour {h[:8]} lors du retry: {e}")
                        item["state"] = "downloading"
                        item["progress"] = 0.0
            save_state()
    return PlainTextResponse("Ok.")


@router.post("/api/v2/torrents/setCategory")
async def qb_torrents_set_category(hashes: str = Form(...), category: str = Form("")):
    target_hashes = [h.strip().lower() for h in hashes.split("|") if h.strip()]
    cat = category.strip()
    async with state_lock:
        for h in target_hashes:
            if h in torrents_db:
                torrents_db[h]["category"] = cat
        save_state()
    return PlainTextResponse("Ok.")


@router.post("/api/v2/torrents/recheck")
async def qb_torrents_recheck(hashes: str = Form(...)):
    return PlainTextResponse("Ok.")


@router.get("/api/v2/torrents/tags")
@router.post("/api/v2/torrents/tags")
async def qb_torrents_tags():
    return JSONResponse([])


@router.get("/api/v2/app/buildInfo")
async def qb_build_info():
    return JSONResponse(
        {
            "qt": "6.6.0",
            "libtorrent": "2.0.10",
            "boost": "1.83.0",
            "openssl": "3.1.4",
            "bitness": 64,
        }
    )


# --- Nzb360 / WebUI Synchronization & Transfer Endpoints ---

@router.get("/api/v2/sync/maindata")
@router.post("/api/v2/sync/maindata")
async def qb_sync_maindata(rid: Optional[int] = 0):
    async with state_lock:
        torrents_dict = {}
        total_dl = 0
        for h, item in torrents_db.items():
            size = int(item.get("size") or 0)
            progress = float(item.get("progress") or 0.0)
            downloaded = size if progress >= 1.0 else int(size * progress)
            total_dl += downloaded
            raw_state = item.get("state") or "downloading"
            if raw_state == "copying":
                qb_state = "checkingDL"
            elif raw_state in ("stalledUP", "uploading", "completed", "pausedUP") or progress >= 1.0:
                qb_state = "pausedUP"
            else:
                qb_state = raw_state

            torrents_dict[h] = {
                "name": item.get("name") or h,
                "size": size,
                "progress": progress,
                "dlspeed": 0,
                "upspeed": 0,
                "priority": 1,
                "num_seeds": 1,
                "num_leechs": 0,
                "ratio": 1.0,
                "ratio_limit": 1.0,
                "max_ratio": 1.0,
                "seeding_time": 86400,
                "seeding_time_limit": 0,
                "max_seeding_time": 0,
                "time_active": 86400,
                "has_seed_limit_reached": True,
                "eta": 0 if progress >= 1.0 else 10,
                "state": qb_state,
                "category": item.get("category") or "",
                "save_path": item.get("save_path") or str(settings_db["download_base_dir"]),
                "content_path": item.get("content_path") or str(settings_db["download_base_dir"]),
                "added_on": item.get("added_on", 0),
                "completion_on": item.get("completion_on", -1),
                "amount_left": max(0, size - downloaded),
                "completed": downloaded,
                "total_size": size,
            }

        cats = {
            cat_name: {"name": cat_name, "savePath": cat_data.get("savePath", "")}
            for cat_name, cat_data in categories_db.items()
        }

    return JSONResponse(
        {
            "rid": (rid or 0) + 1,
            "full_update": True,
            "torrents": torrents_dict,
            "torrents_removed": [],
            "categories": cats,
            "categories_removed": [],
            "tags": [],
            "tags_removed": [],
            "server_state": {
                "connection_status": "connected",
                "dht_nodes": 0,
                "dl_info_data": total_dl,
                "dl_info_speed": 0,
                "dl_rate_limit": 0,
                "up_info_data": total_dl,
                "up_info_speed": 0,
                "up_rate_limit": 0,
                "free_space_on_disk": 1000 * 1024 * 1024 * 1024,
                "total_buffers_size": 0,
                "total_wasted_session": 0,
                "global_ratio": "1.0",
                "use_alt_speed_limits": False,
                "refresh_interval": 2000,
            },
        }
    )


@router.get("/api/v2/transfer/info")
@router.post("/api/v2/transfer/info")
async def qb_transfer_info():
    limit_mb = float(settings_db.get("download_speed_limit", 0))
    limit_bytes = int(limit_mb * 1024 * 1024)
    # Calcul de la vitesse instantanée globale
    async with state_lock:
        current_dlspeed = sum(int(t.get("dlspeed", 0)) for t in torrents_db.values())
    return JSONResponse(
        {
            "connection_status": "connected",
            "dht_nodes": 0,
            "dl_info_data": 0,
            "dl_info_speed": current_dlspeed,
            "dl_rate_limit": limit_bytes,
            "up_info_data": 0,
            "up_info_speed": 0,
            "up_rate_limit": 0,
        }
    )


@router.get("/api/v2/transfer/downloadLimit")
@router.post("/api/v2/transfer/downloadLimit")
async def qb_transfer_download_limit():
    limit_mb = float(settings_db.get("download_speed_limit", 0))
    limit_bytes = int(limit_mb * 1024 * 1024)
    return PlainTextResponse(str(limit_bytes))


@router.get("/api/v2/transfer/uploadLimit")
@router.post("/api/v2/transfer/uploadLimit")
async def qb_transfer_upload_limit():
    return PlainTextResponse("0")


@router.get("/api/v2/transfer/speedLimitsMode")
@router.post("/api/v2/transfer/speedLimitsMode")
async def qb_transfer_speed_limits_mode():
    return PlainTextResponse("0")


@router.post("/api/v2/transfer/setDownloadLimit")
async def qb_transfer_set_download_limit(limit: int = Form(0)):
    limit_mb = round(limit / (1024 * 1024), 2) if limit > 0 else 0.0
    async with state_lock:
        settings_db["download_speed_limit"] = limit_mb
        save_state()
    return PlainTextResponse("Ok.")


@router.post("/api/v2/transfer/setUploadLimit")
async def qb_transfer_set_upload_limit():
    return PlainTextResponse("Ok.")


@router.post("/api/v2/transfer/toggleSpeedLimitsMode")
@router.post("/api/v2/transfer/setSpeedLimitsMode")
async def qb_transfer_toggle_speed_limits_mode():
    return PlainTextResponse("Ok.")


@router.post("/api/v2/transfer/banPeers")
async def qb_transfer_ban_peers():
    return PlainTextResponse("Ok.")


@router.get("/api/v2/torrents/properties")
@router.post("/api/v2/torrents/properties")
async def qb_torrents_properties(hash: str):
    async with state_lock:
        item = torrents_db.get(hash.lower())
    if not item:
        return JSONResponse({}, status_code=404)
    size = int(item.get("size") or 0)
    progress = float(item.get("progress") or 0.0)
    downloaded = size if progress >= 1.0 else int(size * progress)
    return JSONResponse(
        {
            "save_path": item.get("save_path") or str(settings_db["download_base_dir"]),
            "creation_date": item.get("added_on", 0),
            "piece_size": 1024 * 1024,
            "pieces_num": max(1, size // (1024 * 1024)),
            "pieces_have": int(max(1, size // (1024 * 1024)) * progress),
            "comment": f"OmniSym Error: {item.get('error_msg')}" if item.get("state") == "error" else f"OmniSym Transfer ({item.get('transfer_mode', 'symlink')})",
            "total_wasted": 0,
            "total_uploaded": downloaded,
            "total_downloaded": downloaded,
            "up_limit": -1,
            "dl_limit": -1,
            "time_elapsed": 86400,
            "seeding_time": 86400,
            "nb_connections": 1,
            "nb_connections_limit": 100,
            "peers": 0,
            "peers_total": 0,
            "seeds": 0 if item.get("state") == "error" else 1,
            "seeds_total": 0 if item.get("state") == "error" else 1,
            "dl_speed": 0,
            "up_speed": 0,
            "eta": 86400 if item.get("state") == "error" else 0,
            "addition_date": item.get("added_on", 0),
            "completion_on": item.get("completion_on", -1),
        }
    )


@router.get("/api/v2/torrents/trackers")
@router.post("/api/v2/torrents/trackers")
async def qb_torrents_trackers(hash: str):
    item = torrents_db.get(hash.lower(), {})
    is_err = item.get("state") == "error"
    err_msg = item.get("error_msg") or "Erreur Fournisseur Debrid"
    return JSONResponse(
        [
            {
                "url": "**OmniSym Debrid**",
                "status": 4 if is_err else 2,
                "tier": 0,
                "num_peers": 0,
                "num_seeds": 0 if is_err else 1,
                "num_leeches": 0,
                "num_downloaded": 0 if is_err else 1,
                "msg": err_msg if is_err else "OK",
            }
        ]
    )


@router.get("/api/v2/torrents/pieceStates")
@router.post("/api/v2/torrents/pieceStates")
async def qb_torrents_piece_states(hash: str):
    return JSONResponse([2] * 20)

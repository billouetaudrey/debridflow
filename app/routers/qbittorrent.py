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
from app.storage import remove_local_artifacts

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
            if raw_state == "copying":
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
        should_delete_provider = deleteProvider.lower() == "true"
        should_delete_local = (deleteFiles or "false").lower() == "true"
    else:
        should_delete_provider = bool(settings_db.get("delete_on_provider"))
        should_delete_local = bool(settings_db.get("auto_clean_import")) or (
            (deleteFiles or "false").lower() == "true"
        )

    async with state_lock:
        for h in target_hashes:
            item = torrents_db.pop(h, None)
            if item:
                if should_delete_provider and item.get("ad_id") and not item.get("deleted_on_ad"):
                    ad_ids_to_delete.append(int(item["ad_id"]))
                if should_delete_local:
                    remove_local_artifacts(item)
        save_state()

    logger.info(
        f"Suppression demandée pour {len(target_hashes)} torrent(s) (local={should_delete_local}, ad={should_delete_provider})."
    )

    if ad_ids_to_delete and settings_db.get("api_key"):
        async with httpx.AsyncClient() as client:
            for ad_id in ad_ids_to_delete:
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
    async with state_lock:
        for h in target_hashes:
            if h in torrents_db:
                torrents_db[h]["state"] = "downloading"
                torrents_db[h]["error_msg"] = ""
                torrents_db[h]["ready_since"] = now_ts
        save_state()
    return PlainTextResponse("Ok.")

import hashlib
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

import httpx
from fastapi import APIRouter, Body, Form, HTTPException, Request
from fastapi.responses import JSONResponse

from app.alldebrid import alldebrid_upload_file, alldebrid_upload_magnet
from app.bencode import parse_magnet_uri, parse_torrent_bytes, sanitize_filename
from app.config import logger
from app.finder import (
    AVAILABLE_ENGINES,
    load_finder_config,
    run_finder_search_async,
    save_finder_config,
)
from app.state import resolve_service, save_state, settings_db, state_lock, torrents_db

router = APIRouter(prefix="/api/finder", tags=["finder"])


@router.get("/config")
async def get_finder_config():
    cfg = load_finder_config()
    return JSONResponse(
        {
            "config": cfg,
            "available_engines": AVAILABLE_ENGINES,
        }
    )


@router.post("/config")
async def set_finder_config(payload: Dict[str, Any] = Body(...)):
    cfg = load_finder_config()
    for k, v in payload.items():
        if k in cfg:
            cfg[k] = v
    save_finder_config(cfg)
    logger.info("Configuration du Finder enregistrée.")
    return JSONResponse({"status": "ok", "config": cfg})


@router.post("/search")
async def api_finder_search(payload: Dict[str, Any] = Body(...)):
    query = (payload.get("query") or "").strip()
    if not query:
        raise HTTPException(status_code=400, detail="La requête de recherche est vide.")

    cfg = load_finder_config()

    search_mode = str(payload.get("search_mode") or cfg.get("search_mode", "torrent")).strip()
    site_filter = str(payload.get("site_filter") or cfg.get("site_filter", "rapidgator.net")).strip()
    engines = payload.get("engines") or cfg.get("engines")
    region = str(payload.get("region") or cfg.get("region", "fr-fr")).strip()
    safesearch = str(payload.get("safesearch") or cfg.get("safesearch", "off")).strip()

    try:
        max_results = int(payload.get("max_results") or cfg.get("max_results", 25))
    except Exception:
        max_results = 25

    try:
        max_pages_to_scrape = int(payload.get("max_pages_to_scrape") or cfg.get("max_pages_to_scrape", 18))
    except Exception:
        max_pages_to_scrape = 18

    try:
        min_similarity = int(payload.get("min_similarity") or cfg.get("min_similarity", 10))
    except Exception:
        min_similarity = 10

    verify_links = bool(payload.get("verify_links", cfg.get("verify_links", True)))

    try:
        timeout = int(payload.get("timeout") or cfg.get("timeout", 8))
    except Exception:
        timeout = 8

    user_agent = cfg.get("user_agent")
    max_workers = int(cfg.get("max_workers", 8))

    logger.info(f"Finder: recherche multi-moteurs lancée pour '{query}' (mode={search_mode}, moteurs={len(engines) if engines else 0})...")

    try:
        results = await run_finder_search_async(
            query=query,
            search_mode=search_mode,
            site_filter=site_filter,
            engines=engines,
            region=region,
            safesearch=safesearch,
            max_results=max_results,
            max_pages_to_scrape=max_pages_to_scrape,
            min_similarity=min_similarity,
            verify_links=verify_links,
            timeout=timeout,
            user_agent=user_agent,
            max_workers=max_workers,
        )
        return JSONResponse(results)
    except Exception as exc:
        logger.error(f"Erreur recherche Finder: {exc}", exc_info=True)
        return JSONResponse(
            {
                "pages_scanned": 0,
                "engine_counts": {},
                "engine_errors": {"Erreur": str(exc)},
                "results": [],
                "rejected": [],
                "error": str(exc),
            },
            status_code=500,
        )


@router.post("/download")
async def api_finder_download(payload: Dict[str, Any] = Body(...)):
    """
    Télécharge un ou plusieurs liens trouvés directement dans OmniSym.
    Prend en charge les liens magnet, les fichiers .torrent (téléchargés puis envoyés),
    et les liens DDL (Rapidgator, etc.) envoyés dans la file DDL.
    """
    items = payload.get("items") or []
    single_url = payload.get("url")
    if single_url and not items:
        items = [{"url": single_url, "kind": payload.get("kind", "magnet"), "name": payload.get("name")}]

    if not items:
        raise HTTPException(status_code=400, detail="Aucun élément à télécharger spécifié.")

    cat = (payload.get("category") or "torrent-direct").strip()
    cfg_mode, configured_dir = resolve_service(cat)
    transfer_mode = payload.get("transfer_mode") or cfg_mode
    if transfer_mode not in ("download", "symlink"):
        transfer_mode = cfg_mode
    save_dir = configured_dir
    save_dir.mkdir(parents=True, exist_ok=True)

    added_items: List[Dict[str, Any]] = []
    errors: List[str] = []

    async with httpx.AsyncClient(timeout=30.0) as client:
        for entry in items:
            raw_url = str(entry.get("url") or "").strip()
            if not raw_url:
                continue
            item_kind = str(entry.get("kind") or "").lower()
            hint_name = str(entry.get("name") or "").strip()

            try:
                # 1. Liens Magnet
                if raw_url.lower().startswith("magnet:?") or item_kind == "magnet":
                    info_hash, parsed_name = parse_magnet_uri(raw_url)
                    ad_data = await alldebrid_upload_magnet(client, raw_url)
                    ad_id = ad_data.get("id")
                    if str(ad_id).isdigit():
                        ad_id = int(ad_id)
                    ad_name = ad_data.get("name") or parsed_name or hint_name or "Magnet"
                    real_hash = str(ad_data.get("hash") or "").strip().lower()
                    if real_hash:
                        info_hash = real_hash

                    async with state_lock:
                        torrents_db[info_hash] = {
                            "hash": info_hash,
                            "ad_id": ad_id,
                            "name": ad_name,
                            "category": cat,
                            "transfer_mode": transfer_mode,
                            "save_path": str(save_dir),
                            "content_path": str(save_dir / sanitize_filename(ad_name)),
                            "linked_paths": [],
                            "size": int(ad_data.get("size") or 0),
                            "progress": 0.0,
                            "state": "downloading",
                            "added_on": int(time.time()),
                            "completion_on": -1,
                            "deleted_on_ad": False,
                            "missing_count": 0,
                            "is_ddl": False,
                        }
                        save_state()
                    added_items.append({"hash": info_hash, "name": ad_name, "type": "magnet"})

                # 2. Liens de fichiers .torrent distants
                elif ".torrent" in raw_url.lower() or item_kind == "torrent":
                    # Télécharger le fichier .torrent
                    resp = await client.get(raw_url, headers={"User-Agent": "OmniSym"}, follow_redirects=True)
                    resp.raise_for_status()
                    torrent_bytes = resp.content

                    info_hash, torrent_name = parse_torrent_bytes(torrent_bytes)
                    ad_name = torrent_name or hint_name or "Fichier.torrent"
                    ad_data = await alldebrid_upload_file(client, f"{ad_name}.torrent", torrent_bytes)
                    ad_id = ad_data.get("id")
                    if str(ad_id).isdigit():
                        ad_id = int(ad_id)
                    real_hash = str(ad_data.get("hash") or "").strip().lower()
                    if real_hash:
                        info_hash = real_hash

                    async with state_lock:
                        torrents_db[info_hash] = {
                            "hash": info_hash,
                            "ad_id": ad_id,
                            "name": ad_name,
                            "category": cat,
                            "transfer_mode": transfer_mode,
                            "save_path": str(save_dir),
                            "content_path": str(save_dir / sanitize_filename(ad_name)),
                            "linked_paths": [],
                            "size": int(ad_data.get("size") or 0),
                            "progress": 0.0,
                            "state": "downloading",
                            "added_on": int(time.time()),
                            "completion_on": -1,
                            "deleted_on_ad": False,
                            "missing_count": 0,
                            "is_ddl": False,
                        }
                        save_state()
                    added_items.append({"hash": info_hash, "name": ad_name, "type": "torrent"})

                # 3. Liens DDL directs (Rapidgator, etc.)
                else:
                    info_hash = hashlib.sha1(raw_url.encode("utf-8")).hexdigest()
                    raw_fname = Path(raw_url.split("?")[0]).name or hint_name or "fichier_ddl"
                    ddl_cfg_dir = settings_db.get("ddl_download_dir")
                    if ddl_cfg_dir and cat in ("direct", "torrent-direct", ""):
                        ddl_save_dir = Path(ddl_cfg_dir)
                    else:
                        ddl_save_dir = save_dir
                    ddl_save_dir.mkdir(parents=True, exist_ok=True)

                    async with state_lock:
                        torrents_db[info_hash] = {
                            "hash": info_hash,
                            "ad_id": "DDL",
                            "name": sanitize_filename(hint_name or raw_fname) or "fichier_ddl",
                            "category": cat,
                            "transfer_mode": "download",
                            "save_path": str(ddl_save_dir),
                            "content_path": str(ddl_save_dir / sanitize_filename(raw_fname)),
                            "linked_paths": [],
                            "size": 0,
                            "progress": 0.0,
                            "state": "resolving",
                            "added_on": int(time.time()),
                            "completion_on": -1,
                            "deleted_on_ad": False,
                            "missing_count": 0,
                            "is_ddl": True,
                            "original_url": raw_url,
                            "password": "",
                            "download_url": "",
                            "error_msg": "",
                        }
                        save_state()
                    added_items.append({"hash": info_hash, "name": hint_name or raw_fname, "type": "ddl"})

            except Exception as exc:
                logger.error(f"Erreur ajout Finder vers OmniSym pour '{raw_url[:60]}' : {exc}")
                errors.append(f"{raw_url[:60]}... : {exc}")

    if not added_items and errors:
        return JSONResponse({"status": "error", "message": "; ".join(errors)}, status_code=400)

    logger.info(f"Finder: {len(added_items)} élément(s) transféré(s) vers la file OmniSym.")
    return JSONResponse(
        {
            "status": "ok",
            "count": len(added_items),
            "items": added_items,
            "errors": errors,
            "message": f"{len(added_items)} téléchargement(s) ajouté(s) à OmniSym avec succès !",
        }
    )

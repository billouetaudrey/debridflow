import asyncio
import time
from pathlib import Path
from typing import Any, Dict, List, Set

import httpx

from app.alldebrid import (
    alldebrid_delete_magnet,
    alldebrid_get_magnet_files,
    alldebrid_get_statuses,
    check_alldebrid_api_health,
)
from app.config import logger
from app.state import (
    api_health,
    resolve_service,
    save_state,
    settings_db,
    state_lock,
    torrents_db,
)
from app.storage import (
    find_mounted_files,
    is_already_imported_by_arr,
    materialize_files_for_torrent,
    remove_local_artifacts,
)


async def background_worker() -> None:
    logger.info("Worker PyRDT actif et en écoute.")
    copying_hashes: Set[str] = set()

    async def _run_transfer(
        http_client: httpx.AsyncClient,
        info_hash: str,
        item_snapshot: Dict[str, Any],
        mounted_files: List[Path],
        mode: str,
        dest_dir: Path,
    ) -> None:
        try:
            content_path, linked_paths = await asyncio.to_thread(
                materialize_files_for_torrent, item_snapshot, mounted_files, mode, dest_dir
            )
            now_done = int(time.time())
            ad_id = int(item_snapshot.get("ad_id") or 0)
            deleted_on_ad = False

            if mode == "download" and settings_db.get("delete_on_dl_complete") and ad_id and settings_db.get("api_key"):
                await alldebrid_delete_magnet(http_client, ad_id)
                deleted_on_ad = True

            async with state_lock:
                if info_hash in torrents_db:
                    torrents_db[info_hash].update(
                        {
                            "name": item_snapshot["name"],
                            "size": item_snapshot["size"],
                            "progress": 1.0,
                            "state": "pausedUP",
                            "transfer_mode": mode,
                            "save_path": str(dest_dir),
                            "content_path": content_path,
                            "linked_paths": linked_paths,
                            "completion_on": now_done,
                            "files_linked": len(mounted_files),
                            "deleted_on_ad": deleted_on_ad,
                            "error_msg": "",
                        }
                    )
                    save_state()
            label_mode = "Fichier(s) téléchargé(s)" if mode == "download" else "Symlink(s) créé(s)"
            logger.info(f"{label_mode} ({len(mounted_files)} fichier(s)) -> {content_path}")
        except Exception as exc:
            logger.error(f"Erreur transfert ({mode}) pour {item_snapshot.get('name')} : {exc}")
            async with state_lock:
                if info_hash in torrents_db:
                    torrents_db[info_hash]["state"] = "error"
                    torrents_db[info_hash]["error_msg"] = f"Erreur copie/symlink : {exc}"
                    save_state()
        finally:
            copying_hashes.discard(info_hash)

    async with httpx.AsyncClient() as client:
        await check_alldebrid_api_health(client)
        while True:
            poll_interval = max(1.5, float(settings_db.get("poll_interval", 3.0)))
            mount_timeout = int(settings_db.get("mount_timeout", 60))
            try:
                now_ts = int(time.time())

                # Rafraîchissement périodique du statut API AllDebrid (toutes les 60s)
                if now_ts - int(api_health.get("last_check") or 0) >= 60:
                    await check_alldebrid_api_health(client)

                if settings_db.get("auto_clean_import"):
                    moved_hashes: List[str] = []
                    moved_ad_ids: List[int] = []
                    async with state_lock:
                        for h, item in list(torrents_db.items()):
                            if item.get("state") in ("pausedUP", "stalledUP"):
                                comp_ts = int(item.get("completion_on") or 0)
                                if comp_ts > 0 and (now_ts - comp_ts) >= 15 and is_already_imported_by_arr(item):
                                    moved_hashes.append(h)
                                    if (
                                        settings_db.get("delete_on_provider")
                                        and item.get("ad_id")
                                        and not item.get("deleted_on_ad")
                                    ):
                                        moved_ad_ids.append(int(item["ad_id"]))
                                    remove_local_artifacts(item)
                                    torrents_db.pop(h, None)
                        if moved_hashes:
                            save_state()

                    if moved_hashes:
                        logger.info(f"Auto-nettoyage après import : {len(moved_hashes)} torrent(s) purgé(s).")
                    if moved_ad_ids and settings_db.get("api_key"):
                        for ad_id in moved_ad_ids:
                            await alldebrid_delete_magnet(client, ad_id)

                async with state_lock:
                    active_items = [
                        (h, dict(item))
                        for h, item in torrents_db.items()
                        if item["state"] not in ("pausedUP", "stalledUP", "pausedDL", "error")
                        and h not in copying_hashes
                    ]

                if not active_items or not settings_db.get("api_key"):
                    await asyncio.sleep(poll_interval)
                    continue

                tracked_ids = [int(item["ad_id"]) for _, item in active_items if item.get("ad_id")]
                statuses = await alldebrid_get_statuses(client, tracked_ids)

                for info_hash, item in active_items:
                    if info_hash in copying_hashes:
                        continue
                    ad_id = int(item.get("ad_id") or 0)
                    if not ad_id or ad_id not in statuses:
                        logger.warning(f"ID={ad_id} ({info_hash[:8]}) introuvable dans la réponse AllDebrid.")
                        continue

                    ad_info = statuses[ad_id]
                    status_code = int(ad_info.get("statusCode", 0))
                    ad_filename = ad_info.get("filename") or item["name"]
                    ad_size = int(ad_info.get("size") or item.get("size") or 0)

                    if status_code >= 5:
                        async with state_lock:
                            if info_hash in torrents_db:
                                torrents_db[info_hash]["state"] = "error"
                                torrents_db[info_hash]["error_msg"] = ad_info.get("status", "Erreur AllDebrid")
                                save_state()
                        logger.warning(f"Échec AllDebrid [{info_hash[:8]}] : {ad_info.get('status')}")
                        continue

                    if status_code != 4:
                        downloaded = int(ad_info.get("downloaded") or 0)
                        progress = (downloaded / ad_size) if ad_size > 0 else 0.1
                        async with state_lock:
                            if info_hash in torrents_db and torrents_db[info_hash]["state"] != "pausedDL":
                                torrents_db[info_hash]["name"] = ad_filename
                                torrents_db[info_hash]["size"] = ad_size
                                torrents_db[info_hash]["progress"] = min(0.99, round(progress, 4))
                                torrents_db[info_hash]["state"] = "downloading"
                                save_state()
                        continue

                    mode, dest_dir = resolve_service(item.get("category", ""))
                    ready_since = item.get("ready_since") or now_ts
                    async with state_lock:
                        if info_hash in torrents_db and torrents_db[info_hash]["state"] != "pausedDL":
                            torrents_db[info_hash]["ready_since"] = ready_since
                            torrents_db[info_hash]["name"] = ad_filename
                            torrents_db[info_hash]["size"] = ad_size
                            torrents_db[info_hash]["progress"] = 0.99
                            torrents_db[info_hash]["transfer_mode"] = mode
                            torrents_db[info_hash]["save_path"] = str(dest_dir)
                            torrents_db[info_hash]["state"] = "checkingDL"
                            save_state()

                    links = ad_info.get("links") or []
                    expected_files = [lnk.get("filename", "") for lnk in links if isinstance(lnk, dict)]
                    if not expected_files:
                        expected_files = await alldebrid_get_magnet_files(client, ad_id)

                    mounted_files = await asyncio.to_thread(find_mounted_files, ad_filename, expected_files)

                    if not mounted_files:
                        waited = now_ts - ready_since
                        if mount_timeout > 0 and waited > mount_timeout:
                            async with state_lock:
                                if info_hash in torrents_db:
                                    torrents_db[info_hash]["state"] = "error"
                                    torrents_db[info_hash]["error_msg"] = f"Introuvable dans rclone après {waited}s"
                                    save_state()
                            logger.error(f"Timeout rclone ({waited}s) pour {ad_filename}")
                            continue

                        logger.info(f"Attente montage rclone ({waited}s/{mount_timeout}s) : {ad_filename}")
                        continue

                    copying_hashes.add(info_hash)
                    if mode == "download":
                        async with state_lock:
                            if info_hash in torrents_db:
                                torrents_db[info_hash]["state"] = "copying"
                                save_state()
                        logger.info(f"Début copie locale ({len(mounted_files)} fichier(s)) -> {dest_dir} : {ad_filename}")

                    entry_copy = dict(item, name=ad_filename, size=ad_size)
                    asyncio.create_task(_run_transfer(client, info_hash, entry_copy, mounted_files, mode, dest_dir))

            except Exception as exc:
                logger.error(f"Erreur boucle worker : {exc}", exc_info=True)

            await asyncio.sleep(poll_interval)

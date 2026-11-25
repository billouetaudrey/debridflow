import asyncio
import time
from pathlib import Path
from typing import Any, Dict, List, Set

import httpx

from app.alldebrid import (
    alldebrid_delete_magnet,
    alldebrid_get_magnet_files,
    alldebrid_get_statuses,
    alldebrid_unlock_link,
    check_alldebrid_api_health,
)
from app.bencode import sanitize_filename
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
    download_http_file_chunked,
    find_mounted_files,
    is_already_imported_by_arr,
    materialize_files_for_torrent,
    refresh_rclone_vfs,
    remove_local_artifacts,
)

RCLONE_RETRY_DELAYS = [10, 20, 30, 60, 120, 180]


async def background_worker() -> None:
    logger.info("Worker OmniSym actif et en écoute.")
    copying_hashes: Set[str] = set()
    active_downloads: Set[str] = set()
    active_target_paths: Set[str] = set()

    async def _run_transfer(
        http_client: httpx.AsyncClient,
        info_hash: str,
        item_snapshot: Dict[str, Any],
        mounted_files: List[Path],
        mode: str,
        dest_dir: Path,
        target_path: Optional[str] = None,
    ) -> None:
        try:
            def on_progress(bytes_copied: int, total_expected: int, instant_speed: float):
                if info_hash in torrents_db:
                    torrents_db[info_hash]["dlspeed"] = int(instant_speed)
                    if total_expected > 0:
                        torrents_db[info_hash]["progress"] = min(0.99, round(bytes_copied / total_expected, 4))
                        rem = max(0, total_expected - bytes_copied)
                        torrents_db[info_hash]["eta"] = int(rem / instant_speed) if instant_speed > 0 else 0

            speed_limit_mb = float(settings_db.get("download_speed_limit", 0))
            speed_limit_bytes = int(speed_limit_mb * 1024 * 1024)

            content_path, linked_paths, total_copied, duration = await asyncio.to_thread(
                materialize_files_for_torrent,
                item_snapshot,
                mounted_files,
                mode,
                dest_dir,
                speed_limit_bytes,
                on_progress if mode == "download" else None,
            )
            now_done = int(time.time())
            ad_id = int(item_snapshot.get("ad_id") or 0)
            deleted_on_ad = False

            avg_speed = int(total_copied / duration) if duration > 0 and total_copied > 0 else 0
            if mode == "download":
                settings_db["last_download_stat"] = {
                    "name": item_snapshot["name"],
                    "size": total_copied,
                    "duration": round(duration, 1),
                    "avg_speed": avg_speed,
                    "timestamp": now_done,
                }

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
                            "dlspeed": 0,
                            "avg_speed": avg_speed,
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
            if mode == "download":
                speed_str = f"{avg_speed / (1024*1024):.2f} Mo/s" if avg_speed >= 1024*1024 else f"{avg_speed / 1024:.1f} Ko/s"
                logger.info(f"Fichier(s) téléchargé(s) ({len(mounted_files)} fichier(s)) -> {content_path} (Vitesse moy : {speed_str} en {duration:.1f}s)")
            else:
                logger.info(f"Symlink(s) créé(s) ({len(mounted_files)} fichier(s)) -> {content_path}")
            try:
                from app.notifications import notifier
                await notifier.notify_download_complete(
                    name=item_snapshot["name"],
                    category=item_snapshot.get("category", ""),
                    mode=mode,
                    size_bytes=total_copied if mode == "download" else item_snapshot.get("size", 0),
                    duration=round(duration, 1),
                    avg_speed=avg_speed,
                )
            except Exception as notif_err:
                logger.warning(f"Worker: erreur notif download complete : {notif_err}")
        except Exception as exc:
            logger.error(f"Erreur transfert ({mode}) pour {item_snapshot.get('name')} : {exc}")
            async with state_lock:
                if info_hash in torrents_db:
                    torrents_db[info_hash]["state"] = "error"
                    torrents_db[info_hash]["error_msg"] = f"Erreur copie/symlink : {exc}"
                    save_state()
            try:
                from app.notifications import notifier
                await notifier.notify_error(
                    title=f"Erreur transfert ({mode}) : {item_snapshot.get('name')}",
                    message=str(exc),
                )
            except Exception:
                pass
        finally:
            copying_hashes.discard(info_hash)
            active_downloads.discard(info_hash)
            if target_path:
                active_target_paths.discard(target_path)

    async def _run_ddl_download(
        http_client: httpx.AsyncClient,
        item_id: str,
        item_snapshot: Dict[str, Any],
        dest_dir: Path,
    ) -> None:
        try:
            dest_dir.mkdir(parents=True, exist_ok=True)
            raw_name = item_snapshot.get("name") or "fichier"
            clean_name = sanitize_filename(raw_name) or "fichier"
            target_file = dest_dir / clean_name
            tmp_file = dest_dir / f".{clean_name}.{item_id[:8]}.part"
            download_url = item_snapshot.get("download_url")

            if not download_url:
                raise RuntimeError("URL de téléchargement direct absente")

            total_expected = int(item_snapshot.get("size") or 0)
            speed_limit_mb = float(settings_db.get("download_speed_limit", 0))
            speed_limit_bytes = int(speed_limit_mb * 1024 * 1024)

            async with state_lock:
                if item_id in torrents_db:
                    torrents_db[item_id]["state"] = "copying"
                    torrents_db[item_id]["save_path"] = str(dest_dir)
                    save_state()

            logger.info(f"Début téléchargement DDL -> {target_file} (Taille : {total_expected} octets)")

            def on_progress(bytes_copied: int, total_exp: int, instant_speed: float):
                if item_id in torrents_db:
                    torrents_db[item_id]["dlspeed"] = int(instant_speed)
                    if total_exp > 0:
                        torrents_db[item_id]["progress"] = min(0.99, round(bytes_copied / total_exp, 4))
                        rem = max(0, total_exp - bytes_copied)
                        torrents_db[item_id]["eta"] = int(rem / instant_speed) if instant_speed > 0 else 0

            total_copied, duration = await asyncio.to_thread(
                download_http_file_chunked,
                download_url,
                target_file,
                tmp_file,
                speed_limit_bytes,
                total_expected,
                on_progress,
            )

            now_done = int(time.time())
            avg_speed = int(total_copied / duration) if duration > 0 and total_copied > 0 else 0

            settings_db["last_download_stat"] = {
                "name": clean_name,
                "size": total_copied,
                "duration": round(duration, 1),
                "avg_speed": avg_speed,
                "timestamp": now_done,
            }

            async with state_lock:
                if item_id in torrents_db:
                    torrents_db[item_id].update(
                        {
                            "name": clean_name,
                            "size": total_copied,
                            "progress": 1.0,
                            "dlspeed": 0,
                            "avg_speed": avg_speed,
                            "state": "pausedUP",
                            "transfer_mode": "download",
                            "save_path": str(dest_dir),
                            "content_path": str(target_file),
                            "completion_on": now_done,
                            "error_msg": "",
                        }
                    )
                    save_state()

            speed_str = (
                f"{avg_speed / (1024*1024):.2f} Mo/s"
                if avg_speed >= 1024 * 1024
                else f"{avg_speed / 1024:.1f} Ko/s"
            )
            logger.info(f"Fichier DDL téléchargé -> {target_file} (Vitesse moy : {speed_str} en {duration:.1f}s)")

            try:
                from app.notifications import notifier
                await notifier.notify_download_complete(
                    name=clean_name,
                    category=item_snapshot.get("category", ""),
                    mode="download",
                    size_bytes=total_copied,
                    duration=round(duration, 1),
                    avg_speed=avg_speed,
                )
            except Exception as notif_err:
                logger.warning(f"Worker: erreur notif download complete DDL : {notif_err}")

        except Exception as exc:
            logger.error(f"Erreur téléchargement DDL pour {item_snapshot.get('name')} : {exc}")
            async with state_lock:
                if item_id in torrents_db:
                    torrents_db[item_id]["state"] = "error"
                    torrents_db[item_id]["error_msg"] = f"Erreur DDL : {exc}"
                    save_state()
            try:
                from app.notifications import notifier
                await notifier.notify_error(
                    title=f"Erreur DDL : {item_snapshot.get('name')}",
                    message=str(exc),
                )
            except Exception:
                pass
        finally:
            copying_hashes.discard(item_id)
            active_downloads.discard(item_id)

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

                max_concurrent = max(1, int(settings_db.get("max_concurrent_downloads", 3)))

                # 1. Traitement des liens DDL directs
                ddl_items = [(h, item) for h, item in active_items if item.get("is_ddl")]
                for ddl_h, ddl_item in ddl_items:
                    if ddl_h in copying_hashes:
                        continue
                    # Débridage si en attente de résolution
                    if ddl_item.get("state") == "resolving":
                        try:
                            logger.info(f"Débridage du lien DDL [{ddl_h[:8]}]...")
                            link_info = await alldebrid_unlock_link(
                                client, ddl_item.get("original_url", ""), password=ddl_item.get("password")
                            )
                            async with state_lock:
                                if ddl_h in torrents_db:
                                    torrents_db[ddl_h].update(
                                        {
                                            "name": link_info.get("filename") or ddl_item.get("name"),
                                            "size": link_info.get("size") or 0,
                                            "download_url": link_info.get("link") or "",
                                            "state": "queued",
                                            "is_debrided": True,
                                            "cloud_status": "Débridé",
                                            "error_msg": "",
                                        }
                                    )
                                    save_state()
                            logger.info(f"Lien DDL débridé [{ddl_h[:8]}] : {link_info.get('filename')}")
                        except Exception as unlock_err:
                            logger.warning(f"Échec débridage DDL [{ddl_h[:8]}] : {unlock_err}")
                            async with state_lock:
                                if ddl_h in torrents_db:
                                    torrents_db[ddl_h]["state"] = "error"
                                    torrents_db[ddl_h]["error_msg"] = f"Échec débridage : {unlock_err}"
                                    save_state()
                            continue

                    # Téléchargement si prêt et slot dispo
                    if ddl_item.get("state") in ("queued", "downloading") and ddl_item.get("download_url"):
                        if len(active_downloads) < max_concurrent:
                            copying_hashes.add(ddl_h)
                            active_downloads.add(ddl_h)
                            _, ddl_dest = resolve_service(ddl_item.get("category", ""))
                            if ddl_item.get("save_path"):
                                ddl_dest = Path(ddl_item["save_path"])
                            entry_copy = dict(ddl_item)
                            asyncio.create_task(_run_ddl_download(client, ddl_h, entry_copy, ddl_dest))
                        else:
                            async with state_lock:
                                if ddl_h in torrents_db and torrents_db[ddl_h]["state"] != "queued":
                                    torrents_db[ddl_h]["state"] = "queued"
                                    save_state()

                # 2. Traitement des torrents
                torrent_items = [(h, item) for h, item in active_items if not item.get("is_ddl")]
                tracked_ids = [
                    int(item["ad_id"])
                    for _, item in torrent_items
                    if item.get("ad_id") and str(item.get("ad_id")).isdigit()
                ]
                statuses = await alldebrid_get_statuses(client, tracked_ids) if tracked_ids else {}

                for info_hash, item in torrent_items:
                    if info_hash in copying_hashes:
                        continue
                    ad_id = int(item.get("ad_id") or 0)
                    if not ad_id or ad_id not in statuses:
                        missing_cnt = int(item.get("missing_count", 0)) + 1
                        async with state_lock:
                            if info_hash in torrents_db:
                                torrents_db[info_hash]["missing_count"] = missing_cnt
                        if missing_cnt < 3:
                            logger.warning(f"ID={ad_id} ({info_hash[:8]}) introuvable chez le fournisseur (tentative {missing_cnt}/3)...")
                        else:
                            err_text = "Torrent introuvable ou supprimé chez le fournisseur Debrid"
                            async with state_lock:
                                if info_hash in torrents_db:
                                    torrents_db[info_hash]["state"] = "error"
                                    torrents_db[info_hash]["error_msg"] = err_text
                                    save_state()
                            logger.error(f"Échec Debrid [{info_hash[:8]}] : {err_text} (ID={ad_id})")
                            try:
                                from app.notifications import notifier
                                await notifier.notify_error(f"Échec débridage : {item.get('name') or info_hash[:8]}", err_text)
                            except Exception:
                                pass
                        continue

                    # Réinitialiser le compteur d'absence si le torrent réapparaît
                    if item.get("missing_count"):
                        async with state_lock:
                            if info_hash in torrents_db:
                                torrents_db[info_hash]["missing_count"] = 0

                    ad_info = statuses[ad_id]
                    status_code = int(ad_info.get("statusCode", 0))
                    ad_filename = ad_info.get("filename") or item["name"]
                    ad_size = int(ad_info.get("size") or item.get("size") or 0)
                    ad_status_str = str(ad_info.get("status") or "").strip()
                    ad_status_lower = ad_status_str.lower()

                    is_error = (
                        status_code >= 5
                        or status_code < 0
                        or "error" in ad_status_lower
                        or "fail" in ad_status_lower
                        or "dead" in ad_status_lower
                        or "invalid" in ad_status_lower
                        or bool(ad_info.get("error"))
                    )

                    if is_error:
                        err_text = ad_status_str or "Erreur Fournisseur Debrid"
                        async with state_lock:
                            if info_hash in torrents_db:
                                torrents_db[info_hash]["state"] = "error"
                                torrents_db[info_hash]["error_msg"] = err_text
                                save_state()
                        logger.warning(f"Échec Debrid [{info_hash[:8]}] : {err_text}")
                        try:
                            from app.notifications import notifier
                            await notifier.notify_error(f"Échec débridage : {ad_filename}", err_text)
                        except Exception:
                            pass
                        continue

                    if status_code != 4:
                        downloaded = int(ad_info.get("downloaded") or 0)
                        progress = (downloaded / ad_size) if ad_size > 0 else 0.1
                        seeders = int(ad_info.get("seeders") or 0)
                        cloud_speed = int(ad_info.get("downloadSpeed") or 0)
                        async with state_lock:
                            if info_hash in torrents_db and torrents_db[info_hash]["state"] != "pausedDL":
                                torrents_db[info_hash]["name"] = ad_filename
                                torrents_db[info_hash]["size"] = ad_size
                                torrents_db[info_hash]["progress"] = min(0.99, round(progress, 4))
                                torrents_db[info_hash]["state"] = "downloading"
                                torrents_db[info_hash]["is_debrided"] = False
                                torrents_db[info_hash]["debrid_cached"] = False
                                torrents_db[info_hash]["seeders"] = seeders
                                torrents_db[info_hash]["cloud_speed"] = cloud_speed
                                torrents_db[info_hash]["cloud_status"] = ad_status_str or "Téléchargement cloud"
                                save_state()
                        continue

                    mode, dest_dir = resolve_service(item.get("category", ""))
                    if item.get("transfer_mode") in ("download", "symlink"):
                        mode = item["transfer_mode"]
                    if item.get("save_path"):
                        dest_dir = Path(item["save_path"])
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
                            torrents_db[info_hash]["is_debrided"] = True
                            torrents_db[info_hash]["cloud_status"] = "Débridé"
                            save_state()

                    retry_attempt = int(item.get("rclone_retry_attempt") or 0)
                    next_retry_ts = float(item.get("rclone_next_retry_ts") or 0.0)
                    total_delays = len(RCLONE_RETRY_DELAYS)

                    # Si un prochain essai est planifié dans le futur, décompter sans appel disque/réseau lourd
                    if next_retry_ts > now_ts:
                        rem = max(1, int(next_retry_ts - now_ts))
                        status_str = f"Attente montage rclone (tentative {retry_attempt}/{total_delays} • dans {rem}s)"
                        async with state_lock:
                            if info_hash in torrents_db:
                                torrents_db[info_hash]["retry_status"] = status_str
                                torrents_db[info_hash]["rclone_retry_total"] = total_delays
                                save_state()
                        continue

                    # Si c'est une retentative (retry_attempt > 0), forcer un rafraîchissement VFS rclone
                    if retry_attempt > 0:
                        await refresh_rclone_vfs("magnets")

                    links = ad_info.get("links") or []
                    expected_files = [lnk.get("filename", "") for lnk in links if isinstance(lnk, dict)]
                    if not expected_files:
                        expected_files = await alldebrid_get_magnet_files(client, ad_id)

                    mounted_files = await asyncio.to_thread(find_mounted_files, ad_filename, expected_files, ad_id)

                    if not mounted_files:
                        waited = int(now_ts - ready_since)
                        new_attempt = retry_attempt + 1

                        if new_attempt <= total_delays:
                            delay = RCLONE_RETRY_DELAYS[new_attempt - 1]
                            next_ts = now_ts + delay
                            status_str = f"Attente montage rclone (tentative {new_attempt}/{total_delays} • dans {delay}s)"
                            async with state_lock:
                                if info_hash in torrents_db:
                                    torrents_db[info_hash]["rclone_retry_attempt"] = new_attempt
                                    torrents_db[info_hash]["rclone_next_retry_ts"] = next_ts
                                    torrents_db[info_hash]["rclone_retry_total"] = total_delays
                                    torrents_db[info_hash]["retry_status"] = status_str
                                    save_state()
                            logger.info(
                                f"Fichiers non trouvés dans rclone pour '{ad_filename}' ({waited}s). "
                                f"Programmation tentative {new_attempt}/{total_delays} dans {delay}s"
                            )
                            # Invalidation proactive du cache VFS rclone en tâche de fond
                            asyncio.create_task(refresh_rclone_vfs("magnets"))
                            continue
                        else:
                            # Toutes les tentatives sont épuisées
                            async with state_lock:
                                if info_hash in torrents_db:
                                    torrents_db[info_hash]["state"] = "error"
                                    torrents_db[info_hash]["rclone_retry_attempt"] = 0
                                    torrents_db[info_hash]["rclone_next_retry_ts"] = 0.0
                                    torrents_db[info_hash]["retry_status"] = ""
                                    torrents_db[info_hash]["error_msg"] = (
                                        f"Introuvable dans rclone après {total_delays} tentatives ({waited}s)"
                                    )
                                    save_state()
                            logger.error(f"Timeout rclone après {total_delays} tentatives ({waited}s) pour {ad_filename}")
                            try:
                                from app.notifications import notifier
                                await notifier.notify_error(
                                    f"Timeout Rclone : {ad_filename}",
                                    f"Fichier introuvable dans le montage après {total_delays} tentatives ({waited}s)."
                                )
                            except Exception:
                                pass
                            continue

                    # Fichiers trouvés avec succès ! Nettoyage des indicateurs de retry
                    if retry_attempt > 0 or item.get("retry_status"):
                        async with state_lock:
                            if info_hash in torrents_db:
                                torrents_db[info_hash]["rclone_retry_attempt"] = 0
                                torrents_db[info_hash]["rclone_next_retry_ts"] = 0.0
                                torrents_db[info_hash]["rclone_retry_total"] = total_delays
                                torrents_db[info_hash]["retry_status"] = ""
                                save_state()

                    clean_root_name = sanitize_filename(ad_filename)
                    target_path = str(dest_dir / clean_root_name) if len(mounted_files) > 1 else str(dest_dir / mounted_files[0].name)

                    if mode == "symlink":
                        copying_hashes.add(info_hash)
                        entry_copy = dict(item, name=ad_filename, size=ad_size)
                        asyncio.create_task(_run_transfer(client, info_hash, entry_copy, mounted_files, mode, dest_dir, target_path))
                    else:
                        # mode == "download" (DDL copie locale)
                        # Si un autre transfert écrit déjà vers exactement le même dossier cible, on attend qu'il termine
                        if target_path in active_target_paths:
                            async with state_lock:
                                if info_hash in torrents_db and torrents_db[info_hash]["state"] != "queued":
                                    torrents_db[info_hash]["state"] = "queued"
                                    save_state()
                            continue

                        if len(active_downloads) < max_concurrent:
                            copying_hashes.add(info_hash)
                            active_downloads.add(info_hash)
                            active_target_paths.add(target_path)
                            async with state_lock:
                                if info_hash in torrents_db:
                                    torrents_db[info_hash]["state"] = "copying"
                                    save_state()
                            logger.info(f"Début copie locale ({len(mounted_files)} fichier(s)) -> {dest_dir} : {ad_filename}")
                            entry_copy = dict(item, name=ad_filename, size=ad_size)
                            asyncio.create_task(_run_transfer(client, info_hash, entry_copy, mounted_files, mode, dest_dir, target_path))
                        else:
                            async with state_lock:
                                if info_hash in torrents_db and torrents_db[info_hash]["state"] != "queued":
                                    torrents_db[info_hash]["state"] = "queued"
                                    save_state()

            except Exception as exc:
                logger.error(f"Erreur boucle worker : {exc}", exc_info=True)

            await asyncio.sleep(poll_interval)

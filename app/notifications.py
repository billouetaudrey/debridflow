import asyncio
import hashlib
import html
import logging
import re
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

import httpx

from app.alldebrid import alldebrid_upload_file, alldebrid_upload_magnet
from app.bencode import parse_magnet_uri, parse_torrent_bytes, sanitize_filename
from app.state import resolve_service, save_state, settings_db, state_lock, torrents_db

logger = logging.getLogger("OmniSym.Notifications")


class TelegramNotifier:
    def __init__(self):
        self._client: Optional[httpx.AsyncClient] = None

    def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=10.0)
        return self._client

    async def send_message(
        self,
        text: str,
        parse_mode: str = "HTML",
        disable_web_page_preview: bool = True,
    ) -> bool:
        """Envoie un message Telegram si configuré et activé."""
        enabled = settings_db.get("telegram_enabled", False)
        bot_token = str(settings_db.get("telegram_bot_token", "")).strip()
        chat_id = str(settings_db.get("telegram_chat_id", "")).strip()

        if not enabled or not bot_token or not chat_id:
            return False

        return await self._dispatch(bot_token, chat_id, text, parse_mode, disable_web_page_preview)

    async def _dispatch(
        self,
        bot_token: str,
        chat_id: str,
        text: str,
        parse_mode: str = "HTML",
        disable_web_page_preview: bool = True,
    ) -> bool:
        url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        payload = {
            "chat_id": chat_id,
            "text": text,
            "parse_mode": parse_mode,
            "disable_web_page_preview": disable_web_page_preview,
        }
        client = self._get_client()
        try:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                logger.info("Notification Telegram transmise avec succès.")
                return True
            else:
                logger.warning(f"Échec notification Telegram (status {resp.status_code}): {resp.text}")
                return False
        except Exception as e:
            logger.warning(f"Erreur lors de l'envoi de la notification Telegram: {e}")
            return False

    async def test_notification(
        self, bot_token: Optional[str] = None, chat_id: Optional[str] = None
    ) -> Dict[str, Any]:
        token = str(bot_token if bot_token is not None and bot_token != "" else settings_db.get("telegram_bot_token", "")).strip()
        cid = str(chat_id if chat_id is not None and chat_id != "" else settings_db.get("telegram_chat_id", "")).strip()

        if not token or not cid:
            return {"ok": False, "error": "Token de bot ou Chat ID manquant"}

        msg = (
            "🔔 <b>OmniSym — Test de Notification Telegram</b>\n\n"
            "✅ <b>Connexion réussie !</b>\n"
            "La liaison entre OmniSym et votre bot Telegram est opérationnelle.\n"
            "Vous recevrez désormais les notifications sélectionnées (scans, liens morts, téléchargements, etc.)."
        )
        ok = await self._dispatch(token, cid, msg)
        if ok:
            return {"ok": True, "message": "Notification de test envoyée avec succès !"}
        else:
            return {
                "ok": False,
                "error": "Échec de l'envoi vers Telegram. Vérifiez le Token du bot, le Chat ID et que vous avez bien démarré la conversation avec le bot (/start).",
            }

    async def notify_scan_start(self, is_full: bool = False, paths: Optional[List[Any]] = None):
        if not settings_db.get("telegram_notify_scan_start", True):
            return
        scan_type = "Scan complet forcé ⚡" if is_full else "Scan incrémental rapide 🔄"
        paths_str = ", ".join(str(p) for p in (paths or [])) if paths else "Tous les dossiers"
        text = (
            f"🔍 <b>OmniSym — Début du Scan de Médiathèque</b>\n\n"
            f"• <b>Type</b> : {scan_type}\n"
            f"• <b>Dossiers</b> : <code>{html.escape(paths_str)}</code>"
        )
        await self.send_message(text)

    async def notify_scan_complete(self, stats: Dict[str, Any], duration: float = 0.0):
        if not settings_db.get("telegram_notify_scan_complete", True):
            return
        dead = int(stats.get("dead_symlinks", 0))
        total_mags = int(stats.get("total_magnets", 0))
        dups = int(stats.get("duplicates", 0))
        unlinked = int(stats.get("unlinked", 0))
        local_links = int(stats.get("local_links", 0))

        status_emoji = "⚠️" if dead > 0 else "✅"
        dur_str = f" en {duration:.1f}s" if duration > 0 else ""

        text = (
            f"{status_emoji} <b>OmniSym — Scan de Médiathèque Terminé{dur_str}</b>\n\n"
            f"• <b>Fichiers analysés</b> : {local_links}\n"
            f"• <b>Liens morts détectés</b> : <b>{dead}</b>\n"
            f"• <b>Total magnets cloud</b> : {total_mags}\n"
            f"• <b>Doublons cloud</b> : {dups}\n"
            f"• <b>Magnets non symlinkés</b> : {unlinked}"
        )
        await self.send_message(text)

    async def notify_dead_links_detected(self, dead_count: int, dead_samples: Optional[List[Dict[str, Any]]] = None):
        if not settings_db.get("telegram_notify_dead_link", True):
            return
        if dead_count <= 0:
            return

        text = (
            f"⚠️ <b>OmniSym — {dead_count} Lien(s) Mort(s) Détecté(s) !</b>\n\n"
            f"Des fichiers de votre médiathèque pointent vers des cibles Debrid inexistantes ou supprimées."
        )
        if dead_samples:
            text += "\n\n<b>Exemples :</b>\n"
            for item in dead_samples[:5]:
                name = html.escape(str(item.get("media_title") or item.get("filename") or "Fichier"))
                text += f"• <code>{name}</code>\n"
            if dead_count > 5:
                text += f"<i>... et {dead_count - 5} autre(s).</i>\n"

        text += "\n💡 <i>Rendez-vous dans l'onglet Médiathèque & Liens pour relancer dans Sonarr/Radarr ou purger.</i>"
        await self.send_message(text)

    async def notify_dead_links_cleaned(self, cleaned_count: int, deleted_arr: bool = False):
        if not settings_db.get("telegram_notify_clean_dead", True):
            return
        arr_info = " (et supprimés dans Radarr / Sonarr)" if deleted_arr else ""
        text = (
            f"🗑️ <b>OmniSym — Nettoyage de Liens Morts</b>\n\n"
            f"• <b>{cleaned_count}</b> lien(s) mort(s) supprimé(s){arr_info}."
        )
        await self.send_message(text)

    async def notify_download_complete(
        self,
        name: str,
        category: str,
        mode: str,
        size_bytes: int = 0,
        duration: float = 0.0,
        avg_speed: int = 0,
    ):
        if not settings_db.get("telegram_notify_download_complete", True):
            return

        mode_badge = "📥 Téléchargement réel" if mode == "download" else "🔗 Symlink"
        size_str = self._format_size(size_bytes)
        speed_str = self._format_speed(avg_speed) if avg_speed > 0 else ""
        dur_str = f"{duration:.1f}s" if duration > 0 else ""

        details = []
        if size_bytes > 0:
            details.append(f"• <b>Taille</b> : {size_str}")
        if dur_str:
            details.append(f"• <b>Durée</b> : {dur_str}")
        if speed_str and mode == "download":
            details.append(f"• <b>Vitesse moyenne</b> : <b>{speed_str}</b>")

        details_txt = "\n".join(details)
        if details_txt:
            details_txt = "\n" + details_txt

        text = (
            f"✅ <b>OmniSym — Récupération Terminée</b>\n\n"
            f"• <b>Nom</b> : <code>{html.escape(str(name))}</code>\n"
            f"• <b>Catégorie</b> : <code>{html.escape(str(category or 'Aucune'))}</code>\n"
            f"• <b>Mode</b> : {mode_badge}{details_txt}"
        )
        await self.send_message(text)

    async def notify_error(self, title: str, message: str):
        if not settings_db.get("telegram_notify_error", True):
            return
        text = (
            f"❌ <b>OmniSym — Erreur Détectée</b>\n\n"
            f"• <b>Contexte</b> : {html.escape(str(title))}\n"
            f"• <b>Détails</b> : <code>{html.escape(str(message))}</code>"
        )
        await self.send_message(text)

    @staticmethod
    def _format_size(b: int) -> str:
        if b <= 0:
            return "0 B"
        val = float(b)
        for unit in ["B", "Ko", "Mo", "Go", "To"]:
            if val < 1024.0:
                return f"{val:.2f} {unit}"
            val /= 1024.0
        return f"{val:.2f} Po"

    @staticmethod
    def _format_speed(bps: int) -> str:
        if bps <= 0:
            return "0 Mo/s"
        mbs = bps / (1024 * 1024)
        if mbs < 1:
            return f"{(bps / 1024):.1f} Ko/s"
        return f"{mbs:.2f} Mo/s"


notifier = TelegramNotifier()


async def run_telegram_listener() -> None:
    """Écoute en tâche de fond les messages Telegram entrants pour ajouter automatiquement les liens partagés."""
    last_update_id = 0
    logger.info("Module d'écoute Telegram en tâche de fond actif.")

    while True:
        try:
            enabled = settings_db.get("telegram_enabled", False)
            bot_token = str(settings_db.get("telegram_bot_token", "")).strip()
            chat_id = str(settings_db.get("telegram_chat_id", "")).strip()

            if not enabled or not bot_token or not chat_id:
                await asyncio.sleep(8)
                continue

            url = f"https://api.telegram.org/bot{bot_token}/getUpdates"
            params = {"offset": last_update_id + 1, "timeout": 15}

            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.get(url, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    for upd in data.get("result", []):
                        last_update_id = max(last_update_id, upd.get("update_id", 0))
                        msg = upd.get("message") or upd.get("channel_post")
                        if not msg:
                            continue

                        # Sécurité stricte : ignorer les messages qui ne viennent pas du chat_id autorisé
                        sender_chat_id = str(msg.get("chat", {}).get("id", ""))
                        if sender_chat_id != chat_id:
                            continue

                        text = str(msg.get("text") or msg.get("caption") or "").strip()
                        doc = msg.get("document")

                        cat = "torrent-direct"
                        cfg_mode, configured_dir = resolve_service(cat)
                        configured_dir.mkdir(parents=True, exist_ok=True)

                        # Cas 1 : Fichier .torrent envoyé sur Telegram
                        if doc and doc.get("file_name", "").lower().endswith(".torrent"):
                            file_id = doc.get("file_id")
                            f_info_resp = await client.get(f"https://api.telegram.org/bot{bot_token}/getFile?file_id={file_id}")
                            if f_info_resp.status_code == 200:
                                file_path = f_info_resp.json().get("result", {}).get("file_path")
                                dl_resp = await client.get(f"https://api.telegram.org/file/bot{bot_token}/{file_path}")
                                if dl_resp.status_code == 200:
                                    raw_bytes = dl_resp.content
                                    info_hash, parsed_name = parse_torrent_bytes(raw_bytes)
                                    ad_data = await alldebrid_upload_file(client, doc.get("file_name"), raw_bytes)
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
                                            "save_path": str(configured_dir),
                                            "content_path": str(configured_dir / sanitize_filename(ad_name)),
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
                                    await notifier.send_message(f"⚡ <b>Fichier .torrent reçu via Telegram !</b>\n\n• <b>Nom</b> : <code>{html.escape(ad_name)}</code>\n• <b>Mode</b> : {cfg_mode}")

                        # Cas 2 : Magnet ou Lien URL dans le texte
                        if text:
                            magnets = re.findall(r"(magnet:\?[^\s\"'<>]+)", text, re.IGNORECASE)
                            for mag in magnets:
                                try:
                                    info_hash, parsed_name = parse_magnet_uri(mag)
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
                                            "save_path": str(configured_dir),
                                            "content_path": str(configured_dir / sanitize_filename(ad_name)),
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
                                    await notifier.send_message(f"⚡ <b>Magnet reçu via Telegram !</b>\n\n• <b>Nom</b> : <code>{html.escape(ad_name)}</code>\n• <b>Statut</b> : En cours de débridage ({cfg_mode})")
                                except Exception as exc:
                                    await notifier.send_message(f"❌ <b>Erreur ajout magnet :</b> <code>{html.escape(str(exc))}</code>")

                            urls = [u for u in re.findall(r"(https?://[^\s\"'<>]+)", text, re.IGNORECASE) if not u.lower().endswith(".torrent")]
                            for u in urls:
                                try:
                                    custom_ddl_dir = settings_db.get("ddl_download_dir")
                                    ddl_save_dir = Path(custom_ddl_dir) if custom_ddl_dir else configured_dir
                                    ddl_save_dir.mkdir(parents=True, exist_ok=True)
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
                                            "added_on": int(time.time()),
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
                                    await notifier.send_message(f"⚡ <b>Lien DDL reçu via Telegram !</b>\n\n• <b>Fichier</b> : <code>{html.escape(raw_fname)}</code>\n• <b>Statut</b> : Résolution lancée")
                                except Exception as exc:
                                    await notifier.send_message(f"❌ <b>Erreur ajout DDL :</b> <code>{html.escape(str(exc))}</code>")
                else:
                    await asyncio.sleep(5)
        except asyncio.CancelledError:
            logger.info("Arrêt de l'écouteur Telegram.")
            break
        except Exception as e:
            logger.debug(f"Erreur getUpdates Telegram: {e}")
            await asyncio.sleep(6)

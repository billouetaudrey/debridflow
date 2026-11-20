import html
import logging
from typing import Any, Dict, List, Optional
import httpx
from app.state import settings_db

logger = logging.getLogger("DebridFlow.Notifications")


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
            "🔔 <b>DebridFlow — Test de Notification Telegram</b>\n\n"
            "✅ <b>Connexion réussie !</b>\n"
            "La liaison entre DebridFlow et votre bot Telegram est opérationnelle.\n"
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
            f"🔍 <b>DebridFlow — Début du Scan de Médiathèque</b>\n\n"
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
            f"{status_emoji} <b>DebridFlow — Scan de Médiathèque Terminé{dur_str}</b>\n\n"
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
            f"⚠️ <b>DebridFlow — {dead_count} Lien(s) Mort(s) Détecté(s) !</b>\n\n"
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
            f"🗑️ <b>DebridFlow — Nettoyage de Liens Morts</b>\n\n"
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
            f"✅ <b>DebridFlow — Récupération Terminée</b>\n\n"
            f"• <b>Nom</b> : <code>{html.escape(str(name))}</code>\n"
            f"• <b>Catégorie</b> : <code>{html.escape(str(category or 'Aucune'))}</code>\n"
            f"• <b>Mode</b> : {mode_badge}{details_txt}"
        )
        await self.send_message(text)

    async def notify_error(self, title: str, message: str):
        if not settings_db.get("telegram_notify_error", True):
            return
        text = (
            f"❌ <b>DebridFlow — Erreur Détectée</b>\n\n"
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

import time
from typing import Any, Dict, List, Optional

import httpx

from app.config import logger
from app.providers.base import BaseDebridProvider


class TorBoxProvider(BaseDebridProvider):
    name = "torbox"
    display_name = "TorBox"
    default_api_base = "https://api.torbox.app/v1/api"

    def _headers(self, api_key: str) -> Dict[str, str]:
        return {"Authorization": f"Bearer {api_key.strip()}"}

    async def check_health(
        self,
        client: httpx.AsyncClient,
        api_key: str,
        api_base: Optional[str] = None,
        agent: Optional[str] = None,
    ) -> Dict[str, Any]:
        key_to_test = (api_key or "").strip()
        base_to_test = (api_base or self.default_api_base).strip().rstrip("/")
        now_ts = int(time.time())

        if not key_to_test:
            return {
                "ok": False,
                "label": "Échec Test API",
                "detail": "Aucune clé API TorBox configurée",
                "last_check": now_ts,
            }

        try:
            resp = await client.get(
                f"{base_to_test}/user/me",
                headers=self._headers(key_to_test),
                timeout=10.0,
            )
            resp.raise_for_status()
            payload = resp.json()
            if not payload.get("success"):
                return {
                    "ok": False,
                    "label": "Échec Test API",
                    "detail": payload.get("detail", "Clé TorBox refusée"),
                    "last_check": now_ts,
                }

            user_data = payload.get("data") or {}
            email = user_data.get("email") or "Utilisateur TorBox"
            plan = user_data.get("plan") or "Plan Standard"

            return {
                "ok": True,
                "label": "Test API OK",
                "detail": f"TorBox : {email} ({plan})",
                "last_check": now_ts,
            }
        except Exception as exc:
            return {
                "ok": False,
                "label": "Échec Test API",
                "detail": f"Erreur TorBox : {exc}",
                "last_check": now_ts,
            }

    async def upload_magnet(
        self, client: httpx.AsyncClient, magnet: str, api_key: str, api_base: str, agent: str
    ) -> Dict[str, Any]:
        base = (api_base or self.default_api_base).rstrip("/")
        resp = await client.post(
            f"{base}/torrents/createtorrent",
            headers=self._headers(api_key),
            data={"magnet": magnet},
            timeout=20.0,
        )
        resp.raise_for_status()
        payload = resp.json()
        if not payload.get("success"):
            raise RuntimeError(f"TorBox erreur upload : {payload.get('detail')}")
        data = payload.get("data") or {}
        torrent_id = data.get("torrent_id") or data.get("id")
        return {
            "id": torrent_id,
            "name": data.get("name") or "",
            "size": int(data.get("size") or 0),
        }

    async def upload_file(
        self,
        client: httpx.AsyncClient,
        filename: str,
        content: bytes,
        api_key: str,
        api_base: str,
        agent: str,
    ) -> Dict[str, Any]:
        base = (api_base or self.default_api_base).rstrip("/")
        resp = await client.post(
            f"{base}/torrents/createtorrent",
            headers=self._headers(api_key),
            files={"file": (filename, content, "application/x-bittorrent")},
            timeout=25.0,
        )
        resp.raise_for_status()
        payload = resp.json()
        if not payload.get("success"):
            raise RuntimeError(f"TorBox erreur upload fichier : {payload.get('detail')}")
        data = payload.get("data") or {}
        torrent_id = data.get("torrent_id") or data.get("id")
        return {
            "id": torrent_id,
            "name": data.get("name") or filename,
            "size": int(data.get("size") or 0),
        }

    async def get_statuses(
        self, client: httpx.AsyncClient, ids: List[Any], api_key: str, api_base: str, agent: str
    ) -> Dict[Any, Dict[str, Any]]:
        base = (api_base or self.default_api_base).rstrip("/")
        result: Dict[Any, Dict[str, Any]] = {}

        try:
            resp = await client.get(
                f"{base}/torrents/mylist",
                headers=self._headers(api_key),
                params={"bypass_cache": "true"},
                timeout=15.0,
            )
            if resp.is_success:
                payload = resp.json()
                items = payload.get("data") or []
                id_map = {str(item.get("id")): item for item in items}

                for target_id in ids:
                    tid_str = str(target_id)
                    if tid_str in id_map:
                        item = id_map[tid_str]
                        state = (item.get("download_state") or "").lower()
                        is_ready = state in ("cached", "completed")
                        is_err = state in ("error", "dead")
                        status_code = 4 if is_ready else (5 if is_err else 0)

                        total_size = int(item.get("size") or 0)
                        pct = float(item.get("progress") or (1.0 if is_ready else 0.0))
                        if pct > 1.0:
                            pct = pct / 100.0
                        downloaded = total_size if is_ready else int(total_size * pct)

                        files = item.get("files") or []
                        links = [{"filename": f.get("name")} for f in files if f.get("name")]

                        result[target_id] = {
                            "id": target_id,
                            "statusCode": status_code,
                            "filename": item.get("name") or "",
                            "size": total_size,
                            "downloaded": downloaded,
                            "status": state,
                            "links": links,
                        }
        except Exception as exc:
            logger.debug(f"TorBox get_statuses erreur : {exc}")

        return result

    async def get_magnet_files(
        self, client: httpx.AsyncClient, item_id: Any, api_key: str, api_base: str, agent: str
    ) -> List[str]:
        base = (api_base or self.default_api_base).rstrip("/")
        try:
            resp = await client.get(
                f"{base}/torrents/mylist",
                headers=self._headers(api_key),
                params={"id": str(item_id)},
                timeout=10.0,
            )
            if resp.is_success:
                items = resp.json().get("data") or []
                if isinstance(items, dict):
                    items = [items]
                for item in items:
                    if str(item.get("id")) == str(item_id):
                        return [f.get("name") for f in item.get("files", []) if f.get("name")]
        except Exception:
            pass
        return []

    async def delete_magnet(
        self, client: httpx.AsyncClient, item_id: Any, api_key: str, api_base: str, agent: str
    ) -> None:
        base = (api_base or self.default_api_base).rstrip("/")
        try:
            await client.post(
                f"{base}/torrents/controltorrent",
                headers=self._headers(api_key),
                json={"torrent_id": int(item_id), "operation": "delete"},
                timeout=10.0,
            )
            logger.info(f"Torrent ID={item_id} supprimé sur TorBox.")
        except Exception as exc:
            logger.warning(f"Impossible de supprimer ID={item_id} sur TorBox : {exc}")

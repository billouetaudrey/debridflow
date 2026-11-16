import time
from typing import Any, Dict, List, Optional

import httpx

from app.config import logger
from app.providers.base import BaseDebridProvider


class HighWayProvider(BaseDebridProvider):
    name = "highway"
    display_name = "High-Way.me"
    default_api_base = "https://cloud.high-way.me/center-api"

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
                "detail": "Aucun token API High-Way configuré",
                "last_check": now_ts,
            }

        try:
            resp = await client.get(
                f"{base_to_test}/user",
                headers=self._headers(key_to_test),
                timeout=10.0,
            )
            # Si le endpoint /user répond ou valide la clé
            if resp.is_success:
                user_data = resp.json()
                uname = user_data.get("username") or user_data.get("email") or "Utilisateur High-Way"
                traffic = user_data.get("traffic_left_formatted") or "Actif"
                return {
                    "ok": True,
                    "label": "Test API OK",
                    "detail": f"High-Way : {uname} ({traffic})",
                    "last_check": now_ts,
                }
            elif resp.status_code == 401 or resp.status_code == 403:
                return {
                    "ok": False,
                    "label": "Échec Test API",
                    "detail": "Token High-Way refusé ou expiré",
                    "last_check": now_ts,
                }
            else:
                # Fallback vérification /torrent/list
                resp_list = await client.get(
                    f"{base_to_test}/torrent/list",
                    headers=self._headers(key_to_test),
                    timeout=10.0,
                )
                if resp_list.is_success:
                    return {
                        "ok": True,
                        "label": "Test API OK",
                        "detail": "High-Way : Connexion réussie",
                        "last_check": now_ts,
                    }
                return {
                    "ok": False,
                    "label": "Échec Test API",
                    "detail": f"Réponse High-Way HTTP {resp.status_code}",
                    "last_check": now_ts,
                }
        except Exception as exc:
            return {
                "ok": False,
                "label": "Échec Test API",
                "detail": f"Erreur High-Way : {exc}",
                "last_check": now_ts,
            }

    async def upload_magnet(
        self, client: httpx.AsyncClient, magnet: str, api_key: str, api_base: str, agent: str
    ) -> Dict[str, Any]:
        base = (api_base or self.default_api_base).rstrip("/")
        resp = await client.post(
            f"{base}/torrent/add",
            headers=self._headers(api_key),
            data={"magnet": magnet},
            timeout=20.0,
        )
        resp.raise_for_status()
        payload = resp.json()
        item_id = payload.get("id") or payload.get("torrent_id") or str(int(time.time()))
        return {
            "id": item_id,
            "name": payload.get("name") or "",
            "size": int(payload.get("size") or 0),
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
            f"{base}/torrent/add",
            headers=self._headers(api_key),
            files={"file": (filename, content, "application/x-bittorrent")},
            timeout=25.0,
        )
        resp.raise_for_status()
        payload = resp.json()
        item_id = payload.get("id") or payload.get("torrent_id") or str(int(time.time()))
        return {
            "id": item_id,
            "name": payload.get("name") or filename,
            "size": int(payload.get("size") or 0),
        }

    async def get_statuses(
        self, client: httpx.AsyncClient, ids: List[Any], api_key: str, api_base: str, agent: str
    ) -> Dict[Any, Dict[str, Any]]:
        base = (api_base or self.default_api_base).rstrip("/")
        result: Dict[Any, Dict[str, Any]] = {}

        try:
            resp = await client.get(
                f"{base}/torrent/list",
                headers=self._headers(api_key),
                timeout=15.0,
            )
            if resp.is_success:
                items = resp.json()
                if isinstance(items, dict):
                    items = items.get("data") or items.get("torrents") or []
                id_map = {str(item.get("id")): item for item in items if isinstance(item, dict)}

                for target_id in ids:
                    tid_str = str(target_id)
                    if tid_str in id_map:
                        item = id_map[tid_str]
                        st = (item.get("status") or "").lower()
                        is_ready = st in ("completed", "finished", "downloaded", "seeding")
                        is_err = "error" in st or st in ("failed", "dead")
                        status_code = 4 if is_ready else (5 if is_err else 0)

                        total_size = int(item.get("size") or 0)
                        pct = float(item.get("progress") or (1.0 if is_ready else 0.0))
                        if pct > 1.0:
                            pct = pct / 100.0
                        downloaded = total_size if is_ready else int(total_size * pct)

                        files = item.get("files") or []
                        links = [{"filename": f.get("name") or str(f)} for f in files]

                        result[target_id] = {
                            "id": target_id,
                            "statusCode": status_code,
                            "filename": item.get("name") or "",
                            "size": total_size,
                            "downloaded": downloaded,
                            "status": st,
                            "links": links,
                        }
        except Exception as exc:
            logger.debug(f"High-Way get_statuses erreur : {exc}")

        return result

    async def get_magnet_files(
        self, client: httpx.AsyncClient, item_id: Any, api_key: str, api_base: str, agent: str
    ) -> List[str]:
        base = (api_base or self.default_api_base).rstrip("/")
        try:
            resp = await client.get(
                f"{base}/torrent/list",
                headers=self._headers(api_key),
                timeout=10.0,
            )
            if resp.is_success:
                items = resp.json()
                if isinstance(items, dict):
                    items = items.get("data") or []
                for item in items:
                    if str(item.get("id")) == str(item_id):
                        return [f.get("name") or str(f) for f in item.get("files", [])]
        except Exception:
            pass
        return []

    async def delete_magnet(
        self, client: httpx.AsyncClient, item_id: Any, api_key: str, api_base: str, agent: str
    ) -> None:
        base = (api_base or self.default_api_base).rstrip("/")
        try:
            await client.post(
                f"{base}/torrent/delete",
                headers=self._headers(api_key),
                json={"id": item_id},
                timeout=10.0,
            )
            logger.info(f"Torrent ID={item_id} supprimé sur High-Way.")
        except Exception as exc:
            logger.warning(f"Impossible de supprimer ID={item_id} sur High-Way : {exc}")

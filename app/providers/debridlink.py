import datetime
import time
from typing import Any, Dict, List, Optional

import httpx

from app.config import logger
from app.providers.base import BaseDebridProvider


class DebridLinkProvider(BaseDebridProvider):
    name = "debridlink"
    display_name = "Debrid-Link"
    default_api_base = "https://debrid-link.com/api/v2"

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
                "detail": "Aucune clé API Debrid-Link configurée",
                "last_check": now_ts,
            }

        try:
            resp = await client.get(
                f"{base_to_test}/account/infos",
                headers=self._headers(key_to_test),
                timeout=10.0,
            )
            resp.raise_for_status()
            payload = resp.json()
            if not payload.get("success"):
                return {
                    "ok": False,
                    "label": "Échec Test API",
                    "detail": payload.get("error", "Clé Debrid-Link refusée"),
                    "last_check": now_ts,
                }

            val = payload.get("value", {})
            uname = val.get("pseudo", "Inconnu")
            prem = val.get("premium", {})
            is_premium = bool(prem.get("status"))
            until = prem.get("until")
            if is_premium and until:
                exp_str = datetime.datetime.fromtimestamp(int(until)).strftime("%d/%m/%Y")
                prem_txt = f"Premium jusqu'au {exp_str}"
            else:
                prem_txt = "Non Premium"

            return {
                "ok": True,
                "label": "Test API OK",
                "detail": f"Debrid-Link : {uname} ({prem_txt})",
                "last_check": now_ts,
            }
        except Exception as exc:
            return {
                "ok": False,
                "label": "Échec Test API",
                "detail": f"Erreur Debrid-Link : {exc}",
                "last_check": now_ts,
            }

    async def upload_magnet(
        self, client: httpx.AsyncClient, magnet: str, api_key: str, api_base: str, agent: str
    ) -> Dict[str, Any]:
        base = (api_base or self.default_api_base).rstrip("/")
        resp = await client.post(
            f"{base}/seedbox/add",
            headers=self._headers(api_key),
            data={"url": magnet},
            timeout=20.0,
        )
        resp.raise_for_status()
        payload = resp.json()
        if not payload.get("success"):
            raise RuntimeError(f"Debrid-Link erreur upload : {payload.get('error')}")
        val = payload.get("value", {})
        return {
            "id": val.get("id"),
            "name": val.get("name") or "",
            "size": int(val.get("totalSize") or 0),
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
            f"{base}/seedbox/add",
            headers=self._headers(api_key),
            files={"file": (filename, content, "application/x-bittorrent")},
            timeout=25.0,
        )
        resp.raise_for_status()
        payload = resp.json()
        if not payload.get("success"):
            raise RuntimeError(f"Debrid-Link erreur upload fichier : {payload.get('error')}")
        val = payload.get("value", {})
        return {
            "id": val.get("id"),
            "name": val.get("name") or filename,
            "size": int(val.get("totalSize") or 0),
        }

    async def get_statuses(
        self, client: httpx.AsyncClient, ids: List[Any], api_key: str, api_base: str, agent: str
    ) -> Dict[Any, Dict[str, Any]]:
        base = (api_base or self.default_api_base).rstrip("/")
        result: Dict[Any, Dict[str, Any]] = {}

        try:
            resp = await client.get(
                f"{base}/seedbox/list",
                headers=self._headers(api_key),
                timeout=15.0,
            )
            if resp.is_success:
                payload = resp.json()
                items = payload.get("value") or []
                id_map = {str(item.get("id")): item for item in items}

                for target_id in ids:
                    tid_str = str(target_id)
                    if tid_str in id_map:
                        item = id_map[tid_str]
                        st = int(item.get("status", 0))
                        # 100 = terminé
                        is_ready = st >= 100
                        is_err = st < 0
                        status_code = 4 if is_ready else (5 if is_err else 0)

                        total_size = int(item.get("totalSize") or 0)
                        pct = float(item.get("downloadPercent") or (100.0 if is_ready else 0.0))
                        downloaded = total_size if is_ready else int(total_size * (pct / 100.0))

                        files = item.get("files") or []
                        links = [{"filename": f.get("name")} for f in files if f.get("name")]

                        result[target_id] = {
                            "id": target_id,
                            "statusCode": status_code,
                            "filename": item.get("name") or "",
                            "size": total_size,
                            "downloaded": downloaded,
                            "status": f"{pct}%" if not is_ready else "Terminé",
                            "links": links,
                        }
        except Exception as exc:
            logger.debug(f"Debrid-Link get_statuses erreur : {exc}")

        return result

    async def get_magnet_files(
        self, client: httpx.AsyncClient, item_id: Any, api_key: str, api_base: str, agent: str
    ) -> List[str]:
        base = (api_base or self.default_api_base).rstrip("/")
        try:
            resp = await client.get(
                f"{base}/seedbox/list",
                headers=self._headers(api_key),
                timeout=10.0,
            )
            if resp.is_success:
                items = resp.json().get("value", [])
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
            await client.delete(
                f"{base}/seedbox/{item_id}/remove",
                headers=self._headers(api_key),
                timeout=10.0,
            )
            logger.info(f"Torrent ID={item_id} supprimé sur Debrid-Link.")
        except Exception as exc:
            logger.warning(f"Impossible de supprimer ID={item_id} sur Debrid-Link : {exc}")

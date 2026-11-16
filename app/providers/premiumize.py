import datetime
import time
from typing import Any, Dict, List, Optional

import httpx

from app.config import logger
from app.providers.base import BaseDebridProvider


class PremiumizeProvider(BaseDebridProvider):
    name = "premiumize"
    display_name = "Premiumize.me"
    default_api_base = "https://www.premiumize.me/api"

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
                "detail": "Aucune clé API Premiumize configurée",
                "last_check": now_ts,
            }

        try:
            resp = await client.get(
                f"{base_to_test}/account/info",
                params={"apikey": key_to_test},
                timeout=10.0,
            )
            resp.raise_for_status()
            data = resp.json()
            if data.get("status") != "success":
                return {
                    "ok": False,
                    "label": "Échec Test API",
                    "detail": data.get("message", "Clé Premiumize refusée"),
                    "last_check": now_ts,
                }

            prem_until = data.get("premium_until")
            cid = data.get("customer_id", "ID inconnu")
            if prem_until:
                exp_str = datetime.datetime.fromtimestamp(int(prem_until)).strftime("%d/%m/%Y")
                prem_txt = f"Premium jusqu'au {exp_str}"
            else:
                prem_txt = "Non Premium"

            return {
                "ok": True,
                "label": "Test API OK",
                "detail": f"Premiumize : #{cid} ({prem_txt})",
                "last_check": now_ts,
            }
        except Exception as exc:
            return {
                "ok": False,
                "label": "Échec Test API",
                "detail": f"Erreur Premiumize : {exc}",
                "last_check": now_ts,
            }

    async def upload_magnet(
        self, client: httpx.AsyncClient, magnet: str, api_key: str, api_base: str, agent: str
    ) -> Dict[str, Any]:
        base = (api_base or self.default_api_base).rstrip("/")
        resp = await client.post(
            f"{base}/transfer/create",
            params={"apikey": api_key},
            data={"src": magnet},
            timeout=20.0,
        )
        resp.raise_for_status()
        payload = resp.json()
        if payload.get("status") != "success":
            raise RuntimeError(f"Premiumize erreur upload : {payload.get('message')}")
        return {
            "id": payload.get("id"),
            "name": payload.get("name") or "",
            "size": 0,
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
            f"{base}/transfer/create",
            params={"apikey": api_key},
            files={"file": (filename, content, "application/x-bittorrent")},
            timeout=25.0,
        )
        resp.raise_for_status()
        payload = resp.json()
        if payload.get("status") != "success":
            raise RuntimeError(f"Premiumize erreur upload fichier : {payload.get('message')}")
        return {
            "id": payload.get("id"),
            "name": payload.get("name") or filename,
            "size": 0,
        }

    async def get_statuses(
        self, client: httpx.AsyncClient, ids: List[Any], api_key: str, api_base: str, agent: str
    ) -> Dict[Any, Dict[str, Any]]:
        base = (api_base or self.default_api_base).rstrip("/")
        result: Dict[Any, Dict[str, Any]] = {}

        try:
            resp = await client.get(
                f"{base}/transfer/list",
                params={"apikey": api_key},
                timeout=15.0,
            )
            if resp.is_success:
                payload = resp.json()
                transfers = payload.get("transfers") or []
                id_map = {str(t.get("id")): t for t in transfers}

                for target_id in ids:
                    tid_str = str(target_id)
                    if tid_str in id_map:
                        t = id_map[tid_str]
                        st = (t.get("status") or "").lower()
                        is_ready = st in ("finished", "seeding")
                        is_err = st in ("error", "deleted")
                        status_code = 4 if is_ready else (5 if is_err else 0)

                        progress = float(t.get("progress") or 0.0)
                        if is_ready:
                            progress = 1.0

                        result[target_id] = {
                            "id": target_id,
                            "statusCode": status_code,
                            "filename": t.get("name") or "",
                            "size": 0,
                            "downloaded": 0,
                            "status": st,
                            "links": [{"filename": t.get("name")}] if t.get("name") else [],
                        }
        except Exception as exc:
            logger.debug(f"Premiumize get_statuses erreur : {exc}")

        return result

    async def get_magnet_files(
        self, client: httpx.AsyncClient, item_id: Any, api_key: str, api_base: str, agent: str
    ) -> List[str]:
        base = (api_base or self.default_api_base).rstrip("/")
        try:
            resp = await client.get(
                f"{base}/transfer/list",
                params={"apikey": api_key},
                timeout=10.0,
            )
            if resp.is_success:
                transfers = resp.json().get("transfers", [])
                for t in transfers:
                    if str(t.get("id")) == str(item_id) and t.get("name"):
                        return [t["name"]]
        except Exception:
            pass
        return []

    async def delete_magnet(
        self, client: httpx.AsyncClient, item_id: Any, api_key: str, api_base: str, agent: str
    ) -> None:
        base = (api_base or self.default_api_base).rstrip("/")
        try:
            await client.post(
                f"{base}/transfer/delete",
                params={"apikey": api_key},
                data={"id": str(item_id)},
                timeout=10.0,
            )
            logger.info(f"Transfert ID={item_id} supprimé sur Premiumize.")
        except Exception as exc:
            logger.warning(f"Impossible de supprimer ID={item_id} sur Premiumize : {exc}")

import datetime
import time
from typing import Any, Dict, List, Optional

import httpx

from app.config import logger
from app.providers.base import BaseDebridProvider


class AllDebridProvider(BaseDebridProvider):
    name = "alldebrid"
    display_name = "AllDebrid"
    default_api_base = "https://api.alldebrid.com/v4"

    def _get_v41_base(self, api_base: str) -> str:
        base = (api_base or self.default_api_base).rstrip("/")
        if base.endswith("/v4"):
            return base[:-3] + "/v4.1"
        return base

    async def check_health(
        self,
        client: httpx.AsyncClient,
        api_key: str,
        api_base: Optional[str] = None,
        agent: Optional[str] = None,
    ) -> Dict[str, Any]:
        key_to_test = (api_key or "").strip()
        base_to_test = (api_base or self.default_api_base).strip().rstrip("/")
        agent_to_test = (agent or "PyRDT-Billou").strip()
        now_ts = int(time.time())

        if not key_to_test:
            return {
                "ok": False,
                "label": "Échec Test API",
                "detail": "Aucune clé API configurée",
                "last_check": now_ts,
            }

        try:
            resp = await client.get(
                f"{base_to_test}/user",
                params={"agent": agent_to_test, "apikey": key_to_test},
                timeout=10.0,
            )
            resp.raise_for_status()
            payload = resp.json()
            if payload.get("status") != "success":
                err = payload.get("error", {})
                detail = f"{err.get('message', 'Clé refusée')} ({err.get('code', '?')})"
                return {
                    "ok": False,
                    "label": "Échec Test API",
                    "detail": detail,
                    "last_check": now_ts,
                }

            user_info = payload.get("data", {}).get("user", {})
            uname = user_info.get("username", "Inconnu")
            is_premium = user_info.get("isPremium", False)
            premium_until = user_info.get("premiumUntil")
            if is_premium and premium_until:
                exp_str = datetime.datetime.fromtimestamp(int(premium_until)).strftime("%d/%m/%Y")
                prem_txt = f"Premium jusqu'au {exp_str}"
            else:
                prem_txt = "Non Premium"

            return {
                "ok": True,
                "label": "Test API OK",
                "detail": f"AllDebrid : {uname} ({prem_txt})",
                "last_check": now_ts,
            }
        except Exception as exc:
            return {
                "ok": False,
                "label": "Échec Test API",
                "detail": f"Erreur réseau/API AllDebrid : {exc}",
                "last_check": now_ts,
            }

    async def upload_magnet(
        self, client: httpx.AsyncClient, magnet: str, api_key: str, api_base: str, agent: str
    ) -> Dict[str, Any]:
        resp = await client.post(
            f"{api_base.rstrip('/')}/magnet/upload",
            params={"agent": agent, "apikey": api_key},
            data={"magnets[]": magnet},
            timeout=20.0,
        )
        resp.raise_for_status()
        payload = resp.json()
        if payload.get("status") != "success":
            raise RuntimeError(f"AllDebrid erreur upload magnet : {payload}")
        mag = payload["data"]["magnets"][0]
        return {
            "id": mag["id"],
            "name": mag.get("name") or "",
            "size": int(mag.get("size") or 0),
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
        resp = await client.post(
            f"{api_base.rstrip('/')}/magnet/upload/file",
            params={"agent": agent, "apikey": api_key},
            files={"files[]": (filename, content, "application/x-bittorrent")},
            timeout=25.0,
        )
        resp.raise_for_status()
        payload = resp.json()
        if payload.get("status") != "success":
            raise RuntimeError(f"AllDebrid erreur upload fichier : {payload}")
        f = payload["data"]["files"][0]
        return {
            "id": f["id"],
            "name": f.get("name") or filename,
            "size": int(f.get("size") or 0),
        }

    async def get_statuses(
        self, client: httpx.AsyncClient, ids: List[Any], api_key: str, api_base: str, agent: str
    ) -> Dict[Any, Dict[str, Any]]:
        v41_base = self._get_v41_base(api_base)
        result: Dict[Any, Dict[str, Any]] = {}

        for target_id in ids:
            try:
                r_single = await client.post(
                    f"{v41_base}/magnet/status",
                    params={"agent": agent, "apikey": api_key},
                    data={"id": str(target_id)},
                    timeout=15.0,
                )
                r_single.raise_for_status()
                p_single = r_single.json()
                if p_single.get("status") == "success":
                    m_data = p_single.get("data", {}).get("magnets")
                    items = [m_data] if isinstance(m_data, dict) else (m_data if isinstance(m_data, list) else [])
                    for item in items:
                        if isinstance(item, dict) and "id" in item:
                            mid = int(item["id"])
                            result[mid] = {
                                "id": mid,
                                "statusCode": int(item.get("statusCode", 0)),
                                "filename": item.get("filename") or "",
                                "size": int(item.get("size") or 0),
                                "downloaded": int(item.get("downloaded") or 0),
                                "status": item.get("status") or "",
                                "links": item.get("links") or [],
                            }
                elif p_single.get("status") == "error":
                    err = p_single.get("error") or {}
                    err_code = err.get("code") or "ERROR"
                    err_msg = err.get("message") or f"Erreur AllDebrid ({err_code})"
                    mid = int(target_id)
                    result[mid] = {
                        "id": mid,
                        "statusCode": 5,
                        "filename": "",
                        "size": 0,
                        "downloaded": 0,
                        "status": err_msg,
                        "error": err,
                    }
            except httpx.HTTPStatusError as http_err:
                if http_err.response.status_code in (400, 404, 410):
                    mid = int(target_id)
                    result[mid] = {
                        "id": mid,
                        "statusCode": 5,
                        "filename": "",
                        "size": 0,
                        "downloaded": 0,
                        "status": f"Torrent introuvable ou supprimé chez AllDebrid (HTTP {http_err.response.status_code})",
                    }
                else:
                    logger.debug(f"AllDebrid get_statuses erreur HTTP ID {target_id} : {http_err}")
            except Exception as exc:
                logger.debug(f"AllDebrid get_statuses erreur ID {target_id} : {exc}")

        return result

    def _extract_filenames_from_tree(self, nodes: Any) -> List[str]:
        names: List[str] = []
        if isinstance(nodes, list):
            for n in nodes:
                names.extend(self._extract_filenames_from_tree(n))
        elif isinstance(nodes, dict):
            if "e" in nodes and isinstance(nodes["e"], list):
                names.extend(self._extract_filenames_from_tree(nodes["e"]))
            elif "n" in nodes:
                names.append(str(nodes["n"]))
            elif "filename" in nodes:
                names.append(str(nodes["filename"]))
        return names

    async def get_magnet_files(
        self, client: httpx.AsyncClient, item_id: Any, api_key: str, api_base: str, agent: str
    ) -> List[str]:
        try:
            resp = await client.post(
                f"{api_base.rstrip('/')}/magnet/files",
                params={"agent": agent, "apikey": api_key},
                data={"id[]": str(item_id)},
                timeout=15.0,
            )
            resp.raise_for_status()
            payload = resp.json()
            if payload.get("status") != "success":
                return []
            magnets = payload.get("data", {}).get("magnets", [])
            if isinstance(magnets, dict):
                magnets = [magnets]
            for m in magnets:
                if str(m.get("id")) == str(item_id):
                    return self._extract_filenames_from_tree(m.get("files", []))
        except Exception as exc:
            logger.debug(f"Impossible de récupérer /magnet/files pour ID={item_id} : {exc}")
        return []

    async def delete_magnet(
        self, client: httpx.AsyncClient, item_id: Any, api_key: str, api_base: str, agent: str
    ) -> None:
        try:
            await client.get(
                f"{api_base.rstrip('/')}/magnet/delete",
                params={"agent": agent, "apikey": api_key, "id": item_id},
                timeout=10.0,
            )
            logger.info(f"Magnet ID={item_id} supprimé sur AllDebrid.")
        except Exception as exc:
            logger.warning(f"Impossible de supprimer ID={item_id} sur AllDebrid : {exc}")

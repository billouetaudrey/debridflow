import datetime
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

import httpx

from app.config import logger
from app.providers.base import BaseDebridProvider


class RealDebridProvider(BaseDebridProvider):
    name = "realdebrid"
    display_name = "Real-Debrid"
    default_api_base = "https://api.real-debrid.com/rest/1.0"

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
                "detail": "Aucun token API Real-Debrid configuré",
                "last_check": now_ts,
            }

        try:
            resp = await client.get(
                f"{base_to_test}/user",
                headers=self._headers(key_to_test),
                timeout=10.0,
            )
            resp.raise_for_status()
            user_data = resp.json()

            uname = user_data.get("username", "Inconnu")
            is_premium = user_data.get("type") == "premium"
            exp = user_data.get("expiration")
            prem_txt = f"Premium (expire le {exp[:10]})" if is_premium and exp else ("Premium" if is_premium else "Gratuit")

            return {
                "ok": True,
                "label": "Test API OK",
                "detail": f"Real-Debrid : {uname} ({prem_txt})",
                "last_check": now_ts,
            }
        except Exception as exc:
            return {
                "ok": False,
                "label": "Échec Test API",
                "detail": f"Erreur Real-Debrid : {exc}",
                "last_check": now_ts,
            }

    async def upload_magnet(
        self, client: httpx.AsyncClient, magnet: str, api_key: str, api_base: str, agent: str
    ) -> Dict[str, Any]:
        base = (api_base or self.default_api_base).rstrip("/")
        resp = await client.post(
            f"{base}/torrents/addMagnet",
            headers=self._headers(api_key),
            data={"magnet": magnet},
            timeout=20.0,
        )
        resp.raise_for_status()
        payload = resp.json()
        item_id = str(payload["id"])

        # Sélectionner tous les fichiers automatiquement pour démarrer le torrent
        try:
            await client.post(
                f"{base}/torrents/selectFiles/{item_id}",
                headers=self._headers(api_key),
                data={"files": "all"},
                timeout=10.0,
            )
        except Exception as exc:
            logger.debug(f"Real-Debrid selectFiles automatique : {exc}")

        # Récupérer le nom et la taille
        info_resp = await client.get(
            f"{base}/torrents/info/{item_id}",
            headers=self._headers(api_key),
            timeout=10.0,
        )
        info_data = info_resp.json() if info_resp.is_success else {}

        is_ready = (info_data.get("status") or "").lower() == "downloaded"
        return {
            "id": item_id,
            "name": info_data.get("filename") or f"Torrent-{item_id}",
            "size": int(info_data.get("bytes") or 0),
            "ready": is_ready,
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
        resp = await client.put(
            f"{base}/torrents/addTorrent",
            headers={**self._headers(api_key), "Content-Type": "application/x-bittorrent"},
            content=content,
            timeout=25.0,
        )
        resp.raise_for_status()
        payload = resp.json()
        item_id = str(payload["id"])

        try:
            await client.post(
                f"{base}/torrents/selectFiles/{item_id}",
                headers=self._headers(api_key),
                data={"files": "all"},
                timeout=10.0,
            )
        except Exception as exc:
            logger.debug(f"Real-Debrid selectFiles automatique : {exc}")

        info_resp = await client.get(
            f"{base}/torrents/info/{item_id}",
            headers=self._headers(api_key),
            timeout=10.0,
        )
        info_data = info_resp.json() if info_resp.is_success else {}

        return {
            "id": item_id,
            "name": info_data.get("filename") or filename,
            "size": int(info_data.get("bytes") or 0),
        }

    async def get_statuses(
        self, client: httpx.AsyncClient, ids: List[Any], api_key: str, api_base: str, agent: str
    ) -> Dict[Any, Dict[str, Any]]:
        base = (api_base or self.default_api_base).rstrip("/")
        result: Dict[Any, Dict[str, Any]] = {}

        for target_id in ids:
            try:
                resp = await client.get(
                    f"{base}/torrents/info/{target_id}",
                    headers=self._headers(api_key),
                    timeout=15.0,
                )
                if not resp.is_success:
                    if resp.status_code in (400, 403, 404, 410):
                        result[target_id] = {
                            "id": target_id,
                            "statusCode": 5,
                            "filename": "",
                            "size": 0,
                            "downloaded": 0,
                            "status": f"Torrent introuvable ou supprimé sur Real-Debrid (HTTP {resp.status_code})",
                        }
                    continue
                info = resp.json()
                raw_status = (info.get("status") or "").lower()

                # Si en attente de sélection des fichiers, forcer la sélection 'all'
                if raw_status == "waiting_files_selection":
                    try:
                        await client.post(
                            f"{base}/torrents/selectFiles/{target_id}",
                            headers=self._headers(api_key),
                            data={"files": "all"},
                            timeout=10.0,
                        )
                    except Exception:
                        pass

                is_ready = raw_status == "downloaded"
                is_err = "error" in raw_status or raw_status in ("virus", "dead")
                status_code = 4 if is_ready else (5 if is_err else 0)

                total_size = int(info.get("bytes") or 0)
                pct = float(info.get("progress") or 0.0)
                downloaded = total_size if is_ready else int(total_size * (pct / 100.0))

                links = []
                for f in info.get("files", []):
                    if f.get("selected"):
                        clean_path = str(f.get("path") or "").lstrip("/")
                        links.append({"filename": clean_path})

                result[target_id] = {
                    "id": target_id,
                    "statusCode": status_code,
                    "filename": info.get("filename") or "",
                    "size": total_size,
                    "downloaded": downloaded,
                    "status": raw_status,
                    "links": links,
                    "seeders": int(info.get("seeders") or 0),
                    "downloadSpeed": int(info.get("speed") or 0),
                    "is_ready": is_ready,
                }
            except Exception as exc:
                logger.debug(f"Real-Debrid get_statuses erreur {target_id} : {exc}")

        return result

    async def get_magnet_files(
        self, client: httpx.AsyncClient, item_id: Any, api_key: str, api_base: str, agent: str
    ) -> List[str]:
        base = (api_base or self.default_api_base).rstrip("/")
        try:
            resp = await client.get(
                f"{base}/torrents/info/{item_id}",
                headers=self._headers(api_key),
                timeout=10.0,
            )
            if resp.is_success:
                info = resp.json()
                return [str(f.get("path") or "").lstrip("/") for f in info.get("files", []) if f.get("selected")]
        except Exception as exc:
            logger.debug(f"Real-Debrid get_magnet_files {item_id} : {exc}")
        return []

    async def delete_magnet(
        self, client: httpx.AsyncClient, item_id: Any, api_key: str, api_base: str, agent: str
    ) -> None:
        base = (api_base or self.default_api_base).rstrip("/")
        try:
            await client.delete(
                f"{base}/torrents/delete/{item_id}",
                headers=self._headers(api_key),
                timeout=10.0,
            )
            logger.info(f"Torrent ID={item_id} supprimé sur Real-Debrid.")
        except Exception as exc:
            logger.warning(f"Impossible de supprimer ID={item_id} sur Real-Debrid : {exc}")

    async def unlock_link(
        self,
        client: httpx.AsyncClient,
        link: str,
        password: Optional[str],
        api_key: str,
        api_base: str,
        agent: str,
    ) -> Dict[str, Any]:
        """Débride un lien direct via Real-Debrid (/unrestrict/link)."""
        base = (api_base or self.default_api_base).rstrip("/")
        data_payload: Dict[str, str] = {"link": link.strip()}
        if password:
            data_payload["password"] = password.strip()

        resp = await client.post(
            f"{base}/unrestrict/link",
            headers=self._headers(api_key),
            data=data_payload,
            timeout=25.0,
        )
        resp.raise_for_status()
        res_data = resp.json()
        direct_link = res_data.get("download") or ""
        if not direct_link:
            raise RuntimeError("Real-Debrid n'a retourné aucun lien de téléchargement direct")

        raw_fname = res_data.get("filename")
        if not raw_fname:
            try:
                raw_fname = Path(link.split("?")[0]).name
            except Exception:
                raw_fname = "fichier"

        fsize = int(res_data.get("filesize") or 0)
        return {
            "link": direct_link,
            "filename": raw_fname,
            "size": fsize,
            "host": res_data.get("host") or "",
            "id": res_data.get("id"),
        }

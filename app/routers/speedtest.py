import asyncio
import logging
import time
from typing import Any, Dict

import httpx
from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.state import settings_db

logger = logging.getLogger("DebridFlow.Speedtest")
router = APIRouter()


@router.post("/api/speedtest/run")
@router.get("/api/speedtest/run")
async def api_run_speedtest() -> JSONResponse:
    """Mesure le ping AllDebrid, le ping global et la bande passante descendante/montante."""
    result: Dict[str, Any] = {
        "ok": True,
        "ping_ms": None,
        "alldebrid_ping_ms": None,
        "alldebrid_status": "N/A",
        "download_mbps": 0.0,
        "download_mbs": 0.0,
        "upload_mbps": 0.0,
        "upload_mbs": 0.0,
        "tested_at": int(time.time()),
        "error": None,
    }

    ad_key = settings_db.get("api_key", "").strip()

    timeout = httpx.Timeout(connect=5.0, read=15.0, write=15.0, pool=15.0)
    async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
        # 1. Ping AllDebrid API
        if ad_key:
            try:
                t0 = time.time()
                r_ad = await client.get(f"https://api.alldebrid.com/v4/user?agent=DebridFlow-Billou&apikey={ad_key}")
                result["alldebrid_ping_ms"] = round((time.time() - t0) * 1000, 1)
                if r_ad.status_code == 200:
                    data = r_ad.json()
                    if data.get("status") == "success":
                        result["alldebrid_status"] = "OK"
                    else:
                        result["alldebrid_status"] = data.get("error", {}).get("message", "API Error")
            except Exception as e:
                logger.warning(f"AllDebrid ping error: {e}")
                result["alldebrid_status"] = "Injoignable"

        # 2. Ping Global (Cloudflare Edge CDN)
        try:
            t0 = time.time()
            r_ping = await client.get("https://speed.cloudflare.com/__down?bytes=0")
            if r_ping.status_code == 200:
                result["ping_ms"] = round((time.time() - t0) * 1000, 1)
        except Exception as e:
            logger.warning(f"Global ping error: {e}")

        # 3. Test Débit Descendant (Download) ~ 25 Mo
        try:
            test_size = 25_000_000  # 25 MB
            t_start = time.time()
            dl_bytes = 0
            async with client.stream("GET", f"https://speed.cloudflare.com/__down?bytes={test_size}") as resp:
                if resp.status_code == 200:
                    async for chunk in resp.aiter_bytes(chunk_size=65536):
                        dl_bytes += len(chunk)
            duration = max(0.001, time.time() - t_start)
            if dl_bytes > 0:
                mbps = (dl_bytes * 8) / (duration * 1_000_000)
                result["download_mbps"] = round(mbps, 2)
                result["download_mbs"] = round(mbps / 8, 2)
        except Exception as e:
            logger.warning(f"Download speed test error: {e}")
            result["error"] = f"Erreur test débit descendant: {e}"

        # 4. Test Débit Montant (Upload) ~ 5 Mo
        try:
            payload = b"0" * (5 * 1024 * 1024)
            t_start = time.time()
            r_up = await client.post("https://speed.cloudflare.com/__up", content=payload)
            duration = max(0.001, time.time() - t_start)
            if r_up.status_code == 200:
                mbps = (len(payload) * 8) / (duration * 1_000_000)
                result["upload_mbps"] = round(mbps, 2)
                result["upload_mbs"] = round(mbps / 8, 2)
        except Exception as e:
            logger.warning(f"Upload speed test error: {e}")

    return JSONResponse(result)

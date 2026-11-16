from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Body
from fastapi.responses import JSONResponse

from app.scanner import scanner_service

router = APIRouter(prefix="/api/scanner", tags=["scanner"])


@router.get("/status")
async def get_scanner_status():
    return JSONResponse(
        {
            "status": scanner_service.status,
            "progress": scanner_service.progress,
            "last_update": scanner_service.last_update,
            "stats": scanner_service.stats,
            "error_msg": scanner_service.error_msg,
        }
    )


@router.api_route("/start", methods=["GET", "POST"])
@router.api_route("/webhook", methods=["GET", "POST"])
async def start_scanner(force: bool = False):
    result = await scanner_service.start_scan(force=force)
    return JSONResponse(result)


@router.get("/data")
async def get_scanner_data():
    return JSONResponse(
        {
            "status": scanner_service.status,
            "last_update": scanner_service.last_update,
            "stats": scanner_service.stats,
            "dead_symlinks": scanner_service.dead_symlinks,
            "grouped_magnets": scanner_service.grouped_magnets,
            "total_magnets": scanner_service.total_magnets,
        }
    )


@router.post("/clean_dead_symlinks")
async def clean_dead_symlinks(payload: Dict[str, Any] = Body(default={})):
    paths = payload.get("paths")
    deleted = await scanner_service.clean_dead_symlinks(paths)
    return JSONResponse({"status": "success", "deleted": deleted})


@router.post("/delete_magnets")
async def delete_magnets(payload: Dict[str, Any] = Body(...)):
    items = payload.get("items", [])
    deleted = await scanner_service.delete_magnets(items)
    return JSONResponse({"status": "success", "deleted": deleted})


@router.post("/research")
async def trigger_research(payload: Dict[str, Any] = Body(...)):
    media_type = payload.get("media_type", "")
    media_id = payload.get("media_id")
    dead_path = payload.get("dead_path")

    if not media_type or media_id is None:
        return JSONResponse({"status": "error", "message": "media_type et media_id requis"}, status_code=400)

    result = await scanner_service.trigger_research_arr(media_type, int(media_id), dead_path)
    # Si le lien mort a été purgé, le retirer aussi de la liste
    if dead_path:
        await scanner_service.clean_dead_symlinks([dead_path])
    return JSONResponse(result)


@router.post("/research_all_dead")
async def research_all_dead():
    matched_dead = [d for d in scanner_service.dead_symlinks if d.get("media_type") in ("radarr", "sonarr") and d.get("media_id")]
    if not matched_dead:
        return JSONResponse({"status": "warning", "message": "Aucun lien mort associé à Radarr ou Sonarr"})

    success_count = 0
    for item in matched_dead:
        res = await scanner_service.trigger_research_arr(item["media_type"], int(item["media_id"]), item.get("path"))
        if res.get("status") == "success":
            success_count += 1

    # Nettoyage de ces liens morts
    await scanner_service.clean_dead_symlinks([d["path"] for d in matched_dead])

    return JSONResponse({
        "status": "success",
        "message": f"Recherche relancée pour {success_count} média(s) dans Radarr / Sonarr.",
        "count": success_count,
    })

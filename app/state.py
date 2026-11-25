import asyncio
import json
import os
from pathlib import Path
from typing import Any, Dict, Tuple

from app.bencode import sanitize_filename
from app.config import DEFAULT_SERVICES, DEFAULT_SETTINGS, STATE_FILE, logger

state_lock = asyncio.Lock()
settings_db: Dict[str, Any] = dict(DEFAULT_SETTINGS)
torrents_db: Dict[str, Dict[str, Any]] = {}
categories_db: Dict[str, Dict[str, str]] = {}
api_health: Dict[str, Any] = {
    "ok": False,
    "label": "Vérification API...",
    "detail": "",
    "last_check": 0,
}


def get_services_config() -> Dict[str, Dict[str, str]]:
    svcs = settings_db.get("services")
    if not isinstance(svcs, dict) or not svcs:
        old_modes = settings_db.get("service_modes")
        if isinstance(old_modes, dict) and old_modes:
            settings_db["services"] = {
                k: {"mode": v, "subpath": k} for k, v in old_modes.items()
            }
        else:
            settings_db["services"] = {k: dict(v) for k, v in DEFAULT_SERVICES.items()}
    return settings_db["services"]


def resolve_service(category: str) -> Tuple[str, Path]:
    svcs = get_services_config()
    base = Path(settings_db["download_base_dir"])
    cat = (category or "torrent-direct").strip()

    cfg = svcs.get(cat)
    if not cfg:
        # Prise en charge des alias direct <-> torrent-direct
        if cat in ("direct", "torrent-direct"):
            cfg = svcs.get("torrent-direct") or svcs.get("direct")
        if not cfg:
            for k, v in svcs.items():
                if k.lower() == cat.lower():
                    cfg = v
                    break

    if cfg:
        mode = "download" if cfg.get("mode") == "download" else "symlink"
        sub = (cfg.get("subpath") or cat).strip()
        target_dir = Path(sub) if sub.startswith("/") else (base / sub)
        return mode, target_dir

    safe_cat = sanitize_filename(cat) or "default"
    default_mode = "download" if "direct" in cat.lower() else "symlink"
    return default_mode, base / safe_cat


def rebuild_categories() -> None:
    svcs = get_services_config()
    categories_db.clear()
    for cat in svcs.keys():
        _, target_dir = resolve_service(cat)
        target_dir.mkdir(parents=True, exist_ok=True)
        categories_db[cat] = {"name": cat, "savePath": str(target_dir)}


def get_allowed_exts() -> set:
    raw = settings_db.get("allowed_exts", "")
    return {
        (e.strip().lower() if e.strip().startswith(".") else f".{e.strip().lower()}")
        for e in raw.split(",")
        if e.strip()
    }


def get_ignored_exts() -> set:
    raw = settings_db.get("ignored_exts", "")
    return {
        (e.strip().lower() if e.strip().startswith(".") else f".{e.strip().lower()}")
        for e in raw.split(",")
        if e.strip()
    }


def load_state() -> None:
    global torrents_db, settings_db
    if STATE_FILE.exists():
        try:
            data = json.loads(STATE_FILE.read_text(encoding="utf-8"))
            saved_settings = data.get("settings", {})
            for k, v in DEFAULT_SETTINGS.items():
                if k == "services":
                    if isinstance(saved_settings.get("services"), dict) and saved_settings["services"]:
                        settings_db["services"] = {
                            sk: {
                                "mode": "download" if sv.get("mode") == "download" else "symlink",
                                "subpath": str(sv.get("subpath") or sk),
                            }
                            for sk, sv in saved_settings["services"].items()
                            if isinstance(sv, dict)
                        }
                        if "torrent-direct" not in settings_db["services"] and "direct" not in settings_db["services"]:
                            settings_db["services"]["torrent-direct"] = dict(DEFAULT_SERVICES["torrent-direct"])
                    elif isinstance(saved_settings.get("service_modes"), dict) and saved_settings["service_modes"]:
                        settings_db["services"] = {
                            sk: {"mode": sm, "subpath": sk}
                            for sk, sm in saved_settings["service_modes"].items()
                        }
                        if "torrent-direct" not in settings_db["services"] and "direct" not in settings_db["services"]:
                            settings_db["services"]["torrent-direct"] = dict(DEFAULT_SERVICES["torrent-direct"])
                    else:
                        settings_db["services"] = {k2: dict(v2) for k2, v2 in DEFAULT_SERVICES.items()}
                elif k == "ignored_exts" and k in saved_settings:
                    settings_db[k] = saved_settings[k]
                elif k in saved_settings and saved_settings[k] != "":
                    settings_db[k] = saved_settings[k]
                elif k in saved_settings and not v:
                    settings_db[k] = saved_settings[k]
            if "max_concurrent_downloads" in settings_db:
                try:
                    settings_db["max_concurrent_downloads"] = max(1, int(settings_db["max_concurrent_downloads"]))
                except Exception:
                    settings_db["max_concurrent_downloads"] = 3
            torrents_db.clear()
            torrents_db.update(data.get("torrents", {}))
            logger.info(f"État chargé : {len(torrents_db)} torrent(s), {len(get_services_config())} service(s) configuré(s).")
        except Exception as exc:
            logger.error(f"Impossible de lire {STATE_FILE} : {exc}")
    rebuild_categories()


def save_state() -> None:
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    tmp_file = STATE_FILE.with_suffix(".tmp")
    payload = {"settings": settings_db, "torrents": torrents_db}
    tmp_file.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    os.replace(tmp_file, STATE_FILE)

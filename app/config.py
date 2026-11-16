import logging
import os
from pathlib import Path
from typing import Any, Dict

# Fichier de persistance d'état (utilise /data/state.json sous Docker ou ./data/state.json en local)
def _get_default_state_file() -> Path:
    env_val = os.getenv("STATE_FILE")
    if env_val:
        return Path(env_val)
    if Path("/data").is_dir() and os.access("/data", os.W_OK):
        return Path("/data/state.json")
    return Path(__file__).resolve().parent.parent / "data" / "state.json"


STATE_FILE = _get_default_state_file()

# Services par défaut associés aux applications *arr
DEFAULT_SERVICES: Dict[str, Dict[str, str]] = {
    "tv-sonarr": {"mode": "symlink", "subpath": "tv-sonarr"},
    "radarr": {"mode": "symlink", "subpath": "radarr"},
    "whisparr": {"mode": "download", "subpath": "whisparr"},
    "prowlarr": {"mode": "symlink", "subpath": "prowlarr"},
}

# Configuration par défaut (surchargeable par variables d'environnement ou state.json)
DEFAULT_SETTINGS: Dict[str, Any] = {
    "api_key": os.getenv("ALLDEBRID_API_KEY", "").strip(),
    "api_base": os.getenv("ALLDEBRID_API_BASE", "https://api.alldebrid.com/v4").rstrip("/"),
    "agent": os.getenv("ALLDEBRID_AGENT", "PyRDT-Billou"),
    "rclone_mount_dir": os.getenv("RCLONE_MOUNT_DIR", "/mnt/alldebrid/magnets"),
    "download_base_dir": os.getenv("DOWNLOAD_BASE_DIR", "/mnt/virtual/Medias/DL"),
    "poll_interval": float(os.getenv("POLL_INTERVAL", "3.0")),
    "mount_timeout": int(os.getenv("MOUNT_TIMEOUT", "60")),
    "auto_clean_import": os.getenv("AUTO_CLEAN_IMPORT", "true").lower() == "true",
    "delete_on_provider": os.getenv("DELETE_ON_PROVIDER", "false").lower() == "true",
    "delete_on_dl_complete": os.getenv("DELETE_ON_DL_COMPLETE", "true").lower() == "true",
    "allowed_exts": ".mkv,.mp4,.avi,.mov,.wmv,.m4v,.ts,.webm,.srt,.ass,.ssa,.sub,.vtt",
    "username": os.getenv("PYRDT_USER", "").strip(),
    "password": os.getenv("PYRDT_PASS", "").strip(),
    "ui_language": os.getenv("UI_LANGUAGE", "fr").strip().lower(),
    "provider": os.getenv("DEBRID_PROVIDER", "alldebrid").strip().lower(),
    "services": {k: dict(v) for k, v in DEFAULT_SERVICES.items()},
    "media_scan_paths": os.getenv(
        "MEDIA_SCAN_PATHS",
        "/mnt/virtual/Medias/Films,/mnt/virtual/Medias/Series,/mnt/virtual/Medias/Replay,/mnt/virtual/Medias/Enfants,/mnt/virtual/Medias/Animes",
    ),
    "radarr_url": os.getenv("RADARR_URL", "http://127.0.0.1:7878"),
    "radarr_api_key": os.getenv("RADARR_API_KEY", ""),
    "sonarr_url": os.getenv("SONARR_URL", "http://127.0.0.1:8989"),
    "sonarr_api_key": os.getenv("SONARR_API_KEY", ""),
}

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)
logger = logging.getLogger("PyRDT")

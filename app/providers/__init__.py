from typing import Dict, Optional

from app.providers.alldebrid import AllDebridProvider
from app.providers.base import BaseDebridProvider
from app.providers.debridlink import DebridLinkProvider
from app.providers.highway import HighWayProvider
from app.providers.premiumize import PremiumizeProvider
from app.providers.realdebrid import RealDebridProvider
from app.providers.torbox import TorBoxProvider

SUPPORTED_PROVIDERS: Dict[str, Dict[str, str]] = {
    "alldebrid": {
        "id": "alldebrid",
        "name": "AllDebrid",
        "api_base": "https://api.alldebrid.com/v4",
        "key_label": "Clé API AllDebrid",
        "key_hint": "Clé générée dans votre espace AllDebrid > Apikeys",
        "url": "https://alldebrid.com/apikeys/",
    },
    "realdebrid": {
        "id": "realdebrid",
        "name": "Real-Debrid",
        "api_base": "https://api.real-debrid.com/rest/1.0",
        "key_label": "Token API Real-Debrid",
        "key_hint": "Token secret généré sur Real-Debrid > API Token",
        "url": "https://real-debrid.com/apitoken",
    },
    "premiumize": {
        "id": "premiumize",
        "name": "Premiumize.me",
        "api_base": "https://www.premiumize.me/api",
        "key_label": "Clé API Premiumize",
        "key_hint": "Clé API disponible dans votre compte Premiumize",
        "url": "https://www.premiumize.me/account",
    },
    "debridlink": {
        "id": "debridlink",
        "name": "Debrid-Link",
        "api_base": "https://debrid-link.com/api/v2",
        "key_label": "Clé API Debrid-Link",
        "key_hint": "Clé API personnelle disponible sur Debrid-Link",
        "url": "https://debrid-link.com/webapp/account",
    },
    "torbox": {
        "id": "torbox",
        "name": "TorBox",
        "api_base": "https://api.torbox.app/v1/api",
        "key_label": "Clé API TorBox",
        "key_hint": "Clé API disponible dans vos paramètres TorBox",
        "url": "https://torbox.app/settings",
    },
    "highway": {
        "id": "highway",
        "name": "High-Way.me",
        "api_base": "https://cloud.high-way.me/center-api",
        "key_label": "Token API High-Way",
        "key_hint": "Générez un Token API dans Download Center > Sitzungen",
        "url": "https://high-way.me",
    },
}

_PROVIDERS_INSTANCES: Dict[str, BaseDebridProvider] = {
    "alldebrid": AllDebridProvider(),
    "realdebrid": RealDebridProvider(),
    "premiumize": PremiumizeProvider(),
    "debridlink": DebridLinkProvider(),
    "torbox": TorBoxProvider(),
    "highway": HighWayProvider(),
}


def normalize_provider_name(name: Optional[str]) -> str:
    if not name:
        return "alldebrid"
    clean = name.strip().lower().replace("-", "").replace(".", "").replace("_", "")
    if "all" in clean:
        return "alldebrid"
    if "real" in clean:
        return "realdebrid"
    if "prem" in clean:
        return "premiumize"
    if "debrid" in clean and "link" in clean:
        return "debridlink"
    if "torbox" in clean:
        return "torbox"
    if "high" in clean or "way" in clean:
        return "highway"
    return "alldebrid"


def get_provider(name: Optional[str] = None) -> BaseDebridProvider:
    key = normalize_provider_name(name)
    return _PROVIDERS_INSTANCES.get(key, _PROVIDERS_INSTANCES["alldebrid"])

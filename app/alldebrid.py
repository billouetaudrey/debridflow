from typing import Any, Dict, List, Optional

import httpx

from app.providers import get_provider
from app.state import api_health, settings_db


async def check_alldebrid_api_health(
    client: httpx.AsyncClient,
    api_key: Optional[str] = None,
    api_base: Optional[str] = None,
    agent: Optional[str] = None,
    provider_name: Optional[str] = None,
) -> Dict[str, Any]:
    prov_key = provider_name or settings_db.get("provider", "alldebrid")
    provider = get_provider(prov_key)
    key = api_key if api_key is not None else settings_db.get("api_key", "")
    base = api_base if api_base is not None else settings_db.get("api_base", provider.default_api_base)
    ag = agent if agent is not None else settings_db.get("agent", "OmniSym-Billou")

    health = await provider.check_health(client, api_key=key, api_base=base, agent=ag)
    api_health.update(health)
    return dict(api_health)


async def alldebrid_upload_magnet(client: httpx.AsyncClient, magnet: str) -> Dict[str, Any]:
    provider = get_provider(settings_db.get("provider", "alldebrid"))
    return await provider.upload_magnet(
        client,
        magnet,
        api_key=settings_db.get("api_key", ""),
        api_base=settings_db.get("api_base", provider.default_api_base),
        agent=settings_db.get("agent", "OmniSym-Billou"),
    )


async def alldebrid_upload_file(client: httpx.AsyncClient, filename: str, content: bytes) -> Dict[str, Any]:
    provider = get_provider(settings_db.get("provider", "alldebrid"))
    return await provider.upload_file(
        client,
        filename,
        content,
        api_key=settings_db.get("api_key", ""),
        api_base=settings_db.get("api_base", provider.default_api_base),
        agent=settings_db.get("agent", "OmniSym-Billou"),
    )


async def alldebrid_get_statuses(client: httpx.AsyncClient, ids: List[Any]) -> Dict[Any, Dict[str, Any]]:
    provider = get_provider(settings_db.get("provider", "alldebrid"))
    return await provider.get_statuses(
        client,
        ids,
        api_key=settings_db.get("api_key", ""),
        api_base=settings_db.get("api_base", provider.default_api_base),
        agent=settings_db.get("agent", "OmniSym-Billou"),
    )


async def alldebrid_get_magnet_files(client: httpx.AsyncClient, ad_id: Any) -> List[str]:
    provider = get_provider(settings_db.get("provider", "alldebrid"))
    return await provider.get_magnet_files(
        client,
        ad_id,
        api_key=settings_db.get("api_key", ""),
        api_base=settings_db.get("api_base", provider.default_api_base),
        agent=settings_db.get("agent", "OmniSym-Billou"),
    )


async def alldebrid_delete_magnet(client: httpx.AsyncClient, ad_id: Any) -> None:
    provider = get_provider(settings_db.get("provider", "alldebrid"))
    await provider.delete_magnet(
        client,
        ad_id,
        api_key=settings_db.get("api_key", ""),
        api_base=settings_db.get("api_base", provider.default_api_base),
        agent=settings_db.get("agent", "OmniSym-Billou"),
    )


async def alldebrid_unlock_link(
    client: httpx.AsyncClient, link: str, password: Optional[str] = None
) -> Dict[str, Any]:
    provider = get_provider(settings_db.get("provider", "alldebrid"))
    return await provider.unlock_link(
        client,
        link,
        password=password,
        api_key=settings_db.get("api_key", ""),
        api_base=settings_db.get("api_base", provider.default_api_base),
        agent=settings_db.get("agent", "OmniSym-Billou"),
    )

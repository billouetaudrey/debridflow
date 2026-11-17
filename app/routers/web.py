import html
from pathlib import Path
from typing import Dict, List, Optional

import httpx
from fastapi import APIRouter, Form, Response
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse

from app.alldebrid import check_alldebrid_api_health
from app.bencode import sanitize_filename
from app.config import DEFAULT_SERVICES, DEFAULT_SETTINGS, logger
from app.providers import SUPPORTED_PROVIDERS, get_provider, normalize_provider_name
from app.state import (
    api_health,
    get_services_config,
    rebuild_categories,
    resolve_service,
    save_state,
    settings_db,
    state_lock,
    torrents_db,
)

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"
TEMPLATES_DIR = BASE_DIR / "templates"


@router.get("/static/css/style.css")
async def get_css():
    css_file = STATIC_DIR / "css" / "style.css"
    if css_file.exists():
        return Response(content=css_file.read_text(encoding="utf-8"), media_type="text/css")
    return Response(content="", status_code=404)


@router.get("/static/js/app.js")
async def get_js():
    js_file = STATIC_DIR / "js" / "app.js"
    if js_file.exists():
        return Response(content=js_file.read_text(encoding="utf-8"), media_type="application/javascript")
    return Response(content="", status_code=404)


@router.get("/api/ui/queue")
async def ui_queue_feed():
    async with state_lock:
        items_sorted = sorted(torrents_db.items(), key=lambda kv: kv[1].get("added_on", 0), reverse=True)
        payload = [
            {
                "hash": h,
                "ad_id": item.get("ad_id", "-"),
                "name": item.get("name") or h,
                "size": int(item.get("size") or 0),
                "category": item.get("category") or "",
                "transfer_mode": item.get("transfer_mode") or resolve_service(item.get("category", ""))[0],
                "save_path": item.get("save_path") or "",
                "state": item.get("state") or "downloading",
                "progress": float(item.get("progress") or 0.0),
                "dlspeed": int(item.get("dlspeed") or 0),
                "avg_speed": int(item.get("avg_speed") or 0),
                "error_msg": item.get("error_msg") or "",
            }
            for h, item in items_sorted
        ]
        last_stat = dict(settings_db.get("last_download_stat", {}))
    return JSONResponse(
        {
            "items": payload,
            "api_health": dict(api_health),
            "last_download_stat": last_stat,
            "download_speed_limit": float(settings_db.get("download_speed_limit", 0)),
        },
        headers={"Cache-Control": "no-store"},
    )


@router.post("/api/test")
async def test_api_connection(
    provider: str = Form("alldebrid"),
    api_key: str = Form(""),
    api_base: str = Form(""),
    agent: str = Form("PyRDT-Billou"),
    rclone_mount_dir: str = Form("/mnt/alldebrid/magnets"),
):
    mount_path = Path(rclone_mount_dir.strip() or "/mnt/alldebrid/magnets")

    if mount_path.exists() and mount_path.is_dir():
        try:
            nb_items = len(list(mount_path.iterdir()))
            mount_status = f"Montage rclone OK ({nb_items} élément(s) détecté(s))"
        except Exception as exc:
            mount_status = f"Montage rclone illisible ({exc})"
    else:
        mount_status = f"Dossier rclone introuvable ({mount_path})"

    prov_inst = get_provider(provider)
    resolved_base = api_base.strip() or prov_inst.default_api_base

    async with httpx.AsyncClient() as client:
        health = await prov_inst.check_health(client, api_key=api_key, api_base=resolved_base, agent=agent)

    if health["ok"]:
        return JSONResponse(
            {
                "ok": True,
                "message": f"Connexion {prov_inst.display_name} réussie — {health['detail']} | {mount_status}",
            }
        )
    return JSONResponse(
        {
            "ok": False,
            "message": f"Échec {prov_inst.display_name} : {health['detail']} | {mount_status}",
        }
    )


@router.post("/api/settings/test-telegram")
async def test_telegram_connection(
    bot_token: str = Form(""),
    chat_id: str = Form(""),
):
    from app.notifications import notifier
    res = await notifier.test_notification(bot_token=bot_token, chat_id=chat_id)
    return JSONResponse(res)


@router.post("/api/settings")
async def update_settings(
    provider: str = Form("alldebrid"),
    api_key: str = Form(""),
    api_base: str = Form(""),
    agent: str = Form("PyRDT-Billou"),
    rclone_mount_dir: str = Form("/mnt/alldebrid/magnets"),
    download_base_dir: str = Form("/mnt/virtual/Medias/DL"),
    poll_interval: float = Form(3.0),
    mount_timeout: int = Form(60),
    auto_clean_import: Optional[str] = Form(None),
    delete_on_provider: Optional[str] = Form(None),
    delete_on_dl_complete: Optional[str] = Form(None),
    download_speed_limit: float = Form(0.0),
    enable_scanner_tab: Optional[str] = Form(None),
    allowed_exts: str = Form(""),
    username: str = Form(""),
    password: str = Form(""),
    ui_language: str = Form("fr"),
    media_scan_paths: str = Form(""),
    radarr_url: str = Form(""),
    radarr_api_key: str = Form(""),
    sonarr_url: str = Form(""),
    sonarr_api_key: str = Form(""),
    telegram_enabled: Optional[str] = Form(None),
    telegram_bot_token: str = Form(""),
    telegram_chat_id: str = Form(""),
    telegram_notify_scan_start: Optional[str] = Form(None),
    telegram_notify_scan_complete: Optional[str] = Form(None),
    telegram_notify_dead_link: Optional[str] = Form(None),
    telegram_notify_download_complete: Optional[str] = Form(None),
    telegram_notify_clean_dead: Optional[str] = Form(None),
    telegram_notify_error: Optional[str] = Form(None),
    service_names: Optional[List[str]] = Form(None),
    service_modes_list: Optional[List[str]] = Form(None),
    service_subpaths: Optional[List[str]] = Form(None),
):
    new_services: Dict[str, Dict[str, str]] = {}
    if service_names and service_modes_list:
        subpaths_safe = service_subpaths or []
        for idx, (s_name, s_mode) in enumerate(zip(service_names, service_modes_list)):
            clean_name = sanitize_filename(s_name.strip())
            if clean_name:
                raw_sub = subpaths_safe[idx].strip() if idx < len(subpaths_safe) else ""
                new_services[clean_name] = {
                    "mode": "download" if s_mode == "download" else "symlink",
                    "subpath": raw_sub or clean_name,
                }
    if not new_services:
        new_services = {k: dict(v) for k, v in DEFAULT_SERVICES.items()}

    clean_lang = ui_language.strip().lower()
    if clean_lang not in ("fr", "en"):
        clean_lang = "fr"

    clean_prov = normalize_provider_name(provider)
    prov_obj = get_provider(clean_prov)

    async with state_lock:
        settings_db["provider"] = clean_prov
        settings_db["api_key"] = api_key.strip()
        settings_db["api_base"] = api_base.strip().rstrip("/") or prov_obj.default_api_base
        settings_db["agent"] = agent.strip() or "PyRDT-Billou"
        settings_db["rclone_mount_dir"] = rclone_mount_dir.strip() or "/mnt/alldebrid/magnets"
        settings_db["download_base_dir"] = download_base_dir.strip() or "/mnt/virtual/Medias/DL"
        settings_db["poll_interval"] = max(1.5, float(poll_interval))
        settings_db["mount_timeout"] = max(5, int(mount_timeout))
        settings_db["auto_clean_import"] = auto_clean_import == "on"
        settings_db["delete_on_provider"] = delete_on_provider == "on"
        settings_db["delete_on_dl_complete"] = delete_on_dl_complete == "on"
        settings_db["download_speed_limit"] = max(0.0, float(download_speed_limit))
        settings_db["allowed_exts"] = allowed_exts.strip() or DEFAULT_SETTINGS["allowed_exts"]
        settings_db["username"] = username.strip()
        settings_db["password"] = password.strip()
        settings_db["ui_language"] = clean_lang
        if media_scan_paths.strip():
            settings_db["media_scan_paths"] = media_scan_paths.strip()
        settings_db["radarr_url"] = radarr_url.strip() or "http://127.0.0.1:7878"
        settings_db["radarr_api_key"] = radarr_api_key.strip()
        settings_db["sonarr_url"] = sonarr_url.strip() or "http://127.0.0.1:8989"
        settings_db["sonarr_api_key"] = sonarr_api_key.strip()
        settings_db["enable_scanner_tab"] = enable_scanner_tab == "on"
        settings_db["telegram_enabled"] = telegram_enabled == "on"
        settings_db["telegram_bot_token"] = telegram_bot_token.strip()
        settings_db["telegram_chat_id"] = telegram_chat_id.strip()
        settings_db["telegram_notify_scan_start"] = telegram_notify_scan_start == "on"
        settings_db["telegram_notify_scan_complete"] = telegram_notify_scan_complete == "on"
        settings_db["telegram_notify_dead_link"] = telegram_notify_dead_link == "on"
        settings_db["telegram_notify_download_complete"] = telegram_notify_download_complete == "on"
        settings_db["telegram_notify_clean_dead"] = telegram_notify_clean_dead == "on"
        settings_db["telegram_notify_error"] = telegram_notify_error == "on"
        settings_db["services"] = new_services
        rebuild_categories()
        save_state()

    async with httpx.AsyncClient() as client:
        await check_alldebrid_api_health(client, provider_name=clean_prov)

    logger.info(f"Paramètres mis à jour via l'interface web (fournisseur={clean_prov}, {len(new_services)} service(s), langue={clean_lang}).")
    return RedirectResponse(url="/?saved=1", status_code=303)


@router.get("/", response_class=HTMLResponse)
async def web_dashboard(saved: Optional[str] = None):
    rows = []
    service_rows = []
    active_dl_count = 0
    active_sym_count = 0

    async with state_lock:
        s = dict(settings_db)
        health = dict(api_health)
        svcs = dict(get_services_config())

        for svc_name, svc_cfg in svcs.items():
            svc_mode = svc_cfg.get("mode", "symlink")
            svc_sub = svc_cfg.get("subpath") or svc_name
            sel_sym = "selected" if svc_mode != "download" else ""
            sel_dl = "selected" if svc_mode == "download" else ""
            service_rows.append(
                f'<div class="svc-row">'
                f'<input type="text" name="service_names" value="{html.escape(svc_name)}" placeholder="Catégorie" required>'
                f'<select name="service_modes_list">'
                f'<option value="symlink" {sel_sym} data-i18n="opt_mode_symlink">Symlink (instantané)</option>'
                f'<option value="download" {sel_dl} data-i18n="opt_mode_download">Téléchargement réel (copie locale)</option>'
                f'</select>'
                f'<input type="text" name="service_subpaths" value="{html.escape(svc_sub)}" placeholder="Sous-dossier dans DL" data-edited="1">'
                f'<button type="button" class="btn-del" onclick="this.parentElement.remove()" data-i18n="btn_remove">Retirer</button>'
                f'</div>'
            )

        items_sorted = sorted(torrents_db.items(), key=lambda kv: kv[1].get("added_on", 0), reverse=True)
        for h, item in items_sorted:
            pct = int(float(item.get("progress", 0)) * 100)
            state = item.get("state", "downloading")
            err = item.get("error_msg", "")
            mode = item.get("transfer_mode") or resolve_service(item.get("category", ""))[0]

            if state in ("downloading", "checkingDL", "copying"):
                if mode == "download":
                    active_dl_count += 1
                else:
                    active_sym_count += 1

            save_path_txt = html.escape(str(item.get("save_path") or ""))
            mode_badge = (
                '<span class="tag dl">DL réel</span>'
                if mode == "download"
                else '<span class="tag sym">Symlink</span>'
            )

            if state in ("pausedUP", "stalledUP"):
                badge_cls = "ok"
                state_txt = f"Terminé ({pct}%)"
            elif state == "pausedDL":
                badge_cls = "pause"
                state_txt = f"En pause ({pct}%)"
            elif state == "error":
                badge_cls = "err"
                state_txt = f"Erreur — {html.escape(err)}"
            elif state == "checkingDL":
                badge_cls = "run"
                state_txt = f"Montage rclone ({pct}%)"
            elif state == "copying":
                badge_cls = "run"
                state_txt = f"Copie locale ({pct}%)"
            else:
                badge_cls = "run"
                state_txt = f"{state} ({pct}%)"

            short_id = html.escape(h[:8])
            full_id = html.escape(h)
            ad_id = html.escape(str(item.get("ad_id", "-")))
            name_esc = html.escape(str(item.get("name", h)))
            cat_esc = html.escape(str(item.get("category", "")))

            pause_btn = (
                f'<button class="btn-sec" onclick="batchAction(\'resume\', [\'{full_id}\'])">Reprendre</button>'
                if state == "pausedDL"
                else f'<button class="btn-warn" onclick="batchAction(\'pause\', [\'{full_id}\'])">Pause</button>'
            )

            rows.append(
                f'<tr>'
                f'<td class="col-chk"><input type="checkbox" class="row-chk" value="{full_id}" onchange="updateSelection()"></td>'
                f'<td class="mono col-id"><div>#{ad_id}</div><small title="{full_id}" onclick="copyId(\'{full_id}\')" style="cursor:pointer;color:#8b949e">{short_id} 📋</small></td>'
                f'<td class="col-name">{name_esc}<div style="color:#8b949e;font-size:11px;margin-top:2px;">{save_path_txt}</div></td>'
                f'<td class="col-cat"><span class="tag">{cat_esc}</span> {mode_badge}</td>'
                f'<td class="col-status"><span class="badge {badge_cls}">{state_txt}</span><div class="pbar"><div class="pbar-fill {badge_cls}" style="width:{pct}%"></div></div></td>'
                f'<td class="actions col-actions">'
                f'<button class="btn-sec" onclick="batchAction(\'retry\', [\'{full_id}\'])">Relancer</button> '
                f'{pause_btn} '
                f'<button class="btn-del" onclick="openDeleteModal([\'{full_id}\'])">Supprimer</button>'
                f'</td></tr>'
            )

    api_ok = bool(health.get("ok"))
    base_label = health.get("label") or ("Test API OK" if api_ok else "Échec Test API")
    api_detail = html.escape(str(health.get("detail") or ""))

    if active_dl_count > 0:
        orb_cls = "dl"
        api_label = f"DL en cours ({active_dl_count}) — {base_label}"
    elif active_sym_count > 0:
        orb_cls = "sym"
        api_label = f"Symlink en cours ({active_sym_count}) — {base_label}"
    elif api_ok:
        orb_cls = "ok"
        api_label = base_label
    else:
        orb_cls = "err"
        api_label = base_label

    table_body = "".join(rows) or "<tr><td colspan='6' style='color:#8b949e;text-align:center'>Aucun torrent en file</td></tr>"
    banner = "<div class='alert' data-i18n='alert_saved'>Paramètres enregistrés et appliqués immédiatement.</div>" if saved else ""

    template_file = TEMPLATES_DIR / "index.html"
    raw_template = template_file.read_text(encoding="utf-8")

    ui_lang = s.get("ui_language") or "fr"
    current_prov = normalize_provider_name(s.get("provider", "alldebrid"))
    prov_meta = SUPPORTED_PROVIDERS.get(current_prov, SUPPORTED_PROVIDERS["alldebrid"])

    prov_options = []
    for pid, pdata in SUPPORTED_PROVIDERS.items():
        is_sel = "selected" if pid == current_prov else ""
        prov_options.append(f'<option value="{pid}" {is_sel}>{pdata["name"]}</option>')

    page = (
        raw_template.replace("__BANNER__", banner)
        .replace("__ORB_CLS__", orb_cls)
        .replace("__API_LABEL__", html.escape(api_label))
        .replace("__API_DETAIL__", api_detail)
        .replace("__PROVIDER__", current_prov)
        .replace("__PROVIDER_NAME__", html.escape(prov_meta["name"]))
        .replace("__PROVIDER_OPTIONS__", "".join(prov_options))
        .replace("__KEY_LABEL__", html.escape(prov_meta["key_label"]))
        .replace("__KEY_HINT__", html.escape(prov_meta["key_hint"]))
        .replace("__RCLONE_MOUNT_DIR__", html.escape(s["rclone_mount_dir"]))
        .replace("__DOWNLOAD_BASE_DIR__", html.escape(s["download_base_dir"]))
        .replace("__DOWNLOAD_SPEED_LIMIT__", str(s.get("download_speed_limit", 0)))
        .replace("__TABLE_BODY__", table_body)
        .replace("__SERVICE_ROWS__", "".join(service_rows))
        .replace("__API_KEY__", html.escape(s["api_key"]))
        .replace("__AGENT__", html.escape(s["agent"]))
        .replace("__POLL_INTERVAL__", str(s["poll_interval"]))
        .replace("__MOUNT_TIMEOUT__", str(s["mount_timeout"]))
        .replace("__USERNAME__", html.escape(s["username"]))
        .replace("__PASSWORD__", html.escape(s["password"]))
        .replace("__UI_LANGUAGE__", html.escape(ui_lang))
        .replace("__ALLOWED_EXTS__", html.escape(s["allowed_exts"]))
        .replace("__API_BASE__", html.escape(s["api_base"]))
        .replace("__MEDIA_SCAN_PATHS__", html.escape(s.get("media_scan_paths", "")))
        .replace("__RADARR_URL__", html.escape(s.get("radarr_url", "http://127.0.0.1:7878")))
        .replace("__RADARR_API_KEY__", html.escape(s.get("radarr_api_key", "")))
        .replace("__SONARR_URL__", html.escape(s.get("sonarr_url", "http://127.0.0.1:8989")))
        .replace("__SONARR_API_KEY__", html.escape(s.get("sonarr_api_key", "")))
        .replace("__CHECKED_SCANNER_TAB__", "checked" if s.get("enable_scanner_tab", True) else "")
        .replace("__SCANNER_TAB_DISPLAY__", "" if s.get("enable_scanner_tab", True) else "display:none;")
        .replace("__CHECKED_DL_DONE__", "checked" if s.get("delete_on_dl_complete") else "")
        .replace("__CHECKED_AUTO__", "checked" if s.get("auto_clean_import") else "")
        .replace("__CHECKED_DEL__", "checked" if s.get("delete_on_provider") else "")
        .replace("__TELEGRAM_BOT_TOKEN__", html.escape(str(s.get("telegram_bot_token", ""))))
        .replace("__TELEGRAM_CHAT_ID__", html.escape(str(s.get("telegram_chat_id", ""))))
        .replace("__CHECKED_TG_ENABLED__", "checked" if s.get("telegram_enabled", False) else "")
        .replace("__CHECKED_TG_SCAN_START__", "checked" if s.get("telegram_notify_scan_start", True) else "")
        .replace("__CHECKED_TG_SCAN_COMPLETE__", "checked" if s.get("telegram_notify_scan_complete", True) else "")
        .replace("__CHECKED_TG_DEAD_LINK__", "checked" if s.get("telegram_notify_dead_link", True) else "")
        .replace("__CHECKED_TG_DL_COMPLETE__", "checked" if s.get("telegram_notify_download_complete", True) else "")
        .replace("__CHECKED_TG_CLEAN_DEAD__", "checked" if s.get("telegram_notify_clean_dead", True) else "")
        .replace("__CHECKED_TG_ERROR__", "checked" if s.get("telegram_notify_error", True) else "")
    )
    return HTMLResponse(page)

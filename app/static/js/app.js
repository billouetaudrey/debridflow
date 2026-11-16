// PyRDT Frontend Logic & Multilingual Engine
const TRANSLATIONS = {
  fr: {
    // Brand & Header
    brand_title: "PyRDT — Client Multi-Debrid Symlink & DL",
    tab_queue: "File d'attente",
    tab_settings: "Paramètres",
    api_test_ok: "Test API OK",
    api_test_err: "Échec Test API",
    api_testing: "Vérification API...",
    status_dl: "DL en cours ({n})",
    status_sym: "Symlink en cours ({n})",
    status_unreachable: "Serveur PyRDT injoignable",

    // Toolbar
    sel_count: "{n} sélectionné(s)",
    btn_retry: "Relancer",
    btn_pause: "Pause",
    btn_resume: "Reprendre",
    btn_delete: "Supprimer",
    btn_purge_completed: "Purger terminés",
    select_all: "Tout sélectionner",

    // Queue Table Headers
    th_id: "ID (AD / Hash)",
    th_name: "Nom",
    th_service: "Service / Mode",
    th_status: "Statut",
    th_actions: "Actions",
    no_torrents: "Aucun torrent en file d'attente",
    tag_dl: "DL réel",
    tag_sym: "Symlink",

    // Statuses
    st_completed: "Terminé",
    st_paused: "En pause",
    st_error: "Erreur",
    st_rclone_wait: "Attente rclone",
    st_copying: "Copie locale",
    st_downloading: "Téléchargement",

    // Delete Modal
    modal_title: "Options de suppression",
    modal_desc: "Retirer {n} élément(s) de la liste PyRDT :",
    opt_del_files: "Supprimer aussi les fichiers / liens symboliques locaux",
    opt_del_ad: "Supprimer aussi le magnet chez le fournisseur",
    btn_cancel: "Annuler",
    btn_confirm_delete: "Confirmer la suppression",

    // Settings Sub-categories
    nav_provider: "Fournisseur & API",
    nav_storage: "Dossiers & Stockage",
    nav_services: "Services (*arr)",
    nav_automation: "Automatisation",
    nav_security: "Sécurité",
    nav_system: "Système & Langue",

    // Settings Section Titles
    sec_provider: "1. Fournisseur & API Debrid",
    sec_storage: "2. Dossiers & Stockage",
    sec_services: "3. Services, Catégories *arr & Destinations",
    sec_automation: "4. Automatisation & Nettoyage",
    sec_security: "5. Sécurité & Authentification",
    sec_system: "6. Performances & Langue",

    // Fields & Labels
    lbl_provider: "Fournisseur de Débridage (Provider)",
    hint_provider: "Choisissez parmi AllDebrid, Real-Debrid, Premiumize, Debrid-Link, TorBox ou High-Way.",
    lbl_api_key: "Clé / Token API",
    hint_api_key: "Clé ou Token secret généré chez votre fournisseur.",
    lbl_agent: "Nom de l'agent / User-Agent",
    hint_agent: "Identifiant envoyé aux API (ex: PyRDT-Billou).",
    lbl_api_base: "URL de l'API",
    hint_api_base: "Pré-remplie automatiquement selon le service sélectionné.",
    btn_test_api: "Tester la connexion API",
    testing_api: "Test en cours...",

    lbl_rclone_mount: "Chemin de montage Rclone (source magnets)",
    hint_rclone_mount: "Dossier monté par rclone (ex: /mnt/alldebrid/magnets).",
    lbl_dl_dir: "Dossier racine des téléchargements (DL)",
    hint_dl_dir: "Chaque service écrit dans son sous-dossier ici.",
    lbl_allowed_exts: "Extensions autorisées (séparées par virgules)",
    hint_allowed_exts: "Fichiers vidéos, audios ou sous-titres acceptés.",
    lbl_mount_timeout: "Timeout montage Rclone (secondes)",
    hint_mount_timeout: "Temps max d'attente d'apparition du fichier avant erreur.",

    hint_services: "Par défaut, chaque service écrit dans <Dossier racine DL>/<sous-dossier>/ (vous pouvez aussi indiquer un chemin absolu commençant par /).",
    btn_add_service: "+ Ajouter un service",
    th_svc_cat: "Catégorie *arr",
    th_svc_mode: "Mode de récupération",
    th_svc_subpath: "Sous-dossier dans DL (ou chemin /)",
    opt_mode_symlink: "Symlink (instantané)",
    opt_mode_download: "Téléchargement réel (copie locale)",
    btn_remove: "Retirer",

    lbl_del_dl_done: "Supprimer automatiquement le magnet chez le fournisseur dès que le Téléchargement réel est terminé (n'affecte pas les Symlinks)",
    lbl_auto_clean: "Purger automatiquement la liste des téléchargements et les fichiers/symlinks locaux temporaires après import *arr",
    lbl_del_prov: "Supprimer aussi automatiquement le magnet chez le fournisseur lors de la purge après import (y compris pour les Symlinks)",

    lbl_username: "Nom d'utilisateur (Web & Apps *arr — optionnel)",
    hint_username: "Si renseigné, doit correspondre aux identifiants qBittorrent dans Sonarr/Radarr.",
    lbl_password: "Mot de passe (Web & Apps *arr — optionnel)",
    hint_password: "Protège l'accès Web et l'API qBittorrent.",

    lbl_poll_interval: "Intervalle de vérification API (secondes)",
    hint_poll_interval: "Fréquence d'interrogation du fournisseur (défaut : 3.0s).",
    lbl_language: "Langue de l'interface",
    hint_language: "Choisissez le français ou l'anglais pour l'affichage.",

    btn_save_settings: "Enregistrer les paramètres",
    alert_saved: "Paramètres enregistrés et appliqués immédiatement.",
    tip_switch_light: "Passer en mode clair",
    tip_switch_dark: "Passer en mode sombre",
    home_tip: "Accueil (File d'attente)",
  },
  en: {
    // Brand & Header
    brand_title: "PyRDT — Multi-Debrid Symlink & DL Client",
    tab_queue: "Queue",
    tab_settings: "Settings",
    api_test_ok: "API Test OK",
    api_test_err: "API Test Failed",
    api_testing: "Checking API...",
    status_dl: "Downloading ({n})",
    status_sym: "Symlinking ({n})",
    status_unreachable: "PyRDT server unreachable",

    // Toolbar
    sel_count: "{n} selected",
    btn_retry: "Retry",
    btn_pause: "Pause",
    btn_resume: "Resume",
    btn_delete: "Delete",
    btn_purge_completed: "Purge completed",
    select_all: "Select all",

    // Queue Table Headers
    th_id: "ID (AD / Hash)",
    th_name: "Name",
    th_service: "Service / Mode",
    th_status: "Status",
    th_actions: "Actions",
    no_torrents: "No torrents in queue",
    tag_dl: "Real DL",
    tag_sym: "Symlink",

    // Statuses
    st_completed: "Completed",
    st_paused: "Paused",
    st_error: "Error",
    st_rclone_wait: "Waiting for rclone",
    st_copying: "Local copying",
    st_downloading: "Downloading",

    // Delete Modal
    modal_title: "Deletion Options",
    modal_desc: "Remove {n} item(s) from PyRDT list:",
    opt_del_files: "Also delete local files / symbolic links",
    opt_del_ad: "Also delete magnet on provider",
    btn_cancel: "Cancel",
    btn_confirm_delete: "Confirm deletion",

    // Settings Sub-categories
    nav_provider: "Provider & API",
    nav_storage: "Storage & Folders",
    nav_services: "Services (*arr)",
    nav_automation: "Automation",
    nav_security: "Security",
    nav_system: "System & Language",

    // Settings Section Titles
    sec_provider: "1. Debrid Provider & API",
    sec_storage: "2. Folders & Storage",
    sec_services: "3. Services, *arr Categories & Destinations",
    sec_automation: "4. Automation & Cleanup",
    sec_security: "5. Security & Authentication",
    sec_system: "6. Performance & Language",

    // Fields & Labels
    lbl_provider: "Debrid Provider",
    hint_provider: "Choose your debrid service: AllDebrid, Real-Debrid, Premiumize, Debrid-Link, TorBox, or High-Way.",
    lbl_api_key: "API Key / Token",
    hint_api_key: "API Key or secret token generated with your provider.",
    lbl_agent: "Agent Name / User-Agent",
    hint_agent: "Identifier sent to APIs (e.g. PyRDT-Billou).",
    lbl_api_base: "API Base URL",
    hint_api_base: "Automatically filled according to selected provider.",
    btn_test_api: "Test API Connection",
    testing_api: "Testing...",

    lbl_rclone_mount: "Rclone Mount Path (magnets source)",
    hint_rclone_mount: "Folder mounted by rclone (e.g. /mnt/alldebrid/magnets).",
    lbl_dl_dir: "Root Download Folder (DL)",
    hint_dl_dir: "Each service writes to its own subfolder here.",
    lbl_allowed_exts: "Allowed Extensions (comma-separated)",
    hint_allowed_exts: "Allowed video, audio or subtitle extensions.",
    lbl_mount_timeout: "Rclone Mount Timeout (seconds)",
    hint_mount_timeout: "Max wait time for file appearance before error.",

    hint_services: "By default, each service writes to <Root DL folder>/<subfolder>/ (you can also provide an absolute path starting with /).",
    btn_add_service: "+ Add a service",
    th_svc_cat: "*arr Category",
    th_svc_mode: "Retrieval Mode",
    th_svc_subpath: "Subfolder in DL (or / path)",
    opt_mode_symlink: "Symlink (instant)",
    opt_mode_download: "Real download (local copy)",
    btn_remove: "Remove",

    lbl_del_dl_done: "Automatically delete magnet on provider as soon as Real Download completes (does not affect Symlinks)",
    lbl_auto_clean: "Automatically purge downloads list and temporary local files/symlinks after *arr import",
    lbl_del_prov: "Also delete magnet on provider upon post-import purge (including for Symlinks)",

    lbl_username: "Username (Web & *arr Apps — optional)",
    hint_username: "If set, must match qBittorrent credentials in Sonarr/Radarr.",
    lbl_password: "Password (Web & *arr Apps — optional)",
    hint_password: "Protects Web UI access and qBittorrent API.",

    lbl_poll_interval: "API Polling Interval (seconds)",
    hint_poll_interval: "Provider query frequency (default: 3.0s).",
    lbl_language: "Interface Language",
    hint_language: "Choose French or English for display.",

    btn_save_settings: "Save settings",
    alert_saved: "Settings saved and applied immediately.",
    tip_switch_light: "Switch to light mode",
    tip_switch_dark: "Switch to dark mode",
    home_tip: "Home (Queue)",
  }
};

const PROVIDER_METAS = {
  alldebrid: {
    name: "AllDebrid",
    api_base: "https://api.alldebrid.com/v4",
    key_label_fr: "Clé API AllDebrid",
    key_label_en: "AllDebrid API Key",
    key_hint_fr: "Clé générée sur AllDebrid > Apikeys",
    key_hint_en: "Key generated on AllDebrid > Apikeys",
  },
  realdebrid: {
    name: "Real-Debrid",
    api_base: "https://api.real-debrid.com/rest/1.0",
    key_label_fr: "Token API Real-Debrid",
    key_label_en: "Real-Debrid API Token",
    key_hint_fr: "Token secret disponible sur https://real-debrid.com/apitoken",
    key_hint_en: "Secret token available on https://real-debrid.com/apitoken",
  },
  premiumize: {
    name: "Premiumize.me",
    api_base: "https://www.premiumize.me/api",
    key_label_fr: "Clé API Premiumize",
    key_label_en: "Premiumize API Key",
    key_hint_fr: "Clé API disponible sur https://www.premiumize.me/account",
    key_hint_en: "API key available on https://www.premiumize.me/account",
  },
  debridlink: {
    name: "Debrid-Link",
    api_base: "https://debrid-link.com/api/v2",
    key_label_fr: "Clé API Debrid-Link",
    key_label_en: "Debrid-Link API Key",
    key_hint_fr: "Clé API disponible sur https://debrid-link.com/webapp/account",
    key_hint_en: "API key available on https://debrid-link.com/webapp/account",
  },
  torbox: {
    name: "TorBox",
    api_base: "https://api.torbox.app/v1/api",
    key_label_fr: "Clé API TorBox",
    key_label_en: "TorBox API Key",
    key_hint_fr: "Clé API disponible sur https://torbox.app/settings",
    key_hint_en: "API key available on https://torbox.app/settings",
  },
  highway: {
    name: "High-Way.me",
    api_base: "https://cloud.high-way.me/center-api",
    key_label_fr: "API Token High-Way",
    key_label_en: "High-Way API Token",
    key_hint_fr: "Token disponible dans votre espace Download Center > Sitzungen",
    key_hint_en: "Token available in your Download Center > Sitzungen",
  },
};

function onProviderChange(provId) {
  const meta = PROVIDER_METAS[provId] || PROVIDER_METAS['alldebrid'];
  const baseInput = document.getElementById('api_base_input');
  if (baseInput) {
    baseInput.value = meta.api_base;
  }
  const lblKey = document.getElementById('lbl-api-key');
  if (lblKey) {
    lblKey.textContent = currentLang === 'en' ? meta.key_label_en : meta.key_label_fr;
  }
  const hintKey = document.getElementById('hint-api-key');
  if (hintKey) {
    hintKey.textContent = currentLang === 'en' ? meta.key_hint_en : meta.key_hint_fr;
  }
  const testBtn = document.getElementById('btn-test-api');
  if (testBtn) {
    testBtn.textContent = (currentLang === 'en' ? 'Test API ' : "Tester l'API ") + meta.name;
  }
}

let currentTab = 'queue';
let currentLang = localStorage.getItem('pyrdt_lang') || 'fr';
let pendingDeleteHashes = [];
let modalOpen = false;
let isFetching = false;

function t(key, params = {}) {
  const dict = TRANSLATIONS[currentLang] || TRANSLATIONS['fr'];
  let text = dict[key] || TRANSLATIONS['fr'][key] || key;
  for (const [k, v] of Object.entries(params)) {
    text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
  }
  return text;
}

function setLanguage(lang) {
  if (lang !== 'fr' && lang !== 'en') lang = 'fr';
  currentLang = lang;
  localStorage.setItem('pyrdt_lang', lang);
  document.documentElement.lang = lang;

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  const hiddenLangInput = document.getElementById('ui_language');
  if (hiddenLangInput) hiddenLangInput.value = lang;
  const langSelect = document.getElementById('lang-select');
  if (langSelect) langSelect.value = lang;

  // Mise à jour de tous les éléments balisés avec data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    el.textContent = t(key);
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    el.placeholder = t(key);
  });

  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.dataset.i18nTitle;
    el.title = t(key);
  });

  // Mettre à jour le texte du data-attribute pour le responsive
  const thFirst = document.querySelector('thead th:first-child');
  if (thFirst) thFirst.setAttribute('data-text-all', t('select_all'));

  const provSelect = document.getElementById('provider-select');
  if (provSelect) {
    onProviderChange(provSelect.value);
  }

  const themeBtn = document.getElementById('theme-btn');
  if (themeBtn) {
    themeBtn.title = currentTheme === 'light' ? t('tip_switch_dark') : t('tip_switch_light');
  }

  const brandEl = document.querySelector('.brand');
  if (brandEl) {
    brandEl.title = t('home_tip');
  }

  updateSelection();
  refreshQueue();
}

let currentTheme = localStorage.getItem('pyrdt_theme') || 'dark';

function applyTheme(theme) {
  currentTheme = theme === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);
  localStorage.setItem('pyrdt_theme', currentTheme);
  const icon = document.getElementById('theme-icon');
  const btn = document.getElementById('theme-btn');
  if (icon) {
    icon.textContent = currentTheme === 'light' ? '🌙' : '☀️';
  }
  if (btn) {
    btn.title = currentTheme === 'light' ? t('tip_switch_dark') : t('tip_switch_light');
  }
}

function toggleTheme() {
  applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function showTab(tab) {
  currentTab = tab;
  document.getElementById('tab-queue').style.display = tab === 'queue' ? 'block' : 'none';
  document.getElementById('tab-settings').style.display = tab === 'settings' ? 'block' : 'none';
  document.getElementById('btn-queue').classList.toggle('active', tab === 'queue');
  document.getElementById('btn-settings').classList.toggle('active', tab === 'settings');
  if (tab === 'queue') refreshQueue();
}

function showSettingsPage(pageId) {
  const pages = ['alldebrid', 'storage', 'services', 'automation', 'security', 'system'];
  if (!pages.includes(pageId)) pageId = 'alldebrid';
  sessionStorage.setItem('pyrdt_settings_page', pageId);

  pages.forEach(p => {
    const pageEl = document.getElementById('setpage-' + p);
    if (pageEl) pageEl.style.display = p === pageId ? 'block' : 'none';
    const navBtn = document.getElementById('snav-' + p);
    if (navBtn) navBtn.classList.toggle('active', p === pageId);
  });
}

function addServiceRow(svcName = '', svcMode = 'download', svcSubpath = '') {
  const container = document.getElementById('services-list');
  const row = document.createElement('div');
  row.className = 'svc-row';
  const selSym = svcMode !== 'download' ? 'selected' : '';
  const selDl = svcMode === 'download' ? 'selected' : '';

  row.innerHTML = `
    <input type="text" name="service_names" value="${esc(svcName)}" placeholder="${esc(t('th_svc_cat'))}" oninput="if(!this.dataset.edited) this.parentElement.querySelector('[name=service_subpaths]').value = this.value" required>
    <select name="service_modes_list">
      <option value="symlink" ${selSym}>${esc(t('opt_mode_symlink'))}</option>
      <option value="download" ${selDl}>${esc(t('opt_mode_download'))}</option>
    </select>
    <input type="text" name="service_subpaths" value="${esc(svcSubpath)}" placeholder="${esc(t('th_svc_subpath'))}" oninput="this.dataset.edited='1'">
    <button type="button" class="btn-del" onclick="this.parentElement.remove()">${esc(t('btn_remove'))}</button>
  `;
  container.appendChild(row);
}

function updateHeaderStatus(items, apiHealth) {
  const orb = document.getElementById('status-orb');
  const sub = document.getElementById('api-sub');
  if (!orb || !sub) return;

  const activeStates = new Set(['downloading', 'checkingDL', 'copying']);
  const activeItems = (items || []).filter(t => activeStates.has(t.state));
  const activeDl = activeItems.filter(t => t.transfer_mode === 'download');
  const activeSym = activeItems.filter(t => t.transfer_mode !== 'download');

  const apiOk = Boolean(apiHealth && apiHealth.ok);
  const apiBaseLabel = (apiHealth && apiHealth.label) || (apiOk ? t('api_test_ok') : t('api_test_err'));
  const apiDetail = (apiHealth && apiHealth.detail) || '';

  orb.className = 'status-orb';
  sub.className = 'api-sub';
  orb.title = apiDetail;
  sub.title = apiDetail;

  if (activeDl.length > 0) {
    orb.classList.add('dl');
    sub.classList.add('dl');
    sub.textContent = t('status_dl', { n: activeDl.length }) + ' — ' + apiBaseLabel;
  } else if (activeSym.length > 0) {
    orb.classList.add('sym');
    sub.classList.add('sym');
    sub.textContent = t('status_sym', { n: activeSym.length }) + ' — ' + apiBaseLabel;
  } else if (apiOk) {
    orb.classList.add('ok');
    sub.classList.add('ok');
    sub.textContent = apiBaseLabel;
  } else {
    orb.classList.add('err');
    sub.classList.add('err');
    sub.textContent = apiBaseLabel;
  }
}

function getSelectedHashes() {
  return Array.from(document.querySelectorAll('.row-chk:checked')).map(c => c.value);
}

function updateSelection() {
  const selected = getSelectedHashes();
  const total = document.querySelectorAll('.row-chk').length;
  document.getElementById('sel-count').textContent = t('sel_count', { n: selected.length });
  document.getElementById('bulk-retry').disabled = selected.length === 0;
  document.getElementById('bulk-pause').disabled = selected.length === 0;
  document.getElementById('bulk-del').disabled = selected.length === 0;
  document.getElementById('chk-all').checked = total > 0 && selected.length === total;
}

function toggleAll(master) {
  document.querySelectorAll('.row-chk').forEach(c => c.checked = master.checked);
  updateSelection();
}

function copyId(txt) {
  if (navigator.clipboard) navigator.clipboard.writeText(txt);
}

function renderQueue(items) {
  const tbody = document.getElementById('queue-tbody');
  const checkedSet = new Set(getSelectedHashes());

  if (!items || items.length === 0) {
    tbody.innerHTML = `<tr><td colspan='6' style='color:#8b949e;text-align:center'>${esc(t('no_torrents'))}</td></tr>`;
    updateSelection();
    return;
  }

  tbody.innerHTML = items.map(item => {
    const pct = Math.round((Number(item.progress) || 0) * 100);
    const state = item.state || 'downloading';
    const isDl = item.transfer_mode === 'download';
    const modeBadge = isDl
      ? `<span class="tag dl">${esc(t('tag_dl'))}</span>`
      : `<span class="tag sym">${esc(t('tag_sym'))}</span>`;

    let badgeCls = 'run';
    let stateTxt = `${esc(t('st_downloading'))} (${pct}%)`;

    if (state === 'pausedUP' || state === 'stalledUP') {
      badgeCls = 'ok';
      stateTxt = `${esc(t('st_completed'))} (${pct}%)`;
    } else if (state === 'pausedDL') {
      badgeCls = 'pause';
      stateTxt = `${esc(t('st_paused'))} (${pct}%)`;
    } else if (state === 'error') {
      badgeCls = 'err';
      stateTxt = `${esc(t('st_error'))} — ${esc(item.error_msg)}`;
    } else if (state === 'checkingDL') {
      badgeCls = 'run';
      stateTxt = `${esc(t('st_rclone_wait'))} (${pct}%)`;
    } else if (state === 'copying') {
      badgeCls = 'run';
      stateTxt = `${esc(t('st_copying'))} (${pct}%)`;
    }

    const fullId = esc(item.hash);
    const shortId = esc(String(item.hash).slice(0, 8));
    const adId = esc(item.ad_id);
    const isChecked = checkedSet.has(item.hash) ? 'checked' : '';
    const pauseBtn = state === 'pausedDL'
      ? `<button class="btn-sec" onclick="batchAction('resume', ['${fullId}'])">${esc(t('btn_resume'))}</button>`
      : `<button class="btn-warn" onclick="batchAction('pause', ['${fullId}'])">${esc(t('btn_pause'))}</button>`;

    return `<tr>
      <td class="col-chk"><input type="checkbox" class="row-chk" value="${fullId}" ${isChecked} onchange="updateSelection()"></td>
      <td class="mono col-id"><div>#${adId}</div><small title="${fullId}" onclick="copyId('${fullId}')" style="cursor:pointer;color:#8b949e">${shortId} 📋</small></td>
      <td class="col-name">${esc(item.name)}<div style="color:#8b949e;font-size:11px;margin-top:2px;">${esc(item.save_path)}</div></td>
      <td class="col-cat"><span class="tag">${esc(item.category)}</span> ${modeBadge}</td>
      <td class="col-status">
        <span class="badge ${badgeCls}">${stateTxt}</span>
        <div class="pbar"><div class="pbar-fill ${badgeCls}" style="width:${pct}%"></div></div>
      </td>
      <td class="actions col-actions">
        <button class="btn-sec" onclick="batchAction('retry', ['${fullId}'])">${esc(t('btn_retry'))}</button>
        ${pauseBtn}
        <button class="btn-del" onclick="openDeleteModal(['${fullId}'])">${esc(t('btn_delete'))}</button>
      </td>
    </tr>`;
  }).join('');

  updateSelection();
}

async function refreshQueue() {
  if (isFetching || modalOpen) return;
  isFetching = true;
  try {
    const res = await fetch('/api/ui/queue', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      const items = data.items || [];
      updateHeaderStatus(items, data.api_health);
      if (currentTab === 'queue') {
        renderQueue(items);
      }
    }
  } catch (e) {
    updateHeaderStatus([], { ok: false, label: t('api_test_err'), detail: t('status_unreachable') });
  } finally {
    isFetching = false;
  }
}

async function batchAction(action, hashes) {
  if (!hashes.length) return;
  const fd = new FormData();
  fd.append('hashes', hashes.join('|'));
  await fetch('/api/v2/torrents/' + action, { method: 'POST', body: fd });
  await refreshQueue();
}

function batchSelected(action) {
  batchAction(action, getSelectedHashes());
}

function openDeleteModal(hashes) {
  if (!hashes.length) return;
  pendingDeleteHashes = hashes;
  modalOpen = true;
  document.getElementById('del-modal-desc').textContent = t('modal_desc', { n: hashes.length });
  document.getElementById('del-modal').style.display = 'flex';
}

function deleteSelected() {
  openDeleteModal(getSelectedHashes());
}

function closeDeleteModal() {
  modalOpen = false;
  pendingDeleteHashes = [];
  document.getElementById('del-modal').style.display = 'none';
}

async function confirmDelete() {
  if (!pendingDeleteHashes.length) return;
  const delFiles = document.getElementById('opt-del-files').checked ? 'true' : 'false';
  const delAd = document.getElementById('opt-del-ad').checked ? 'true' : 'false';
  const fd = new FormData();
  fd.append('hashes', pendingDeleteHashes.join('|'));
  fd.append('deleteFiles', delFiles);
  fd.append('deleteProvider', delAd);
  await fetch('/api/v2/torrents/delete', { method: 'POST', body: fd });
  closeDeleteModal();
  await refreshQueue();
}

async function testApi() {
  const btn = document.getElementById('btn-test-api');
  const box = document.getElementById('test-result');
  btn.disabled = true;
  btn.textContent = t('testing_api');
  box.className = 'test-box';
  try {
    const fd = new FormData(document.getElementById('settings-form'));
    const res = await fetch('/api/test', { method: 'POST', body: fd });
    const data = await res.json();
    box.textContent = data.message;
    box.className = 'test-box ' + (data.ok ? 'ok' : 'err');
    await refreshQueue();
  } catch (e) {
    box.textContent = t('status_unreachable') + ' : ' + e;
    box.className = 'test-box err';
  } finally {
    btn.disabled = false;
    const provSelect = document.getElementById('provider-select');
    const pId = provSelect ? provSelect.value : 'alldebrid';
    const meta = PROVIDER_METAS[pId] || PROVIDER_METAS['alldebrid'];
    btn.textContent = (currentLang === 'en' ? 'Test API ' : "Tester l'API ") + meta.name;
  }
}

async function purgeCompleted() {
  const res = await fetch('/api/v2/torrents/info', { cache: 'no-store' });
  const list = await res.json();
  const done = list.filter(t => t.state === 'pausedUP' || t.state === 'stalledUP').map(t => t.hash);
  if (!done.length) return;
  const fd = new FormData();
  fd.append('hashes', done.join('|'));
  fd.append('deleteFiles', 'false');
  fd.append('deleteProvider', 'false');
  await fetch('/api/v2/torrents/delete', { method: 'POST', body: fd });
  await refreshQueue();
}

// Initialisation au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
  const savedLang = localStorage.getItem('pyrdt_lang') || document.documentElement.lang || 'fr';
  setLanguage(savedLang);
  applyTheme(currentTheme);

  const urlParams = new URLSearchParams(window.location.search);
  const activeSubPage = sessionStorage.getItem('pyrdt_settings_page') || 'alldebrid';
  showSettingsPage(activeSubPage);

  if (urlParams.has('saved')) {
    showTab('settings');
  }

  setInterval(refreshQueue, 2000);
});

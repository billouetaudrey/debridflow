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
    nav_scanner: "Médiathèque & Liens",
    nav_automation: "Automatisation",
    nav_security: "Sécurité",
    nav_system: "Système & Langue",

    // Settings Section Titles
    sec_provider: "1. Fournisseur & API Debrid",
    sec_storage: "2. Dossiers & Stockage",
    sec_services: "3. Services, Catégories *arr & Destinations",
    sec_scanner_settings: "4. Médiathèque & Surveillance des Liens",
    sec_automation: "5. Automatisation & Nettoyage",
    sec_security: "6. Sécurité & Authentification",
    sec_system: "7. Performances & Langue",

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

    // Scanner & Liens Morts
    tab_scanner: "Médiathèque & Liens",
    sc_title: "🧲 Gestionnaire AllDebrid & Liens Morts Médiathèque",
    sc_last_scan_unknown: "Dernier scan : Inconnu",
    btn_scan_now: "🔄 Scanner la médiathèque & AllDebrid",
    sc_stat_dead: "⚠️ Liens Morts Locaux",
    sc_stat_magnets: "🧲 Total Magnets AD",
    sc_stat_duplicates: "📑 Doublons AD",
    sc_stat_unlinked: "❓ Non Symlinkés",
    sc_stat_links: "🔗 Fichiers Détectés",
    sc_dead_head: "⚠️ Liens Morts dans votre Médiathèque",
    btn_research_all: "⚡ Relancer dans Radarr / Sonarr & Purger",
    btn_clean_all_dead: "🗑️ Supprimer tous les liens morts",
    msg_no_dead_links: "Aucun lien mort détecté dans la médiathèque. Lancez un scan pour vérifier.",
    th_sc_media: "Média Radarr / Sonarr",
    th_sc_deadpath: "Lien symbolique mort",
    th_sc_target: "Cible manquante (Rclone / AD)",
    th_sc_actions: "Actions",
    sc_magnets_head: "🧲 Magnets AllDebrid & Doublons",
    btn_filter_all: "Tous",
    btn_filter_duplicates: "Doublons uniquement",
    btn_filter_dead: "Morts API",
    btn_filter_unlinked: "Non symlinkés",
    ph_search_magnets: "🔍 Filtrer les magnets par titre...",
    btn_expand_all: "↕️ Déplier tout",
    btn_select_visible: "☑ Cocher visibles",
    btn_clean_duplicates: "🧹 Nettoyer doublons",
    btn_delete_checked: "🗑️ Supprimer cochés",
    msg_loading_magnets: "Chargement des magnets...",
    btn_scan_stop: "Interrompre",
    hint_enable_scanner_tab: "Active ou désactive l'accès à l'onglet et au tableau de bord Médiathèque.",
    hint_webhook_info: "À renseigner dans Sonarr/Radarr (Settings > Connect > Webhook, déclencheur : On Download / On Import) pour analyser automatiquement après un téléchargement.",
    sec_arr_integration: "🔗 Intégration Radarr & Sonarr (Relance automatique des liens morts)",
    lbl_enable_scanner_tab: "Afficher l'onglet Médiathèque & Liens dans la barre de navigation",
    lbl_radarr_url: "URL Radarr",
    lbl_radarr_key: "Clé API Radarr",
    lbl_sonarr_url: "URL Sonarr",
    lbl_sonarr_key: "Clé API Sonarr",
    lbl_scan_paths: "Dossiers Médiathèque à analyser (séparés par virgules)",
    hint_scan_paths: "Dossiers scannés pour détecter les symlinks brisés / cibles inexistantes.",
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
    nav_scanner: "Media Library & Links",
    nav_automation: "Automation",
    nav_security: "Security",
    nav_system: "System & Language",

    // Settings Section Titles
    sec_provider: "1. Debrid Provider & API",
    sec_storage: "2. Folders & Storage",
    sec_services: "3. Services, *arr Categories & Destinations",
    sec_scanner_settings: "4. Media Library & Links Monitor",
    sec_automation: "5. Automation & Cleanup",
    sec_security: "6. Security & Authentication",
    sec_system: "7. Performance & Language",

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

    // Scanner & Dead Links
    tab_scanner: "Library & Links",
    sc_title: "🧲 AllDebrid & Dead Links Manager",
    sc_last_scan_unknown: "Last scan: Unknown",
    btn_scan_now: "🔄 Scan library & AllDebrid",
    sc_stat_dead: "⚠️ Local Dead Links",
    sc_stat_magnets: "🧲 Total AD Magnets",
    sc_stat_duplicates: "📑 AD Duplicates",
    sc_stat_unlinked: "❓ Not Symlinked",
    sc_stat_links: "🔗 Detected Files",
    sc_dead_head: "⚠️ Dead Links in Media Library",
    btn_research_all: "⚡ Trigger Search in Radarr / Sonarr & Purge",
    btn_clean_all_dead: "🗑️ Delete all dead links",
    msg_no_dead_links: "No dead links detected in your media library. Run a scan to check.",
    th_sc_media: "Radarr / Sonarr Media",
    th_sc_deadpath: "Dead Symbolic Link",
    th_sc_target: "Missing Target (Rclone / AD)",
    th_sc_actions: "Actions",
    sc_magnets_head: "🧲 AllDebrid Magnets & Duplicates",
    btn_filter_all: "All",
    btn_filter_duplicates: "Duplicates only",
    btn_filter_dead: "API Dead Links",
    btn_filter_unlinked: "Not symlinked",
    ph_search_magnets: "🔍 Filter magnets by title...",
    btn_expand_all: "↕️ Expand all",
    btn_select_visible: "☑ Check visible",
    btn_clean_duplicates: "🧹 Clean duplicates",
    btn_delete_checked: "🗑️ Delete checked",
    msg_loading_magnets: "Loading magnets...",
    btn_scan_stop: "Stop Scan",
    hint_enable_scanner_tab: "Enable or disable access to the Media Library tab and dashboard.",
    hint_webhook_info: "Configure in Sonarr/Radarr (Settings > Connect > Webhook, trigger: On Download / On Import) to automatically scan after a download.",
    sec_arr_integration: "🔗 Radarr & Sonarr Integration (Auto-trigger search on dead links)",
    lbl_enable_scanner_tab: "Show Media Library & Links tab in navigation bar",
    lbl_radarr_url: "Radarr URL",
    lbl_radarr_key: "Radarr API Key",
    lbl_sonarr_url: "Sonarr URL",
    lbl_sonarr_key: "Sonarr API Key",
    lbl_scan_paths: "Media Library scan folders (comma-separated)",
    hint_scan_paths: "Folders scanned to detect broken symlinks / missing targets.",
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
  const btnScanner = document.getElementById('btn-scanner');
  if (tab === 'scanner' && btnScanner && (btnScanner.style.display === 'none' || getComputedStyle(btnScanner).display === 'none')) {
    tab = 'queue';
  }
  currentTab = tab;
  document.getElementById('tab-queue').style.display = tab === 'queue' ? 'block' : 'none';
  document.getElementById('tab-settings').style.display = tab === 'settings' ? 'block' : 'none';
  const tabScanner = document.getElementById('tab-scanner');
  if (tabScanner) tabScanner.style.display = tab === 'scanner' ? 'block' : 'none';

  document.getElementById('btn-queue').classList.toggle('active', tab === 'queue');
  document.getElementById('btn-settings').classList.toggle('active', tab === 'settings');
  if (btnScanner) btnScanner.classList.toggle('active', tab === 'scanner');

  if (tab === 'queue') refreshQueue();
  if (tab === 'scanner') {
    loadScannerData();
    checkScannerStatusOnLoad();
  }
}

function showSettingsPage(pageId) {
  const pages = ['alldebrid', 'storage', 'services', 'scanner', 'automation', 'security', 'system'];
  if (!pages.includes(pageId)) pageId = 'alldebrid';
  sessionStorage.setItem('pyrdt_settings_page', pageId);

  pages.forEach(p => {
    const pageEl = document.getElementById('setpage-' + p);
    if (pageEl) pageEl.style.display = p === pageId ? 'block' : 'none';
    const navBtn = document.getElementById('snav-' + p);
    if (navBtn) navBtn.classList.toggle('active', p === pageId);
  });

  const whEl = document.getElementById('webhook-url-display');
  if (whEl) whEl.textContent = window.location.origin + '/api/scanner/webhook';
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
  setInterval(() => {
    if (currentTab === 'scanner') {
      checkScannerStatusOnLoad();
    }
  }, 4000);
});

// ==========================================
// SCANNER & GESTIONNAIRE DE LIENS MORTS
// ==========================================
let scannerData = null;
let currentMagnetsFilter = 'all';
let isScanning = false;
let allMagnetsExpanded = false;
let scannerPollTimer = null;

function setScanButtonScanning(scanning, percent = 0, stage = '') {
  const btn = document.getElementById('btn-start-scan');
  const btnStop = document.getElementById('btn-stop-scan');
  const spinner = document.getElementById('scan-btn-spinner');
  const text = document.getElementById('scan-btn-text');
  const progContainer = document.getElementById('scanner-progress-container');
  const progStage = document.getElementById('scanner-progress-stage');
  const progPercent = document.getElementById('scanner-progress-percent');
  const progFill = document.getElementById('scanner-progress-fill');

  if (btn) btn.disabled = scanning;
  if (btnStop) btnStop.style.display = scanning ? 'inline-block' : 'none';
  if (spinner) spinner.style.display = scanning ? 'inline' : 'none';
  if (text) text.textContent = scanning ? (percent > 0 ? `Scan en cours... (${percent}%)` : 'Scan en cours...') : t('btn_scan_now');

  if (progContainer) {
    if (scanning) {
      progContainer.style.display = 'block';
      if (progStage) progStage.textContent = stage || 'Démarrage du scan...';
      if (progPercent) progPercent.textContent = (percent || 0) + '%';
      if (progFill) progFill.style.width = (percent || 0) + '%';
    } else {
      if (progPercent) progPercent.textContent = '100%';
      if (progFill) progFill.style.width = '100%';
      if (progStage) progStage.textContent = 'Scan terminé avec succès !';
      setTimeout(() => {
        if (!isScanning) progContainer.style.display = 'none';
      }, 1500);
    }
  }
}

async function triggerScannerScan() {
  setScanButtonScanning(true, 5, 'Démarrage du scan...');
  try {
    await fetch('/api/scanner/start?force=true', { method: 'POST' });
    isScanning = true;
    pollScannerStatus();
  } catch (err) {
    alert('Erreur lors du lancement du scan : ' + err);
    setScanButtonScanning(false);
  }
}

async function stopScannerScan() {
  const btnStop = document.getElementById('btn-stop-scan');
  if (btnStop) {
    btnStop.disabled = true;
    btnStop.innerHTML = '<span>⏳ </span>' + (i18n[currentLang]?.btn_scan_stop || 'Interrompre');
  }
  try {
    await fetch('/api/scanner/stop', { method: 'POST' });
    isScanning = false;
    setScanButtonScanning(false);
    if (scannerPollTimer) clearTimeout(scannerPollTimer);
    const progStage = document.getElementById('scanner-progress-stage');
    if (progStage) progStage.textContent = 'Scan interrompu par l\'utilisateur.';
    const progContainer = document.getElementById('scanner-progress-container');
    setTimeout(() => {
      if (!isScanning && progContainer) progContainer.style.display = 'none';
    }, 2000);
    await loadScannerData();
  } catch (err) {
    alert('Erreur lors de l\'interruption du scan : ' + err);
  } finally {
    if (btnStop) {
      btnStop.disabled = false;
      btnStop.innerHTML = '<span>⏹️ </span>' + (i18n[currentLang]?.btn_scan_stop || 'Interrompre');
    }
  }
}

async function pollScannerStatus() {
  if (scannerPollTimer) clearTimeout(scannerPollTimer);
  try {
    const res = await fetch('/api/scanner/status');
    const data = await res.json();
    if (data.status === 'scanning') {
      isScanning = true;
      const prog = data.progress || {};
      const pct = prog.percent || 0;
      const stage = prog.stage || 'Scan en cours...';
      setScanButtonScanning(true, pct, stage);
      scannerPollTimer = setTimeout(pollScannerStatus, 1000);
    } else {
      isScanning = false;
      setScanButtonScanning(false);
      await loadScannerData();
    }
  } catch (e) {
    scannerPollTimer = setTimeout(pollScannerStatus, 2000);
  }
}

async function checkScannerStatusOnLoad() {
  try {
    const res = await fetch('/api/scanner/status');
    const data = await res.json();
    if (data.status === 'scanning') {
      isScanning = true;
      const prog = data.progress || {};
      setScanButtonScanning(true, prog.percent || 0, prog.stage || '');
      pollScannerStatus();
    } else {
      if (isScanning) {
        isScanning = false;
        setScanButtonScanning(false);
        await loadScannerData();
      }
    }
  } catch (e) {}
}

async function loadScannerData() {
  try {
    const res = await fetch('/api/scanner/data');
    scannerData = await res.json();
    renderScannerView();
  } catch (err) {
    console.error('Erreur chargement données scanner :', err);
  }
}

function renderScannerView() {
  if (!scannerData) return;
  const stats = scannerData.stats || {};

  // Compteurs statistiques
  const deadCount = (scannerData.dead_symlinks || []).length;
  const elDead = document.getElementById('sc-val-dead');
  if (elDead) elDead.textContent = deadCount;
  const elMags = document.getElementById('sc-val-magnets');
  if (elMags) elMags.textContent = stats.total_magnets || 0;
  const elDups = document.getElementById('sc-val-duplicates');
  if (elDups) elDups.textContent = stats.duplicates || 0;
  const elUnlinked = document.getElementById('sc-val-unlinked');
  if (elUnlinked) elUnlinked.textContent = stats.unlinked || 0;
  const elLinks = document.getElementById('sc-val-links');
  if (elLinks) elLinks.textContent = stats.local_links || 0;

  const elBadgeCount = document.getElementById('dead-links-badge-count');
  if (elBadgeCount) elBadgeCount.textContent = deadCount;

  // Date du dernier scan
  const lastTimeEl = document.getElementById('scan-last-time');
  if (lastTimeEl && scannerData.last_update) {
    const d = new Date(scannerData.last_update * 1000);
    lastTimeEl.textContent = `Dernier scan : ${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
  }

  // Rendu des Liens Morts
  renderDeadLinks(scannerData.dead_symlinks || []);

  // Rendu de la liste des Magnets
  renderMagnetsList(scannerData.grouped_magnets || {});
}

function renderDeadLinks(deadList) {
  const table = document.getElementById('dead-links-table');
  const tbody = document.getElementById('dead-links-tbody');
  const emptyMsg = document.getElementById('no-dead-links-msg');
  const btnResearchAll = document.getElementById('btn-research-all');
  const btnCleanAll = document.getElementById('btn-clean-all-dead');

  if (!deadList || deadList.length === 0) {
    if (table) table.style.display = 'none';
    if (emptyMsg) emptyMsg.style.display = 'block';
    if (btnResearchAll) btnResearchAll.style.display = 'none';
    if (btnCleanAll) btnCleanAll.style.display = 'none';
    return;
  }

  if (table) table.style.display = 'table';
  if (emptyMsg) emptyMsg.style.display = 'none';
  if (btnResearchAll) btnResearchAll.style.display = 'inline-block';
  if (btnCleanAll) btnCleanAll.style.display = 'inline-block';

  tbody.innerHTML = deadList.map(item => {
    let mediaBadge = '<span class="badge-tag unlinked">❓ Non identifié</span>';
    let researchBtn = '';

    if (item.media_type === 'radarr' && item.media_id) {
      mediaBadge = `<span class="badge-tag radarr">🎬 Radarr</span> <strong>${esc(item.media_title || item.filename)}</strong>`;
      researchBtn = `<button type="button" class="btn-sec" style="color:#f5a623;border-color:#f5a623;" onclick="researchDeadLink('radarr', ${item.media_id}, '${esc(item.path)}')">🔍 Relancer Radarr</button>`;
    } else if (item.media_type === 'sonarr' && item.media_id) {
      mediaBadge = `<span class="badge-tag sonarr">📺 Sonarr</span> <strong>${esc(item.media_title || item.filename)}</strong>`;
      researchBtn = `<button type="button" class="btn-sec" style="color:#58a6ff;border-color:#58a6ff;" onclick="researchDeadLink('sonarr', ${item.media_id}, '${esc(item.path)}')">🔍 Relancer Sonarr</button>`;
    }

    return `<tr>
      <td>${mediaBadge}</td>
      <td style="font-family:monospace;font-size:12px;word-break:break-all;">${esc(item.path)}</td>
      <td style="font-family:monospace;font-size:11px;color:#f85149;word-break:break-all;">${esc(item.target || 'Cible inexistante')}</td>
      <td style="display:flex;gap:6px;align-items:center;">
        ${researchBtn}
        <button type="button" class="btn-del" onclick="cleanDeadSymlink('${esc(item.path)}')">🗑️ Purger</button>
      </td>
    </tr>`;
  }).join('');
}

async function researchDeadLink(mediaType, mediaId, path) {
  if (!confirm(`Relancer une recherche dans ${mediaType.toUpperCase()} et purger le lien mort local ?`)) return;
  try {
    const res = await fetch('/api/scanner/research', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ media_type: mediaType, media_id: mediaId, dead_path: path })
    });
    const data = await res.json();
    if (data.status === 'success') {
      alert(`Recherche relancée avec succès dans ${mediaType.toUpperCase()} !`);
      loadScannerData();
    } else {
      alert(`Erreur : ${data.message}`);
    }
  } catch (e) {
    alert('Erreur réseau lors de la relance : ' + e);
  }
}

async function cleanDeadSymlink(path) {
  const item = (scannerData.dead_symlinks || []).find(d => d.path === path);
  const mediaType = item && item.media_type && item.media_type !== 'unknown' ? item.media_type.toUpperCase() : null;
  const mediaTitle = item && item.media_title ? ` (${item.media_title})` : '';

  if (!confirm(`Supprimer définitivement ce lien symbolique mort sur le disque ?`)) return;

  let deleteFromArr = false;
  if (mediaType) {
    deleteFromArr = confirm(
      `Ce média est associé à ${mediaType}${mediaTitle}.\n\n` +
      `Voulez-vous ÉGALEMENT supprimer ce titre de votre bibliothèque ${mediaType} ?`
    );
  }

  try {
    const res = await fetch('/api/scanner/clean_dead_symlinks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths: [path], delete_from_arr: deleteFromArr })
    });
    const data = await res.json();
    let msg = `${data.deleted} lien(s) supprimé(s) sur le disque.`;
    if (data.deleted_arr > 0) {
      msg += `\n${data.deleted_arr} élément(s) supprimé(s) dans ${mediaType || 'Radarr/Sonarr'}.`;
    }
    alert(msg);
    loadScannerData();
  } catch (e) {
    alert('Erreur : ' + e);
  }
}

async function researchAllDeadLinks() {
  const matched = (scannerData.dead_symlinks || []).filter(d => d.media_type === 'radarr' || d.media_type === 'sonarr');
  if (matched.length === 0) return alert('Aucun lien mort associé à Radarr ou Sonarr.');
  if (!confirm(`Voulez-vous relancer la recherche dans Radarr / Sonarr pour les ${matched.length} médias détectés et purger les liens morts ?`)) return;

  const btn = document.getElementById('btn-research-all');
  if (btn) { btn.disabled = true; btn.textContent = 'Traitement en cours...'; }

  try {
    const res = await fetch('/api/scanner/research_all_dead', { method: 'POST' });
    const data = await res.json();
    alert(data.message || `${data.count} recherche(s) relancée(s) !`);
    loadScannerData();
  } catch (e) {
    alert('Erreur : ' + e);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = t('btn_research_all'); }
  }
}

async function cleanAllDeadSymlinks() {
  const total = (scannerData.dead_symlinks || []).length;
  if (total === 0) return alert('Aucun lien mort à supprimer.');
  if (!confirm(`Supprimer l'intégralité des ${total} liens morts détectés sur le disque ?`)) return;

  const arrItems = (scannerData.dead_symlinks || []).filter(d => d.media_type === 'radarr' || d.media_type === 'sonarr');
  let deleteFromArr = false;
  if (arrItems.length > 0) {
    deleteFromArr = confirm(
      `${arrItems.length} des liens morts sont associés à Radarr ou Sonarr.\n\n` +
      `Voulez-vous ÉGALEMENT supprimer ces médias de votre bibliothèque Radarr / Sonarr ?`
    );
  }

  try {
    const res = await fetch('/api/scanner/clean_dead_symlinks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delete_from_arr: deleteFromArr })
    });
    const data = await res.json();
    let msg = `${data.deleted} lien(s) mort(s) purgé(s) sur le disque !`;
    if (data.deleted_arr > 0) {
      msg += `\n${data.deleted_arr} média(s) supprimé(s) dans Radarr / Sonarr.`;
    }
    alert(msg);
    loadScannerData();
  } catch (e) {
    alert('Erreur : ' + e);
  }
}

function formatSize(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + units[i];
}

function renderMagnetsList(grouped) {
  const container = document.getElementById('magnets-list-container');
  const groupKeys = Object.keys(grouped);

  if (groupKeys.length === 0) {
    container.innerHTML = `<div style="color:var(--text-muted);text-align:center;padding:25px;">Aucun magnet trouvé. Lancez un scan pour actualiser.</div>`;
    return;
  }

  let html = '';
  groupKeys.forEach((normTitle, gIdx) => {
    const mags = grouped[normTitle];
    const isSingle = mags.length === 1;
    const groupId = 'group-' + gIdx;

    if (isSingle) {
      const mag = mags[0];
      const localBadge = mag.is_local ? `<span class="badge-tag local">🔗 Symlinké</span>` : `<span class="badge-tag unlinked">Non symlinké</span>`;
      const deadBadge = mag.is_dead ? `<span class="badge-tag dead">⚠️ Mort API</span>` : '';

      html += `<div class="mag-group sc-mag-card" id="mag-single-${mag.id}" data-title="${esc(normTitle.toLowerCase())} ${esc(mag.name.toLowerCase())}" data-dead="${mag.is_dead ? '1':'0'}" data-local="${mag.is_local ? '1':'0'}" data-dup="0">
        <div class="mag-item" data-dead="${mag.is_dead ? '1':'0'}" data-local="${mag.is_local ? '1':'0'}">
          <div class="mag-info-left">
            <input type="checkbox" class="sc-mag-chk" value="${mag.id}" data-name="${esc(mag.name)}">
            <div>
              <div style="font-weight:600;font-size:13px;word-break:break-word;overflow-wrap:anywhere;">${esc(mag.name)}</div>
              <div class="mag-meta">
                <span>ID: #${mag.id}</span>
                <span>Taille: ${formatSize(mag.size)}</span>
                <span>Statut: ${mag.statusCode}</span>
                ${localBadge} ${deadBadge}
              </div>
            </div>
          </div>
          <div class="mag-actions">
            <button type="button" class="btn-del" onclick="deleteSingleMagnet(${mag.id}, '${esc(mag.name)}')">Supprimer</button>
          </div>
        </div>
      </div>`;
    } else {
      let childrenHtml = '';
      mags.forEach((mag, idx) => {
        const isBest = idx === 0 ? `<span style="color:#58a6ff;font-size:11px;">(Conservé par défaut)</span>` : '';
        const localBadge = mag.is_local ? `<span class="badge-tag local">🔗 Symlinké</span>` : `<span class="badge-tag unlinked">Non symlinké</span>`;
        const deadBadge = mag.is_dead ? `<span class="badge-tag dead">⚠️ Mort API</span>` : '';

        childrenHtml += `<div class="mag-item sc-mag-child" id="mag-child-${mag.id}" data-dead="${mag.is_dead ? '1':'0'}" data-local="${mag.is_local ? '1':'0'}">
          <div class="mag-info-left">
            <input type="checkbox" class="sc-mag-chk" value="${mag.id}" data-name="${esc(mag.name)}" ${idx > 0 ? 'data-isdup="1"' : ''}>
            <div>
              <div style="font-weight:500;font-size:13px;word-break:break-word;overflow-wrap:anywhere;">${esc(mag.name)} ${isBest}</div>
              <div class="mag-meta">
                <span>ID: #${mag.id}</span>
                <span>Taille: ${formatSize(mag.size)}</span>
                <span>Statut: ${mag.statusCode}</span>
                ${localBadge} ${deadBadge}
              </div>
            </div>
          </div>
          <div class="mag-actions">
            <button type="button" class="btn-del" onclick="deleteSingleMagnet(${mag.id}, '${esc(mag.name)}')">Supprimer</button>
          </div>
        </div>`;
      });

      html += `<div class="mag-group sc-mag-card" id="${groupId}" data-title="${esc(normTitle.toLowerCase())}" data-dup="1">
        <div class="mag-group-header" onclick="document.getElementById('${groupId}').classList.toggle('open')">
          <div class="mag-group-title">
            <span class="mag-chevron">▶</span>
            <span>${esc(normTitle)}</span>
            <span class="badge" style="background:#d29922;color:#121212;">${mags.length} versions</span>
          </div>
        </div>
        <div class="mag-children">${childrenHtml}</div>
      </div>`;
    }
  });

  container.innerHTML = html;
  filterMagnetsDisplay();
}

function setMagnetsFilter(filter) {
  currentMagnetsFilter = filter;
  document.querySelectorAll('.sc-filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
  filterMagnetsDisplay();
}

function filterMagnetsDisplay() {
  const search = (document.getElementById('magnet-search-input')?.value || '').toLowerCase().trim();

  document.querySelectorAll('.sc-mag-card').forEach(card => {
    const title = card.getAttribute('data-title') || '';
    const isDup = card.getAttribute('data-dup') === '1';
    let matchFilter = true;

    if (currentMagnetsFilter === 'duplicates') {
      matchFilter = isDup;
    } else if (currentMagnetsFilter === 'dead') {
      const hasDead = card.getAttribute('data-dead') === '1' || card.querySelector('[data-dead="1"]') !== null;
      matchFilter = hasDead;
    } else if (currentMagnetsFilter === 'unlinked') {
      const hasUnlinked = card.getAttribute('data-local') === '0' || card.querySelector('[data-local="0"]') !== null;
      matchFilter = hasUnlinked;
    }

    const matchSearch = !search || title.includes(search);
    const visible = matchFilter && matchSearch;
    card.style.display = visible ? 'block' : 'none';

    if (visible && isDup && (currentMagnetsFilter === 'dead' || currentMagnetsFilter === 'unlinked')) {
      card.classList.add('open');
    }
  });
}

function toggleExpandAllGroups() {
  allMagnetsExpanded = !allMagnetsExpanded;
  document.querySelectorAll('.mag-group').forEach(g => {
    g.classList.toggle('open', allMagnetsExpanded);
  });
  const btn = document.getElementById('btn-expand-groups');
  if (btn) btn.textContent = allMagnetsExpanded ? '↕️ Plier tout' : '↕️ Déplier tout';
}

function toggleSelectAllVisibleMagnets() {
  const visibleChks = Array.from(document.querySelectorAll('.sc-mag-chk')).filter(chk => {
    const card = chk.closest('.sc-mag-card');
    return card && card.style.display !== 'none';
  });
  if (visibleChks.length === 0) return;
  const allChecked = visibleChks.every(c => c.checked);
  visibleChks.forEach(c => c.checked = !allChecked);
  const btn = document.getElementById('btn-select-all-mags');
  if (btn) btn.textContent = allChecked ? '☑ Cocher visibles' : '☐ Décocher tout';
}

async function deleteSingleMagnet(id, name) {
  if (!confirm(`Supprimer ce magnet sur AllDebrid et purger ses liens locaux associés ?\n\n${name}`)) return;
  try {
    const res = await fetch('/api/scanner/delete_magnets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [{ id, name }] })
    });
    const data = await res.json();
    if (data.status === 'success') {
      const singleEl = document.getElementById(`mag-single-${id}`);
      if (singleEl) singleEl.remove();
      const childEl = document.getElementById(`mag-child-${id}`);
      if (childEl) childEl.remove();
      await loadScannerData();
      pollScannerStatus();
    } else {
      alert(`Erreur : ${data.message || 'Échec de la suppression'}`);
    }
  } catch (e) {
    alert('Erreur lors de la suppression : ' + e);
  }
}

async function deleteSelectedMagnets() {
  const checked = Array.from(document.querySelectorAll('.sc-mag-chk:checked')).map(c => ({
    id: c.value,
    name: c.dataset.name || ''
  }));
  if (checked.length === 0) return alert('Aucun magnet sélectionné.');
  if (!confirm(`Supprimer définitivement ${checked.length} magnet(s) sélectionné(s) sur AllDebrid et leurs symlinks locaux ?`)) return;

  const btn = document.getElementById('btn-del-selected-mags');
  if (btn) { btn.disabled = true; btn.textContent = 'Suppression...'; }

  try {
    const res = await fetch('/api/scanner/delete_magnets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: checked })
    });
    const data = await res.json();
    if (data.status === 'success') {
      checked.forEach(item => {
        const singleEl = document.getElementById(`mag-single-${item.id}`);
        if (singleEl) singleEl.remove();
        const childEl = document.getElementById(`mag-child-${item.id}`);
        if (childEl) childEl.remove();
      });
      await loadScannerData();
      pollScannerStatus();
    } else {
      alert(`Erreur : ${data.message || 'Échec de la suppression'}`);
    }
  } catch (e) {
    alert('Erreur : ' + e);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = t('btn_delete_checked'); }
  }
}

async function cleanAllDuplicateMagnets() {
  const duplicates = [];
  document.querySelectorAll('.sc-mag-card[data-dup="1"]').forEach(card => {
    const children = card.querySelectorAll('.sc-mag-child');
    for (let i = 1; i < children.length; i++) {
      const chk = children[i].querySelector('.sc-mag-chk');
      if (chk) duplicates.push({ id: chk.value, name: chk.dataset.name || '' });
    }
  });

  if (duplicates.length === 0) return alert('Aucun doublon AllDebrid détecté à nettoyer.');
  if (!confirm(`Supprimer ${duplicates.length} doublons inutiles sur AllDebrid ?\n\nLe meilleur fichier de chaque groupe sera conservé intact.`)) return;

  try {
    const res = await fetch('/api/scanner/delete_magnets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: duplicates })
    });
    const data = await res.json();
    if (data.status === 'success') {
      await loadScannerData();
      pollScannerStatus();
    } else {
      alert(`Erreur : ${data.message || 'Échec du nettoyage'}`);
    }
  } catch (e) {
    alert('Erreur : ' + e);
  }
}


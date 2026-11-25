// ==========================================
// ASSISTANT ONBOARDING (PREMIER LANCEMENT)
// ==========================================
let currentObStep = 1;

function addObArrInstanceRow(type = 'radarr', name = '', url = '', apiKey = '') {
  const container = document.getElementById('ob-arr-instances-list');
  if (!container) return;
  const row = document.createElement('div');
  row.className = 'ob-arr-row arr-row';

  const defaults = {
    radarr: { name: 'Radarr', url: 'http://127.0.0.1:7878' },
    sonarr: { name: 'Sonarr', url: 'http://127.0.0.1:8989' },
    whisparr: { name: 'Whisparr', url: 'http://127.0.0.1:6969' },
    lidarr: { name: 'Lidarr', url: 'http://127.0.0.1:8686' },
    readarr: { name: 'Readarr', url: 'http://127.0.0.1:8787' }
  };

  const curType = (type || 'radarr').toLowerCase();
  const curName = name || (defaults[curType] ? defaults[curType].name : 'Radarr');
  const curUrl = url || (defaults[curType] ? defaults[curType].url : 'http://127.0.0.1:7878');

  row.innerHTML = `
    <select class="ob-arr-type" onchange="onObArrTypeChange(this)">
      <option value="radarr" ${curType === 'radarr' ? 'selected' : ''}>🎬 Radarr</option>
      <option value="sonarr" ${curType === 'sonarr' ? 'selected' : ''}>📺 Sonarr</option>
      <option value="whisparr" ${curType === 'whisparr' ? 'selected' : ''}>🔞 Whisparr</option>
      <option value="lidarr" ${curType === 'lidarr' ? 'selected' : ''}>🎵 Lidarr</option>
      <option value="readarr" ${curType === 'readarr' ? 'selected' : ''}>📚 Readarr</option>
    </select>
    <input type="text" class="ob-arr-name" value="${esc(curName)}" placeholder="Nom" required>
    <input type="text" class="ob-arr-url" value="${esc(curUrl)}" placeholder="http://127.0.0.1:7878" required>
    <input type="password" class="ob-arr-key" value="${esc(apiKey)}" placeholder="Clé API">
    <button type="button" class="btn-del" onclick="this.parentElement.remove()" style="padding:7px 10px;" title="Retirer">✕</button>
  `;
  container.appendChild(row);
}

function onObArrTypeChange(selectEl) {
  const row = selectEl.parentElement;
  const nameInput = row.querySelector('.ob-arr-name');
  const urlInput = row.querySelector('.ob-arr-url');
  const type = selectEl.value;
  const defaults = {
    radarr: { name: 'Radarr', url: 'http://127.0.0.1:7878' },
    sonarr: { name: 'Sonarr', url: 'http://127.0.0.1:8989' },
    whisparr: { name: 'Whisparr', url: 'http://127.0.0.1:6969' },
    lidarr: { name: 'Lidarr', url: 'http://127.0.0.1:8686' },
    readarr: { name: 'Readarr', url: 'http://127.0.0.1:8787' }
  };
  if (defaults[type]) {
    if (!nameInput.dataset.edited || !nameInput.value) nameInput.value = defaults[type].name;
    if (!urlInput.dataset.edited || !urlInput.value) urlInput.value = defaults[type].url;
  }
}

function openOnboarding(force = false) {
  const modal = document.getElementById('onboarding-modal');
  if (!modal) return;

  const getVal = (name, fallback = '') => {
    const el = document.querySelector(`[name="${name}"]`);
    return el ? el.value : fallback;
  };
  const getChk = (id) => {
    const el = document.getElementById(id);
    return el ? el.checked : false;
  };

  // Step 1: Styles & Affichage
  const obTheme = document.getElementById('ob_theme');
  if (obTheme) obTheme.value = currentTheme;
  const obLang = document.getElementById('ob_lang');
  if (obLang) obLang.value = currentLang;
  const obHideDl = document.getElementById('ob_hide_last_download_name');
  if (obHideDl) obHideDl.checked = getChk('hide_last_download_name');
  const obScanner = document.getElementById('ob_enable_scanner');
  if (obScanner) obScanner.checked = getChk('chk_enable_scanner');

  // Step 2: Fournisseur
  const provEl = document.getElementById('provider-select');
  const obProv = document.getElementById('ob_provider');
  if (obProv && provEl) {
    obProv.value = provEl.value || 'alldebrid';
    onObProviderChange(obProv.value);
  }
  const obApiKey = document.getElementById('ob_api_key');
  if (obApiKey) obApiKey.value = getVal('api_key');
  const obAgent = document.getElementById('ob_agent');
  if (obAgent) obAgent.value = getVal('agent', 'OmniSym-Billou');
  const obApiBase = document.getElementById('ob_api_base');
  if (obApiBase) obApiBase.value = getVal('api_base');

  // Step 3: Stockage
  const obRclone = document.getElementById('ob_rclone_mount_dir');
  if (obRclone) obRclone.value = getVal('rclone_mount_dir', '/mnt/alldebrid/magnets');
  const obDl = document.getElementById('ob_download_base_dir');
  if (obDl) obDl.value = getVal('download_base_dir', '/mnt/virtual/Medias/DL');
  const obMountTimeout = document.getElementById('ob_mount_timeout');
  if (obMountTimeout) obMountTimeout.value = getVal('mount_timeout', '60');
  const obSpeedLimit = document.getElementById('ob_download_speed_limit');
  if (obSpeedLimit) obSpeedLimit.value = getVal('download_speed_limit', '0');
  const obConcurrent = document.getElementById('ob_max_concurrent_downloads');
  if (obConcurrent) obConcurrent.value = getVal('max_concurrent_downloads', '3');
  const obPoll = document.getElementById('ob_poll_interval');
  if (obPoll) obPoll.value = getVal('poll_interval', '3.0');
  const obExts = document.getElementById('ob_allowed_exts');
  if (obExts) obExts.value = getVal('allowed_exts', '.mkv,.mp4,.avi,.mov,.wmv,.m4v,.ts,.webm,.srt,.ass,.ssa,.sub,.vtt');
  const obIgnored = document.getElementById('ob_ignored_exts');
  if (obIgnored) obIgnored.value = getVal('ignored_exts', '.nfo,.jpg,.jpeg,.png,.txt,.exe,.html,.url,.lnk,.website');

  // Step 4: Services
  const obSvcContainer = document.getElementById('ob-services-list');
  if (obSvcContainer) {
    obSvcContainer.innerHTML = '';
    const mainRows = document.querySelectorAll('#services-list .svc-row');
    if (mainRows.length > 0) {
      mainRows.forEach(row => {
        const nameInput = row.querySelector('[name="service_names"]');
        const modeSelect = row.querySelector('[name="service_modes_list"]');
        const subInput = row.querySelector('[name="service_subpaths"]');
        addObServiceRow(
          nameInput ? nameInput.value : '',
          modeSelect ? modeSelect.value : 'download',
          subInput ? subInput.value : ''
        );
      });
    } else {
      addObServiceRow('tv-sonarr', 'symlink', 'tv-sonarr');
      addObServiceRow('radarr', 'symlink', 'radarr');
      addObServiceRow('tv-whisparr', 'download', 'tv-whisparr');
      addObServiceRow('torrent-direct', 'download', 'Torrent-Direct');
    }
  }

  // Step 5: Automatisation & Sécurité
  const obDelDl = document.getElementById('ob_del_dl_done');
  if (obDelDl) obDelDl.checked = getChk('del_dl_done');
  const obAutoClean = document.getElementById('ob_auto_clean');
  if (obAutoClean) obAutoClean.checked = getChk('auto_clean');
  const obDelProv = document.getElementById('ob_del_prov');
  if (obDelProv) obDelProv.checked = getChk('del_prov');
  const obUser = document.getElementById('ob_username');
  if (obUser) obUser.value = getVal('username');
  const obPass = document.getElementById('ob_password');
  if (obPass) obPass.value = getVal('password');

  // Step 6: Médiathèque & Notifications
  const obScanList = document.getElementById('ob-scan-paths-list');
  if (obScanList) {
    obScanList.innerHTML = '';
    const mainPaths = Array.from(document.querySelectorAll('#scan-paths-list input[name="media_scan_paths"]')).map(i => i.value.trim()).filter(Boolean);
    if (mainPaths.length > 0) {
      mainPaths.forEach(p => addObScanPathRow(p));
    } else {
      addObScanPathRow('/mnt/virtual/Medias/Films');
      addObScanPathRow('/mnt/virtual/Medias/Series');
    }
  }

  const obArrContainer = document.getElementById('ob-arr-instances-list');
  if (obArrContainer) {
    obArrContainer.innerHTML = '';
    const mainArrRows = document.querySelectorAll('#arr-instances-list .arr-row');
    if (mainArrRows.length > 0) {
      mainArrRows.forEach(row => {
        const typeSelect = row.querySelector('[name="arr_types"]');
        const nameInput = row.querySelector('[name="arr_names"]');
        const urlInput = row.querySelector('[name="arr_urls"]');
        const keyInput = row.querySelector('[name="arr_api_keys"]');
        addObArrInstanceRow(
          typeSelect ? typeSelect.value : 'radarr',
          nameInput ? nameInput.value : 'Radarr',
          urlInput ? urlInput.value : 'http://127.0.0.1:7878',
          keyInput ? keyInput.value : ''
        );
      });
    } else {
      addObArrInstanceRow('radarr', 'Radarr', 'http://127.0.0.1:7878', '');
      addObArrInstanceRow('sonarr', 'Sonarr', 'http://127.0.0.1:8989', '');
    }
  }

  const obTgEnabled = document.getElementById('ob_telegram_enabled');
  if (obTgEnabled) {
    obTgEnabled.checked = getChk('telegram_enabled');
    toggleObTelegramOptions(obTgEnabled.checked);
  }
  const obTgBot = document.getElementById('ob_telegram_bot_token');
  if (obTgBot) obTgBot.value = getVal('telegram_bot_token');
  const obTgChat = document.getElementById('ob_telegram_chat_id');
  if (obTgChat) obTgChat.value = getVal('telegram_chat_id');

  showObStep(1);
  modal.style.display = 'flex';
}

function closeOnboarding() {
  const modal = document.getElementById('onboarding-modal');
  if (modal) modal.style.display = 'none';
}

function showObStep(step) {
  if (step < 1) step = 1;
  if (step > 7) step = 7;
  currentObStep = step;

  // Pages
  for (let i = 1; i <= 7; i++) {
    const page = document.getElementById(`ob-page-${i}`);
    if (page) page.classList.toggle('active', i === step);
    const navBtn = document.getElementById(`ob-nav-${i}`);
    if (navBtn) {
      navBtn.classList.toggle('active', i === step);
      navBtn.classList.toggle('completed', i < step);
    }
  }

  // Progress bar
  const progressBar = document.getElementById('ob-progress-bar');
  if (progressBar) {
    progressBar.style.width = ((step / 7) * 100) + '%';
  }

  // Buttons
  const btnPrev = document.getElementById('ob-btn-prev');
  if (btnPrev) btnPrev.style.display = step > 1 ? 'inline-block' : 'none';

  const btnNext = document.getElementById('ob-btn-next');
  if (btnNext) btnNext.style.display = step < 7 ? 'inline-block' : 'none';

  const btnFinish = document.getElementById('ob-btn-finish');
  if (btnFinish) btnFinish.style.display = step === 7 ? 'inline-block' : 'none';

  if (step === 7) {
    updateObRecap();
  }
}

function nextObStep() {
  showObStep(currentObStep + 1);
}

function prevObStep() {
  showObStep(currentObStep - 1);
}

function onObProviderChange(pId) {
  const meta = PROVIDER_METAS[pId] || PROVIDER_METAS['alldebrid'];
  const lbl = document.getElementById('ob-key-label');
  const hint = document.getElementById('ob-key-hint');
  const baseInput = document.getElementById('ob_api_base');
  const btnTest = document.getElementById('ob-btn-test-api');

  if (lbl) lbl.textContent = currentLang === 'en' ? meta.key_label_en : meta.key_label_fr;
  if (hint) hint.textContent = currentLang === 'en' ? meta.key_hint_en : meta.key_hint_fr;
  if (baseInput) baseInput.value = meta.api_base;
  if (btnTest) btnTest.textContent = (currentLang === 'en' ? 'Test API ' : "Tester l'API ") + meta.name;
}

function addObServiceRow(svcName = '', svcMode = 'download', svcSubpath = '') {
  const container = document.getElementById('ob-services-list');
  if (!container) return;
  const row = document.createElement('div');
  row.className = 'svc-row';
  const selSym = svcMode !== 'download' ? 'selected' : '';
  const selDl = svcMode === 'download' ? 'selected' : '';

  row.innerHTML = `
    <input type="text" class="ob-svc-name" value="${esc(svcName)}" placeholder="${esc(t('th_svc_cat'))}" oninput="if(!this.dataset.edited) this.parentElement.querySelector('.ob-svc-sub').value = this.value" required>
    <select class="ob-svc-mode">
      <option value="symlink" ${selSym}>${esc(t('opt_mode_symlink'))}</option>
      <option value="download" ${selDl}>${esc(t('opt_mode_download'))}</option>
    </select>
    <input type="text" class="ob-svc-sub" value="${esc(svcSubpath || svcName)}" placeholder="${esc(t('th_svc_subpath'))}" oninput="this.dataset.edited=true">
    <button type="button" class="btn-del" onclick="this.parentElement.remove()" style="padding:6px 10px;" title="${esc(t('btn_remove'))}">✕</button>
  `;
  container.appendChild(row);
}

function addObScanPathRow(path = '') {
  const container = document.getElementById('ob-scan-paths-list');
  if (!container) return;
  const row = document.createElement('div');
  row.className = 'scan-path-row';
  row.innerHTML = `
    <input type="text" class="ob-scan-path-val" value="${esc(path)}" placeholder="${esc(t('ph_scan_path_single'))}" style="flex:1;" required>
    <button type="button" class="btn-del" onclick="this.parentElement.remove()" style="padding:7px 12px;" title="${esc(t('btn_remove'))}">✕</button>
  `;
  container.appendChild(row);
  const input = row.querySelector('input');
  if (input && !path) input.focus();
}

function toggleObTelegramOptions(enabled) {
  const details = document.getElementById('ob-tg-details');
  if (details) {
    details.style.opacity = enabled ? '1' : '0.4';
    details.style.pointerEvents = enabled ? 'auto' : 'none';
  }
}

async function testObApi() {
  const btn = document.getElementById('ob-btn-test-api');
  const box = document.getElementById('ob-test-result');
  if (btn) {
    btn.disabled = true;
    btn.textContent = t('testing_api');
  }
  if (box) box.style.display = 'none';

  try {
    const fd = new FormData();
    fd.append('provider', document.getElementById('ob_provider').value);
    fd.append('api_key', document.getElementById('ob_api_key').value);
    fd.append('api_base', document.getElementById('ob_api_base').value);
    fd.append('agent', document.getElementById('ob_agent').value);
    fd.append('rclone_mount_dir', document.getElementById('ob_rclone_mount_dir').value);

    const res = await fetch('/api/test', { method: 'POST', body: fd });
    const data = await res.json();
    if (box) {
      box.style.display = 'inline-block';
      box.textContent = data.message;
      box.className = 'test-box ' + (data.ok ? 'ok' : 'err');
    }
  } catch (e) {
    if (box) {
      box.style.display = 'inline-block';
      box.textContent = t('status_unreachable') + ' : ' + e;
      box.className = 'test-box err';
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      const pId = document.getElementById('ob_provider').value;
      const meta = PROVIDER_METAS[pId] || PROVIDER_METAS['alldebrid'];
      btn.textContent = (currentLang === 'en' ? 'Test API ' : "Tester l'API ") + meta.name;
    }
  }
}

async function testObTelegram() {
  const btn = document.getElementById('ob-btn-test-tg');
  const box = document.getElementById('ob-tg-test-result');
  const botToken = document.getElementById('ob_telegram_bot_token').value.trim();
  const chatId = document.getElementById('ob_telegram_chat_id').value.trim();

  if (!botToken || !chatId) {
    if (box) {
      box.style.display = 'inline-block';
      box.className = 'test-box err';
      box.textContent = currentLang === 'en' ? 'Please fill in Bot Token and Chat ID.' : 'Veuillez renseigner le Token et le Chat ID.';
    }
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = t('testing_tg');
  }
  if (box) box.style.display = 'none';

  try {
    const fd = new FormData();
    fd.append('bot_token', botToken);
    fd.append('chat_id', chatId);
    const res = await fetch('/api/settings/test-telegram', { method: 'POST', body: fd });
    const data = await res.json();
    if (box) {
      box.style.display = 'inline-block';
      box.className = 'test-box ' + (data.ok ? 'ok' : 'err');
      box.textContent = data.ok ? (data.message || t('tg_test_ok')) : (data.error || t('tg_test_err'));
    }
  } catch (err) {
    if (box) {
      box.style.display = 'inline-block';
      box.className = 'test-box err';
      box.textContent = t('tg_test_err') + ' : ' + err;
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = t('btn_test_tg');
    }
  }
}

function updateObRecap() {
  const pId = document.getElementById('ob_provider').value;
  const meta = PROVIDER_METAS[pId] || PROVIDER_METAS['alldebrid'];
  const recapProv = document.getElementById('ob-recap-provider');
  if (recapProv) recapProv.textContent = meta.name;

  const recapDl = document.getElementById('ob-recap-dl-dir');
  if (recapDl) recapDl.textContent = document.getElementById('ob_download_base_dir').value || '/mnt/virtual/Medias/DL';

  const svcsCount = document.querySelectorAll('#ob-services-list .svc-row').length;
  const recapSvc = document.getElementById('ob-recap-services');
  if (recapSvc) recapSvc.textContent = t('ob_services_count', { n: svcsCount });

  const tgOn = document.getElementById('ob_telegram_enabled').checked;
  const recapTg = document.getElementById('ob-recap-tg');
  if (recapTg) {
    recapTg.textContent = tgOn ? t('ob_active') : t('ob_disabled');
    recapTg.style.color = tgOn ? '#3fb950' : 'var(--text-muted)';
  }
}

async function skipOnboarding() {
  closeOnboarding();
  try {
    localStorage.setItem('pyrdt_onboarding_completed', 'true');
  } catch (e) {}
  fetch('/api/settings/onboarding-complete', { method: 'POST' });
}

function finishOnboarding() {
  const setVal = (name, val) => {
    const el = document.querySelector(`[name="${name}"]`);
    if (el) el.value = val;
  };
  const setChk = (id, checked) => {
    const el = document.getElementById(id);
    if (el) el.checked = checked;
  };

  applyTheme(document.getElementById('ob_theme').value);
  setLanguage(document.getElementById('ob_lang').value);
  setChk('hide_last_download_name', document.getElementById('ob_hide_last_download_name').checked);
  setChk('chk_enable_scanner', document.getElementById('ob_enable_scanner').checked);

  const provSelect = document.getElementById('provider-select');
  if (provSelect) {
    provSelect.value = document.getElementById('ob_provider').value;
    onProviderChange(provSelect.value);
  }
  setVal('api_key', document.getElementById('ob_api_key').value);
  setVal('agent', document.getElementById('ob_agent').value);
  setVal('api_base', document.getElementById('ob_api_base').value);

  setVal('rclone_mount_dir', document.getElementById('ob_rclone_mount_dir').value);
  setVal('download_base_dir', document.getElementById('ob_download_base_dir').value);
  setVal('mount_timeout', document.getElementById('ob_mount_timeout').value);
  setVal('download_speed_limit', document.getElementById('ob_download_speed_limit').value);
  const obConcurrentEl = document.getElementById('ob_max_concurrent_downloads');
  if (obConcurrentEl) setVal('max_concurrent_downloads', obConcurrentEl.value);
  setVal('poll_interval', document.getElementById('ob_poll_interval').value);
  setVal('allowed_exts', document.getElementById('ob_allowed_exts').value);
  const obIgnoredEl = document.getElementById('ob_ignored_exts');
  if (obIgnoredEl) setVal('ignored_exts', obIgnoredEl.value);

  const mainSvcContainer = document.getElementById('services-list');
  if (mainSvcContainer) {
    mainSvcContainer.innerHTML = '';
    const obRows = document.querySelectorAll('#ob-services-list .svc-row');
    obRows.forEach(r => {
      const name = r.querySelector('.ob-svc-name').value;
      const mode = r.querySelector('.ob-svc-mode').value;
      const sub = r.querySelector('.ob-svc-sub').value;
      addServiceRow(name, mode, sub);
    });
  }

  setChk('del_dl_done', document.getElementById('ob_del_dl_done').checked);
  setChk('auto_clean', document.getElementById('ob_auto_clean').checked);
  setChk('del_prov', document.getElementById('ob_del_prov').checked);
  setVal('username', document.getElementById('ob_username').value);
  setVal('password', document.getElementById('ob_password').value);

  const mainScanContainer = document.getElementById('scan-paths-list');
  if (mainScanContainer) {
    mainScanContainer.innerHTML = '';
    const obPaths = Array.from(document.querySelectorAll('#ob-scan-paths-list .ob-scan-path-val')).map(i => i.value.trim()).filter(Boolean);
    if (obPaths.length > 0) {
      obPaths.forEach(p => addScanPathRow(p));
    } else {
      addScanPathRow('/mnt/virtual/Medias/Films');
      addScanPathRow('/mnt/virtual/Medias/Series');
    }
  }
  const mainArrContainer = document.getElementById('arr-instances-list');
  if (mainArrContainer) {
    mainArrContainer.innerHTML = '';
    const obArrRows = document.querySelectorAll('#ob-arr-instances-list .ob-arr-row');
    obArrRows.forEach(r => {
      const type = r.querySelector('.ob-arr-type').value;
      const name = r.querySelector('.ob-arr-name').value;
      const url = r.querySelector('.ob-arr-url').value;
      const key = r.querySelector('.ob-arr-key').value;
      addArrInstanceRow(type, name, url, key);
    });
  }

  const tgOn = document.getElementById('ob_telegram_enabled').checked;
  setChk('telegram_enabled', tgOn);
  toggleTelegramOptions(tgOn);
  setVal('telegram_bot_token', document.getElementById('ob_telegram_bot_token').value);
  setVal('telegram_chat_id', document.getElementById('ob_telegram_chat_id').value);

  const obCompletedInput = document.getElementById('onboarding_completed');
  if (obCompletedInput) obCompletedInput.value = 'on';

  try {
    localStorage.setItem('pyrdt_onboarding_completed', 'true');
  } catch (e) {}

  closeOnboarding();

  const form = document.getElementById('settings-form');
  if (form) form.submit();
}

async function resetSettingsAndRelaunchOnboarding() {
  const confirmMsg = t('confirm_reset_settings');
  if (!confirm(confirmMsg)) return;

  try {
    const res = await fetch('/api/settings/reset', { method: 'POST' });
    const data = await res.json();
    if (data.ok) {
      try {
        localStorage.removeItem('pyrdt_onboarding_completed');
      } catch (e) {}
      window.location.href = '/?onboarding=1';
    } else {
      alert((currentLang === 'en' ? 'Error: ' : 'Erreur : ') + (data.error || data.message || (currentLang === 'en' ? 'Unable to reset' : 'Impossible de réinitialiser')));
    }
  } catch (e) {
    alert((currentLang === 'en' ? 'Network error: ' : 'Erreur réseau : ') + e);
  }
}


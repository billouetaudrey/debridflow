function showSettingsPage(pageId) {
  const pages = ['alldebrid', 'storage', 'services', 'scanner', 'automation', 'security', 'appearance', 'notifications', 'system'];
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

  const tgChk = document.getElementById('telegram_enabled');
  if (tgChk) toggleTelegramOptions(tgChk.checked);

  const themeSel = document.getElementById('theme-select');
  if (themeSel) themeSel.value = currentTheme;

  const langSel = document.getElementById('lang-select');
  if (langSel) langSel.value = currentLang;
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

function addScanPathRow(path = '') {
  const container = document.getElementById('scan-paths-list');
  if (!container) return;
  const row = document.createElement('div');
  row.className = 'scan-path-row';
  row.innerHTML = `
    <input type="text" name="media_scan_paths" value="${esc(path)}" placeholder="${esc(t('ph_scan_path_single'))}" style="flex:1;" required>
    <button type="button" class="btn-del" onclick="this.parentElement.remove()" style="padding:7px 12px;" title="${esc(t('btn_remove'))}">✕</button>
  `;
  container.appendChild(row);
  const input = row.querySelector('input');
  if (input && !path) input.focus();
}

function addArrInstanceRow(type = 'radarr', name = '', url = '', apiKey = '') {
  const container = document.getElementById('arr-instances-list');
  if (!container) return;
  const row = document.createElement('div');
  row.className = 'arr-row';

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
    <select name="arr_types" onchange="onArrTypeChange(this)">
      <option value="radarr" ${curType === 'radarr' ? 'selected' : ''}>🎬 Radarr</option>
      <option value="sonarr" ${curType === 'sonarr' ? 'selected' : ''}>📺 Sonarr</option>
      <option value="whisparr" ${curType === 'whisparr' ? 'selected' : ''}>🔞 Whisparr</option>
      <option value="lidarr" ${curType === 'lidarr' ? 'selected' : ''}>🎵 Lidarr</option>
      <option value="readarr" ${curType === 'readarr' ? 'selected' : ''}>📚 Readarr</option>
    </select>
    <input type="text" name="arr_names" value="${esc(curName)}" placeholder="${esc(t('th_arr_name'))}" required data-edited="1">
    <input type="text" name="arr_urls" value="${esc(curUrl)}" placeholder="${esc(t('th_arr_url'))}" required data-edited="1">
    <input type="password" name="arr_api_keys" value="${esc(apiKey)}" placeholder="${esc(t('th_arr_key'))}">
    <button type="button" class="btn-del" onclick="this.parentElement.remove()" style="padding:7px 10px;" title="${esc(t('btn_remove'))}">✕</button>
  `;
  container.appendChild(row);
}

function onArrTypeChange(selectEl) {
  const row = selectEl.parentElement;
  const nameInput = row.querySelector('[name="arr_names"]');
  const urlInput = row.querySelector('[name="arr_urls"]');
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

function toggleTelegramOptions(enabled) {
  const container = document.getElementById('tg-details-container');
  if (container) {
    container.style.opacity = enabled ? '1' : '0.4';
    container.style.pointerEvents = enabled ? 'auto' : 'none';
  }
}

async function testTelegramNotification() {
  const btn = document.getElementById('btn-test-tg');
  const box = document.getElementById('tg-test-result');
  const botToken = (document.getElementById('telegram_bot_token')?.value || '').trim();
  const chatId = (document.getElementById('telegram_chat_id')?.value || '').trim();

  if (!botToken || !chatId) {
    if (box) {
      box.style.display = 'block';
      box.style.background = 'rgba(248, 81, 73, 0.15)';
      box.style.color = '#f85149';
      box.style.border = '1px solid rgba(248, 81, 73, 0.4)';
      box.textContent = currentLang === 'en' ? 'Please fill in Bot Token and Chat ID.' : 'Veuillez renseigner le Token du Bot et le Chat ID.';
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
      box.style.display = 'block';
      if (data.ok) {
        box.style.background = 'rgba(63, 185, 80, 0.15)';
        box.style.color = '#3fb950';
        box.style.border = '1px solid rgba(63, 185, 80, 0.4)';
        box.textContent = data.message || t('tg_test_ok');
      } else {
        box.style.background = 'rgba(248, 81, 73, 0.15)';
        box.style.color = '#f85149';
        box.style.border = '1px solid rgba(248, 81, 73, 0.4)';
        box.textContent = data.error || t('tg_test_err');
      }
    }
  } catch (err) {
    if (box) {
      box.style.display = 'block';
      box.style.background = 'rgba(248, 81, 73, 0.15)';
      box.style.color = '#f85149';
      box.style.border = '1px solid rgba(248, 81, 73, 0.4)';
      box.textContent = t('tg_test_err') + ' : ' + err;
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = t('btn_test_tg');
    }
  }
}


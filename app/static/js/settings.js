function toggleDefaultSubfolderCustom() {
  const sel = document.getElementById('default_subfolder_mode');
  const wrap = document.getElementById('default_subfolder_custom_wrap');
  if (sel && wrap) {
    wrap.style.display = sel.value === 'manual' ? 'block' : 'none';
  }
}

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

  toggleDefaultSubfolderCustom();
  toggleResourceProtField();

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

async function testArrConnections() {
  const btn = document.getElementById('btn-test-arr');
  const box = document.getElementById('arr-test-results');
  if (!btn || !box) return;

  btn.disabled = true;
  const originalTxt = btn.textContent;
  btn.textContent = t('testing_arr');

  box.style.display = 'block';
  box.style.background = 'var(--bg-card)';
  box.style.borderColor = 'var(--border-muted)';
  box.innerHTML = `<span style="color:var(--text-muted);">${esc(t('testing_arr'))}</span>`;

  try {
    const fd = new FormData();
    const rows = document.querySelectorAll('#arr-instances-list .arr-row');
    if (rows.length === 0) {
      box.innerHTML = `<span style="color:#f85149;">${esc(t('no_arr_to_test'))}</span>`;
      box.style.borderColor = '#f85149';
      return;
    }

    rows.forEach(r => {
      const type = r.querySelector('[name="arr_types"]');
      const name = r.querySelector('[name="arr_names"]');
      const url = r.querySelector('[name="arr_urls"]');
      const key = r.querySelector('[name="arr_api_keys"]');
      if (type) fd.append('arr_types', type.value);
      if (name) fd.append('arr_names', name.value);
      if (url) fd.append('arr_urls', url.value);
      if (key) fd.append('arr_api_keys', key.value);
    });

    const res = await fetch('/api/settings/test-arr', { method: 'POST', body: fd });
    const data = await res.json();

    if (data.results && data.results.length > 0) {
      const itemsHtml = data.results.map(r => {
        const icon = r.ok ? '✅' : '❌';
        const color = r.ok ? '#3fb950' : '#f85149';
        let msg = r.message || '';
        if (r.ok) {
          msg = r.version
            ? t('arr_test_connected', { name: r.app_name || r.name, version: r.version })
            : t('arr_test_connected_no_ver', { name: r.app_name || r.name });
        } else if (r.code === 'missing_url') {
          msg = t('arr_test_missing_url');
        } else if (r.code === 'missing_key') {
          msg = t('arr_test_missing_key');
        } else if (r.code === 'invalid_key') {
          msg = t('arr_test_invalid_key');
        } else if (r.code === 'conn_refused') {
          msg = t('arr_test_conn_refused', { url: r.url || '' });
        } else if (r.code === 'timeout') {
          msg = t('arr_test_timeout', { url: r.url || '' });
        } else if (r.code === 'not_found') {
          msg = t('arr_test_not_found');
        } else if (r.code === 'net_error') {
          msg = t('arr_test_net_error', { error: r.detail || r.message || '' });
        }
        return `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:5px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
            <div>
              <strong>${esc(r.name)}</strong> <span style="color:var(--text-muted);font-size:11px;">(${esc(r.type)})</span>
            </div>
            <div style="color:${color};font-weight:500;">
              ${icon} ${esc(msg)}
            </div>
          </div>
        `;
      }).join('');

      box.style.borderColor = data.all_ok ? '#3fb950' : '#d29922';
      box.style.background = data.all_ok ? 'rgba(63, 185, 80, 0.1)' : 'rgba(210, 153, 34, 0.1)';
      box.innerHTML = itemsHtml;
    } else {
      box.innerHTML = `<span style="color:var(--text-muted);">${esc(data.message || t('no_arr_to_test'))}</span>`;
    }
  } catch (e) {
    box.style.borderColor = '#f85149';
    box.style.background = 'rgba(248, 81, 73, 0.1)';
    box.innerHTML = `<span style="color:#f85149;">${esc(t('arr_test_network_err'))}${esc(String(e))}</span>`;
  } finally {
    btn.disabled = false;
    btn.textContent = originalTxt;
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

function toggleResourceProtField() {
  const chk = document.getElementById('system_resource_protection');
  const field = document.getElementById('field_throttle_cpu_threshold');
  if (chk && field) {
    field.style.opacity = chk.checked ? '1' : '0.4';
    const inp = field.querySelector('input');
    if (inp) inp.disabled = !chk.checked;
  }
}


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


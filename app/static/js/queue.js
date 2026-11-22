
function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function showTab(tab) {
  const btnTarget = document.getElementById('btn-' + tab);
  if (tab !== 'settings' && btnTarget && (btnTarget.style.display === 'none' || getComputedStyle(btnTarget).display === 'none')) {
    const candidateTabs = ['queue', 'ddl', 'finder', 'scanner', 'settings'];
    for (const c of candidateTabs) {
      const b = document.getElementById('btn-' + c);
      if (b && b.style.display !== 'none' && getComputedStyle(b).display !== 'none') {
        tab = c;
        break;
      }
    }
  }

  currentTab = tab;
  const tabQueue = document.getElementById('tab-queue');
  if (tabQueue) tabQueue.style.display = tab === 'queue' ? 'block' : 'none';
  const tabDdl = document.getElementById('tab-ddl');
  if (tabDdl) tabDdl.style.display = tab === 'ddl' ? 'block' : 'none';
  const tabFinder = document.getElementById('tab-finder');
  if (tabFinder) tabFinder.style.display = tab === 'finder' ? 'block' : 'none';
  const tabScanner = document.getElementById('tab-scanner');
  if (tabScanner) tabScanner.style.display = tab === 'scanner' ? 'block' : 'none';
  const tabSettings = document.getElementById('tab-settings');
  if (tabSettings) tabSettings.style.display = tab === 'settings' ? 'block' : 'none';

  const btnQueue = document.getElementById('btn-queue');
  if (btnQueue) btnQueue.classList.toggle('active', tab === 'queue');
  const btnDdl = document.getElementById('btn-ddl');
  if (btnDdl) btnDdl.classList.toggle('active', tab === 'ddl');
  const btnFinder = document.getElementById('btn-finder');
  if (btnFinder) btnFinder.classList.toggle('active', tab === 'finder');
  const btnScanner = document.getElementById('btn-scanner');
  if (btnScanner) btnScanner.classList.toggle('active', tab === 'scanner');
  const btnSettings = document.getElementById('btn-settings');
  if (btnSettings) btnSettings.classList.toggle('active', tab === 'settings');

  if (window.location.search) {
    try {
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (e) {}
  }

  if (tab === 'queue' || tab === 'ddl') refreshQueue();
  if (tab === 'finder') loadFinderSettings();
  if (tab === 'scanner') {
    loadScannerData();
    checkScannerStatusOnLoad();
  }
}

function goHome() {
  showTab('queue');
  if (window.location.search) {
    try {
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (e) {}
  }
}


function formatSize(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + units[i];
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

let currentQueueFilter = 'all';
let currentQueueGrouping = 'status';
let collapsedGroupsSet = new Set();

try {
  const sf = localStorage.getItem('omnisym_queue_filter');
  if (sf) currentQueueFilter = sf;
  const sg = localStorage.getItem('omnisym_queue_grouping');
  if (sg) currentQueueGrouping = sg;
  const sc = localStorage.getItem('omnisym_collapsed_groups');
  if (sc) collapsedGroupsSet = new Set(JSON.parse(sc));
} catch (e) {}

function saveCollapsedGroups() {
  try {
    localStorage.setItem('omnisym_collapsed_groups', JSON.stringify(Array.from(collapsedGroupsSet)));
  } catch (e) {}
}

function getItemTypeGroup(item) {
  const state = item.state || 'downloading';
  const isDdl = Boolean(item.is_ddl);
  const isDebrided = Boolean(item.is_debrided || state === 'copying' || state === 'checkingDL' || state === 'pausedUP' || state === 'stalledUP' || isDdl);

  if (state === 'error') {
    return 'failed';
  }
  if (state === 'pausedDL') {
    return 'paused';
  }
  if (state === 'pausedUP' || state === 'stalledUP' || (Number(item.progress) >= 1.0 && (state === 'completed' || state === 'uploading'))) {
    return 'completed';
  }
  // Débridage cloud (non débridé, recherche de pairs torrent sur le cloud AllDebrid, resolving)
  if (!isDebrided || state === 'resolving' || (state === 'downloading' && !isDebrided)) {
    return 'debriding';
  }
  // Téléchargement actif ou copie locale / attente rclone
  if (state === 'downloading' || state === 'copying' || state === 'checkingDL' || state === 'queued') {
    return 'downloading';
  }
  return 'other';
}

function setQueueFilter(filter) {
  currentQueueFilter = filter;
  try { localStorage.setItem('omnisym_queue_filter', filter); } catch (e) {}
  const sel = document.getElementById('queue-filter-select');
  if (sel && sel.value !== filter) sel.value = filter;
  if (window.currentQueueItems) {
    renderQueue(window.currentQueueItems);
  }
}

function setQueueGrouping(grouping) {
  currentQueueGrouping = grouping;
  try { localStorage.setItem('omnisym_queue_grouping', grouping); } catch (e) {}
  const sel = document.getElementById('queue-group-select');
  if (sel && sel.value !== grouping) sel.value = grouping;
  if (window.currentQueueItems) {
    renderQueue(window.currentQueueItems);
  }
}

function toggleQueueGroup(groupId) {
  const header = document.querySelector(`.queue-group-row[data-group-id="${groupId}"]`);
  const isCurrentlyOpen = header && header.classList.contains('open');
  if (isCurrentlyOpen) {
    if (header) header.classList.remove('open');
    document.querySelectorAll(`.group-row-${groupId}`).forEach(el => el.classList.add('group-collapsed'));
    collapsedGroupsSet.add(groupId);
  } else {
    if (header) header.classList.add('open');
    document.querySelectorAll(`.group-row-${groupId}`).forEach(el => el.classList.remove('group-collapsed'));
    collapsedGroupsSet.delete(groupId);
  }
  saveCollapsedGroups();
  updateSelection();
}

function toggleSelectGroup(groupId) {
  const rows = document.querySelectorAll(`.group-row-${groupId} .row-chk`);
  if (!rows.length) return;
  const anyUnchecked = Array.from(rows).some(r => !r.checked);
  rows.forEach(r => r.checked = anyUnchecked);
  updateSelection();
}

function expandAllQueueGroups() {
  collapsedGroupsSet.clear();
  saveCollapsedGroups();
  document.querySelectorAll('.queue-group-row').forEach(el => el.classList.add('open'));
  document.querySelectorAll('.queue-item-row').forEach(el => el.classList.remove('group-collapsed'));
}

function collapseAllQueueGroups() {
  const groupRows = document.querySelectorAll('.queue-group-row');
  groupRows.forEach(el => {
    el.classList.remove('open');
    const gid = el.dataset.groupId;
    if (gid) collapsedGroupsSet.add(gid);
  });
  saveCollapsedGroups();
  document.querySelectorAll('.queue-item-row').forEach(el => el.classList.add('group-collapsed'));
}

function renderGroupHeaderRow(groupId, groupIcon, groupTitle, count, badgeClass = 'tag') {
  const isCollapsed = collapsedGroupsSet.has(groupId);
  const openClass = isCollapsed ? '' : 'open';
  return `<tr class="queue-group-row ${openClass}" onclick="toggleQueueGroup('${groupId}')" data-group-id="${groupId}">
    <td colspan="6" class="queue-group-cell">
      <div class="queue-group-header-content">
        <div class="queue-group-title">
          <span class="queue-chevron">▶</span>
          <span>${groupIcon}</span>
          <span class="queue-group-label">${esc(groupTitle)}</span>
          <span class="badge ${badgeClass}">${count}</span>
        </div>
        <div class="queue-group-tools" onclick="event.stopPropagation()">
          <button type="button" class="btn-sec q-grp-sel-btn" onclick="toggleSelectGroup('${groupId}')" title="${esc(t('select_all') || 'Sélectionner ce groupe')}">
            ☑️
          </button>
        </div>
      </div>
    </td>
  </tr>`;
}

function renderQueueRow(item, checkedSet, groupId = '') {
  const pct = Math.round((Number(item.progress) || 0) * 100);
  const state = item.state || 'downloading';
  const isDl = item.transfer_mode === 'download';
  const isDdl = Boolean(item.is_ddl);
  const modeBadge = isDdl
    ? `<span class="tag dl" style="background:#8957e5;color:#fff;">${esc(t('tag_ddl') || 'DDL')}</span>`
    : (isDl
      ? `<span class="tag dl">${esc(t('tag_dl'))}</span>`
      : `<span class="tag sym">${esc(t('tag_sym'))}</span>`);

  const isDebrided = Boolean(item.is_debrided || state === 'copying' || state === 'checkingDL' || state === 'pausedUP' || state === 'stalledUP' || isDdl);
  const isCached = Boolean(item.debrid_cached);
  let debridBadge = '';
  if (isDebrided) {
    if (isCached) {
      debridBadge = `<span class="tag debrid-cache" title="${esc(t('tip_debrided_cache'))}">⚡ ${esc(t('tag_debrided_cache'))}</span>`;
    } else {
      debridBadge = `<span class="tag debrid-ready" title="${esc(t('tip_debrided_ready'))}">⚡ ${esc(t('tag_debrided_ready'))}</span>`;
    }
  } else {
    const seedersTxt = item.seeders ? ` • ${item.seeders} src` : '';
    debridBadge = `<span class="tag debrid-pending" title="${esc(t('tip_debrided_pending'))}">⏳ ${esc(t('tag_debrided_pending'))}${seedersTxt}</span>`;
  }

  let badgeCls = 'run';
  let stateTxt = pct > 0 ? `${esc(t('st_downloading'))} (${pct}%)` : `${esc(t('st_in_progress'))}`;

  if (state === 'pausedUP' || state === 'stalledUP') {
    badgeCls = 'ok';
    stateTxt = `${esc(t('st_completed'))} (${pct}%)`;
  } else if (state === 'pausedDL') {
    badgeCls = 'pause';
    stateTxt = `${esc(t('st_paused'))} (${pct}%)`;
  } else if (state === 'error') {
    badgeCls = 'err';
    stateTxt = `${esc(t('st_error'))} — ${esc(item.error_msg)}`;
  } else if (state === 'resolving') {
    badgeCls = 'run';
    stateTxt = `${esc(t('st_in_progress'))}`;
  } else if (state === 'queued') {
    badgeCls = 'pause';
    stateTxt = `${esc(t('st_queued') || 'En attente (slot DL)')}`;
  } else if (state === 'checkingDL') {
    badgeCls = 'run';
    stateTxt = `${esc(t('st_rclone_wait'))} (${pct}%)`;
  } else if (state === 'copying') {
    badgeCls = 'run';
    stateTxt = `${esc(t('st_copying'))} (${pct}%)`;
    if (item.dlspeed && item.dlspeed > 0) {
      stateTxt += ` • ${formatSpeed(item.dlspeed)}`;
    }
  } else if (state === 'downloading' && !isDebrided) {
    badgeCls = 'run';
    stateTxt = `${esc(t('st_cloud_dl'))} (${pct}%)`;
    if (item.seeders && item.seeders > 0) {
      stateTxt += ` • ${item.seeders} sources`;
    }
  } else if (isDl && item.dlspeed && item.dlspeed > 0) {
    stateTxt += ` • ${formatSpeed(item.dlspeed)}`;
  }

  const fullId = esc(item.hash);
  const shortId = esc(String(item.hash).slice(0, 8));
  const adId = isDdl ? 'DDL' : esc(item.ad_id);
  const isChecked = checkedSet.has(item.hash) ? 'checked' : '';
  const pauseBtn = state === 'pausedDL'
    ? `<button class="btn-sec" onclick="batchAction('resume', ['${fullId}'])">${esc(t('btn_resume'))}</button>`
    : `<button class="btn-warn" onclick="batchAction('pause', ['${fullId}'])">${esc(t('btn_pause'))}</button>`;

  const retryBtn = state === 'error'
    ? `<button class="btn-main" onclick="batchAction('retry', ['${fullId}'])" style="font-size:11px;padding:4px 8px;display:inline-flex;align-items:center;gap:4px;"><span>🔄</span> <span>${esc(t('btn_retry'))}</span></button>`
    : `<button class="btn-sec" onclick="batchAction('retry', ['${fullId}'])">${esc(t('btn_retry'))}</button>`;

  const groupClass = groupId ? `group-row-${groupId}` : '';
  const isCollapsed = groupId && collapsedGroupsSet.has(groupId);
  const collapsedClass = isCollapsed ? 'group-collapsed' : '';

  return `<tr class="queue-item-row ${groupClass} ${collapsedClass}" data-hash="${fullId}" data-group-id="${groupId}">
    <td class="col-chk"><input type="checkbox" class="row-chk" value="${fullId}" ${isChecked} onchange="updateSelection()"></td>
    <td class="mono col-id"><div>#${adId}</div><small title="${fullId}" onclick="copyId('${fullId}')" style="cursor:pointer;color:#8b949e">${shortId} 📋</small></td>
    <td class="col-name">${esc(item.name)}<div style="color:#8b949e;font-size:11px;margin-top:2px;">${esc(item.save_path)}</div></td>
    <td class="col-cat"><span class="tag">${esc(item.category)}</span> ${modeBadge}</td>
    <td class="col-status">
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:4px;">
        <span class="badge ${badgeCls}">${stateTxt}</span>
        ${debridBadge}
      </div>
      <div class="pbar"><div class="pbar-fill ${badgeCls}" style="width:${pct}%"></div></div>
    </td>
    <td class="actions col-actions">
      ${retryBtn}
      ${pauseBtn}
      <button class="btn-del" onclick="openDeleteModal(['${fullId}'])">${esc(t('btn_delete'))}</button>
    </td>
  </tr>`;
}

function getSelectedHashes() {
  return Array.from(document.querySelectorAll('.row-chk:checked')).map(c => c.value);
}

function updateSelection() {
  const selected = getSelectedHashes();
  const visibleChks = document.querySelectorAll('.queue-item-row:not(.group-collapsed) .row-chk');
  const total = visibleChks.length;
  const selEl = document.getElementById('sel-count');
  if (selEl) selEl.textContent = t('sel_count', { n: selected.length });
  const bulkRetry = document.getElementById('bulk-retry');
  if (bulkRetry) bulkRetry.disabled = selected.length === 0;
  const bulkPause = document.getElementById('bulk-pause');
  if (bulkPause) bulkPause.disabled = selected.length === 0;
  const bulkDel = document.getElementById('bulk-del');
  if (bulkDel) bulkDel.disabled = selected.length === 0;
  const chkAll = document.getElementById('chk-all');
  if (chkAll) chkAll.checked = total > 0 && Array.from(visibleChks).every(c => c.checked);
}

function toggleAll(master) {
  document.querySelectorAll('.queue-item-row:not(.group-collapsed) .row-chk').forEach(c => c.checked = master.checked);
  updateSelection();
}

function copyId(txt) {
  if (navigator.clipboard) navigator.clipboard.writeText(txt);
}

function formatSpeed(bytesPerSec) {
  if (!bytesPerSec || bytesPerSec <= 0) return currentLang === 'en' ? '0 MB/s' : '0 Mo/s';
  const mbs = bytesPerSec / (1024 * 1024);
  const uMB = currentLang === 'en' ? 'MB/s' : 'Mo/s';
  const uKB = currentLang === 'en' ? 'KB/s' : 'Ko/s';
  if (mbs < 1) {
    const kbs = bytesPerSec / 1024;
    return kbs.toFixed(1) + ' ' + uKB;
  }
  return mbs.toFixed(2) + ' ' + uMB;
}

let lastDlNameRevealed = null;
let serverHideLastDlName = true;

function updateLastDlDisplay() {
  const isRevealed = lastDlNameRevealed !== null ? lastDlNameRevealed : !serverHideLastDlName;
  const infoEl = document.getElementById('last-dl-info-revealed');
  const iconEl = document.getElementById('last-dl-toggle-icon');
  const textEl = document.getElementById('last-dl-toggle-text');
  if (infoEl) infoEl.style.display = isRevealed ? 'inline-flex' : 'none';
  if (iconEl) iconEl.textContent = isRevealed ? '🙈' : '👁️';
  if (textEl) textEl.textContent = isRevealed ? t('lbl_hide_last_dl') : t('lbl_show_last_dl');
}

function toggleLastDlName() {
  const currentRevealed = lastDlNameRevealed !== null ? lastDlNameRevealed : !serverHideLastDlName;
  lastDlNameRevealed = !currentRevealed;
  updateLastDlDisplay();
}

function renderQueue(items) {
  const tbody = document.getElementById('queue-tbody');
  const checkedSet = new Set(getSelectedHashes());

  const filterSelect = document.getElementById('queue-filter-select');
  if (filterSelect && filterSelect.value !== currentQueueFilter) {
    filterSelect.value = currentQueueFilter;
  }
  const groupSelect = document.getElementById('queue-group-select');
  if (groupSelect && groupSelect.value !== currentQueueGrouping) {
    groupSelect.value = currentQueueGrouping;
  }

  // Calcul dynamique des compteurs de chaque statut
  const counts = {
    all: (items || []).length,
    downloading: 0,
    debriding: 0,
    failed: 0,
    completed: 0,
    paused: 0,
  };
  if (items && items.length > 0) {
    for (const it of items) {
      const grp = getItemTypeGroup(it);
      if (counts[grp] !== undefined) counts[grp]++;
    }
  }

  // Mise à jour des options du menu déroulant avec les compteurs
  const optAll = document.getElementById('opt-filter-all');
  if (optAll) optAll.textContent = `${t('q_filter_all') || 'Tous'} (${counts.all})`;
  const optDl = document.getElementById('opt-filter-downloading');
  if (optDl) optDl.textContent = `📥 ${t('q_filter_downloading') || 'DL en cours'} (${counts.downloading})`;
  const optDeb = document.getElementById('opt-filter-debriding');
  if (optDeb) optDeb.textContent = `☁️ ${t('q_filter_debriding') || 'Débridage cloud'} (${counts.debriding})`;
  const optFail = document.getElementById('opt-filter-failed');
  if (optFail) optFail.textContent = `❌ ${t('q_filter_failed') || 'En échec'} (${counts.failed})`;
  const optComp = document.getElementById('opt-filter-completed');
  if (optComp) optComp.textContent = `✅ ${t('q_filter_completed') || 'Terminés'} (${counts.completed})`;
  const optPause = document.getElementById('opt-filter-paused');
  if (optPause) optPause.textContent = `⏸️ ${t('q_filter_paused') || 'En pause'} (${counts.paused})`;

  if (!items || items.length === 0) {
    tbody.innerHTML = `<tr><td colspan='6' style='color:#8b949e;text-align:center'>${esc(t('no_torrents'))}</td></tr>`;
    updateSelection();
    return;
  }

  // Filtrage selon le filtre actif
  let filteredItems = items;
  if (currentQueueFilter && currentQueueFilter !== 'all') {
    filteredItems = items.filter(it => getItemTypeGroup(it) === currentQueueFilter);
  }

  if (filteredItems.length === 0) {
    tbody.innerHTML = `<tr><td colspan='6' style='color:#8b949e;text-align:center'>${esc(t('q_no_filtered_torrents') || 'Aucun élément ne correspond au filtre sélectionné')}</td></tr>`;
    updateSelection();
    return;
  }

  // Rendu selon le mode de regroupement sélectionné
  if (currentQueueGrouping === 'none') {
    tbody.innerHTML = filteredItems.map(it => renderQueueRow(it, checkedSet, '')).join('');
  } else if (currentQueueGrouping === 'category') {
    const catMap = new Map();
    for (const it of filteredItems) {
      const cat = (it.category || 'default').trim();
      if (!catMap.has(cat)) catMap.set(cat, []);
      catMap.get(cat).push(it);
    }
    let html = '';
    for (const [cat, catItems] of catMap.entries()) {
      const gId = 'cat_' + cat.replace(/[^a-zA-Z0-9_-]/g, '_');
      const gTitle = `${t('q_grp_cat_prefix') || 'Catégorie :'} ${cat}`;
      html += renderGroupHeaderRow(gId, '📁', gTitle, catItems.length, 'run');
      html += catItems.map(it => renderQueueRow(it, checkedSet, gId)).join('');
    }
    tbody.innerHTML = html;
  } else if (currentQueueGrouping === 'mode') {
    const modeMap = {
      symlink: { icon: '⚡', title: t('q_grp_mode_symlink') || 'Mode Symlink (Instantané)', items: [] },
      download: { icon: '📥', title: t('q_grp_mode_download') || 'Mode Téléchargement réel (Local)', items: [] },
      ddl: { icon: '🔗', title: t('q_grp_mode_ddl') || 'Téléchargement Direct (DDL)', items: [] },
    };
    for (const it of filteredItems) {
      const m = it.is_ddl ? 'ddl' : (it.transfer_mode === 'download' ? 'download' : 'symlink');
      if (modeMap[m]) modeMap[m].items.push(it);
    }
    let html = '';
    for (const [mKey, mData] of Object.entries(modeMap)) {
      if (mData.items.length === 0) continue;
      const gId = 'mode_' + mKey;
      html += renderGroupHeaderRow(gId, mData.icon, mData.title, mData.items.length, 'run');
      html += mData.items.map(it => renderQueueRow(it, checkedSet, gId)).join('');
    }
    tbody.innerHTML = html;
  } else {
    // Mode par défaut : Par Statut / Type
    const statusGroupsDef = [
      { id: 'debriding', icon: '☁️', labelKey: 'q_grp_debriding', badgeCls: 'run', defaultLabel: 'Débridage cloud en cours' },
      { id: 'downloading', icon: '📥', labelKey: 'q_grp_downloading', badgeCls: 'run', defaultLabel: 'Téléchargements / Transferts en cours' },
      { id: 'failed', icon: '❌', labelKey: 'q_grp_failed', badgeCls: 'err', defaultLabel: 'En échec / Erreurs' },
      { id: 'paused', icon: '⏸️', labelKey: 'q_grp_paused', badgeCls: 'pause', defaultLabel: 'En pause / En attente' },
      { id: 'completed', icon: '✅', labelKey: 'q_grp_completed', badgeCls: 'ok', defaultLabel: 'Terminés' },
      { id: 'other', icon: '📦', labelKey: 'q_grp_other', badgeCls: 'pause', defaultLabel: 'Autres' },
    ];

    const groupBuckets = {};
    for (const def of statusGroupsDef) {
      groupBuckets[def.id] = [];
    }
    for (const it of filteredItems) {
      const grp = getItemTypeGroup(it);
      if (groupBuckets[grp]) {
        groupBuckets[grp].push(it);
      } else {
        groupBuckets.other.push(it);
      }
    }

    let html = '';
    for (const def of statusGroupsDef) {
      const list = groupBuckets[def.id] || [];
      if (list.length === 0) continue;
      const gTitle = t(def.labelKey) || def.defaultLabel;
      html += renderGroupHeaderRow(def.id, def.icon, gTitle, list.length, def.badgeCls);
      html += list.map(it => renderQueueRow(it, checkedSet, def.id)).join('');
    }
    tbody.innerHTML = html;
  }

  // Rendu dans le tableau dédié DDL
  const ddlTbody = document.getElementById('ddl-queue-tbody');
  if (ddlTbody) {
    const ddlItems = items.filter(it => it.is_ddl);
    if (ddlItems.length === 0) {
      ddlTbody.innerHTML = `<tr><td colspan='4' style='color:#8b949e;text-align:center;'>Aucun téléchargement DDL</td></tr>`;
    } else {
      ddlTbody.innerHTML = ddlItems.map(item => {
        const pct = Math.round((Number(item.progress) || 0) * 100);
        const state = item.state || 'downloading';
        let badgeCls = 'run';
        let stateTxt = pct > 0 ? `${esc(t('st_downloading'))} (${pct}%)` : `${esc(t('st_in_progress'))}`;

        if (state === 'pausedUP' || state === 'stalledUP') {
          badgeCls = 'ok';
          stateTxt = `${esc(t('st_completed'))} (${pct}%)`;
        } else if (state === 'pausedDL') {
          badgeCls = 'pause';
          stateTxt = `${esc(t('st_paused'))} (${pct}%)`;
        } else if (state === 'error') {
          badgeCls = 'err';
          stateTxt = `${esc(t('st_error'))} — ${esc(item.error_msg)}`;
        } else if (state === 'resolving') {
          badgeCls = 'run';
          stateTxt = `${esc(t('st_in_progress'))}`;
        } else if (state === 'queued') {
          badgeCls = 'pause';
          stateTxt = `${esc(t('st_queued') || 'En attente (slot DL)')}`;
        } else if (state === 'copying' || item.dlspeed > 0) {
          badgeCls = 'run';
          stateTxt = `${esc(t('st_downloading'))} (${pct}%)`;
          if (item.dlspeed > 0) stateTxt += ` • ${formatSpeed(item.dlspeed)}`;
        }

        const fullId = esc(item.hash);
        const pauseBtn = state === 'pausedDL'
          ? `<button class="btn-sec" onclick="batchAction('resume', ['${fullId}'])">${esc(t('btn_resume'))}</button>`
          : `<button class="btn-warn" onclick="batchAction('pause', ['${fullId}'])">${esc(t('btn_pause'))}</button>`;

        const ddlRetryBtn = state === 'error'
          ? `<button class="btn-main" onclick="batchAction('retry', ['${fullId}'])" style="font-size:11px;padding:4px 8px;display:inline-flex;align-items:center;gap:4px;"><span>🔄</span> <span>${esc(t('btn_retry'))}</span></button>`
          : `<button class="btn-sec" onclick="batchAction('retry', ['${fullId}'])">${esc(t('btn_retry'))}</button>`;

        return `<tr>
          <td class="col-name"><strong>${esc(item.name)}</strong><div style="color:#8b949e;font-size:11px;margin-top:2px;">${item.size > 0 ? formatSize(item.size) : ''}</div></td>
          <td class="col-cat"><span class="tag">${esc(item.category)}</span><div style="color:#8b949e;font-size:11px;margin-top:2px;">${esc(item.save_path)}</div></td>
          <td class="col-status">
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:4px;">
              <span class="badge ${badgeCls}">${stateTxt}</span>
              <span class="tag debrid-cache" title="${esc(t('tip_debrided_ready'))}">⚡ ${esc(t('tag_debrided_ready'))}</span>
            </div>
            <div class="pbar"><div class="pbar-fill ${badgeCls}" style="width:${pct}%"></div></div>
          </td>
          <td class="actions col-actions" style="text-align:right;">
            ${ddlRetryBtn}
            ${pauseBtn}
            <button class="btn-del" onclick="openDeleteModal(['${fullId}'])">${esc(t('btn_delete'))}</button>
          </td>
        </tr>`;
      }).join('');
    }
  }

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
      window.currentQueueItems = items;
      updateHeaderStatus(items, data.api_health);
      if (currentTab === 'queue' || currentTab === 'ddl') {
        renderQueue(items);
      }
      const activeCountEl = document.getElementById('ddl-active-count-txt');
      if (activeCountEl && data.max_concurrent_downloads !== undefined) {
        const act = data.active_downloads_count || 0;
        const maxDl = data.max_concurrent_downloads || 3;
        activeCountEl.textContent = `Téléchargements simultanés actifs : ${act} / ${maxDl}`;
      }
      if (data.hide_last_download_name !== undefined) {
        serverHideLastDlName = Boolean(data.hide_last_download_name);
      }
      const lastStat = data.last_download_stat;
      const statBar = document.getElementById('last-download-stat-bar');
      if (statBar) {
        if (lastStat && lastStat.name && lastStat.avg_speed) {
          statBar.style.display = 'flex';
          const nameEl = document.getElementById('last-dl-name');
          const detailsEl = document.getElementById('last-dl-details');
          const speedEl = document.getElementById('last-dl-speed');
          if (nameEl) nameEl.textContent = lastStat.name;
          if (detailsEl) {
            const sizeStr = formatSize(lastStat.size || 0);
            const durStr = lastStat.duration ? `${lastStat.duration}s` : '';
            detailsEl.textContent = `(${sizeStr}${durStr ? (currentLang === 'en' ? ' in ' : ' en ') + durStr : ''})`;
          }
          if (speedEl) speedEl.textContent = formatSpeed(lastStat.avg_speed);
          updateLastDlDisplay();
        } else {
          statBar.style.display = 'none';
        }
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
  if (action === 'retry' && window.currentQueueItems) {
    const hashSet = new Set(hashes);
    window.currentQueueItems.forEach(it => {
      if (hashSet.has(it.hash)) {
        it.state = it.is_ddl ? 'resolving' : 'downloading';
        it.progress = 0;
        it.error_msg = '';
      }
    });
    renderQueue(window.currentQueueItems);
  }
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

let currentUploadTab = 'magnet';
let selectedTorrentFiles = [];

function openUploadModal(initialTab = 'magnet') {
  modalOpen = true;
  const modal = document.getElementById('upload-modal');
  if (!modal) return;

  const magnetInput = document.getElementById('upload-magnet-text');
  if (magnetInput) magnetInput.value = '';
  const fileInput = document.getElementById('upload-torrent-files');
  if (fileInput) fileInput.value = '';
  const ddlInput = document.getElementById('upload-ddl-text');
  if (ddlInput) ddlInput.value = '';
  const ddlPwd = document.getElementById('upload-ddl-password');
  if (ddlPwd) ddlPwd.value = '';
  selectedTorrentFiles = [];
  updateDropzoneFileList();

  const statusMsg = document.getElementById('upload-status-msg');
  if (statusMsg) {
    statusMsg.style.display = 'none';
    statusMsg.textContent = '';
    statusMsg.className = '';
  }

  const spinner = document.getElementById('upload-spinner');
  if (spinner) spinner.style.display = 'none';
  const submitBtn = document.getElementById('btn-submit-upload');
  if (submitBtn) submitBtn.disabled = false;
  const btnText = document.getElementById('upload-btn-text');
  if (btnText) btnText.textContent = t('btn_send_debrid');

  switchUploadTab(initialTab || 'magnet');
  onUploadCategoryChange();

  modal.style.display = 'flex';
}

function closeUploadModal() {
  modalOpen = false;
  const modal = document.getElementById('upload-modal');
  if (modal) modal.style.display = 'none';
}

function switchUploadTab(tab) {
  currentUploadTab = tab;
  const tabBtnMag = document.getElementById('tab-btn-magnet');
  const tabBtnFile = document.getElementById('tab-btn-file');
  const tabBtnDdl = document.getElementById('tab-btn-ddl');
  const secMag = document.getElementById('upload-sec-magnet');
  const secFile = document.getElementById('upload-sec-file');
  const secDdl = document.getElementById('upload-sec-ddl');
  const optsTorrent = document.getElementById('upload-opts-torrent');
  const optsDdl = document.getElementById('upload-opts-ddl');

  if (tabBtnMag) tabBtnMag.classList.toggle('active', tab === 'magnet');
  if (tabBtnFile) tabBtnFile.classList.toggle('active', tab === 'file');
  if (tabBtnDdl) tabBtnDdl.classList.toggle('active', tab === 'ddl');

  if (secMag) secMag.style.display = tab === 'magnet' ? 'block' : 'none';
  if (secFile) secFile.style.display = tab === 'file' ? 'block' : 'none';
  if (secDdl) secDdl.style.display = tab === 'ddl' ? 'block' : 'none';

  if (optsTorrent) optsTorrent.style.display = tab === 'ddl' ? 'none' : 'block';
  if (optsDdl) optsDdl.style.display = tab === 'ddl' ? 'block' : 'none';

  const modeSel = document.getElementById('upload-transfer-mode');
  if (tab === 'ddl' && modeSel) {
    modeSel.value = 'download';
  }
}

function applyDdlPreset(val, targetInputId) {
  if (!val) return;
  const input = document.getElementById(targetInputId);
  if (!input) return;
  const baseInput = document.getElementById('download_base_dir');
  const baseDir = (baseInput ? baseInput.value.trim() : '') || '/mnt/virtual/Medias/DL';
  const cleanBase = baseDir.replace(/\/+$/, '');

  let sub = val;
  const sel = (typeof event !== 'undefined' && event && event.target) ? event.target : null;
  if (sel && sel.options && sel.selectedIndex >= 0) {
    const opt = sel.options[sel.selectedIndex];
    sub = opt.getAttribute('data-subpath') || val;
  }
  const fullPath = sub.startsWith('/') ? sub : `${cleanBase}/${sub}`;
  input.value = fullPath;
}

function onUploadCategoryChange() {
  const catSel = document.getElementById('upload-category');
  const preview = document.getElementById('upload-dest-preview');
  if (!catSel || !preview) return;

  const opt = catSel.options[catSel.selectedIndex];
  if (!opt) return;

  const sub = opt.getAttribute('data-subpath') || opt.value;
  const mode = opt.getAttribute('data-mode') || 'download';
  const baseInput = document.getElementById('download_base_dir');
  const baseDir = (baseInput ? baseInput.value.trim() : '') || '/mnt/virtual/Medias/DL';
  const target = sub.startsWith('/') ? sub : `${baseDir.replace(/\/+$/, '')}/${sub}`;
  const modeTag = mode === 'download' ? `<span class="tag dl">${t('tag_dl')}</span>` : `<span class="tag sym">${t('tag_sym')}</span>`;

  preview.innerHTML = `<span style="font-weight:600;color:var(--text-bright);">${t('lbl_destination')}</span> <code>${esc(target)}</code> <span style="margin-left:6px;">${modeTag}</span>`;
}

function onTorrentFilesSelected(input) {
  if (input && input.files) {
    selectedTorrentFiles = Array.from(input.files);
    updateDropzoneFileList();
  }
}

function updateDropzoneFileList() {
  const listEl = document.getElementById('dropzone-file-list');
  const promptEl = document.getElementById('dropzone-text');
  if (!listEl) return;

  if (selectedTorrentFiles.length > 0) {
    if (promptEl) promptEl.style.display = 'none';
    listEl.innerHTML = `<div style="color:#58a6ff;margin-bottom:4px;">${t('dropzone_files_selected', { n: selectedTorrentFiles.length })}</div>` +
      selectedTorrentFiles.map(f => `<div>📄 ${esc(f.name)} <span style="color:var(--text-muted);font-weight:normal;">(${formatSize(f.size)})</span></div>`).join('');
  } else {
    if (promptEl) promptEl.style.display = 'block';
    listEl.innerHTML = '';
  }
}

async function submitTorrentUpload() {
  const statusMsg = document.getElementById('upload-status-msg');
  const submitBtn = document.getElementById('btn-submit-upload');
  const spinner = document.getElementById('upload-spinner');
  const btnText = document.getElementById('upload-btn-text');

  const catSel = document.getElementById('upload-category');
  const modeSel = document.getElementById('upload-transfer-mode');
  const magnetInput = document.getElementById('upload-magnet-text');
  const ddlInput = document.getElementById('upload-ddl-text');
  const ddlPwd = document.getElementById('upload-ddl-password');

  const category = catSel ? catSel.value : 'torrent-direct';
  const transferMode = modeSel ? modeSel.value : 'auto';
  const magnetVal = magnetInput ? magnetInput.value.trim() : '';
  const ddlVal = ddlInput ? ddlInput.value.trim() : '';

  if (currentUploadTab === 'magnet' && !magnetVal) {
    if (statusMsg) {
      statusMsg.className = 'upload-msg-error';
      statusMsg.textContent = t('err_no_input');
      statusMsg.style.display = 'block';
    }
    return;
  }

  if (currentUploadTab === 'file' && (!selectedTorrentFiles || selectedTorrentFiles.length === 0)) {
    if (statusMsg) {
      statusMsg.className = 'upload-msg-error';
      statusMsg.textContent = t('err_no_input');
      statusMsg.style.display = 'block';
    }
    return;
  }

  if (currentUploadTab === 'ddl' && !ddlVal) {
    if (statusMsg) {
      statusMsg.className = 'upload-msg-error';
      statusMsg.textContent = 'Veuillez saisir au moins un lien direct à débrider.';
      statusMsg.style.display = 'block';
    }
    return;
  }

  const fd = new FormData();
  fd.append('category', category);
  fd.append('transfer_mode', transferMode);

  if (currentUploadTab === 'magnet') {
    fd.append('magnet', magnetVal);
  } else if (currentUploadTab === 'file') {
    for (const file of selectedTorrentFiles) {
      fd.append('torrent_files', file, file.name);
    }
  } else if (currentUploadTab === 'ddl') {
    fd.append('ddl_links', ddlVal);
    if (ddlPwd && ddlPwd.value.trim()) fd.append('ddl_password', ddlPwd.value.trim());
    const ddlDestInput = document.getElementById('upload-ddl-dest-path');
    const ddlRemChk = document.getElementById('upload-ddl-remember-dest');
    if (ddlDestInput && ddlDestInput.value.trim()) {
      fd.append('ddl_destination', ddlDestInput.value.trim());
    }
    if (ddlRemChk && ddlRemChk.checked) {
      fd.append('ddl_remember_default', 'true');
      const pageDest = document.getElementById('ddl-page-dest-path');
      if (pageDest) pageDest.value = ddlDestInput.value.trim();
      const cfgDest = document.getElementById('ddl_download_dir');
      if (cfgDest) cfgDest.value = ddlDestInput.value.trim();
    }
  }

  if (submitBtn) submitBtn.disabled = true;
  if (spinner) spinner.style.display = 'inline-block';
  if (btnText) btnText.textContent = t('upload_sending');
  if (statusMsg) {
    statusMsg.style.display = 'none';
    statusMsg.textContent = '';
  }

  try {
    const res = await fetch('/api/torrents/upload', {
      method: 'POST',
      body: fd,
    });
    const data = await res.json();
    if (res.ok && (data.status === 'success' || data.status === 'ok')) {
      closeUploadModal();
      await refreshQueue();
    } else {
      const err = data.message || data.detail || t('err_upload_failed');
      if (statusMsg) {
        statusMsg.className = 'upload-msg-error';
        statusMsg.textContent = err;
        statusMsg.style.display = 'block';
      }
    }
  } catch (err) {
    if (statusMsg) {
      statusMsg.className = 'upload-msg-error';
      statusMsg.textContent = `${t('err_upload_failed')} (${err.message || err})`;
      statusMsg.style.display = 'block';
    }
  } finally {
    if (submitBtn) submitBtn.disabled = false;
    if (spinner) spinner.style.display = 'none';
    if (btnText) btnText.textContent = t('btn_send_debrid');
  }
}

async function submitDdlPageUpload() {
  const linksEl = document.getElementById('ddl-page-links');
  const pwdEl = document.getElementById('ddl-page-password');
  const catEl = document.getElementById('ddl-page-category');
  const statusEl = document.getElementById('ddl-page-status-msg');
  const btnEl = document.getElementById('btn-submit-ddl-page');
  const spinnerEl = document.getElementById('ddl-page-spinner');

  const linksVal = linksEl ? linksEl.value.trim() : '';
  if (!linksVal) {
    if (statusEl) {
      statusEl.className = 'upload-msg-error';
      statusEl.textContent = 'Veuillez saisir au moins un lien direct à débrider.';
      statusEl.style.display = 'block';
    }
    return;
  }

  const fd = new FormData();
  fd.append('links', linksVal);
  if (pwdEl && pwdEl.value.trim()) fd.append('password', pwdEl.value.trim());
  if (catEl) fd.append('category', catEl.value);

  const destEl = document.getElementById('ddl-page-dest-path');
  const remEl = document.getElementById('ddl-page-remember-dest');
  if (destEl && destEl.value.trim()) {
    fd.append('destination', destEl.value.trim());
  }
  if (remEl && remEl.checked) {
    fd.append('remember_default', 'true');
    const modalDest = document.getElementById('upload-ddl-dest-path');
    if (modalDest) modalDest.value = destEl.value.trim();
    const cfgDest = document.getElementById('ddl_download_dir');
    if (cfgDest) cfgDest.value = destEl.value.trim();
  }

  if (btnEl) btnEl.disabled = true;
  if (spinnerEl) spinnerEl.style.display = 'inline-block';
  if (statusEl) statusEl.style.display = 'none';

  try {
    const res = await fetch('/api/ddl/upload', {
      method: 'POST',
      body: fd,
    });
    const data = await res.json();
    if (res.ok && data.status === 'ok') {
      if (statusEl) {
        statusEl.className = 'upload-msg-success';
        statusEl.textContent = data.message || `${data.added} lien(s) DDL ajouté(s) !`;
        statusEl.style.display = 'block';
      }
      if (linksEl) linksEl.value = '';
      if (pwdEl) pwdEl.value = '';
      await refreshQueue();
    } else {
      if (statusEl) {
        statusEl.className = 'upload-msg-error';
        statusEl.textContent = data.message || 'Erreur lors de l\'ajout des liens DDL.';
        statusEl.style.display = 'block';
      }
    }
  } catch (err) {
    if (statusEl) {
      statusEl.className = 'upload-msg-error';
      statusEl.textContent = 'Erreur réseau : ' + err.message;
      statusEl.style.display = 'block';
    }
  } finally {
    if (btnEl) btnEl.disabled = false;
    if (spinnerEl) spinnerEl.style.display = 'none';
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


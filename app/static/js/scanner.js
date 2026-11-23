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
  const btnForce = document.getElementById('btn-force-scan');
  const btnStop = document.getElementById('btn-stop-scan');
  const spinner = document.getElementById('scan-btn-spinner');
  const text = document.getElementById('scan-btn-text');
  const progContainer = document.getElementById('scanner-progress-container');
  const progStage = document.getElementById('scanner-progress-stage');
  const progPercent = document.getElementById('scanner-progress-percent');
  const progFill = document.getElementById('scanner-progress-fill');

  if (btn) btn.disabled = scanning;
  if (btnForce) btnForce.disabled = scanning;
  if (btnStop) btnStop.style.display = scanning ? 'inline-block' : 'none';
  if (spinner) spinner.style.display = scanning ? 'inline' : 'none';
  if (text) text.textContent = scanning ? (percent > 0 ? (currentLang === 'en' ? `Scanning... (${percent}%)` : `Scan en cours... (${percent}%)`) : (currentLang === 'en' ? 'Scanning...' : 'Scan en cours...')) : t('btn_scan_now');

  if (progContainer) {
    if (scanning) {
      progContainer.style.display = 'block';
      if (progStage) progStage.textContent = stage || (currentLang === 'en' ? 'Starting scan...' : 'Démarrage du scan...');
      if (progPercent) progPercent.textContent = (percent || 0) + '%';
      if (progFill) progFill.style.width = (percent || 0) + '%';
    } else {
      if (progPercent) progPercent.textContent = '100%';
      if (progFill) progFill.style.width = '100%';
      if (progStage) progStage.textContent = t('scan_finished_success');
      setTimeout(() => {
        if (!isScanning) progContainer.style.display = 'none';
      }, 1500);
    }
  }
}

async function triggerScannerScan(forceFull = false) {
  setScanButtonScanning(true, 5, forceFull ? (currentLang === 'en' ? 'Starting full scan...' : 'Démarrage du scan complet...') : (currentLang === 'en' ? 'Starting scan...' : 'Démarrage du scan...'));
  try {
    const url = forceFull ? '/api/scanner/start?force=true&force_full=true' : '/api/scanner/start?force=true';
    await fetch(url, { method: 'POST' });
    isScanning = true;
    pollScannerStatus();
  } catch (err) {
    alert((currentLang === 'en' ? 'Error starting scan: ' : 'Erreur lors du lancement du scan : ') + err);
    setScanButtonScanning(false);
  }
}

async function stopScannerScan() {
  const btnStop = document.getElementById('btn-stop-scan');
  if (btnStop) {
    btnStop.disabled = true;
    btnStop.innerHTML = '<span>⏳ </span>' + t('btn_scan_stop');
  }
  try {
    await fetch('/api/scanner/stop', { method: 'POST' });
    isScanning = false;
    setScanButtonScanning(false);
    if (scannerPollTimer) clearTimeout(scannerPollTimer);
    const progStage = document.getElementById('scanner-progress-stage');
    if (progStage) progStage.textContent = t('scan_interrupted_user');
    const progContainer = document.getElementById('scanner-progress-container');
    setTimeout(() => {
      if (!isScanning && progContainer) progContainer.style.display = 'none';
    }, 2000);
    await loadScannerData();
  } catch (err) {
    alert((currentLang === 'en' ? 'Error interrupting scan: ' : 'Erreur lors de l\'interruption du scan : ') + err);
  } finally {
    if (btnStop) {
      btnStop.disabled = false;
      btnStop.innerHTML = '<span>⏹️ </span>' + t('btn_scan_stop');
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
      const stage = prog.stage || (currentLang === 'en' ? 'Scanning...' : 'Scan en cours...');
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
    lastTimeEl.textContent = `${t('last_scan_prefix')}${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
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

  tbody.innerHTML = deadList.map((item, idx) => {
    let mediaBadge = `<span class="badge-tag unlinked">${esc(t('media_unknown'))}</span>`;
    let researchBtn = '';

    if (item.media_type === 'radarr' && item.media_id) {
      mediaBadge = `<span class="badge-tag radarr">🎬 Radarr</span> <strong>${esc(item.media_title || item.filename)}</strong>`;
      researchBtn = `<button type="button" class="btn-sec" style="color:#f5a623;border-color:#f5a623;" onclick="onResearchDeadLinkClick(${idx})">${esc(t('btn_retrigger_radarr'))}</button>`;
    } else if (item.media_type === 'sonarr' && item.media_id) {
      mediaBadge = `<span class="badge-tag sonarr">📺 Sonarr</span> <strong>${esc(item.media_title || item.filename)}</strong>`;
      researchBtn = `<button type="button" class="btn-sec" style="color:#58a6ff;border-color:#58a6ff;" onclick="onResearchDeadLinkClick(${idx})">${esc(t('btn_retrigger_sonarr'))}</button>`;
    } else if (item.media_type === 'whisparr' && item.media_id) {
      mediaBadge = `<span class="badge-tag whisparr">🔞 Whisparr</span> <strong>${esc(item.media_title || item.filename)}</strong>`;
      researchBtn = `<button type="button" class="btn-sec" style="color:#e066ff;border-color:#e066ff;" onclick="onResearchDeadLinkClick(${idx})">${esc(t('btn_retrigger_whisparr'))}</button>`;
    } else {
      researchBtn = `<button type="button" class="btn-sec" style="color:#58a6ff;border-color:#58a6ff;font-size:11px;padding:4px 8px;display:inline-flex;align-items:center;gap:4px;" onclick="onSearchDeadLinkAlternative(${idx})" title="${esc(t('tip_search_alternative'))}"><span>🔍</span> <span>${esc(t('btn_search'))}</span></button>`;
    }

    return `<tr>
      <td>${mediaBadge}</td>
      <td style="font-family:monospace;font-size:12px;word-break:break-all;">${esc(item.path)}</td>
      <td style="font-family:monospace;font-size:11px;color:#f85149;word-break:break-all;">${esc(item.target || t('missing_target'))}</td>
      <td style="display:flex;gap:6px;align-items:center;">
        ${researchBtn}
        <button type="button" class="btn-del" onclick="onCleanDeadSymlinkClick(${idx})">${esc(t('btn_purge'))}</button>
      </td>
    </tr>`;
  }).join('');
}

function onResearchDeadLinkClick(idx) {
  const item = (scannerData.dead_symlinks || [])[idx];
  if (!item) return;
  researchDeadLink(item.media_type, item.media_id, item.path);
}

function onCleanDeadSymlinkClick(idx) {
  const item = (scannerData.dead_symlinks || [])[idx];
  if (!item) return;
  cleanDeadSymlink(item.path);
}

function onSearchDeadLinkAlternative(idx) {
  const item = (scannerData.dead_symlinks || [])[idx];
  if (!item) return;
  const name = item.media_title || item.filename || '';
  if (!name) return;
  if (typeof searchAlternative === 'function') {
    searchAlternative(name);
  } else {
    showTab('finder');
    const input = document.getElementById('finder_query');
    if (input) {
      input.value = name;
      input.focus();
    }
    if (typeof runFinderSearch === 'function') {
      runFinderSearch();
    }
  }
}

function searchScannerMagnetAlternative(magId) {
  let magName = '';
  if (scannerData && scannerData.grouped_magnets) {
    for (const mags of Object.values(scannerData.grouped_magnets)) {
      const found = mags.find(m => m.id === magId);
      if (found) {
        magName = found.name;
        break;
      }
    }
  }
  if (!magName) return;
  if (typeof searchAlternative === 'function') {
    searchAlternative(magName);
  } else {
    showTab('finder');
    const input = document.getElementById('finder_query');
    if (input) {
      input.value = magName;
      input.focus();
    }
    if (typeof runFinderSearch === 'function') {
      runFinderSearch();
    }
  }
}

async function researchDeadLink(mediaType, mediaId, path) {
  if (!confirm(t('confirm_research_dead', { mediaType: mediaType.toUpperCase() }))) return;
  try {
    const res = await fetch('/api/scanner/research', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ media_type: mediaType, media_id: mediaId, dead_path: path })
    });
    const data = await res.json();
    if (data.status === 'success') {
      alert(currentLang === 'en' ? `Search successfully retriggered in ${mediaType.toUpperCase()}!` : `Recherche relancée avec succès dans ${mediaType.toUpperCase()} !`);
      loadScannerData();
    } else {
      alert((currentLang === 'en' ? 'Error: ' : 'Erreur : ') + data.message);
    }
  } catch (e) {
    alert((currentLang === 'en' ? 'Network error during search: ' : 'Erreur réseau lors de la relance : ') + e);
  }
}

async function cleanDeadSymlink(path) {
  const item = (scannerData.dead_symlinks || []).find(d => d.path === path);
  const mediaType = item && item.media_type && item.media_type !== 'unknown' ? item.media_type.toUpperCase() : null;
  const mediaTitle = item && item.media_title ? ` (${item.media_title})` : '';

  if (!confirm(t('confirm_clean_single_dead'))) return;

  let deleteFromArr = false;
  if (mediaType) {
    deleteFromArr = confirm(
      t('confirm_delete_media_arr', { mediaType: mediaType, mediaTitle: mediaTitle })
    );
  }

  try {
    const res = await fetch('/api/scanner/clean_dead_symlinks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths: [path], delete_from_arr: deleteFromArr })
    });
    const data = await res.json();
    let msg = currentLang === 'en' ? `${data.deleted} link(s) deleted on disk.` : `${data.deleted} lien(s) supprimé(s) sur le disque.`;
    if (data.deleted_ad > 0) {
      msg += currentLang === 'en' ? `\n${data.deleted_ad} orphaned magnet(s) purged on provider.` : `\n${data.deleted_ad} magnet(s) orphelin(s) purgé(s) sur le fournisseur.`;
    }
    if (data.deleted_arr > 0) {
      msg += currentLang === 'en' ? `\n${data.deleted_arr} item(s) deleted in ${mediaType || 'Radarr/Sonarr'}.` : `\n${data.deleted_arr} élément(s) supprimé(s) dans ${mediaType || 'Radarr/Sonarr'}.`;
    }
    alert(msg);
    loadScannerData();
  } catch (e) {
    alert((currentLang === 'en' ? 'Error: ' : 'Erreur : ') + e);
  }
}

async function researchAllDeadLinks() {
  const matched = (scannerData.dead_symlinks || []).filter(d => d.media_type === 'radarr' || d.media_type === 'sonarr' || d.media_type === 'whisparr');
  if (matched.length === 0) return alert(t('no_dead_arr'));
  if (!confirm(t('confirm_research_all_dead', { n: matched.length }))) return;

  const btn = document.getElementById('btn-research-all');
  if (btn) { btn.disabled = true; btn.textContent = currentLang === 'en' ? 'Processing...' : 'Traitement en cours...'; }

  try {
    const res = await fetch('/api/scanner/research_all_dead', { method: 'POST' });
    const data = await res.json();
    alert(data.message || (currentLang === 'en' ? `${data.count} search(es) retriggered!` : `${data.count} recherche(s) relancée(s) !`));
    loadScannerData();
  } catch (e) {
    alert((currentLang === 'en' ? 'Error: ' : 'Erreur : ') + e);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = t('btn_research_all'); }
  }
}

async function cleanAllDeadSymlinks() {
  const total = (scannerData.dead_symlinks || []).length;
  if (total === 0) return alert(t('no_dead_to_delete'));
  if (!confirm(t('confirm_clean_all_dead', { n: total }))) return;

  const arrItems = (scannerData.dead_symlinks || []).filter(d => d.media_type === 'radarr' || d.media_type === 'sonarr');
  let deleteFromArr = false;
  if (arrItems.length > 0) {
    deleteFromArr = confirm(t('confirm_delete_from_arr', { n: arrItems.length }));
  }

  try {
    const res = await fetch('/api/scanner/clean_dead_symlinks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delete_from_arr: deleteFromArr })
    });
    const data = await res.json();
    let msg = currentLang === 'en' ? `${data.deleted} dead link(s) purged on disk!` : `${data.deleted} lien(s) mort(s) purgé(s) sur le disque !`;
    if (data.deleted_ad > 0) {
      msg += currentLang === 'en' ? `\n${data.deleted_ad} orphaned magnet(s) purged on provider.` : `\n${data.deleted_ad} magnet(s) orphelin(s) purgé(s) sur le fournisseur.`;
    }
    if (data.deleted_arr > 0) {
      msg += currentLang === 'en' ? `\n${data.deleted_arr} media deleted in Radarr / Sonarr.` : `\n${data.deleted_arr} média(s) supprimé(s) dans Radarr / Sonarr.`;
    }
    alert(msg);
    loadScannerData();
  } catch (e) {
    alert((currentLang === 'en' ? 'Error: ' : 'Erreur : ') + e);
  }
}


function renderMagnetsList(grouped) {
  const container = document.getElementById('magnets-list-container');
  const groupKeys = Object.keys(grouped);

  if (groupKeys.length === 0) {
    container.innerHTML = `<div style="color:var(--text-muted);text-align:center;padding:25px;">${esc(t('msg_no_magnets'))}</div>`;
    return;
  }

  let html = '';
  groupKeys.forEach((normTitle, gIdx) => {
    const mags = grouped[normTitle];
    const isSingle = mags.length === 1;
    const groupId = 'group-' + gIdx;

    if (isSingle) {
      const mag = mags[0];
      const localBadge = mag.is_local
        ? `<span class="badge-tag local">${esc(t('tag_symlinked'))}</span>`
        : (mag.is_dead
            ? `<span class="badge-tag dead">${esc(t('tag_dead_api'))}</span>`
            : `<span class="badge-tag unlinked">${esc(t('tag_not_symlinked'))}</span>`);
      const deadBadge = (mag.is_dead && mag.is_local) ? `<span class="badge-tag dead">${esc(t('tag_dead_api'))}</span>` : '';

      html += `<div class="mag-group sc-mag-card" id="mag-single-${mag.id}" data-title="${esc(normTitle.toLowerCase())} ${esc(mag.name.toLowerCase())}" data-dead="${mag.is_dead ? '1':'0'}" data-local="${mag.is_local ? '1':'0'}" data-dup="0">
        <div class="mag-item" data-dead="${mag.is_dead ? '1':'0'}" data-local="${mag.is_local ? '1':'0'}">
          <div class="mag-info-left">
            <input type="checkbox" class="sc-mag-chk" value="${mag.id}" data-name="${esc(mag.name)}">
            <div>
              <div style="font-weight:600;font-size:13px;word-break:break-word;overflow-wrap:anywhere;">${esc(mag.name)} <a href="javascript:void(0)" onclick="searchScannerMagnetAlternative(${mag.id})" title="${esc(t('tip_search_alternative'))}" style="text-decoration:none;font-size:12px;opacity:0.85;">🔍</a></div>
              <div class="mag-meta">
                <span>ID: #${mag.id}</span>
                <span>${esc(t('meta_size'))} ${formatSize(mag.size)}</span>
                <span>${esc(t('meta_status'))} ${mag.statusCode}</span>
                ${localBadge} ${deadBadge}
              </div>
            </div>
          </div>
          <div class="mag-actions">
            <button type="button" class="btn-sec" onclick="searchScannerMagnetAlternative(${mag.id})" style="font-size:11px;padding:4px 8px;display:inline-flex;align-items:center;gap:4px;color:#58a6ff;border-color:rgba(88,166,255,0.4);" title="${esc(t('tip_search_alternative'))}"><span>🔍</span> <span>${esc(t('btn_search'))}</span></button>
            <button type="button" class="btn-sec" onclick="downloadScannerMagnet(${mag.id}, '${esc(mag.name)}', '${esc(mag.hash || '')}', ${mag.size || 0})" style="font-size:11px;padding:4px 8px;display:inline-flex;align-items:center;gap:4px;" title="Basculer en téléchargement réel sur le serveur"><span>📥</span> <span>${esc(t('btn_download') || 'Télécharger')}</span></button>
            <button type="button" class="btn-del" onclick="deleteSingleMagnet(${mag.id}, '${esc(mag.name)}')">${esc(t('btn_delete'))}</button>
          </div>
        </div>
      </div>`;
    } else {
      let childrenHtml = '';
      mags.forEach((mag, idx) => {
        const isBest = idx === 0 ? `<span style="color:#58a6ff;font-size:11px;">${esc(t('tag_kept_default'))}</span>` : '';
        const localBadge = mag.is_local
          ? `<span class="badge-tag local">${esc(t('tag_symlinked'))}</span>`
          : (mag.is_dead
              ? `<span class="badge-tag dead">${esc(t('tag_dead_api'))}</span>`
              : `<span class="badge-tag unlinked">${esc(t('tag_not_symlinked'))}</span>`);
        const deadBadge = (mag.is_dead && mag.is_local) ? `<span class="badge-tag dead">${esc(t('tag_dead_api'))}</span>` : '';

        childrenHtml += `<div class="mag-item sc-mag-child" id="mag-child-${mag.id}" data-dead="${mag.is_dead ? '1':'0'}" data-local="${mag.is_local ? '1':'0'}">
          <div class="mag-info-left">
            <input type="checkbox" class="sc-mag-chk" value="${mag.id}" data-name="${esc(mag.name)}" ${idx > 0 ? 'data-isdup="1"' : ''}>
            <div>
              <div style="font-weight:500;font-size:13px;word-break:break-word;overflow-wrap:anywhere;">${esc(mag.name)} ${isBest} <a href="javascript:void(0)" onclick="searchScannerMagnetAlternative(${mag.id})" title="${esc(t('tip_search_alternative'))}" style="text-decoration:none;font-size:12px;opacity:0.85;">🔍</a></div>
              <div class="mag-meta">
                <span>ID: #${mag.id}</span>
                <span>${esc(t('meta_size'))} ${formatSize(mag.size)}</span>
                <span>${esc(t('meta_status'))} ${mag.statusCode}</span>
                ${localBadge} ${deadBadge}
              </div>
            </div>
          </div>
          <div class="mag-actions">
            <button type="button" class="btn-sec" onclick="searchScannerMagnetAlternative(${mag.id})" style="font-size:11px;padding:4px 8px;display:inline-flex;align-items:center;gap:4px;color:#58a6ff;border-color:rgba(88,166,255,0.4);" title="${esc(t('tip_search_alternative'))}"><span>🔍</span> <span>${esc(t('btn_search'))}</span></button>
            <button type="button" class="btn-sec" onclick="downloadScannerMagnet(${mag.id}, '${esc(mag.name)}', '${esc(mag.hash || '')}', ${mag.size || 0})" style="font-size:11px;padding:4px 8px;display:inline-flex;align-items:center;gap:4px;" title="Basculer en téléchargement réel sur le serveur"><span>📥</span> <span>${esc(t('btn_download') || 'Télécharger')}</span></button>
            <button type="button" class="btn-del" onclick="deleteSingleMagnet(${mag.id}, '${esc(mag.name)}')">${esc(t('btn_delete'))}</button>
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

async function downloadScannerMagnet(id, name, hash, size) {
  try {
    const res = await fetch('/api/scanner/download_magnet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name, hash, size })
    });
    const data = await res.json();
    if (res.ok && data.status === 'success') {
      alert(data.message || `'${name}' basculé dans les téléchargements !`);
      refreshQueue();
    } else {
      alert((currentLang === 'en' ? 'Error: ' : 'Erreur : ') + (data.message || 'Échec du transfert'));
    }
  } catch (e) {
    alert((currentLang === 'en' ? 'Network error: ' : 'Erreur réseau : ') + e.message);
  }
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
      const hasUnlinked = (card.getAttribute('data-local') === '0' && card.getAttribute('data-dead') !== '1')
        || card.querySelector('[data-local="0"][data-dead="0"]') !== null;
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
  if (btn) btn.textContent = allMagnetsExpanded ? t('btn_collapse_all') : t('btn_expand_all');
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
  if (btn) btn.textContent = allChecked ? t('btn_check_visible') : t('btn_uncheck_all');
}

async function deleteSingleMagnet(id, name) {
  if (!confirm(t('confirm_delete_magnet', { name: name }))) return;
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
      alert((currentLang === 'en' ? 'Error: ' : 'Erreur : ') + (data.message || (currentLang === 'en' ? 'Deletion failed' : 'Échec de la suppression')));
    }
  } catch (e) {
    alert((currentLang === 'en' ? 'Error during deletion: ' : 'Erreur lors de la suppression : ') + e);
  }
}

async function deleteSelectedMagnets() {
  const checked = Array.from(document.querySelectorAll('.sc-mag-chk:checked')).map(c => ({
    id: c.value,
    name: c.dataset.name || ''
  }));
  if (checked.length === 0) return alert(t('no_mags_selected'));
  if (!confirm(t('confirm_delete_checked_mags', { n: checked.length }))) return;

  const btn = document.getElementById('btn-del-selected-mags');
  if (btn) { btn.disabled = true; btn.textContent = currentLang === 'en' ? 'Deleting...' : 'Suppression...'; }

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
      alert((currentLang === 'en' ? 'Error: ' : 'Erreur : ') + (data.message || (currentLang === 'en' ? 'Deletion failed' : 'Échec de la suppression')));
    }
  } catch (e) {
    alert((currentLang === 'en' ? 'Error: ' : 'Erreur : ') + e);
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

  if (duplicates.length === 0) return alert(t('no_dup_mags'));
  if (!confirm(t('confirm_clean_duplicates', { n: duplicates.length }))) return;

  try {
    const res = await fetch('/api/scanner/delete_magnets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: duplicates, delete_local: false })
    });
    const data = await res.json();
    if (data.status === 'success') {
      await loadScannerData();
      pollScannerStatus();
    } else {
      alert((currentLang === 'en' ? 'Error: ' : 'Erreur : ') + (data.message || (currentLang === 'en' ? 'Cleanup failed' : 'Échec du nettoyage')));
    }
  } catch (e) {
    alert((currentLang === 'en' ? 'Error: ' : 'Erreur : ') + e);
  }
}


// ==========================================
// RECHERCHE MULTI-MOTEURS (FINDER)
// ==========================================
let finderLastResults = [];
let finderLastRejected = [];

async function loadFinderSettings() {
  try {
    const res = await fetch('/api/finder/config');
    if (!res.ok) return;
    const data = await res.json();
    const cfg = data.config || {};

    const engines = cfg.engines || ['brave', 'yandex', 'yahoo', 'lite'];
    document.querySelectorAll('.finder-engine-cb').forEach(cb => {
      cb.checked = engines.includes(cb.value);
    });

    const modeSel = document.getElementById('finder_search_mode');
    if (modeSel && cfg.search_mode) modeSel.value = cfg.search_mode;

    const siteInput = document.getElementById('finder_site_filter');
    if (siteInput && cfg.site_filter) siteInput.value = cfg.site_filter;

    const regSel = document.getElementById('finder_region');
    if (regSel && cfg.region) regSel.value = cfg.region;

    const safeSel = document.getElementById('finder_safesearch');
    if (safeSel && cfg.safesearch) safeSel.value = cfg.safesearch;

    const maxRes = document.getElementById('finder_max_results');
    if (maxRes && cfg.max_results) maxRes.value = cfg.max_results;

    const maxScrape = document.getElementById('finder_max_scrape');
    if (maxScrape && cfg.max_pages_to_scrape) maxScrape.value = cfg.max_pages_to_scrape;

    const minSim = document.getElementById('finder_min_sim');
    if (minSim && cfg.min_similarity !== undefined) minSim.value = cfg.min_similarity;

    const timeoutInput = document.getElementById('finder_timeout');
    if (timeoutInput && cfg.timeout) timeoutInput.value = cfg.timeout;

    const verifyCb = document.getElementById('finder_verify_links');
    if (verifyCb && cfg.verify_links !== undefined) verifyCb.checked = !!cfg.verify_links;

  } catch (err) {
    console.error('Erreur chargement config finder:', err);
  }
}

function getFinderParams() {
  const selectedEngines = [];
  document.querySelectorAll('.finder-engine-cb:checked').forEach(cb => {
    selectedEngines.push(cb.value);
  });

  return {
    query: (document.getElementById('finder_query')?.value || '').trim(),
    search_mode: document.getElementById('finder_search_mode')?.value || 'torrent',
    site_filter: (document.getElementById('finder_site_filter')?.value || '').trim(),
    region: document.getElementById('finder_region')?.value || 'fr-fr',
    safesearch: document.getElementById('finder_safesearch')?.value || 'off',
    max_results: parseInt(document.getElementById('finder_max_results')?.value || '25', 10),
    max_pages_to_scrape: parseInt(document.getElementById('finder_max_scrape')?.value || '18', 10),
    min_similarity: parseInt(document.getElementById('finder_min_sim')?.value || '10', 10),
    timeout: parseInt(document.getElementById('finder_timeout')?.value || '8', 10),
    verify_links: !!document.getElementById('finder_verify_links')?.checked,
    engines: selectedEngines
  };
}

async function saveFinderDefaultSettings() {
  const p = getFinderParams();
  const payload = {
    search_mode: p.search_mode,
    site_filter: p.site_filter,
    region: p.region,
    safesearch: p.safesearch,
    max_results: p.max_results,
    max_pages_to_scrape: p.max_pages_to_scrape,
    min_similarity: p.min_similarity,
    timeout: p.timeout,
    verify_links: p.verify_links,
    engines: p.engines
  };

  const msgEl = document.getElementById('finder-save-msg');
  if (msgEl) msgEl.textContent = 'Enregistrement...';

  try {
    const res = await fetch('/api/finder/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      if (msgEl) {
        msgEl.textContent = '✓ ' + (currentLang === 'en' ? 'Saved as default!' : 'Enregistré comme défaut !');
        setTimeout(() => { if (msgEl) msgEl.textContent = ''; }, 3000);
      }
    } else {
      if (msgEl) msgEl.textContent = '❌ Erreur';
    }
  } catch (err) {
    if (msgEl) msgEl.textContent = '❌ ' + err;
  }
}

async function runFinderSearch() {
  const params = getFinderParams();
  if (!params.query) {
    alert(currentLang === 'en' ? 'Please enter a search query' : 'Veuillez saisir un terme de recherche');
    document.getElementById('finder_query')?.focus();
    return;
  }
  if (!params.engines || params.engines.length === 0) {
    alert(currentLang === 'en' ? 'Please select at least one search engine' : 'Veuillez cocher au moins un moteur de recherche');
    return;
  }

  const btn = document.getElementById('btn-finder-search');
  const spinner = document.getElementById('finder-spinner');
  const loader = document.getElementById('finder-loader');
  const resultsCard = document.getElementById('finder-results-card');

  if (btn) btn.disabled = true;
  if (spinner) spinner.style.display = 'inline-block';
  if (loader) loader.style.display = 'block';
  if (resultsCard) resultsCard.style.display = 'none';

  const startTime = Date.now();

  try {
    const res = await fetch('/api/finder/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    const data = await res.json();
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    if (!res.ok) {
      alert((currentLang === 'en' ? 'Search error: ' : 'Erreur de recherche : ') + (data.error || res.statusText));
      return;
    }

    finderLastResults = data.results || [];
    finderLastRejected = data.rejected || [];

    const statsEl = document.getElementById('finder-stats');
    if (statsEl) {
      const okCount = finderLastResults.length;
      const rejCount = finderLastRejected.length;
      const pagesCount = data.pages_scanned || 0;
      statsEl.innerHTML = `<span>🎯 <strong>${okCount}</strong> ${currentLang === 'en' ? 'valid results' : 'résultat(s) valide(s)'}</span> &nbsp;|&nbsp; <span>⚠️ ${rejCount} ${currentLang === 'en' ? 'rejected' : 'écarté(s)'}</span> &nbsp;|&nbsp; <span>📄 ${pagesCount} ${currentLang === 'en' ? 'pages analyzed' : 'pages analysées'}</span> &nbsp;|&nbsp; <span style="color:var(--text-muted);">${elapsed}s</span>`;
    }

    const warnBanner = document.getElementById('finder-warn-banner');
    if (warnBanner) {
      const errs = Object.entries(data.engine_errors || {});
      if (errs.length > 0) {
        warnBanner.style.display = 'block';
        warnBanner.innerHTML = '⚠️ ' + errs.map(([eng, msg]) => `<strong>${esc(eng)}:</strong> ${esc(msg)}`).join(' ; ');
      } else {
        warnBanner.style.display = 'none';
        warnBanner.textContent = '';
      }
    }

    const toggleRejBtn = document.getElementById('btn-finder-toggle-rejected');
    if (toggleRejBtn) {
      if (finderLastRejected.length > 0) {
        toggleRejBtn.style.display = 'inline-block';
        toggleRejBtn.textContent = (currentLang === 'en' ? 'Show rejected (' : 'Voir écartés (') + finderLastRejected.length + ')';
      } else {
        toggleRejBtn.style.display = 'none';
      }
    }

    const rejBox = document.getElementById('finder-rejected-box');
    if (rejBox) rejBox.style.display = 'none';

    renderFinderResultsList(finderLastResults);
    renderFinderRejectedList(finderLastRejected);

    if (resultsCard) resultsCard.style.display = 'block';

  } catch (err) {
    alert((currentLang === 'en' ? 'Search failed: ' : 'Échec de la recherche : ') + err);
  } finally {
    if (btn) btn.disabled = false;
    if (spinner) spinner.style.display = 'none';
    if (loader) loader.style.display = 'none';
  }
}

function renderFinderItemCard(item, index, isRejected = false) {
  const kind = (item.kind || 'hoster').toLowerCase();
  let kindBadge = '';
  if (kind === 'magnet') kindBadge = `<span class="finder-badge badge-magnet">🧲 Magnet</span>`;
  else if (kind === 'torrent') kindBadge = `<span class="finder-badge badge-torrent">📦 Torrent</span>`;
  else kindBadge = `<span class="finder-badge badge-hoster">🔗 DDL</span>`;

  const score = item.similarity || 0;
  const scoreBadge = `<span class="finder-badge badge-score">${score}%</span>`;

  const engines = (item.engines || []).map(e => `<span class="finder-badge badge-engine">${esc(e)}</span>`).join(' ');

  let statusBadge = '';
  if (item.verified) {
    const isOk = (item.status || '').toLowerCase().includes('ok') || (item.status || '').includes('200') || item.status === 'Valide';
    statusBadge = `<span class="finder-badge ${isOk ? 'badge-status-ok' : 'badge-status-warn'}">● ${esc(item.status || 'Vérifié')}</span>`;
  }

  const rejectBadge = isRejected && item.reject_reason ? `<span class="finder-badge badge-status-err">❌ ${esc(item.reject_reason)}</span>` : '';

  const rawUrl = item.url || '';
  const safeUrl = esc(rawUrl);
  const isMagnet = rawUrl.startsWith('magnet:?');
  const displayLink = isMagnet ? `${rawUrl.substring(0, 75)}...` : safeUrl;

  const title = esc(item.display_name || rawUrl || 'Lien trouvé');
  const snippet = item.snippet ? `<div class="finder-card-snippet">${esc(item.snippet)}</div>` : '';

  return `
    <div class="finder-card-item ${isRejected ? 'rejected' : ''}">
      ${!isRejected ? `<input type="checkbox" class="finder-card-cb finder-item-chk" data-idx="${index}">` : ''}
      <div class="finder-card-body">
        <div class="finder-card-header">
          ${kindBadge}
          ${scoreBadge}
          ${engines}
          ${statusBadge}
          ${rejectBadge}
        </div>
        <div class="finder-card-title">${title}</div>
        <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="finder-card-url" title="${safeUrl}">${displayLink}</a>
        ${snippet}
      </div>
      <div class="finder-card-actions">
        <button type="button" class="btn-sec" onclick="copyFinderByIndex(${index}, ${isRejected})" title="${currentLang === 'en' ? 'Copy link' : 'Copier le lien'}" style="padding:6px 10px; font-size:12px;">📋</button>
        <button type="button" class="btn-main" onclick="downloadFinderByIndex(${index}, this, ${isRejected})" style="padding:6px 12px; font-size:12px; display:inline-flex; align-items:center; gap:4px;">
          <span>⚡</span> <span>${currentLang === 'en' ? 'Download' : 'Télécharger'}</span>
        </button>
      </div>
    </div>
  `;
}

function renderFinderResultsList(results) {
  const container = document.getElementById('finder-results-list');
  if (!container) return;

  if (!results || results.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-muted); background:var(--bg-subpanel); border-radius:8px;">${currentLang === 'en' ? 'No valid results matching your criteria.' : 'Aucun résultat valide correspondant à vos critères.'}</div>`;
    return;
  }

  container.innerHTML = results.map((item, idx) => renderFinderItemCard(item, idx, false)).join('');
}

function renderFinderRejectedList(rejected) {
  const container = document.getElementById('finder-rejected-list');
  if (!container) return;

  container.innerHTML = rejected.map((item, idx) => renderFinderItemCard(item, idx, true)).join('');
}

function setFinderSelection(mode) {
  const checkboxes = document.querySelectorAll('.finder-item-chk');
  checkboxes.forEach(cb => {
    const idx = parseInt(cb.dataset.idx, 10);
    const item = finderLastResults[idx];
    if (!item) return;

    if (mode === 'all') cb.checked = true;
    else if (mode === 'none') cb.checked = false;
    else if (mode === 'magnet') cb.checked = (item.kind === 'magnet' || item.kind === 'torrent');
    else if (mode === 'ddl') cb.checked = (item.kind === 'hoster');
  });
}

function toggleFinderRejected() {
  const box = document.getElementById('finder-rejected-box');
  const btn = document.getElementById('btn-finder-toggle-rejected');
  if (!box) return;

  if (box.style.display === 'none' || !box.style.display) {
    box.style.display = 'block';
    if (btn) btn.textContent = (currentLang === 'en' ? 'Hide rejected' : 'Masquer écartés');
  } else {
    box.style.display = 'none';
    if (btn) btn.textContent = (currentLang === 'en' ? 'Show rejected (' : 'Voir écartés (') + (finderLastRejected.length) + ')';
  }
}

function copyFinderByIndex(index, isRejected = false) {
  const item = isRejected ? finderLastRejected[index] : finderLastResults[index];
  if (!item || !item.url) return;

  navigator.clipboard.writeText(item.url).then(() => {
    alert(currentLang === 'en' ? 'Link copied to clipboard!' : 'Lien copié dans le presse-papiers !');
  }).catch(() => {
    prompt(currentLang === 'en' ? 'Copy link:' : 'Copiez le lien :', item.url);
  });
}

function copyFinderSelected() {
  const checked = document.querySelectorAll('.finder-item-chk:checked');
  if (checked.length === 0) {
    alert(currentLang === 'en' ? 'Please select at least one item' : 'Veuillez cocher au moins un élément');
    return;
  }
  const urls = Array.from(checked).map(cb => {
    const idx = parseInt(cb.dataset.idx, 10);
    return finderLastResults[idx]?.url;
  }).filter(Boolean);

  navigator.clipboard.writeText(urls.join('\n')).then(() => {
    alert(currentLang === 'en' ? `${urls.length} link(s) copied!` : `${urls.length} lien(s) copié(s) dans le presse-papiers !`);
  }).catch(() => {
    prompt(currentLang === 'en' ? 'Copy links:' : 'Copiez les liens :', urls.join('\n'));
  });
}

async function downloadFinderByIndex(index, btn, isRejected = false) {
  const item = isRejected ? finderLastRejected[index] : finderLastResults[index];
  if (!item || !item.url) return;

  const catSel = document.getElementById('finder-dest-category');
  const category = catSel ? catSel.value : 'torrent-direct';

  const origText = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>⏳</span> ' + (currentLang === 'en' ? 'Adding...' : 'Ajout...');
  }

  try {
    const res = await fetch('/api/finder/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: category,
        items: [{ url: item.url, kind: item.kind, name: item.display_name }]
      })
    });
    const data = await res.json();
    if (res.ok && data.status === 'ok') {
      if (btn) {
        btn.innerHTML = '<span>✓</span> ' + (currentLang === 'en' ? 'Added!' : 'Ajouté !');
        btn.classList.remove('btn-main');
        btn.classList.add('btn-sec');
      }
      refreshQueue();
    } else {
      alert((currentLang === 'en' ? 'Error: ' : 'Erreur : ') + (data.message || data.detail || 'Failed'));
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = origText;
      }
    }
  } catch (err) {
    alert((currentLang === 'en' ? 'Error: ' : 'Erreur : ') + err);
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = origText;
    }
  }
}

async function downloadFinderSelected() {
  const checked = document.querySelectorAll('.finder-item-chk:checked');
  if (checked.length === 0) {
    alert(currentLang === 'en' ? 'Please select at least one item' : 'Veuillez sélectionner au moins un élément');
    return;
  }

  const items = Array.from(checked).map(cb => {
    const idx = parseInt(cb.dataset.idx, 10);
    const it = finderLastResults[idx];
    return it ? { url: it.url, kind: it.kind, name: it.display_name } : null;
  }).filter(Boolean);

  const catSel = document.getElementById('finder-dest-category');
  const category = catSel ? catSel.value : 'torrent-direct';

  const btn = document.getElementById('btn-finder-bulk-dl');
  const origText = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>⏳</span> ' + (currentLang === 'en' ? 'Adding to DebridFlow...' : 'Ajout en cours...');
  }

  try {
    const res = await fetch('/api/finder/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: category,
        items: items
      })
    });
    const data = await res.json();
    if (res.ok && data.status === 'ok') {
      alert(data.message || (currentLang === 'en' ? 'Downloads added to DebridFlow!' : 'Téléchargements ajoutés à DebridFlow !'));
      refreshQueue();
    } else {
      alert((currentLang === 'en' ? 'Error: ' : 'Erreur : ') + (data.message || data.detail || 'Failed'));
    }
  } catch (err) {
    alert((currentLang === 'en' ? 'Error: ' : 'Erreur : ') + err);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = origText;
    }
  }
}


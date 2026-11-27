// Initialisation au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
  const serverLang = document.documentElement.lang || localStorage.getItem('pyrdt_lang') || 'fr';
  setLanguage(serverLang);

  const serverTheme = document.documentElement.getAttribute('data-theme') || localStorage.getItem('pyrdt_theme') || 'dark';
  applyTheme(serverTheme);

  const urlParams = new URLSearchParams(window.location.search);
  const activeSubPage = sessionStorage.getItem('pyrdt_settings_page') || 'alldebrid';
  showSettingsPage(activeSubPage);

  const defMode = (window.OMNISYM_DEFAULT_SUBFOLDER_MODE || 'none').toLowerCase();
  const defCustom = window.OMNISYM_DEFAULT_SUBFOLDER_CUSTOM || '';
  const ddlPageModeEl = document.getElementById('ddl-page-subfolder-mode');
  if (ddlPageModeEl) ddlPageModeEl.value = defMode;
  const ddlPageCustomEl = document.getElementById('ddl-page-subfolder-custom');
  if (ddlPageCustomEl) ddlPageCustomEl.value = defCustom;
  if (typeof onDdlPageSubfolderChange === 'function') onDdlPageSubfolderChange();

  if (urlParams.has('saved')) {
    showTab('settings');
    try {
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (e) {}

    const alertEl = document.querySelector('.alert');
    if (alertEl) {
      setTimeout(() => {
        alertEl.style.transition = 'opacity 0.6s ease';
        alertEl.style.opacity = '0';
        setTimeout(() => {
          alertEl.style.display = 'none';
        }, 600);
      }, 4000);
    }
  }

  // Notification d'élément reçu via le partage Android PWA
  if (urlParams.has('shared')) {
    const itemName = urlParams.get('name') || '';
    const alertMsg = itemName ? `⚡ Nouveau téléchargement reçu via Android : ${decodeURIComponent(itemName)}` : '⚡ Téléchargement partagé reçu avec succès !';
    const banner = document.createElement('div');
    banner.style.cssText = 'position:fixed;top:20px;right:20px;z-index:99999;padding:12px 20px;background:#238636;color:#ffffff;border:1px solid #2ea043;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,0.6);font-weight:600;font-size:13px;display:flex;align-items:center;gap:8px;';
    banner.innerHTML = `<span>⚡</span> <span>${alertMsg}</span>`;
    document.body.appendChild(banner);
    setTimeout(() => {
      banner.style.transition = 'opacity 0.6s ease';
      banner.style.opacity = '0';
      setTimeout(() => banner.remove(), 600);
    }, 4500);
    try {
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (e) {}
  }

  // Ajout automatique si lien magnet ouvert directement via PWA Protocol Handler
  if (urlParams.has('magnet')) {
    const rawMag = urlParams.get('magnet');
    if (rawMag && rawMag.startsWith('magnet:')) {
      const formData = new FormData();
      formData.append('magnet', rawMag);
      formData.append('category', 'torrent-direct');
      formData.append('transfer_mode', 'download');
      fetch('/api/torrents/upload', { method: 'POST', body: formData })
        .then(r => r.json())
        .then(() => {
          refreshQueue();
          try { window.history.replaceState({}, document.title, window.location.pathname); } catch (e) {}
        })
        .catch(err => console.error('Erreur auto-ajout magnet:', err));
    }
  }

  const autoOb = (document.body.dataset.onboardingAuto === 'true' && !localStorage.getItem('pyrdt_onboarding_completed')) || urlParams.has('onboarding');
  if (autoOb && !urlParams.has('saved')) {
    openOnboarding(false);
    if (urlParams.has('onboarding')) {
      try {
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (e) {}
    }
  }

  const dropzone = document.getElementById('torrent-dropzone');
  if (dropzone) {
    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('dragover');
      });
    });
    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dragover');
      });
    });
    dropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      if (dt && dt.files && dt.files.length > 0) {
        selectedTorrentFiles = Array.from(dt.files).filter(f => f.name.endsWith('.torrent') || f.size > 0);
        updateDropzoneFileList();
      }
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOpen) {
      closeUploadModal();
      closeDeleteModal();
    }
  });

  const finderQueryInput = document.getElementById('finder_query');
  if (finderQueryInput) {
    finderQueryInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        runFinderSearch();
      }
    });
  }

  setInterval(refreshQueue, 2000);
  setInterval(() => {
    if (currentTab === 'scanner') {
      checkScannerStatusOnLoad();
    }
  }, 4000);
});

// Enregistrement du Service Worker PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('[OmniSym PWA] Service Worker actif (scope:', reg.scope, ')');
      })
      .catch((err) => {
        console.warn('[OmniSym PWA] Échec enregistrement Service Worker:', err);
      });
  });
}


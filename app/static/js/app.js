// Initialisation au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
  const serverLang = document.documentElement.lang || localStorage.getItem('pyrdt_lang') || 'fr';
  setLanguage(serverLang);

  const serverTheme = document.documentElement.getAttribute('data-theme') || localStorage.getItem('pyrdt_theme') || 'dark';
  applyTheme(serverTheme);

  const urlParams = new URLSearchParams(window.location.search);
  const activeSubPage = sessionStorage.getItem('pyrdt_settings_page') || 'alldebrid';
  showSettingsPage(activeSubPage);

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
        console.log('[DebridFlow PWA] Service Worker actif (scope:', reg.scope, ')');
      })
      .catch((err) => {
        console.warn('[DebridFlow PWA] Échec enregistrement Service Worker:', err);
      });
  });
}


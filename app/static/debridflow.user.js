// ==UserScript==
// @name         DebridFlow - 1-Click & Right-Click Downloader
// @namespace    https://github.com/billouetaudrey/debridflow
// @version      1.0.0
// @description  Envoyez n'importe quel lien (Magnet, Torrent, DDL 1fichier/Rapidgator/etc.) vers DebridFlow via clic-droit, raccourci Alt+Clic ou badge ⚡
// @author       DebridFlow
// @match        *://*/*
// @icon         https://raw.githubusercontent.com/billouetaudrey/debridflow/main/app/static/icons/icon-192.png
// @grant        GM_xmlhttpRequest
// @grant        GM_notification
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @connect      *
// @run-at       document-end
// ==/UserScript==

(function() {
  'use strict';

  // --- CONFIGURATION ---
  function getConfig() {
    return {
      serverUrl: (GM_getValue('df_server_url', 'http://localhost:6505') || 'http://localhost:6505').replace(/\/+$/, ''),
      category: GM_getValue('df_category', 'torrent-direct'),
      transferMode: GM_getValue('df_transfer_mode', 'download'),
      username: GM_getValue('df_username', ''),
      password: GM_getValue('df_password', ''),
      showBadges: GM_getValue('df_show_badges', true),
      enableAltClick: GM_getValue('df_enable_alt_click', true)
    };
  }

  // Enregistrement des commandes dans le menu Tampermonkey
  GM_registerMenuCommand("🌐 Définir l'URL DebridFlow", () => {
    const cur = getConfig().serverUrl;
    const url = prompt("Adresse de votre serveur DebridFlow :\n(Ex: http://192.168.1.50:6505 ou https://df.mondomaine.ovh)", cur);
    if (url !== null && url.trim()) {
      GM_setValue('df_server_url', url.trim());
      showToast("URL mise à jour : " + url.trim(), "success");
    }
  });

  GM_registerMenuCommand("📁 Définir la catégorie par défaut", () => {
    const cur = getConfig().category;
    const cat = prompt("Catégorie par défaut (ex: torrent-direct, films, series, radarr) :", cur);
    if (cat !== null && cat.trim()) {
      GM_setValue('df_category', cat.trim());
      showToast("Catégorie mise à jour : " + cat.trim(), "success");
    }
  });

  GM_registerMenuCommand("⚡ Mode de transfert (download / symlink)", () => {
    const cur = getConfig().transferMode;
    const next = cur === 'download' ? 'symlink' : 'download';
    GM_setValue('df_transfer_mode', next);
    showToast(`Mode de transfert basculé sur : ${next.toUpperCase()}`, "info");
  });

  GM_registerMenuCommand("🔐 Identifiants API (si authentification requise)", () => {
    const curU = getConfig().username;
    const u = prompt("Nom d'utilisateur DebridFlow (laisser vide si aucun) :", curU);
    if (u !== null) {
      GM_setValue('df_username', u.trim());
      const p = prompt("Mot de passe DebridFlow (laisser vide si aucun) :", getConfig().password);
      if (p !== null) {
        GM_setValue('df_password', p.trim());
        showToast("Identifiants enregistrés !", "success");
      }
    }
  });

  // --- STYLES CSS INJECTÉS ---
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    .df-toast {
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 2147483647;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 18px;
      background: #0d1117;
      color: #e6edf3;
      border: 1px solid #30363d;
      border-radius: 8px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.6);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 13px;
      font-weight: 500;
      opacity: 0;
      transform: translateY(-10px);
      transition: all 0.25s ease;
      pointer-events: none;
    }
    .df-toast.show {
      opacity: 1;
      transform: translateY(0);
    }
    .df-toast.success { border-color: #238636; }
    .df-toast.error { border-color: #da3633; color: #ff7b72; }
    .df-toast.info { border-color: #1f6feb; }
    .df-toast-icon { font-size: 16px; }

    /* Menu contextuel DebridFlow */
    #df-context-menu {
      position: fixed;
      z-index: 2147483646;
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 8px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.7);
      padding: 6px;
      min-width: 220px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 13px;
      color: #e6edf3;
      user-select: none;
    }
    .df-menu-header {
      padding: 6px 10px 8px 10px;
      border-bottom: 1px solid #21262d;
      font-weight: 700;
      color: #58a6ff;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
    }
    .df-menu-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
      margin-top: 4px;
      border-radius: 6px;
      cursor: pointer;
      color: #c9d1d9;
      transition: background 0.15s ease, color 0.15s ease;
    }
    .df-menu-item:hover {
      background: #1f6feb;
      color: #ffffff;
    }
    .df-menu-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-left: 6px;
      cursor: pointer;
      padding: 2px 5px;
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 4px;
      font-size: 11px;
      color: #58a6ff;
      line-height: 1;
      vertical-align: middle;
      transition: all 0.15s ease;
    }
    .df-menu-badge:hover {
      background: #238636;
      border-color: #2ea043;
      color: #ffffff;
      transform: scale(1.1);
    }
  `;
  document.head.appendChild(styleEl);

  // --- NOTIFICATIONS VISUELLES ---
  function showToast(message, type = 'info') {
    const existing = document.querySelector('.df-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `df-toast ${type}`;
    const icon = type === 'success' ? '⚡' : (type === 'error' ? '❌' : 'ℹ️');
    toast.innerHTML = `<span class="df-toast-icon">${icon}</span> <span>${message}</span>`;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // --- ENVOI VERS DEBRIDFLOW ---
  function sendLinkToDebridFlow(url, preferredMode = null) {
    if (!url) return;
    const cfg = getConfig();
    const mode = preferredMode || cfg.transferMode;

    showToast("Envoi vers DebridFlow en cours...", "info");

    const isMagnet = url.startsWith('magnet:');
    const isTorrentUrl = url.toLowerCase().includes('.torrent');

    // Cas 1 : Fichier .torrent direct à télécharger et uploader en multipart
    if (isTorrentUrl && !isMagnet) {
      GM_xmlhttpRequest({
        method: 'GET',
        url: url,
        responseType: 'blob',
        onload: function(dlResp) {
          if (dlResp.status >= 200 && dlResp.status < 300 && dlResp.response) {
            uploadMultipartTorrent(dlResp.response, url, cfg, mode);
          } else {
            // Fallback si échec du blob : envoi comme lien DDL standard
            uploadDdlOrMagnet(url, cfg, mode);
          }
        },
        onerror: function() {
          uploadDdlOrMagnet(url, cfg, mode);
        }
      });
      return;
    }

    // Cas 2 : Magnet ou Lien DDL (1fichier, rapidgator, etc.)
    uploadDdlOrMagnet(url, cfg, mode);
  }

  function uploadMultipartTorrent(blob, originalUrl, cfg, mode) {
    const formData = new FormData();
    const filename = originalUrl.split('/').pop().split('?')[0] || "fichier.torrent";
    formData.append('torrent_files', blob, filename);
    formData.append('category', cfg.category);
    formData.append('transfer_mode', mode);

    executeUploadRequest(`${cfg.serverUrl}/api/torrents/upload`, formData, cfg, filename);
  }

  function uploadDdlOrMagnet(url, cfg, mode) {
    const formData = new FormData();
    if (url.startsWith('magnet:')) {
      formData.append('magnet', url);
      formData.append('category', cfg.category);
      formData.append('transfer_mode', mode);
    } else {
      formData.append('ddl_links', url);
      formData.append('category', cfg.category);
    }

    const label = url.startsWith('magnet:') ? "Magnet Torrent" : "Lien DDL";
    executeUploadRequest(`${cfg.serverUrl}/api/torrents/upload`, formData, cfg, label);
  }

  function executeUploadRequest(targetUrl, formData, cfg, itemLabel) {
    const headers = {};
    if (cfg.username && cfg.password) {
      headers['Authorization'] = 'Basic ' + btoa(`${cfg.username}:${cfg.password}`);
    }

    GM_xmlhttpRequest({
      method: 'POST',
      url: targetUrl,
      data: formData,
      headers: headers,
      onload: function(response) {
        try {
          if (response.status >= 200 && response.status < 300) {
            const data = JSON.parse(response.responseText || '{}');
            const itemName = (data.items && data.items[0] && data.items[0].name) || itemLabel;
            showToast(`Ajouté à DebridFlow : ${itemName}`, 'success');
            if (typeof GM_notification === 'function') {
              GM_notification({
                title: "⚡ DebridFlow",
                text: `Ajouté avec succès : ${itemName}`,
                timeout: 3000
              });
            }
          } else {
            let errMsg = `Erreur HTTP ${response.status}`;
            try {
              const errData = JSON.parse(response.responseText);
              errMsg = errData.message || errData.detail || errMsg;
            } catch(e) {}
            showToast(`Erreur DebridFlow : ${errMsg}`, 'error');
          }
        } catch (e) {
          showToast(`Erreur réponse : ${e.message}`, 'error');
        }
      },
      onerror: function(err) {
        showToast(`Impossible de joindre DebridFlow sur ${cfg.serverUrl}. Vérifiez l'URL dans le menu Tampermonkey.`, 'error');
      }
    });
  }

  // --- DÉTECTION DES LIENS ÉLIGIBLES ---
  function isTargetLink(url) {
    if (!url) return false;
    const u = url.toLowerCase();
    if (u.startsWith('magnet:')) return true;
    if (u.includes('.torrent')) return true;

    // Principaux hébergeurs DDL supportés par Debrid
    const ddlHosts = [
      '1fichier.com', 'uptobox.', 'rapidgator.net', 'turbobit.net', 'nitroflare.com',
      'uploaded.net', 'ddownload.com', 'katfile.com', 'dropgalaxy.', 'alfafile.net',
      'mega.nz', 'mediafire.com', 'filefactory.com', 'hitfile.net'
    ];
    return ddlHosts.some(host => u.includes(host));
  }

  // --- GESTION DU CLIC DROIT & MENU CONTEXTUEL FLOTTANT ---
  let activeMenu = null;

  function closeContextMenu() {
    if (activeMenu) {
      activeMenu.remove();
      activeMenu = null;
    }
  }

  document.addEventListener('click', (e) => {
    if (activeMenu && !activeMenu.contains(e.target)) {
      closeContextMenu();
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeContextMenu();
  });

  document.addEventListener('contextmenu', (e) => {
    const linkEl = e.target.closest('a[href]');
    if (!linkEl) return;

    const href = linkEl.href || '';
    const isSpecial = isTargetLink(href);

    // Déclencher si lien debrid/torrent OU si touche Ctrl/Alt enfoncée lors du clic droit
    if (isSpecial || e.ctrlKey || e.altKey) {
      e.preventDefault();
      closeContextMenu();

      const cfg = getConfig();
      const menu = document.createElement('div');
      menu.id = 'df-context-menu';

      menu.innerHTML = `
        <div class="df-menu-header">
          <span>⚡ DebridFlow</span>
          <span style="font-size:10px;color:#8b949e;">${cfg.category}</span>
        </div>
        <div class="df-menu-item" id="df-act-send">
          <span>📥</span> <span>Envoyer à DebridFlow</span>
        </div>
        <div class="df-menu-item" id="df-act-symlink">
          <span>🔗</span> <span>Envoyer en mode Symlink</span>
        </div>
        <div class="df-menu-item" id="df-act-dl">
          <span>💾</span> <span>Envoyer en Téléchargement réel</span>
        </div>
        <div class="df-menu-item" id="df-act-native" style="border-top:1px solid #21262d;margin-top:4px;">
          <span>📋</span> <span>Menu normal du navigateur</span>
        </div>
      `;

      // Positionnement
      const x = Math.min(e.clientX, window.innerWidth - 240);
      const y = Math.min(e.clientY, window.innerHeight - 180);
      menu.style.left = `${x}px`;
      menu.style.top = `${y}px`;

      document.body.appendChild(menu);
      activeMenu = menu;

      menu.querySelector('#df-act-send').onclick = () => {
        closeContextMenu();
        sendLinkToDebridFlow(href, cfg.transferMode);
      };
      menu.querySelector('#df-act-symlink').onclick = () => {
        closeContextMenu();
        sendLinkToDebridFlow(href, 'symlink');
      };
      menu.querySelector('#df-act-dl').onclick = () => {
        closeContextMenu();
        sendLinkToDebridFlow(href, 'download');
      };
      menu.querySelector('#df-act-native').onclick = () => {
        closeContextMenu();
        // Permet de ré-ouvrir le menu standard si souhaité
        alert("Pour afficher le menu standard sur ce lien, vous pouvez faire un clic droit normal sans maintenir Alt/Ctrl.");
      };
    }
  });

  // --- RACCOURCI ALT + CLIC GAUCHE ---
  document.addEventListener('click', (e) => {
    if (e.altKey && !e.ctrlKey && !e.metaKey) {
      const linkEl = e.target.closest('a[href]');
      if (linkEl && linkEl.href) {
        e.preventDefault();
        e.stopPropagation();
        sendLinkToDebridFlow(linkEl.href);
      }
    }
  }, true);

  // --- BADGES ⚡ SUR LES LIENS MAGNETS & TORRENTS ---
  function injectBadges() {
    if (!getConfig().showBadges) return;
    const links = document.querySelectorAll('a[href^="magnet:"], a[href*=".torrent"]');
    links.forEach(a => {
      if (a.dataset.dfBadgeInjected) return;
      a.dataset.dfBadgeInjected = "true";

      const badge = document.createElement('span');
      badge.className = 'df-menu-badge';
      badge.innerHTML = '⚡';
      badge.title = "Envoyer immédiatement à DebridFlow (1-clic)";
      badge.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        sendLinkToDebridFlow(a.href);
      };

      if (a.nextSibling) {
        a.parentNode.insertBefore(badge, a.nextSibling);
      } else {
        a.parentNode.appendChild(badge);
      }
    });
  }

  // Scan initial et observation des chargements dynamiques
  injectBadges();
  const observer = new MutationObserver(() => injectBadges());
  observer.observe(document.body, { childList: true, subtree: true });

})();

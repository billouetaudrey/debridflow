// OmniSym Chrome Extension - Background Service Worker (Manifest V3)

function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get({
      serverUrl: 'http://localhost:6505',
      category: 'torrent-direct',
      transferMode: 'download',
      username: '',
      password: ''
    }, (items) => {
      resolve({
        serverUrl: (items.serverUrl || 'http://localhost:6505').replace(/\/+$/, ''),
        category: items.category || 'torrent-direct',
        transferMode: items.transferMode || 'download',
        username: items.username || '',
        password: items.password || ''
      });
    });
  });
}

function notify(title, message, isError = false) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon-128.png',
    title: title,
    message: message,
    priority: isError ? 2 : 1
  });
}

// Initialisation des menus contextuels au démarrage ou à l'installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    // Menu principal
    chrome.contextMenus.create({
      id: 'df-send-default',
      title: '⚡ Envoyer à OmniSym',
      contexts: ['link', 'selection']
    });

    // Sous-menu Mode Symlink
    chrome.contextMenus.create({
      id: 'df-send-symlink',
      title: '🔗 Envoyer en mode Symlink (Instantané)',
      contexts: ['link', 'selection']
    });

    // Sous-menu Mode Téléchargement réel
    chrome.contextMenus.create({
      id: 'df-send-download',
      title: '💾 Envoyer en Téléchargement réel',
      contexts: ['link', 'selection']
    });
  });
});

// Gestion du clic sur le menu contextuel
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  let targetUrl = info.linkUrl || (info.selectionText ? info.selectionText.trim() : '');
  if (!targetUrl) {
    notify('OmniSym', 'Aucun lien ou texte sélectionné valide.', true);
    return;
  }

  const settings = await getSettings();
  let mode = settings.transferMode;

  if (info.menuItemId === 'df-send-symlink') mode = 'symlink';
  if (info.menuItemId === 'df-send-download') mode = 'download';

  sendToOmniSym(targetUrl, settings, mode);
});

async function sendToOmniSym(url, settings, mode) {
  const isMagnet = url.startsWith('magnet:');
  const isTorrent = url.toLowerCase().includes('.torrent');

  const formData = new FormData();
  formData.append('category', settings.category);
  formData.append('transfer_mode', mode);

  if (isMagnet) {
    formData.append('magnet', url);
  } else if (isTorrent) {
    try {
      const resp = await fetch(url);
      if (resp.ok) {
        const blob = await resp.blob();
        const fname = url.split('/').pop().split('?')[0] || "download.torrent";
        formData.append('torrent_files', blob, fname);
      } else {
        formData.append('ddl_links', url);
      }
    } catch(e) {
      formData.append('ddl_links', url);
    }
  } else {
    // Lien DDL générique (1fichier, uptobox, rapidgator, etc.)
    formData.append('ddl_links', url);
  }

  const headers = {};
  if (settings.username && settings.password) {
    headers['Authorization'] = 'Basic ' + btoa(`${settings.username}:${settings.password}`);
  }

  try {
    const uploadResp = await fetch(`${settings.serverUrl}/api/torrents/upload`, {
      method: 'POST',
      body: formData,
      headers: headers
    });

    if (uploadResp.ok) {
      const data = await uploadResp.json();
      const itemName = (data.items && data.items[0] && data.items[0].name) || (isMagnet ? 'Magnet' : 'Lien');
      notify('⚡ OmniSym', `Ajouté avec succès (${mode}) :\n${itemName}`);
    } else {
      let errMsg = `Erreur HTTP ${uploadResp.status}`;
      try {
        const errJson = await uploadResp.json();
        errMsg = errJson.message || errJson.detail || errMsg;
      } catch(e) {}
      notify('❌ Erreur OmniSym', errMsg, true);
    }
  } catch (err) {
    notify('❌ Impossible de joindre OmniSym', `Vérifiez l'URL du serveur (${settings.serverUrl}) dans les options de l'extension.`, true);
  }
}

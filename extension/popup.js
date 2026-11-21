document.addEventListener('DOMContentLoaded', () => {
  const serverUrlInput = document.getElementById('serverUrl');
  const categoryInput = document.getElementById('category');
  const transferModeInput = document.getElementById('transferMode');
  const serverStatus = document.getElementById('server-status');
  const msgEl = document.getElementById('msg');

  // Charger la configuration enregistrée
  chrome.storage.sync.get({
    serverUrl: 'http://localhost:6505',
    category: 'torrent-direct',
    transferMode: 'download'
  }, (items) => {
    serverUrlInput.value = items.serverUrl;
    categoryInput.value = items.category;
    transferModeInput.value = items.transferMode;
    testConnection(items.serverUrl);
  });

  async function testConnection(url) {
    serverStatus.className = 'status-badge';
    serverStatus.textContent = 'Connexion...';
    try {
      const cleanUrl = url.replace(/\/+$/, '');
      const resp = await fetch(`${cleanUrl}/api/ui/queue`, { method: 'GET' });
      if (resp.ok) {
        serverStatus.className = 'status-badge online';
        serverStatus.textContent = '● En ligne';
      } else {
        serverStatus.className = 'status-badge offline';
        serverStatus.textContent = `● Erreur ${resp.status}`;
      }
    } catch (e) {
      serverStatus.className = 'status-badge offline';
      serverStatus.textContent = '● Hors ligne';
    }
  }

  document.getElementById('btn-test').addEventListener('click', () => {
    testConnection(serverUrlInput.value.trim());
  });

  document.getElementById('btn-save').addEventListener('click', () => {
    const url = serverUrlInput.value.trim().replace(/\/+$/, '');
    const cat = categoryInput.value.trim() || 'torrent-direct';
    const mode = transferModeInput.value;

    chrome.storage.sync.set({
      serverUrl: url,
      category: cat,
      transferMode: mode
    }, () => {
      msgEl.style.display = 'block';
      msgEl.style.color = '#3fb950';
      msgEl.textContent = 'Paramètres enregistrés avec succès !';
      testConnection(url);
      setTimeout(() => { msgEl.style.display = 'none'; }, 2500);
    });
  });

  document.getElementById('btn-open-web').addEventListener('click', () => {
    const url = serverUrlInput.value.trim().replace(/\/+$/, '');
    chrome.tabs.create({ url: url || 'http://localhost:6505' });
  });
});

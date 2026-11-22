// OmniSym PWA Service Worker (Minimal & Robuste)
const CACHE_NAME = 'omnisym-pwa-v1';

// Ressources critiques de l'App Shell pour démarrage instantané
const SHELL_ASSETS = [
  '/',
  '/manifest.json',
  '/static/css/style.css',
  '/static/js/app.js',
  '/static/js/i18n.js',
  '/static/js/queue.js',
  '/static/js/settings.js',
  '/static/icons/icon-192.png',
  '/static/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(SHELL_ASSETS).catch((err) => {
        console.warn('[OmniSym SW] Pré-cache partiel:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Stratégie de mise en cache : Réseau d'abord (Network-First) avec fallback cache
self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes qui ne sont pas des GET
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Pour les requêtes API dynamiques : toujours le réseau direct
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/torrents/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({ offline: true, error: 'Connexion réseau interrompue' }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Network-First pour HTML et ressources statiques
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
        });
      })
  );
});

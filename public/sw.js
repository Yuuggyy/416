const CACHE_NAME = '416-records-v9';
const BASE = '/';

// Static assets to precache
const STATIC_ASSETS = [
  BASE + 'app.js',
  BASE + 'app.css',
  BASE + 'manifest.webmanifest',
  BASE + 'favicon.ico',
  BASE + 'icon-192.png',
  BASE + 'icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Only handle same-origin GET
  if (url.origin !== self.location.origin || e.request.method !== 'GET') return;

  // Skip external APIs
  if (url.hostname.includes('supabase') || url.hostname.includes('googleapis') || url.hostname.includes('gstatic')) return;

  // Navigation requests — network-first (never serve stale/404 HTML)
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(response => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(e.request).then(cached => cached || caches.match(BASE + 'index.html')))
    );
    return;
  }

  // Static assets — cache-first
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => cached);
    })
  );
});

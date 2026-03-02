// ============================================================
// Austin Treasure Map — Service Worker
// ============================================================

const CACHE_NAME = 'atm-v9';

const PRECACHE = [
  './',
  './index.html',
  './css/base.css',
  './css/map.css',
  './css/sidebar.css',
  './js/app.js',
  './js/data.js',
  './js/map.js',
  './js/state.js',
  './js/sidebar.js',
  './js/neighborhoods.js',
  './js/filters.js',
  './js/share.js',
  './js/quests.js',
  './js/mobile.js',
  './manifest.json',
];

// Install — precache app shell
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network-first for tiles, cache-first for app shell
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Map tiles: network-first, cache as user browses
  if (
    url.hostname.includes('tile') ||
    url.hostname.includes('basemaps') ||
    url.hostname.includes('arcgisonline') ||
    url.hostname.includes('cooperhewitt') ||
    url.hostname.includes('opentopomap')
  ) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // CDN resources (Leaflet, plugins): cache-first
  if (url.hostname === 'unpkg.com' || url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        if (cached) return cached;
        return fetch(e.request).then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
          return res;
        });
      })
    );
    return;
  }

  // App shell: cache-first, fallback to network
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});

// ══════════════════════════════════════════════
//  SUK Bangalore — Service Worker
//  Handles caching for offline support &
//  instant loading on repeat visits
// ══════════════════════════════════════════════

const CACHE_NAME    = 'suk-bangalore-v1';
const OFFLINE_URL   = '/bangalore-suk/';

// Assets to cache immediately on install
const PRECACHE_URLS = [
  '/bangalore-suk/',
  '/bangalore-suk/index.html',
  '/bangalore-suk/manifest.json',
  '/bangalore-suk/icons/icon-192.png',
  '/bangalore-suk/icons/icon-512.png',
];

// ── Install: pre-cache core assets ──────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => self.skipWaiting())
  );
});

// ── Activate: clean up old caches ───────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch strategy ───────────────────────────
// • HTML page  → Network first (always get latest), fall back to cache
// • Fonts/CSS  → Cache first (rarely change)
// • API calls  → Network only (never cache live data)
// • Everything else → Cache first, then network
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip non-GET and API calls (Google Apps Script)
  if (event.request.method !== 'GET') return;
  if (url.hostname.includes('script.google.com')) return;
  if (url.hostname.includes('googleapis.com') && url.pathname.includes('/upload')) return;

  // HTML — network first so updates deploy instantly
  if (event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache the fresh copy
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Google Fonts — cache first (stable assets)
  if (url.hostname.includes('fonts.googleapis.com') || 
      url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
          return response;
        });
      })
    );
    return;
  }

  // Default — cache first, network fallback
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});

// ── Background sync: notify clients of updates ──
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});

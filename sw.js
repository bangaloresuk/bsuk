// ╔══════════════════════════════════════════════╗
//  SUK Bangalore — Service Worker
//  Change BASE if you move to a different URL
// ╚══════════════════════════════════════════════╝

const BASE  = '/bsuk/';   // ← must match APP_CONFIG.basePath in index.html
const CACHE = 'suk-v2';

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(c) {
      return c.addAll([
        BASE,
        BASE + 'index.html',
        BASE + 'manifest.json',
        BASE + 'icons/icon-192.png',
        BASE + 'icons/icon-512.png'
      ]);
    }).then(function() { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('script.google.com')) return;
  if (e.request.url.includes('googleapis.com')) return;
  if (e.request.url.includes('fonts.g')) return;

  // HTML — always fetch fresh so updates deploy instantly
  if (e.request.headers.get('accept') &&
      e.request.headers.get('accept').includes('text/html')) {
    e.respondWith(
      fetch(e.request)
        .then(function(r) {
          var clone = r.clone();
          caches.open(CACHE).then(function(c) { c.put(e.request, clone); });
          return r;
        })
        .catch(function() { return caches.match(e.request); })
    );
    return;
  }

  // Everything else — cache first, network fallback
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(r) {
        caches.open(CACHE).then(function(c) { c.put(e.request, r.clone()); });
        return r;
      });
    })
  );
});

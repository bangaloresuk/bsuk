// ============================================================
//  sw.js  — Service Worker for SUK Bangalore PWA
//  Cache strategy: cache-first for assets, network-first for HTML
//  Bump CACHE_VERSION when deploying new code.
// ============================================================

const CACHE_VERSION = "suk-v4";
const BASE = self.location.pathname.replace(/\/[^\/]*$/, "/");

const STATIC_ASSETS = [
  BASE,
  BASE + "index.html",
  BASE + "app.js",
  BASE + "core/config.js",
  BASE + "core/api.js",
  BASE + "core/auth.js",
  BASE + "ui/particles.js",
  BASE + "ui/loader.js",
  BASE + "ui/modal.js",
  BASE + "features/booking.js",
  BASE + "features/satsang.js",
  BASE + "features/manage.js",
  BASE + "features/calendar.js",
  BASE + "features/messages.js",
  BASE + "features/gallery.js",
  BASE + "manifest.json",
  BASE + "icons/icon-192.png",
  BASE + "icons/icon-512.png",
];

// ── Install: cache all assets ─────────────────────────────────
self.addEventListener("install", function(e) {
  e.waitUntil(
    caches.open(CACHE_VERSION)
      .then(function(cache) { return cache.addAll(STATIC_ASSETS); })
      .then(function() { return self.skipWaiting(); })
  );
});

// ── Activate: delete old caches ───────────────────────────────
self.addEventListener("activate", function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_VERSION; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() { return self.clients.claim(); })
  );
});

// ── Fetch: network-first for HTML, cache-first for assets ─────
self.addEventListener("fetch", function(e) {
  const url = new URL(e.request.url);

  // Never cache API calls (Cloudflare Worker requests)
  if (url.pathname.startsWith("/api/") || url.hostname.includes("workers.dev")) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Network-first for HTML (ensures updates are instant)
  if (e.request.destination === "document" || url.pathname.endsWith(".html") || url.pathname === BASE) {
    e.respondWith(
      fetch(e.request)
        .then(function(r) {
          const clone = r.clone();
          caches.open(CACHE_VERSION).then(c => c.put(e.request, clone));
          return r;
        })
        .catch(function() { return caches.match(e.request); })
    );
    return;
  }

  // Cache-first for JS, CSS, images, fonts
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(r) {
        if (r && r.status === 200) {
          const clone = r.clone();
          caches.open(CACHE_VERSION).then(c => c.put(e.request, clone));
        }
        return r;
      });
    })
  );
});

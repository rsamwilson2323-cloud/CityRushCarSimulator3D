// Service Worker for NitroCity 3D
//
// Strategy matters here: the whole game is one index.html. A pure cache-first
// worker (the previous version) meant anyone who had played once was frozen on
// that build forever, because the cache only refreshed when CACHE_NAME was
// manually bumped. So:
//
//   - the game itself (navigations, index.html, manifest) -> NETWORK FIRST,
//     falling back to cache when offline. Updates always land.
//   - the pinned Three.js CDN build -> CACHE FIRST. The URL contains the
//     version, so it is immutable and worth serving instantly.
const CACHE_NAME = 'cityrush-v6-tooncity';
const THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
const PRECACHE = ['./', './index.html', './manifest.json', './assets/toon-city-world.js', './assets/toon-city-life.js', THREE_URL];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      // Don't let one failed CDN fetch abort the whole install.
      .then((cache) => Promise.allSettled(PRECACHE.map((u) => cache.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

function isGameDocument(request, url) {
  if (request.mode === 'navigate') return true;
  if (url.origin !== self.location.origin) return false;
  return url.pathname.endsWith('/')
      || url.pathname.endsWith('.html')
      || url.pathname.endsWith('/assets/toon-city-world.js')
      || url.pathname.endsWith('/assets/toon-city-life.js')
      || url.pathname.endsWith('manifest.json');
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  let url;
  try { url = new URL(request.url); } catch (e) { return; }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  if (isGameDocument(request, url)) {
    // Network first: always prefer a fresh build.
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request)
          .then((cached) => cached || caches.match('./index.html')))
    );
    return;
  }

  // Everything else: cache first, refresh in the background.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && (response.ok || response.type === 'opaque')) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

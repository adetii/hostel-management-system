// Basic service worker for runtime caching of static assets (CSS/JS/fonts/images).
// It never caches HTML and never caches /api requests.

const STATIC_CACHE = 'static-v1';

// Install: prepare cache (no precache, we cache on first fetch)
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(STATIC_CACHE));
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== STATIC_CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for static assets; never cache HTML or /api
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Only handle GET
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Do not touch cross-origin requests (e.g., CDN) — adjust if you want to cache them
  if (url.origin !== self.location.origin) return;

  // Never cache API calls
  if (url.pathname.startsWith('/api')) return;

  // Do not cache navigations (HTML)
  if (request.mode === 'navigate') return;

  const isStaticAsset =
    ['script', 'style', 'image', 'font'].includes(request.destination) ||
    /\.(?:css|js|woff2?|ttf|eot|png|jpg|jpeg|svg|gif|webp|ico)$/.test(url.pathname);

  if (!isStaticAsset) return;

  // Cache-first strategy for static assets
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          // Cache successful responses only
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone)).catch(() => {});
          }
          return response;
        })
        .catch(() => {
          // If offline and nothing cached, just let it fail quietly
          return cached || Promise.reject('Network error and no cached copy.');
        });
    })
  );
});
const CACHE_NAME = 'pog-cache-v1';

// Only cache same-origin app shell; external libs (ZXing, JsBarcode) stay network-fetched.
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
});

// Clean old caches if you change CACHE_NAME later
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;

  // Only handle same-origin GET requests
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  // Hybrid strategy: cache-first for app shell, network-first for other same-origin requests
  if (APP_SHELL.some(path => request.url.endsWith(path.replace('./', '')))) {
    event.respondWith(
      caches.match(request).then(
        cached => cached || fetch(request)
      )
    );
  } else {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Optionally cache dynamic same-origin responses
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request))
    );
  }
});

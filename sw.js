const CACHE_NAME = 'pfrs-expert-v3';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/offline.html',
  '/css/style.css',
  '/js/app.js',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) return caches.delete(cache);
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clonedResponse = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clonedResponse));
          }
          return networkResponse;
        })
        .catch(() => {
          if (event.request.mode === 'navigate') return caches.match('/offline.html');
        });

      return cachedResponse || fetchPromise;
    })
  );
});

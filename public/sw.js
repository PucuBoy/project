const CACHE_NAME = 'story-explorer-v1';

const assetsToCache = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-72x72.png',
  '/icons/icon-144x144.png',
  '/icons/icon-192x192.png',
  '/icons/icon.png',
  '/styles/pwa.css',
  '/app.bundle.js',
  '/scripts/utils/sw-register.js',
  '/src/scripts/views/offline-view.js'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return Promise.all(
          assetsToCache.map(url => {
            return cache.add(url).catch(err => {
              console.warn('Failed to cache:', url);
              return Promise.resolve();
            });
          })
        );
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Skip WebSocket connections
  if (event.request.url.includes('/ws')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }

        const fetchRequest = event.request.clone();

        return fetch(fetchRequest)
          .then((response) => {
            // Don't cache websocket or non-GET requests
            if (response.type === 'opaque' || event.request.method !== 'GET') {
              return response;
            }

            // Don't cache errors
            if (!response || response.status !== 200) {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Handle webpack chunks
            if (event.request.url.includes('.app.bundle.js')) {
              return new Response(null, { status: 404 });
            }
            
            if (event.request.destination === 'image') {
              return caches.match('/icons/icon.png');
            }
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
            return new Response(null, { status: 404 });
          });
      })
  );
});
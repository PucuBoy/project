// First, add version for cache management
const CACHE_VERSION = 'v1';

importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

// Single install event handler
self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  const offlineFallbackPage = '/offline.html';
  event.waitUntil(
    caches.open(CACHE_VERSION + '-offline-cache').then((cache) => {
      return cache.add(offlineFallbackPage);
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
  // Clean up old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName.startsWith(CACHE_VERSION)) {
            return null;
          }
          return caches.delete(cacheName);
        })
      );
    })
  );
});

workbox.setConfig({
  debug: false
});

const { strategies, routing, precaching, cacheableResponse, expiration } = workbox;

// Cache Google Fonts
routing.registerRoute(
  ({url}) => url.origin === 'https://fonts.googleapis.com' ||
             url.origin === 'https://fonts.gstatic.com',
  new strategies.StaleWhileRevalidate({
    cacheName: 'google-fonts',
  })
);

// Cache images
routing.registerRoute(
  ({request}) => request.destination === 'image',
  new strategies.CacheFirst({
    cacheName: 'images',
    plugins: [
      new cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new expiration.ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// Cache API responses
routing.registerRoute(
  ({url}) => url.origin === 'https://story-api.dicoding.dev',
  new strategies.StaleWhileRevalidate({
    cacheName: 'api-cache',
    plugins: [
      new cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Offline fallback
self.addEventListener('install', (event) => {
  const offlineFallbackPage = '/offline.html';
  event.waitUntil(
    caches.open('offline-cache').then((cache) => {
      return cache.add(offlineFallbackPage);
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/offline.html');
      })
    );
  }
});

self.addEventListener('push', (event) => {
  const options = {
    body: event.data.text(),
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('Story Explorer', options)
  );
});
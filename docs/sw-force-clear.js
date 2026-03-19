// Aggressive service worker that clears all caches and unregisters itself
// This will force clear any cached Vite references

self.addEventListener('install', (event) => {
  console.log('SW: Force clear service worker installing...');
  self.skipWaiting();
  
  // Clear all caches immediately
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('SW: Force deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('SW: All caches force cleared');
      return self.registration.unregister();
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('SW: Force clear service worker activating...');
  event.waitUntil(
    clients.claim().then(() => {
      // Clear all caches again on activation
      return caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log('SW: Activation deleting cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      });
    }).then(() => {
      console.log('SW: Activation - all caches cleared');
      // Force unregister
      return self.registration.unregister();
    })
  );
});

// Handle fetch requests - don't cache anything
self.addEventListener('fetch', (event) => {
  // Always fetch from network, never use cache
  event.respondWith(
    fetch(event.request).catch(() => {
      // If network fails, try to serve from cache as fallback
      return caches.match(event.request);
    })
  );
});

// Immediately unregister on load
self.registration.unregister().then(() => {
  console.log('SW: Force unregistered on load');
});

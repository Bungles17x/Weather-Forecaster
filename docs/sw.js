// Service worker that immediately unregisters itself
// This will clear any existing service workers and prevent errors

self.addEventListener('install', (event) => {
  console.log('SW: Unregistering service worker...');
  self.skipWaiting();
  self.registration.unregister().then(() => {
    console.log('SW: Successfully unregistered');
  });
});

self.addEventListener('activate', (event) => {
  console.log('SW: Activating cleanup...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('SW: Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('SW: All caches cleared');
      return self.registration.unregister();
    })
  );
});

// Immediately unregister
self.registration.unregister().then(() => {
  console.log('SW: Unregistered on load');
});

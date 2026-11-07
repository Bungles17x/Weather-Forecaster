/* Weather Desk PWA shell cache. Weather/API responses are deliberately not cached. */
const CACHE_NAME = 'weather-forecaster-shell-v12';
const SHELL_FILES = ['./', './index.html', './manifest.webmanifest', './weather-icon.svg', './icons/weather-180.png', './icons/weather-192.png', './icons/weather-512.png', './icons/weather-maskable-512.png'];
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(SHELL_FILES).catch(() => undefined);
    // Pre-cache the hashed local JS/CSS bundles linked by the generated Vite index.
    // Third-party weather and map resources are intentionally never included.
    try {
      const response = await fetch(new URL('index.html', self.registration.scope));
      if (response.ok) {
        const html = await response.text();
        const paths = [...html.matchAll(/(?:src|href)=["']([^"']+\.(?:js|css))(?:\?[^"']*)?["']/g)].map(match => match[1]);
        const localAssets = paths.filter(path => new URL(path, self.registration.scope).origin === self.location.origin);
        await Promise.all(localAssets.map(path => cache.add(new URL(path, self.registration.scope).href).catch(() => undefined)));
      }
    } catch { /* Keep offline installation best-effort if the deployment is incomplete. */ }
  })());
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))));
  self.clients.claim();
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // Never cache third-party weather data.
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response && response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(new URL('index.html', self.registration.scope).href, response.clone());
        }
        return response;
      } catch {
        // Match the absolute URL inside this app's scope (important on GitHub Pages
        // where the app is hosted below /Weather-Forecaster/).
        return (await caches.match(new URL('index.html', self.registration.scope).href))
          || (await caches.match(new URL('./', self.registration.scope).href));
      }
    })());
    return;
  }
  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    if (response && response.ok && url.origin === self.location.origin) {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
    }
    return response;
  })));
});

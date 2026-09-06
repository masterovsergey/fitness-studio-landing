// Isolated demo cache. Never controls the landing or caches customer/API data.
const scope = new URL(self.registration.scope);
const prefix = `fitness-club-demo:${scope.pathname}:`;
const cacheName = `${prefix}v1`;
const files = ['./', './index.html', './app.css', './app.js', './data.js', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png', '../fonts/Manrope-Regular.ttf', '../fonts/Manrope-SemiBold.ttf', '../fonts/CormorantGaramond-Italic.ttf', '../images/loft-hero-v2-mobile.webp', '../images/loft-space-v2-mobile.webp', ...Array.from({ length: 6 }, (_, index) => `../images/trainers/trainer-0${index + 1}-v3.webp`)];
const assets = new Set(files.map((path) => new URL(path, scope).href));
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(cacheName).then((cache) => cache.addAll([...assets])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith(prefix) && key !== cacheName).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== scope.origin || !assets.has(url.href)) return;
  event.respondWith((async () => {
    const cache = await caches.open(cacheName);
    try {
      const response = await fetch(request);
      if (response.ok) {
        // A full/blocked cache must not prevent a successful online response.
        try { await cache.put(request, response.clone()); } catch { /* Offline storage is optional. */ }
      }
      return response;
    } catch {
      const stored = await cache.match(request);
      return stored || Response.error();
    }
  })());
});

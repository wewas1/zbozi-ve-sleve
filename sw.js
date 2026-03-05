// Service Worker – Slevy Jihlava PWA
const CACHE = 'zbozi-ve-sleve-v1';
const OFFLINE_ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// Instalace – uložení základních souborů do cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(OFFLINE_ASSETS))
  );
  self.skipWaiting();
});

// Aktivace – smazání starých cache
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch – network first, fallback na cache
self.addEventListener('fetch', event => {
  // API volání vždy přes síť (bez cache)
  if (event.request.url.includes('anthropic.com') ||
      event.request.url.includes('fonts.googleapis.com')) {
    event.respondWith(fetch(event.request).catch(() => new Response('', { status: 503 })));
    return;
  }

  // Ostatní – network first, pak cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Uložit do cache pokud je OK
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

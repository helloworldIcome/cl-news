const CACHE_NAME = 'cl-news-morning-v2';
const APP_SHELL = [
  './',
  './index.html',
  './assets/styles.css',
  './assets/app.js',
  './assets/app-model.js',
  './manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // MP3: always fetch fresh (never cache)
  if (url.pathname.endsWith('.mp3')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // latest.json: network-first (serve cached only when offline)
  if (url.pathname.endsWith('latest.json')) {
    event.respondWith(
      fetch(event.request)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, copy));
          return resp;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // App shell and other assets: cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

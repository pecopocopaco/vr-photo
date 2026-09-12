// Wi-Fi REALTIME RADAR — Service Worker
// Caches only the static app shell. Never caches network-measurement
// requests (latency / download / upload probes) — those must always
// hit the real network or the diagnostics would be meaningless.

const CACHE_NAME = 'wifi-radar-shell-v2';
const SHELL_FILES = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only ever serve app-shell GET requests from cache. Anything else
  // (measurement probes to third-party hosts, POST uploads, etc.)
  // passes straight through to the real network untouched.
  const url = new URL(req.url);
  const isSameOrigin = url.origin === self.location.origin;

  if (req.method !== 'GET' || !isSameOrigin) {
    return; // let it hit the network normally
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).catch(() => cached);
    })
  );
});

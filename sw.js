// Offline-Unterstützung: App-Dateien zwischenspeichern.
// Bei Änderungen an der App die Versionsnummer erhöhen.
const CACHE = 'gymplan-v10';
const ASSETS = ['./', 'index.html', 'styles.css', 'data.js', 'app.js', 'ui.js', 'figures.js', 'manifest.webmanifest',
  'icons/icon.svg', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', (e) => {
  // 'reload' umgeht den Browser-Cache, damit wirklich die neuen Dateien gespeichert werden
  e.waitUntil(caches.open(CACHE)
    .then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Netzwerk zuerst und am Browser-Cache vorbei (damit Updates sofort ankommen),
// ohne Netz der gespeicherte Stand (offline im Studio)
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const sameOrigin = new URL(e.request.url).origin === self.location.origin;
  if (!sameOrigin) return;
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' }).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});

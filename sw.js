// Offline cache. Bump VERSION whenever files change so phones pick up the update.
const VERSION = 'cc-v6';
const FILES = [
  './', 'index.html', 'css/style.css', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png',
  'js/app.js', 'js/figure.js', 'js/session.js', 'js/store.js', 'js/i18n.js',
  'js/data/techniques.js', 'js/data/plan.js', 'js/data/poses.js', 'js/sync.js', 'js/firebase-config.js',
];
self.addEventListener('install', e => e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())
));
// Network first (so updates show up), cache as fallback when offline.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' }).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});

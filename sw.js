/* Skull Darts 71 · Service worker (cache hors-ligne) */
const CACHE = 'sd71-halloween-v4';
const ASSETS = [
  './', 'index.html', 'manifest.webmanifest',
  'assets/css/styles.css?v=1.2.1',
  'assets/js/i18n.js?v=1.2.1', 'assets/js/audio.js?v=1.2.1', 'assets/js/board.js?v=1.2.1', 'assets/js/intro.js?v=1.2.1', 'assets/js/game.js?v=1.2.1', 'assets/js/app.js?v=1.2.1',
  'assets/fonts/creepster.woff2', 'assets/fonts/fredoka.woff2',
  'assets/img/logo.svg', 'assets/img/affiche-480.webp', 'assets/img/affiche-768.webp'
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  // Réseau d'abord pour le HTML, cache d'abord pour le reste
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((r) => { const c = r.clone(); caches.open(CACHE).then((x) => x.put(req, c)); return r; }).catch(() => caches.match(req).then((r) => r || caches.match('index.html'))));
    return;
  }
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => {
    if (r.ok) { const c = r.clone(); caches.open(CACHE).then((x) => x.put(req, c)); }
    return r;
  })));
});

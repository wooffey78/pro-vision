// Service worker : fonctionnement hors ligne. Tout est pré-chargé depuis precache.json.
// La ligne VERSION est réécrite par `npm run precache` (ne pas la modifier à la main).
const VERSION = '0d42dc93173b';
const CACHE = `provision-${VERSION}`;

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const liste = await (await fetch('precache.json', { cache: 'no-cache' })).json();
    const cache = await caches.open(CACHE);
    await cache.addAll(liste.fichiers);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const cle of await caches.keys()) if (cle.startsWith('provision-') && cle !== CACHE) await caches.delete(cle);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const trouve = await cache.match(req, { ignoreSearch: true });
    if (trouve) return trouve;
    try {
      return await fetch(req);
    } catch {
      if (req.mode === 'navigate') return (await cache.match('index.html')) || Response.error();
      return Response.error();
    }
  })());
});

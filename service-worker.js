// Cache mínimo do "app shell" — só o essencial pra abrir mesmo sem
// internet. Se um dia adicionar outro arquivo fixo ao lado deste (mais um
// ícone, por exemplo), inclua aqui também.
const CACHE_NAME = 'meta-ads-dashboard-v1';
const APP_SHELL = [
  './dashboard-meta-ads.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// Cache-first pro app shell, com atualização em segundo plano (stale-while-
// revalidate): abre na hora — até offline — e ainda pega a versão nova na
// próxima vez que houver internet, sem travar a abertura esperando por ela.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

// Cache mínimo do "app shell" — só o essencial pra abrir mesmo sem
// internet. Se um dia adicionar outro arquivo fixo ao lado deste (mais um
// ícone, por exemplo), inclua aqui também.
// Versão bumpada pra forçar a limpeza de qualquer cache antigo (v1) ainda
// guardado no navegador de quem já tinha instalado o app antes dessa
// mudança pra network-first abaixo.
const CACHE_NAME = 'meta-ads-dashboard-v2';
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

// Network-first pro app shell, com o cache como fallback só pra quando
// está offline. Isso era cache-first com atualização em segundo plano
// (stale-while-revalidate) antes: abria na hora com a versão SALVA e só
// buscava a nova depois, em background — o que significava que qualquer
// correção no painel exigia pelo menos um reload extra pra aparecer na
// tela (às vezes nem isso, se o navegador nunca chegava a reabrir uma
// segunda vez). Painel em atualização constante precisa sempre da versão
// mais nova quando há internet — o cache existe só pra não quebrar
// completamente sem conexão.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

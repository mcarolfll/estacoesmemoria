const CACHE_NAME = 'match-cards-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './assets/img/trevo.avif',
  './assets/img/img1.jpg',
  './assets/img/img2.jpg',
  './assets/img/img3.jpg',
  './assets/img/img4.jpg',
  './assets/img/img5.jpg',
  './assets/img/img6.jpg',
  './assets/img/img7.jpg',
  './assets/img/img8.jpg',
  './assets/img/img9.jpg'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching all assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
  // Força o SW a ativar imediatamente
  self.skipWaiting();
});

// Ativação e Limpeza de Cache Antigo
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  // Garante que o SW controle a página imediatamente
  self.clients.claim();
});

// Interceptação de Requisições (Cache-First Strategy)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retorna do cache se existir
        if (response) {
          return response;
        }
        // Se não, busca na rede
        return fetch(event.request);
      })
  );
});

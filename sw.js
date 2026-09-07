const CACHE_NAME = 'powerdance-v10'; // Incrementado para v10 para invalidar caches antigos no navegador

// Lista de arquivos estáticos da aplicação
const ASSETS = [
    '/',
    '/index.html',
    '/index2.html',
    '/index6.html',
    '/image/fav-icon.ico',
    '/landing.html',
    '/play.html',
    '/manifest.json',
    '/samp1.html',
    '/samp2.html',
    '/power.html',
    '/tela-carrossel.html',
    '/mm.html',
    '/mdl.html',
    '/tela.html',
    '/admin_m.html',
    '/tela-admin1.html',
    '/tela-admin2.html',
    '/meta-cover.html',
    '/cor.gif',
    '/raiden.gif',
    '/eu1.jpg',
    '/logodj.gif',
    '/vu7.jpg'
];

// Instalação do Service Worker
self.addEventListener('install', (e) => {
  self.skipWaiting(); // Força o novo Service Worker a ativar imediatamente
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        ASSETS.map((url) => {
          return cache.add(url).catch((err) => {
            console.warn('Aviso: Não foi possível salvar no cache o arquivo: ' + url, err);
          });
        })
      );
    })
  );
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim()) // Assume o controle de todas as abas abertas
  );
});

// Gerenciamento de Requisições (Fetch)
self.addEventListener('fetch', (e) => {
  const url = e.request.url;

  // 1. Ignora requisições que não usam método GET (POST, PUT, DELETE)
  if (e.request.method !== 'GET') return;

  // 2. EXCEÇÃO DE STREAMING, APIS E WEBSOCKETS: Deixa o navegador buscar direto na rede
  if (
    url.includes('radio.mp3') || 
    url.includes('erbj.com.br') || 
    url.includes('metadapower.vercel.app') ||
    url.includes('firebaseio.com') ||
    url.includes('googleapis.com') ||
    url.endsWith('.mp3')
  ) {
    return; // Não intercepta pelo Service Worker
  }

  // 3. Estratégia NETWORK FIRST para arquivos HTML (Evita que páginas renomeadas fiquem presas no cache)
  if (e.request.headers.get('accept')?.includes('text/html')) {
    e.respondWith(
      fetch(e.request)
        .then((networkResponse) => {
          // Se a busca na rede deu certo, atualiza a cópia no cache
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseClone));
          return networkResponse;
        })
        .catch(() => {
          // Se estiver offline ou a rede falhar, entrega do cache
          return caches.match(e.request);
        })
    );
    return;
  }

  // 4. Estratégia CACHE FIRST para o restante das mídias e arquivos estáticos (Gifs, imagens, etc.)
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request);
    })
  );
});
const CACHE_NAME = 'powerdance-v9'; // Atualizado para v9 para forçar a renovação do cache

// Lista de arquivos estáticos da aplicação
const ASSETS = [
    '/',
    '/index.html',
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
    }).then(() => self.clients.claim()) // Assume o controle das páginas abertas na hora
  );
});

// Gerenciamento de Requisições (Fetch)
self.addEventListener('fetch', (e) => {
  const url = e.request.url;

  // 1. Ignora requisições que não usam método GET (POST, PUT, DELETE)
  if (e.request.method !== 'GET') return;

  // 2. EXCEÇÃO DE STREAMING E APIs: Deixa o navegador buscar direto na rede
  if (
    url.includes('radio.mp3') || 
    url.includes('erbj.com.br') || 
    url.includes('metadapower.vercel.app') ||
    url.includes('firebaseio.com') ||
    url.endsWith('.mp3')
  ) {
    return; // Não intercepta pelo Service Worker
  }

  // 3. Estratégia Cache First para arquivos locais (HTML, CSS, JS, Imagens)
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request);
    })
  );
});
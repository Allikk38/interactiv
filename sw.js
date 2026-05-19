// ===== SERVICE WORKER ДЛЯ PWA =====
const CACHE_NAME = 'realty-trainer-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/base.css',
  '/css/map.css',
  '/css/steps.css',
  '/css/drawer.css',
  '/js/config.js',
  '/js/state.js',
  '/js/dragdrop.js',
  '/js/badges.js',
  '/js/user.js',
  '/js/progress.js',
  '/js/brief.js',
  '/js/interactive-lesson1.js',
  '/js/drawer.js',
  '/js/ui.js',
  '/js/map.js',
  '/js/quiz.js',
  '/js/interactive.js',
  '/js/app.js',
  '/data/jks.json',
  '/data/questions.json',
  '/data/scenarios.json',
  '/data/marketing-steps.json',
  '/data/lesson-1.json'
];

// Установка Service Worker — кешируем файлы
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: кеширование файлов');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.error('Ошибка кеширования:', err))
  );
  self.skipWaiting();
});

// Активация — удаляем старые кеши
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: удалён старый кеш', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Перехват запросов — сначала пытаемся из сети, если нет — из кеша
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Кешируем успешные ответы от API Яндекса и данных
        if (event.request.url.includes('yandex') || 
            event.request.url.includes('.json') ||
            event.request.url.includes('.css') ||
            event.request.url.includes('.js')) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Если сети нет — пробуем из кеша
        return caches.match(event.request)
          .then(response => {
            if (response) return response;
            
            // Если запрашивают страницу — возвращаем index.html
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            
            return new Response('Страница не найдена в кеше', {
              status: 404,
              statusText: 'Not Found'
            });
          });
      })
  );
});
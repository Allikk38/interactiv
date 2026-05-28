// ===== SERVICE WORKER ДЛЯ PWA (ИСПРАВЛЕННАЯ ВЕРСИЯ) =====
const STATIC_CACHE = 'realty-static-v3';
const DATA_CACHE = 'realty-data-v3';

// Файлы для кеширования при установке
const urlsToCache = [
  './',
  './index.html',
  './css/base.css',
  './css/map.css',
  './css/steps.css',
  './css/drawer.css',
  './js/config.js',
  './js/state.js',
  './js/dragdrop.js',
  './js/badges.js',
  './js/user.js',
  './js/progress.js',
  './js/brief.js',
  './js/interactive-lesson1.js',
  './js/drawer.js',
  './js/ui.js',
  './js/map.js',
  './js/quiz.js',
  './js/interactive.js',
  './js/client-journey.js',
  './js/app.js',
  './manifest.json'
];

// JSON данные для кеширования
const dataUrls = [
  './data/jks.json',
  './data/questions.json',
  './data/scenarios.json',
  './data/marketing-steps.json',
  './data/lesson-1.json',
  './data/floorplans.json'
];

// Установка Service Worker — кешируем статику
self.addEventListener('install', event => {
  console.log('[SW] Установка...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Кеширование статики');
        return cache.addAll(urlsToCache);
      })
      .then(() => caches.open(DATA_CACHE))
      .then(cache => {
        console.log('[SW] Кеширование данных');
        return cache.addAll(dataUrls);
      })
      .then(() => self.skipWaiting())
      .catch(err => console.error('[SW] Ошибка кеширования:', err))
  );
});

// Активация — удаляем старые кеши
self.addEventListener('activate', event => {
  console.log('[SW] Активация...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== STATIC_CACHE && cache !== DATA_CACHE) {
            console.log('[SW] Удалён старый кеш:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Вспомогательная функция для проверки пути запроса
function isPathRequest(requestUrl, targetPath) {
  try {
    const url = new URL(requestUrl);
    return url.pathname === targetPath;
  } catch (e) {
    return false;
  }
}

// Перехват запросов — стратегия: сначала кеш, потом сеть
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // API Яндекс.Карт — только сеть (требует соединения)
  if (url.hostname.includes('api-maps.yandex.ru') || 
      url.hostname.includes('yandex')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({ error: 'no-internet' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }
  
  // JSON данные — стратегия: сеть с обновлением кеша
  if (event.request.url.includes('/data/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const responseClone = response.clone();
          caches.open(DATA_CACHE).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }
  
  // Статические файлы (CSS, JS, HTML) — стратегия: кеш, потом сеть
  if (event.request.url.includes('/css/') || 
      event.request.url.includes('/js/') ||
      isPathRequest(event.request.url, '/') ||
      isPathRequest(event.request.url, '/index.html')) {
    
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) return response;
          
          return fetch(event.request)
            .then(fetchResponse => {
              const responseClone = fetchResponse.clone();
              caches.open(STATIC_CACHE).then(cache => {
                cache.put(event.request, responseClone);
              });
              return fetchResponse;
            });
        })
    );
    return;
  }
  
  // Иконки и изображения
  if (event.request.url.includes('/icons/')) {
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
    return;
  }
  
  // Навигация — fallback на index.html (кеширован)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('./index.html');
        })
    );
    return;
  }
  
  // По умолчанию — сеть с fallback на кеш
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
  );
});

// Обработка сообщений от клиента
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
  
  // Обработка запроса на проверку обновлений
  if (event.data === 'checkUpdate') {
    self.skipWaiting();
    // Уведомляем всех клиентов о необходимости обновления
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage('updateAvailable');
      });
    });
  }
});

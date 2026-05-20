// ===== SERVICE WORKER ДЛЯ PWA (УЛУЧШЕННАЯ ВЕРСИЯ) =====
const CACHE_NAME = 'realty-trainer-v2';
const STATIC_CACHE = 'realty-static-v2';
const DATA_CACHE = 'realty-data-v2';

// Файлы для кеширования при установке
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
  '/manifest.json'
];

// JSON данные для кеширования
const dataUrls = [
  '/data/jks.json',
  '/data/questions.json',
  '/data/scenarios.json',
  '/data/marketing-steps.json',
  '/data/lesson-1.json'
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
          if (cache !== STATIC_CACHE && cache !== DATA_CACHE && cache !== CACHE_NAME) {
            console.log('[SW] Удалён старый кеш:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Страница офлайн режима
const OFFLINE_PAGE = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Нет соединения</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .offline-card {
            background: white;
            border-radius: 24px;
            padding: 40px 32px;
            text-align: center;
            max-width: 400px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        }
        .offline-icon { font-size: 64px; margin-bottom: 16px; }
        h1 { font-size: 24px; margin-bottom: 12px; color: #2d3436; }
        p { color: #636e72; margin-bottom: 24px; line-height: 1.5; }
        .btn {
            background: #2e86de;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 12px;
            font-size: 16px;
            cursor: pointer;
            width: 100%;
        }
        .btn:hover { background: #1b6dc1; }
        .retry-hint { font-size: 12px; margin-top: 16px; color: #b2bec3; }
    </style>
</head>
<body>
    <div class="offline-card">
        <div class="offline-icon">📡</div>
        <h1>Нет соединения с интернетом</h1>
        <p>Для работы тренажёра требуется подключение к сети.<br>Проверьте Wi-Fi или мобильные данные.</p>
        <button class="btn" onclick="location.reload()">🔄 Попробовать снова</button>
        <p class="retry-hint">После восстановления соединения нажмите "Попробовать снова"</p>
    </div>
</body>
</html>`;

// Перехват запросов — стратегия: сначала кеш, потом сеть
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // API Яндекс.Карт — только сеть (требует соединения)
  if (url.hostname.includes('api-maps.yandex.ru') || 
      url.hostname.includes('yandex')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Возвращаем ошибку, карта не работает офлайн
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
      event.request.url === '/' ||
      event.request.url.includes('/index.html')) {
    
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
  
  // Навигация — страница офлайн
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(event.request)
            .then(response => {
              if (response) return response;
              return new Response(OFFLINE_PAGE, {
                headers: { 'Content-Type': 'text/html' }
              });
            });
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

// Обработка сообщений от клиента (проверка обновлений)
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});

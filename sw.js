// ===== SERVICE WORKER ДЛЯ PWA (С ОФЛАЙН-ИНДИКАЦИЕЙ И УВЕДОМЛЕНИЕМ ОБ ОБНОВЛЕНИИ) =====

// Версия кеша (увеличивайте при каждом обновлении)
const CACHE_VERSION = 'v6';
const STATIC_CACHE = `realty-static-${CACHE_VERSION}`;
const DATA_CACHE = `realty-data-${CACHE_VERSION}`;

// Файлы для кеширования при установке
const urlsToCache = [
  './',
  './index.html',
  './app.html',
  './consultation.html',
  './developer.html',
  './ratings.html',
  './privacy.html',
  './css/base.css',
  './css/landing.css',
  './css/map.css',
  './css/steps.css',
  './css/drawer.css',
  './css/onboarding.css',
  './css/consultation.css',
  './css/developer.css',
  './js/config.js',
  './js/constants.js',
  './js/store.js',
  './js/dragdrop.js',
  './js/badges.js',
  './js/user.js',
  './js/progress.js',
  './js/brief.js',
  './js/interactive-lesson1.js',
  './js/client-journey.js',
  './js/drawer.js',
  './js/ui.js',
  './js/map/map-core.js',
  './js/map/map-utils.js',
  './js/map/map-ui.js',
  './js/map/map-step.js',
  './js/quiz.js',
  './js/timer-quiz.js',
  './js/decision-chain.js',
  './js/triple-match-drag.js',
  './js/interactive.js',
  './js/stepRegistry.js',
  './js/stepRegistry-init.js',
  './js/onboarding.js',
  './js/app.js',
  './js/utils/escape.js',
  './js/utils/toast.js',
  './js/utils/logger.js',
  './js/utils/analytics.js',
  './js/utils/offline-queue.js',
  './js/templates/ui-templates.js',
  './js/templates/quiz-templates.js',
  './js/templates/map-templates.js',
  './js/templates/client-journey-templates.js',
  './js/templates/interactive-templates.js',
  './js/templates/triple-templates.js',
  './js/consent.js',
  './js/consent-banner.js',
  './manifest.json'
];

// JSON данные для кеширования
const dataUrls = [
  './data/jks.json',
  './data/questions.json',
  './data/scenarios.json',
  './data/marketing-steps.json',
  './data/lesson-1.json',
  './data/floorplans.json',
  './data/consultation-dialogs.json',
  './data/locations.json'
];

// Установка Service Worker — кешируем статику
self.addEventListener('install', event => {
  console.log('[SW] Установка...', CACHE_VERSION);
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
      .then(() => {
        console.log('[SW] Установка завершена, активация...');
        return self.skipWaiting();
      })
      .catch(err => console.error('[SW] Ошибка кеширования:', err))
  );
});

// Активация — удаляем старые кеши
self.addEventListener('activate', event => {
  console.log('[SW] Активация...', CACHE_VERSION);
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
    }).then(() => {
      console.log('[SW] Активация завершена, уведомляем клиентов');
      return self.clients.matchAll();
    }).then(clients => {
      clients.forEach(client => {
        client.postMessage({ 
          type: 'SW_ACTIVATED',
          version: CACHE_VERSION 
        });
      });
      return self.clients.claim();
    })
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

// Функция для отправки статуса соединения всем клиентам
function broadcastConnectionStatus(isOnline) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'CONNECTION_STATUS',
        isOnline: isOnline,
        timestamp: Date.now()
      });
    });
  });
}

// Функция для отправки уведомления о новой версии
function broadcastNewVersionAvailable() {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'UPDATE_AVAILABLE',
        version: CACHE_VERSION,
        message: 'Доступна новая версия приложения'
      });
    });
  });
}

// Функция для проверки обновлений (периодическая)
function checkForUpdates() {
  console.log('[SW] Проверка обновлений...');
  self.registration.update().catch(err => {
    console.error('[SW] Ошибка проверки обновлений:', err);
  });
}

// Периодическая проверка обновлений (каждый час)
setInterval(() => {
  checkForUpdates();
}, 60 * 60 * 1000);

// Отслеживаем онлайн/офлайн статус
self.addEventListener('online', () => {
  console.log('[SW] Соединение восстановлено');
  broadcastConnectionStatus(true);
  checkForUpdates();
});

self.addEventListener('offline', () => {
  console.log('[SW] Соединение потеряно');
  broadcastConnectionStatus(false);
});

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
  
  // Google Sheets запросы — только сеть (не кешируем)
  if (url.hostname.includes('script.google.com')) {
    event.respondWith(
      fetch(event.request).catch(error => {
        console.warn('[SW] Google Sheets запрос не удался:', error);
        return new Response(JSON.stringify({ error: 'offline', queued: true }), {
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
      isPathRequest(event.request.url, '/index.html') ||
      isPathRequest(event.request.url, '/app.html') ||
      isPathRequest(event.request.url, '/consultation.html') ||
      isPathRequest(event.request.url, '/developer.html') ||
      isPathRequest(event.request.url, '/ratings.html') ||
      isPathRequest(event.request.url, '/privacy.html')) {
    
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
  
  // Иконки и изображения — кеш с fallback на плейсхолдер
  if (event.request.url.includes('/icons/') || 
      event.request.url.includes('/images/') ||
      event.request.url.includes('.png') ||
      event.request.url.includes('.jpg') ||
      event.request.url.includes('.svg')) {
    
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) return response;
          return fetch(event.request).catch(() => {
            return new Response(null, { status: 204 });
          });
        })
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
  const { data } = event;
  
  if (!data) return;
  
  if (data === 'skipWaiting') {
    console.log('[SW] Получен запрос на активацию');
    self.skipWaiting();
    broadcastNewVersionAvailable();
  }
  
  if (data === 'checkUpdate' || data?.type === 'checkUpdate') {
    console.log('[SW] Запрос на проверку обновлений');
    checkForUpdates();
  }
  
  if (data === 'getConnectionStatus' || data?.type === 'getConnectionStatus') {
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'CONNECTION_STATUS',
          isOnline: navigator.onLine,
          timestamp: Date.now()
        });
      });
    });
  }
  
  if (data === 'getVersion' || data?.type === 'getVersion') {
    event.source.postMessage({
      type: 'SW_VERSION',
      version: CACHE_VERSION,
      timestamp: Date.now()
    });
  }
});

// При получении push-уведомлений (если понадобится)
self.addEventListener('push', event => {
  const options = {
    body: event.data?.text() || 'Новое обновление доступно',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('Тренажёр агента', options)
  );
});
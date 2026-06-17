// ============================================================
// ВСПОМОГАТЕЛЬНЫЙ МОДУЛЬ ИНИЦИАЛИЗАЦИИ (ОБНОВЛЁННЫЙ)
// Версия: 2.0.0
// 
// Отвечает за:
// - Загрузку данных (вспомогательная функция)
// - Загрузку Яндекс.Карт (вспомогательная функция)
// - Вспомогательные функции для bootApp
// 
// ВНИМАНИЕ: Этот модуль больше НЕ содержит логики согласий.
// Вся логика согласий теперь в PrivacyManager и app-bootstrap.js.
// ============================================================

(function() {
    'use strict';

    // ===== КОНСТАНТЫ =====
    var MAP_API_KEY = '7d7f69f2-30f1-4a3c-93bd-b7b99354b7c5';
    var MAP_LOAD_TIMEOUT_MS = 10000;

    // ===== СОСТОЯНИЕ =====
    var _isYandexMapsLoading = false;
    var _yandexMapsLoaded = false;
    var _pendingMapCallbacks = [];

    // ===== ПУБЛИЧНЫЕ ФУНКЦИИ =====

    /**
     * Загружает Яндекс.Карты (только если согласие дано)
     * Вызывается из app-bootstrap.js после получения согласия
     */
    function loadYandexMaps() {
        // Проверяем, есть ли согласие на аналитику (карты считаются аналитическим инструментом)
        if (window.PrivacyManager && !window.PrivacyManager.isAnalyticsAllowed()) {
            console.log('[AppInitializer] Яндекс.Карты не загружены: нет согласия на аналитику');
            return;
        }

        // Проверяем, не загружены ли уже
        if (typeof ymaps !== 'undefined' && ymaps.Map) {
            console.log('[AppInitializer] Яндекс.Карты уже загружены');
            _yandexMapsLoaded = true;
            _notifyMapCallbacks();
            return;
        }

        // Проверяем, есть ли уже скрипт
        var existingScript = document.querySelector('script[src*="api-maps.yandex.ru"]');
        if (existingScript) {
            console.log('[AppInitializer] Скрипт Яндекс.Карт уже добавлен');
            // Ждём загрузки
            if (typeof ymaps !== 'undefined' && ymaps.ready) {
                ymaps.ready(function() {
                    _yandexMapsLoaded = true;
                    _notifyMapCallbacks();
                });
            }
            return;
        }

        if (_isYandexMapsLoading) {
            console.log('[AppInitializer] Яндекс.Карты уже загружаются');
            return;
        }

        console.log('[AppInitializer] Загрузка Яндекс.Карт...');
        _isYandexMapsLoading = true;

        var script = document.createElement('script');
        script.src = 'https://api-maps.yandex.ru/2.1/?apikey=' + MAP_API_KEY + '&lang=ru_RU';
        script.async = true;

        var timeoutId = setTimeout(function() {
            _isYandexMapsLoading = false;
            console.warn('[AppInitializer] Таймаут загрузки Яндекс.Карт');
            _notifyMapCallbacks(new Error('Таймаут загрузки Яндекс.Карт'));
        }, MAP_LOAD_TIMEOUT_MS);

        script.onload = function() {
            clearTimeout(timeoutId);
            _isYandexMapsLoading = false;
            _yandexMapsLoaded = true;
            console.log('[AppInitializer] Яндекс.Карты загружены');
            
            // Инициализируем карту, если она должна быть показана
            if (window.StoreInstance && window.StoreInstance.getCurrentScenario()) {
                var mapContainer = document.getElementById('map');
                if (mapContainer && !mapContainer.querySelector('.ymaps-map')) {
                    console.log('[AppInitializer] Повторная инициализация карты');
                    if (typeof initMap === 'function') {
                        initMap();
                    }
                }
            }
            
            _notifyMapCallbacks();
        };

        script.onerror = function() {
            clearTimeout(timeoutId);
            _isYandexMapsLoading = false;
            console.warn('[AppInitializer] Ошибка загрузки Яндекс.Карт');
            if (typeof showToast === 'function') {
                showToast('⚠️', 'Не удалось загрузить карту. Проверьте соединение.', 'warning');
            }
            _notifyMapCallbacks(new Error('Ошибка загрузки Яндекс.Карт'));
        };

        document.head.appendChild(script);
    }

    /**
     * Проверяет, загружены ли Яндекс.Карты
     * @returns {boolean}
     */
    function isYandexMapsLoaded() {
        return _yandexMapsLoaded || (typeof ymaps !== 'undefined' && ymaps.Map);
    }

    /**
     * Выполняет колбэк после загрузки Яндекс.Карт
     * @param {Function} callback - функция, которая будет вызвана после загрузки
     */
    function onYandexMapsReady(callback) {
        if (typeof callback !== 'function') return;

        if (isYandexMapsLoaded()) {
            try {
                callback();
            } catch (error) {
                console.error('[AppInitializer] Ошибка в колбэке карт:', error);
            }
            return;
        }

        _pendingMapCallbacks.push(callback);

        // Если карты ещё не начали загружаться — запускаем загрузку
        if (!_isYandexMapsLoading && !_yandexMapsLoaded) {
            loadYandexMaps();
        }
    }

    /**
     * Уведомляет все ожидающие колбэки о загрузке карт
     */
    function _notifyMapCallbacks(error) {
        var callbacks = _pendingMapCallbacks.slice();
        _pendingMapCallbacks = [];

        for (var i = 0; i < callbacks.length; i++) {
            try {
                callbacks[i](error);
            } catch (err) {
                console.error('[AppInitializer] Ошибка в колбэке карт:', err);
            }
        }
    }

    /**
     * Загружает FontAwesome (шрифты и иконки)
     */
    function loadFontAwesome() {
        // Проверяем, загружен ли уже
        if (document.querySelector('link[href*="font-awesome"]')) {
            return;
        }
        
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css';
        link.crossOrigin = 'anonymous';
        link.referrerPolicy = 'no-referrer';
        document.head.appendChild(link);
        
        console.log('[AppInitializer] FontAwesome загружен');
    }

    /**
     * Проверяет, можно ли загружать Яндекс.Карты
     * @returns {boolean}
     */
    function canLoadYandexMaps() {
        // Проверяем через PrivacyManager
        if (window.PrivacyManager) {
            return window.PrivacyManager.isAnalyticsAllowed();
        }

        // Fallback: проверяем localStorage
        try {
            var consent = localStorage.getItem('user_consent_given');
            return consent === 'true';
        } catch (_) {
            return false;
        }
    }

    /**
     * Загружает данные (обёртка для обратной совместимости)
     * @deprecated Используйте bootApp() из app-bootstrap.js
     */
    function loadData() {
        console.warn('[AppInitializer] loadData() устарела. Используйте bootApp() из app-bootstrap.js');
        
        // Проверяем согласие
        if (window.PrivacyManager && !window.PrivacyManager.hasConsent()) {
            console.log('[AppInitializer] Нет согласия, загрузка данных отложена');
            return;
        }

        // Загружаем данные
        if (typeof fetchDataAndRender === 'function') {
            fetchDataAndRender(true);
        } else {
            console.error('[AppInitializer] fetchDataAndRender не найдена');
        }
    }

    /**
     * Загружает данные без карт
     * @deprecated Используйте bootApp() из app-bootstrap.js
     */
    function loadDataWithoutMaps() {
        console.warn('[AppInitializer] loadDataWithoutMaps() устарела');
        
        if (typeof fetchDataAndRender === 'function') {
            fetchDataAndRender(false);
        }
    }

    /**
     * Инициализация приложения после согласия
     * @deprecated Используется только для обратной совместимости
     */
    function initializeAppAfterConsent() {
        console.warn('[AppInitializer] initializeAppAfterConsent() устарела. Используйте bootApp()');
        
        // Просто делегируем в bootApp
        if (typeof bootApp === 'function') {
            bootApp();
        }
    }

    /**
     * Обработка отказа от согласия
     * @deprecated Используется только для обратной совместимости
     */
    function handleConsentDeclined() {
        console.warn('[AppInitializer] handleConsentDeclined() устарела');
        
        if (typeof showToast === 'function') {
            showToast('🔒', 'Вы отказались от обработки данных. Карта и некоторые функции недоступны.', 'warning');
        }
        
        if (typeof loadDataWithoutMaps === 'function') {
            loadDataWithoutMaps();
        }
    }

    // ===== ЭКСПОРТ =====
    window.loadYandexMaps = loadYandexMaps;
    window.isYandexMapsLoaded = isYandexMapsLoaded;
    window.onYandexMapsReady = onYandexMapsReady;
    window.canLoadYandexMaps = canLoadYandexMaps;
    window.loadFontAwesome = loadFontAwesome;
    
    // Устаревшие, но оставленные для обратной совместимости
    window.loadData = loadData;
    window.loadDataWithoutMaps = loadDataWithoutMaps;
    window.initializeAppAfterConsent = initializeAppAfterConsent;
    window.handleConsentDeclined = handleConsentDeclined;

    console.log('[AppInitializer] Модуль загружен, версия: 2.0.0');

})();
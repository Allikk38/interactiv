// ============================================================
// ГЛАВНЫЙ ФАЙЛ ПРИЛОЖЕНИЯ — ТОЧКА ВХОДА
// Версия: 3.2 (ИСПРАВЛЕНА ЗАГРУЗКА БАННЕРА СОГЛАСИЯ)
// ============================================================

(function() {
    'use strict';

    // ===== ПЕРЕМЕННЫЕ =====
    var _isInitialized = false;
    var _mapsLoaded = false;

    // ===== ЗАГРУЗКА КАРТ =====

    /**
     * Загружает Яндекс.Карты, если есть согласие
     */
    function loadYandexMapsIfAllowed() {
        // Проверяем, есть ли согласие через PrivacyManager
        if (window.PrivacyManager && PrivacyManager.hasConsent()) {
            console.log('[App] Согласие есть, загрузка Яндекс.Карт...');
            _loadYandexMaps();
            return;
        }

        // Если PrivacyManager не загружен, проверяем localStorage
        if (!window.PrivacyManager) {
            try {
                var consent = localStorage.getItem('user_consent_given');
                if (consent === 'true') {
                    console.log('[App] Согласие в localStorage, загрузка Яндекс.Карт...');
                    _loadYandexMaps();
                    return;
                }
            } catch (_) {}
        }

        console.log('[App] Нет согласия, Яндекс.Карты не загружены');
        _showMapPlaceholder();
    }

    /**
     * Загружает Яндекс.Карты
     */
    function _loadYandexMaps() {
        // Проверяем, не загружены ли уже
        if (typeof ymaps !== 'undefined' && ymaps.Map) {
            console.log('[App] Яндекс.Карты уже загружены');
            _mapsLoaded = true;
            _initMapIfNeeded();
            return;
        }

        // Проверяем, есть ли уже скрипт
        var existingScript = document.querySelector('script[src*="api-maps.yandex.ru"]');
        if (existingScript) {
            console.log('[App] Скрипт Яндекс.Карт уже добавлен, ждём загрузки');
            // Ждём загрузки
            if (typeof ymaps !== 'undefined' && ymaps.ready) {
                ymaps.ready(function() {
                    _mapsLoaded = true;
                    _initMapIfNeeded();
                });
            }
            return;
        }

        console.log('[App] Загрузка Яндекс.Карт...');
        var script = document.createElement('script');
        script.src = 'https://api-maps.yandex.ru/2.1/?apikey=7d7f69f2-30f1-4a3c-93bd-b7b99354b7c5&lang=ru_RU';
        script.async = true;

        var timeoutId = setTimeout(function() {
            console.warn('[App] Таймаут загрузки Яндекс.Карт');
            _showMapPlaceholder();
        }, 10000);

        script.onload = function() {
            clearTimeout(timeoutId);
            _mapsLoaded = true;
            console.log('[App] Яндекс.Карты загружены');
            
            // Инициализируем карту, если она должна быть показана
            _initMapIfNeeded();
        };

        script.onerror = function() {
            clearTimeout(timeoutId);
            console.warn('[App] Ошибка загрузки Яндекс.Карт');
            _showMapPlaceholder();
            if (typeof showToast === 'function') {
                showToast('⚠️', 'Не удалось загрузить карту. Проверьте соединение.', 'warning');
            }
        };

        document.head.appendChild(script);
    }

    /**
     * Инициализирует карту, если она нужна
     */
    function _initMapIfNeeded() {
        var mapContainer = document.getElementById('map');
        if (!mapContainer) return;

        // Проверяем, не инициализирована ли уже карта
        if (mapContainer.querySelector('.ymaps-map')) {
            return;
        }

        // Проверяем, есть ли активный сценарий с картой
        if (window.StoreInstance && StoreInstance.getCurrentScenario()) {
            var currentStep = StoreInstance.getCurrentScenario().steps[StoreInstance.getCurrentStepIndex()];
            if (currentStep && currentStep.type === 'map') {
                console.log('[App] Инициализация карты для шага карты');
                if (typeof initMap === 'function') {
                    initMap();
                }
            }
        }
    }

    /**
     * Показывает заглушку на месте карты
     */
    function _showMapPlaceholder() {
        var mapContainer = document.getElementById('map');
        if (!mapContainer) return;

        // Проверяем, не занят ли контейнер уже картой
        if (mapContainer.querySelector('.ymaps-map')) {
            return;
        }

        mapContainer.innerHTML = `
            <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                background: #f5f6fa;
                color: #636e72;
                padding: 40px;
                text-align: center;
            ">
                <div style="font-size: 3rem; margin-bottom: 16px;">🗺️</div>
                <h3 style="margin-bottom: 8px;">Карта загружается...</h3>
                <p style="max-width: 400px; font-size: 0.9rem; color: #b0b0b0;">
                    Проверьте подключение к интернету.
                </p>
            </div>
        `;
    }

    // ===== ОСНОВНАЯ ЛОГИКА =====

    /**
     * Запускает приложение после загрузки DOM
     */
    function initApp() {
        if (_isInitialized) return;
        console.log('[App] Запуск приложения...');

        // Проверяем, что User загружен
        if (typeof User === 'undefined') {
            console.warn('[App] User не загружен, повторная попытка через 500ms');
            setTimeout(initApp, 500);
            return;
        }

        // Проверяем пользователя
        var user = User.get();
        if (!user) {
            User.showNamePrompt(function(name) {
                console.log('[App] Пользователь создан:', name);
                initializeApp();
            });
        } else {
            initializeApp();
        }

        _isInitialized = true;
    }

    /**
     * Основная инициализация приложения
     */
    function initializeApp() {
        console.log('[App] Инициализация приложения...');

        try {
            // ===== ВАЖНО: ЗАПУСКАЕМ ПРОЦЕСС СОГЛАСИЯ =====
            // bootApp() находится в app-bootstrap.js и отвечает за:
            // 1. Проверку наличия согласия
            // 2. Показ баннера, если согласия нет
            // 3. Запуск приложения после получения согласия
            if (typeof bootApp === 'function') {
                console.log('[App] Вызов bootApp() для управления согласием...');
                bootApp();
            } else {
                console.warn('[App] bootApp() не найдена, используется fallback-инициализация');
                // Fallback: если bootApp не загружена, используем старую логику
                loadDataAndRender();
            }

            // Добавляем кнопку смены пользователя
            if (typeof addUserChangeButton === 'function') {
                addUserChangeButton();
            }

            // Обновляем XP в шапке
            if (typeof updateHeaderXP === 'function') {
                updateHeaderXP();
            }

            // Обновляем информацию о пользователе
            if (typeof updateHeaderUser === 'function') {
                updateHeaderUser();
            }

            // Проверяем сохранённый прогресс
            if (typeof checkForSavedProgress === 'function') {
                checkForSavedProgress();
            }

            // Настраиваем автосохранение
            if (typeof setupAutoSave === 'function') {
                setupAutoSave();
            }

            // Инициализируем аналитику
            if (typeof initAnalytics === 'function') {
                initAnalytics();
            }

            // Инициализируем PWA обновления
            if (typeof initPWAUpdates === 'function') {
                initPWAUpdates();
            }

            // Инициализируем офлайн-индикатор
            if (typeof initOfflineIndicator === 'function') {
                initOfflineIndicator();
            }

            // Инициализируем онбординг
            if (typeof Onboarding !== 'undefined' && Onboarding.init) {
                Onboarding.init();
            }

            // ПОДПИСЫВАЕМСЯ НА ИЗМЕНЕНИЕ СОГЛАСИЯ
            if (window.PrivacyManager) {
                PrivacyManager.subscribe(function(state) {
                    console.log('[App] Статус согласия изменён:', state);
                    if (state.consentGiven && state.categories.analytics) {
                        // Если согласие получено — загружаем карты
                        if (!_mapsLoaded) {
                            console.log('[App] Получено согласие на аналитику, загрузка карт...');
                            _loadYandexMaps();
                        }
                    }
                });
            }

            // Пытаемся загрузить карты, если есть согласие
            setTimeout(function() {
                loadYandexMapsIfAllowed();
            }, 1000);

            console.log('[App] Приложение успешно инициализировано');

            // Показываем приветствие
            var user = User.get();
            if (user) {
                showToast('👋', 'С возвращением, ' + user.name + '!', 'success');
            }

        } catch (error) {
            console.error('[App] Ошибка инициализации:', error);
            showToast('❌', 'Произошла ошибка при загрузке приложения', 'error');
        }
    }

    /**
     * Загрузка данных и рендеринг (fallback-режим)
     * Используется только если bootApp() не загружена
     */
    function loadDataAndRender() {
        // Проверяем, что данные уже загружены в StoreInstance
        if (window.StoreInstance && StoreInstance.getScenarios().length > 0) {
            console.log('[App] Данные уже загружены в Store');
            renderScenarios();
            return;
        }

        // Загружаем данные
        console.log('[App] Загрузка данных...');
        
        var jksPromise = fetch('data/jks.json');
        var questionsPromise = fetch('data/questions.json');
        var scenariosPromise = fetch('data/scenarios.json');

        Promise.all([jksPromise, questionsPromise, scenariosPromise])
            .then(function(responses) {
                var jksRes = responses[0];
                var questionsRes = responses[1];
                var scenariosRes = responses[2];

                if (!jksRes.ok || !scenariosRes.ok) {
                    throw new Error('Ошибка загрузки данных');
                }

                return Promise.all([
                    jksRes.json(),
                    scenariosRes.json(),
                    questionsRes.ok ? questionsRes.json() : Promise.resolve([])
                ]);
            })
            .then(function(data) {
                var jksData = data[0];
                var scenariosData = data[1];
                var questionsData = data[2] || [];

                // Сохраняем в StoreInstance
                if (window.StoreInstance) {
                    StoreInstance.setAllJks(jksData);
                    StoreInstance.setScenarios(scenariosData);
                    StoreInstance.setAllQuestions(questionsData);
                }

                // Делаем глобальную переменную для совместимости
                window.allScenarios = scenariosData;

                // Загружаем marketing-steps.json
                return fetch('data/marketing-steps.json')
                    .then(function(res) {
                        if (res.ok) return res.json();
                        return null;
                    })
                    .then(function(marketingData) {
                        if (marketingData && window.StoreInstance) {
                            StoreInstance.setMarketingData(marketingData);
                        }
                        return { 
                            jksData: jksData, 
                            scenariosData: scenariosData, 
                            questionsData: questionsData, 
                            marketingData: marketingData 
                        };
                    });
            })
            .then(function(result) {
                console.log('[App] Данные загружены, количество сценариев:', result.scenariosData.length);
                
                // Рендерим сценарии
                if (typeof renderScenarios === 'function') {
                    renderScenarios();
                }

                // Обновляем UI
                if (typeof updateQuickStats === 'function') {
                    updateQuickStats();
                }

                if (typeof updateContinueLearning === 'function') {
                    updateContinueLearning();
                }

                // Инициализируем PremiumUI после загрузки данных
                if (typeof PremiumUI !== 'undefined' && PremiumUI.init) {
                    // Проверяем, что все сценарии загружены
                    if (window.allScenarios && window.allScenarios.length > 0) {
                        console.log('[App] PremiumUI инициализация после загрузки данных');
                        if (typeof PremiumUI.reinit === 'function') {
                            PremiumUI.reinit();
                        }
                    }
                }

                // После загрузки данных пробуем инициализировать карту
                setTimeout(function() {
                    if (_mapsLoaded) {
                        _initMapIfNeeded();
                    } else {
                        loadYandexMapsIfAllowed();
                    }
                }, 500);
            })
            .catch(function(error) {
                console.error('[App] Ошибка загрузки данных:', error);
                showToast('❌', 'Не удалось загрузить данные. Обновите страницу.', 'error');
            });
    }

    // ===== ЭКСПОРТ =====
    // Делаем функции доступными для других модулей
    window.loadYandexMapsIfAllowed = loadYandexMapsIfAllowed;
    window.loadYandexMaps = _loadYandexMaps;
    window.forceLoadMaps = _loadYandexMaps;

    // Запускаем приложение
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApp);
    } else {
        initApp();
    }

    console.log('[App] Модуль загружен, версия: 3.2');

})();
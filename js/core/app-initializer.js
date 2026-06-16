// ============================================================
// ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ
// Версия: 1.0
// Отвечает за: загрузку данных, инициализацию модулей
// ============================================================

(function() {
    'use strict';

    /**
     * Инициализация приложения после получения согласия
     */
    function initializeAppAfterConsent() {
        console.log('[App] Инициализация после согласия');

        // Загружаем Яндекс.Карты (если они нужны)
        loadYandexMaps();

        // Загружаем FontAwesome (безопасно)
        loadFontAwesome();

        // Загружаем данные и запускаем приложение
        loadData();
    }

    /**
     * Обработка отказа от согласия — упрощённый режим
     */
    function handleConsentDeclined() {
        console.log('[App] Пользователь отказался от согласия — упрощённый режим');

        // Показываем тост
        if (typeof showToast === 'function') {
            showToast(
                '🔒',
                'Вы отказались от обработки данных. Карта и некоторые функции недоступны.',
                'warning'
            );
        }

        // Загружаем только базовые данные (без карт)
        loadDataWithoutMaps();
    }

    /**
     * Загрузка данных без карт (упрощённый режим)
     */
    function loadDataWithoutMaps() {
        // Показываем заглушку на карте
        var mapContainer = document.getElementById('map');
        if (mapContainer) {
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
                    <div style="font-size: 3rem; margin-bottom: 16px;">🔒</div>
                    <h3 style="margin-bottom: 8px;">Карта недоступна</h3>
                    <p style="max-width: 400px; font-size: 0.9rem;">
                        Для отображения карты требуется ваше согласие на обработку данных.
                        Вы можете изменить решение в настройках браузера.
                    </p>
                </div>
            `;
        }

        // Загружаем остальные данные без карт
        loadDataCore(false);
    }

    /**
     * Ядро загрузки данных (общая логика)
     * @param {boolean} withMaps - загружать ли карты
     */
    function loadDataCore(withMaps) {
        // Инициализируем офлайн-индикатор
        if (typeof initOfflineIndicator === 'function') {
            initOfflineIndicator();
        }

        // Загружаем данные
        fetchDataAndRender(withMaps);
    }

    /**
     * Основная функция загрузки данных и рендеринга
     */
    function fetchDataAndRender(withMaps) {
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

                // Читаем все данные параллельно
                var jksDataPromise = jksRes.json();
                var scenariosDataPromise = scenariosRes.json();
                var questionsDataPromise = questionsRes.ok ? questionsRes.json() : Promise.resolve([]);

                return Promise.all([
                    jksDataPromise,
                    scenariosDataPromise,
                    questionsDataPromise
                ]);
            })
            .then(function(data) {
                var jksData = data[0];
                var scenariosData = data[1];
                var questionsData = data[2] || [];

                // Сохраняем в Store
                if (window.StoreInstance) {
                    StoreInstance.setAllJks(jksData);
                    StoreInstance.setScenarios(scenariosData);
                    StoreInstance.setAllQuestions(questionsData);
                }

                // Загружаем marketing-steps.json если нужно
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
                // Проверяем пользователя
                var user = User.get();
                if (!user) {
                    User.showNamePrompt(function() {
                        renderScenarios();
                        addUserChangeButton();
                        updateHeaderXP();
                        updateHeaderUser();
                        checkForSavedProgress();
                    });
                } else {
                    renderScenarios();
                    addUserChangeButton();
                    updateHeaderXP();
                    updateHeaderUser();
                    if (typeof showToast === 'function') {
                        showToast('👋', 'С возвращением, ' + user.name + '!', 'success');
                    }
                    checkForSavedProgress();
                }

                // Инициализируем прогресс-бар
                if (window.ProgressBar && window.ProgressBar.init) {
                    // ProgressBar.init() — инициализация при необходимости
                }

                // Настраиваем Drawer
                if (window.Drawer && window.Drawer.init) {
                    window.Drawer.init();
                }

                // Настройка автосохранения
                setupAutoSave();

                // Инициализация аналитики
                initAnalytics();

                // Инициализация PWA обновлений
                initPWAUpdates();

                // Если карты нужны — загружаем
                if (withMaps) {
                    loadYandexMaps();
                }

                console.log('[App] Приложение инициализировано');
            })
            .catch(function(error) {
                console.error('Ошибка загрузки данных:', error);
                if (typeof showToast === 'function') {
                    showToast('❌', 'Не удалось загрузить данные. Обновите страницу.', 'error');
                }
            });
    }

    /**
     * Загрузить Яндекс.Карты (только после согласия)
     */
    function loadYandexMaps() {
        // Проверяем, не загружены ли уже
        if (typeof ymaps !== 'undefined' && ymaps.Map) {
            console.log('[App] Яндекс.Карты уже загружены');
            return;
        }

        // Проверяем, есть ли уже скрипт
        var existingScript = document.querySelector('script[src*="api-maps.yandex.ru"]');
        if (existingScript) {
            console.log('[App] Скрипт Яндекс.Карт уже добавлен');
            return;
        }

        console.log('[App] Загрузка Яндекс.Карт...');
        var script = document.createElement('script');
        script.src = 'https://api-maps.yandex.ru/2.1/?apikey=7d7f69f2-30f1-4a3c-93bd-b7b99354b7c5&lang=ru_RU';
        script.async = true;
        script.onload = function() {
            console.log('[App] Яндекс.Карты загружены');
            // Если карта уже должна быть показана — инициализируем
            if (window.StoreInstance && window.StoreInstance.getCurrentScenario()) {
                // Переинициализируем карту, если нужно
                var mapContainer = document.getElementById('map');
                if (mapContainer && !mapContainer.querySelector('.ymaps-map')) {
                    console.log('[App] Повторная инициализация карты');
                    if (typeof initMap === 'function') {
                        initMap();
                    }
                }
            }
        };
        script.onerror = function() {
            console.warn('[App] Ошибка загрузки Яндекс.Карт');
            if (typeof showToast === 'function') {
                showToast('⚠️', 'Не удалось загрузить карту. Проверьте соединение.', 'warning');
            }
        };
        document.head.appendChild(script);
    }

    /**
     * Загрузить FontAwesome (шрифты и иконки)
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
        
        console.log('[App] FontAwesome загружен');
    }

    /**
     * Основная функция загрузки данных
     */
    function loadData() {
        loadDataCore(true);
    }

    // ===== ЭКСПОРТ В ГЛОБАЛЬНУЮ ОБЛАСТЬ =====
    window.loadData = loadData;
    window.loadYandexMaps = loadYandexMaps;
    window.initializeAppAfterConsent = initializeAppAfterConsent;
    window.handleConsentDeclined = handleConsentDeclined;

    console.log('[AppInitializer] Модуль загружен, версия: 1.0');

})();
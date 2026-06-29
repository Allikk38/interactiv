// ============================================================
// ЗАПУСК ПРИЛОЖЕНИЯ — ТОЧКА ВХОДА (ОБНОВЛЁННЫЙ)
// Версия: 2.7.0
// 
// Отвечает за:
// - Инициализацию приложения
// - Управление согласием через PrivacyManager
// - Запуск приложения после получения согласия
// - Координацию между модулями
// - Передачу IP-адреса при отправке согласия
// ============================================================

(function() {
    'use strict';

    // ===== ПРИВАТНЫЕ ПЕРЕМЕННЫЕ =====
    var _isBooted = false;
    var _isWaitingForConsent = false;
    var _pendingBootCallbacks = [];
    var _bootstrapAttempts = 0;
    var _maxBootstrapAttempts = 10;
    var _dataLoadAttempts = 0;
    var _maxDataLoadAttempts = 20;

    // ===== ПУБЛИЧНЫЙ API =====

    /**
     * Главная функция запуска приложения
     * Вызывается из app.html при загрузке страницы
     */
    function bootApp() {
        console.log('[AppBootstrap] Запуск приложения...');

        if (_isBooted) {
            console.log('[AppBootstrap] Приложение уже запущено');
            return;
        }

        ensurePulseStyle();
        setupEventListeners();
        registerServiceWorker();

        if (window.setupPWAInstall) {
            window.setupPWAInstall();
        }

        requestConsentAndBoot();
    }

    /**
     * Запрашивает согласие и запускает приложение
     */
    function requestConsentAndBoot() {
        _bootstrapAttempts++;

        if (_bootstrapAttempts > _maxBootstrapAttempts) {
            console.error('[AppBootstrap] Превышено количество попыток загрузки');
            initializeAppAfterConsent();
            return;
        }

        if (!window.PrivacyManager) {
            console.log('[AppBootstrap] Ожидание PrivacyManager... (попытка ' + _bootstrapAttempts + ')');
            setTimeout(function() {
                requestConsentAndBoot();
            }, 200);
            return;
        }

        // ===== ПРОВЕРКА: если согласие уже есть — сразу запускаем =====
        if (window.PrivacyManager.hasConsent()) {
            console.log('[AppBootstrap] Согласие уже есть, запуск приложения');
            initializeAppAfterConsent();
            return;
        }

        if (!window.ConsentBanner) {
            console.log('[AppBootstrap] Ожидание ConsentBanner... (попытка ' + _bootstrapAttempts + ')');
            setTimeout(function() {
                requestConsentAndBoot();
            }, 200);
            return;
        }

        console.log('[AppBootstrap] Запрос согласия у пользователя');
        _isWaitingForConsent = true;

        window.ConsentBanner.init(
            function(categories) {
                console.log('[AppBootstrap] Пользователь дал согласие', categories);
                _isWaitingForConsent = false;
                initializeAppAfterConsent();
            },
            function() {
                console.log('[AppBootstrap] Пользователь отказался от согласия');
                _isWaitingForConsent = false;
                handleConsentDeclined();
            }
        );

        window.ConsentBanner.show();
    }

    /**
     * Инициализация приложения после получения согласия
     */
    function initializeAppAfterConsent() {
        console.log('[AppBootstrap] Инициализация после согласия');

        // Загружаем карты, если есть согласие на аналитику
        if (window.canLoadYandexMaps && window.canLoadYandexMaps()) {
            if (window.loadYandexMaps) {
                window.loadYandexMaps();
            }
        } else {
            console.log('[AppBootstrap] Яндекс.Карты не загружены: нет согласия на аналитику');
            showMapPlaceholder();
        }

        if (window.loadFontAwesome) {
            window.loadFontAwesome();
        }

        loadAppData();

        _pendingBootCallbacks.forEach(function(callback) {
            try {
                callback();
            } catch (error) {
                console.error('[AppBootstrap] Ошибка в отложенном колбэке:', error);
            }
        });
        _pendingBootCallbacks = [];

        _isBooted = true;
        console.log('[AppBootstrap] Приложение запущено');
    }

    /**
     * Обработка отказа от согласия — упрощённый режим
     */
    function handleConsentDeclined() {
        console.log('[AppBootstrap] Пользователь отказался от согласия — упрощённый режим');

        if (typeof showToast === 'function') {
            showToast(
                '🔒',
                'Вы отказались от обработки данных. Карта и некоторые функции недоступны.',
                'warning'
            );
        }

        showMapPlaceholder();
        loadAppData();

        _pendingBootCallbacks.forEach(function(callback) {
            try {
                callback();
            } catch (error) {
                console.error('[AppBootstrap] Ошибка в отложенном колбэке:', error);
            }
        });
        _pendingBootCallbacks = [];

        _isBooted = true;
        console.log('[AppBootstrap] Приложение запущено в упрощённом режиме');
    }

    /**
     * Показывает заглушку на карте
     */
    function showMapPlaceholder() {
        var mapContainer = document.getElementById('map');
        if (!mapContainer) return;

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
                <div style="font-size: 3rem; margin-bottom: 16px;">🔒</div>
                <h3 style="margin-bottom: 8px;">Карта недоступна</h3>
                <p style="max-width: 400px; font-size: 0.9rem;">
                    Для отображения карты требуется ваше согласие на обработку данных.
                    Вы можете изменить решение, очистив данные сайта в настройках браузера.
                </p>
                <button onclick="location.reload()" style="
                    margin-top: 16px;
                    padding: 10px 24px;
                    background: #2e86de;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                ">
                    <i class="fas fa-sync-alt"></i> Обновить страницу
                </button>
            </div>
        `;
    }

    /**
     * Загрузка данных приложения
     */
    function loadAppData() {
        if (window.StoreInstance && window.StoreInstance.getAllJks().length > 0) {
            console.log('[AppBootstrap] Данные уже загружены в Store');
            renderUI();
            return;
        }

        console.log('[AppBootstrap] Загрузка данных...');

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

                if (window.StoreInstance) {
                    window.StoreInstance.setAllJks(jksData);
                    window.StoreInstance.setScenarios(scenariosData);
                    window.StoreInstance.setAllQuestions(questionsData);
                }

                // Сохраняем сценарии в глобальную переменную
                window.allScenarios = scenariosData;

                return fetch('data/marketing-steps.json')
                    .then(function(res) {
                        if (res.ok) return res.json();
                        return null;
                    })
                    .then(function(marketingData) {
                        if (marketingData && window.StoreInstance) {
                            window.StoreInstance.setMarketingData(marketingData);
                        }
                        return { 
                            jksData: jksData, 
                            scenariosData: scenariosData, 
                            questionsData: questionsData, 
                            marketingData: marketingData 
                        };
                    });
            })
            .then(function() {
                console.log('[AppBootstrap] Данные загружены, количество сценариев:', window.allScenarios ? window.allScenarios.length : 0);
                renderUI();
            })
            .catch(function(error) {
                console.error('[AppBootstrap] Ошибка загрузки данных:', error);
                if (typeof showToast === 'function') {
                    showToast('❌', 'Не удалось загрузить данные. Обновите страницу.', 'error');
                }
                renderUI();
            });
    }

    /**
     * Рендер UI после загрузки данных
     */
    function renderUI() {
        var user = null;
        if (window.User) {
            user = window.User.get();
        }

        if (!user) {
            if (window.User && window.User.showNamePrompt) {
                window.User.showNamePrompt(function(name) {
                    console.log('[AppBootstrap] Пользователь создан:', name);
                    renderUIComponents();
                    // Онбординг запустится автоматически через Onboarding.checkAndAutoStart()
                });
            } else {
                renderUIComponents();
            }
        } else {
            renderUIComponents();
            if (typeof showToast === 'function') {
                showToast('👋', 'С возвращением, ' + user.name + '!', 'success');
            }
        }
    }

    /**
     * Рендер UI компонентов
     */
    function renderUIComponents() {
        // Проверяем, что данные загружены
        var scenarios = window.allScenarios || [];
        if (window.StoreInstance) {
            var storeScenarios = StoreInstance.getScenarios();
            if (storeScenarios && storeScenarios.length > 0) {
                scenarios = storeScenarios;
                window.allScenarios = scenarios;
            }
        }

        if (!scenarios || scenarios.length === 0) {
            console.warn('[AppBootstrap] Сценарии ещё не загружены, повторная попытка...');
            _dataLoadAttempts++;
            if (_dataLoadAttempts < _maxDataLoadAttempts) {
                setTimeout(function() {
                    renderUIComponents();
                }, 500);
            } else {
                console.error('[AppBootstrap] Превышено количество попыток загрузки сценариев');
            }
            return;
        }

        console.log('[AppBootstrap] Рендеринг UI, сценариев:', scenarios.length);

        if (typeof renderScenarios === 'function') {
            renderScenarios();
        } else {
            console.warn('[AppBootstrap] renderScenarios не определена');
        }

        if (typeof addUserChangeButton === 'function') {
            addUserChangeButton();
        }

        if (typeof updateHeaderXP === 'function') {
            updateHeaderXP();
        }

        if (typeof updateHeaderUser === 'function') {
            updateHeaderUser();
        }

        if (typeof checkForSavedProgress === 'function') {
            checkForSavedProgress();
        }

        if (window.Drawer && window.Drawer.init) {
            window.Drawer.init();
        }

        if (typeof setupAutoSave === 'function') {
            setupAutoSave();
        }

        if (typeof initAnalytics === 'function') {
            initAnalytics();
        }

        if (typeof initPWAUpdates === 'function') {
            initPWAUpdates();
        }

        if (typeof initOfflineIndicator === 'function') {
            initOfflineIndicator();
        }

        // ===== ВАЖНО: Onboarding.init() уже вызывается в app.js =====
        // Не дублируем вызов здесь, чтобы избежать конфликтов
        // Онбординг сам проверит, нужно ли запускаться
        console.log('[AppBootstrap] UI компоненты отрендерены');
    }

    /**
     * Навешивает обработчики событий на элементы UI
     */
    function setupEventListeners() {
        var buttons = [
            'journey-back-btn',
            'back-to-scenarios-btn',
            'quiz-back-btn',
            'finish-scenarios-btn'
        ];

        buttons.forEach(function(id) {
            var el = document.getElementById(id);
            if (el) {
                el.addEventListener('click', function() {
                    if (typeof exitToScenarios === 'function') {
                        exitToScenarios();
                    }
                });
            }
        });

        var restartBtn = document.getElementById('finish-restart-btn');
        if (restartBtn) {
            restartBtn.addEventListener('click', function() {
                if (window.AppState && window.AppState.currentScenario) {
                    if (window.User) {
                        window.User.clearScenarioProgress(window.AppState.currentScenario.id);
                    }
                    window.AppState.currentStepIndex = 0;
                    window.AppState.stepStats = [];
                    window.AppState.quizAnswers = [];
                    window.AppState.placedJks = new Map();
                    window.AppState.scenarioStartTime = Date.now();
                    
                    var finishScreen = document.getElementById('finish-screen');
                    if (finishScreen) finishScreen.classList.add('hidden');
                    
                    if (typeof runStep === 'function') {
                        runStep();
                    }
                }
            });
        }

        var hintBtn = document.getElementById('hint-btn');
        if (hintBtn) {
            hintBtn.addEventListener('click', function() {
                if (window.AppState && window.AppState.selectedJkId === null) {
                    if (typeof showToast === 'function') {
                        showToast('💡', 'Сначала выберите ЖК из списка', 'info');
                    }
                    return;
                }
                var jk = null;
                if (window.StoreInstance) {
                    var allJks = window.StoreInstance.getAllJks();
                    jk = allJks.find(function(j) { 
                        return j.id === window.AppState.selectedJkId; 
                    });
                }
                if (jk) {
                    if (typeof showToast === 'function') {
                        showToast('💡', jk.hint || 'Подсказка недоступна', 'error');
                    }
                    if (typeof sendHintUsed === 'function') {
                        sendHintUsed('map', 'Расстановка ЖК', 'location_hint');
                    }
                }
            });
        }

        var resetBtn = document.getElementById('reset-step-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', function() {
                if (typeof resetMapStep === 'function') {
                    resetMapStep();
                }
            });
        }
    }

    /**
     * Регистрация Service Worker
     */
    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
                navigator.serviceWorker.register('./sw.js')
                    .then(function(registration) {
                        console.log('[AppBootstrap] Service Worker зарегистрирован:', registration.scope);

                        var updateInterval = 3600000;
                        if (typeof TIMERS !== 'undefined' && TIMERS.UPDATE_CHECK_INTERVAL_MS) {
                            updateInterval = TIMERS.UPDATE_CHECK_INTERVAL_MS;
                        }

                        setInterval(function() {
                            registration.update();
                        }, updateInterval);

                        document.addEventListener('visibilitychange', function() {
                            if (!document.hidden) {
                                registration.update();
                            }
                        });
                    })
                    .catch(function(error) {
                        console.error('[AppBootstrap] Ошибка регистрации Service Worker:', error);
                    });
            });
        }
    }

    /**
     * Добавляет стиль pulse для кнопок
     */
    function ensurePulseStyle() {
        if (document.getElementById('pulse-style')) return;
        var pulseStyle = document.createElement('style');
        pulseStyle.id = 'pulse-style';
        pulseStyle.textContent = `
            @keyframes pulse {
                0%, 100% { transform: translateX(-50%) scale(1); opacity: 1; }
                50% { transform: translateX(-50%) scale(1.05); opacity: 0.9; }
            }
        `;
        document.head.appendChild(pulseStyle);
    }

    /**
     * Добавляет callback, который будет выполнен после загрузки приложения
     * @param {Function} callback
     */
    function onBootComplete(callback) {
        if (_isBooted) {
            try {
                callback();
            } catch (error) {
                console.error('[AppBootstrap] Ошибка в колбэке завершения:', error);
            }
            return;
        }

        _pendingBootCallbacks.push(callback);
    }

    // ===== ЭКСПОРТ =====
    window.bootApp = bootApp;
    window.onBootComplete = onBootComplete;
    window.initializeAppAfterConsent = initializeAppAfterConsent;
    window.handleConsentDeclined = handleConsentDeclined;

    console.log('[AppBootstrap] Модуль загружен, версия: 2.7.0');

})();
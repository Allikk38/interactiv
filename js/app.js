// ============================================================
// ОСНОВНАЯ ЛОГИКА ПРИЛОЖЕНИЯ
// Версия: 2.0 (с интеграцией согласия 152-ФЗ)
// ============================================================

(function() {
    'use strict';

    // ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====

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
        const existingScript = document.querySelector('script[src*="api-maps.yandex.ru"]');
        if (existingScript) {
            console.log('[App] Скрипт Яндекс.Карт уже добавлен');
            return;
        }

        console.log('[App] Загрузка Яндекс.Карт...');
        const script = document.createElement('script');
        script.src = 'https://api-maps.yandex.ru/2.1/?apikey=7d7f69f2-30f1-4a3c-93bd-b7b99354b7c5&lang=ru_RU';
        script.async = true;
        script.onload = function() {
            console.log('[App] Яндекс.Карты загружены');
            // Если карта уже должна быть показана — инициализируем
            if (window.StoreInstance && window.StoreInstance.getCurrentScenario()) {
                // Переинициализируем карту, если нужно
                const mapContainer = document.getElementById('map');
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
            showToast('⚠️', 'Не удалось загрузить карту. Проверьте соединение.', 'warning');
        };
        document.head.appendChild(script);
    }
        /**
     * Загрузить FontAwesome (шрифты и иконки)
     * Безопасно — не содержит трекеров
     */
    function loadFontAwesome() {
        // Проверяем, загружен ли уже
        if (document.querySelector('link[href*="font-awesome"]')) {
            return;
        }
        
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css';
        // Убираем integrity, чтобы избежать ошибок при обновлении CDN
        link.crossOrigin = 'anonymous';
        link.referrerPolicy = 'no-referrer';
        document.head.appendChild(link);
        
        console.log('[App] FontAwesome загружен');
    }
    /**
     * Загрузить FontAwesome (шрифты и иконки)
     * Безопасно — не содержит трекеров
     */
    

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
        showToast(
            '🔒',
            'Вы отказались от обработки данных. Карта и некоторые функции недоступны.',
            'warning'
        );

        // Загружаем только базовые данные (без карт)
        loadDataWithoutMaps();
    }

    /**
     * Загрузка данных без карт (упрощённый режим)
     */
    function loadDataWithoutMaps() {
        // Показываем заглушку на карте
        const mapContainer = document.getElementById('map');
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
    /**
     * Основная функция загрузки данных и рендеринга
     */
    function fetchDataAndRender(withMaps) {
        const jksPromise = fetch('data/jks.json');
        const questionsPromise = fetch('data/questions.json');
        const scenariosPromise = fetch('data/scenarios.json');

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
                // Читаем вопросы только если запрос успешен
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
                        return { jksData: jksData, scenariosData: scenariosData, questionsData: questionsData, marketingData: marketingData };
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
                    showToast('👋', 'С возвращением, ' + user.name + '!', 'success');
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
                logError('Ошибка загрузки данных:', error);
                showToast('❌', 'Не удалось загрузить данные. Обновите страницу.', 'error');
            });
    }

    // ===== ОСНОВНАЯ ФУНКЦИЯ ЗАГРУЗКИ =====

    async function loadData() {
        loadDataCore(true);
    }

    // ===== PWA ОБНОВЛЕНИЯ =====

    function initPWAUpdates() {
        if (!('serviceWorker' in navigator)) return;

        let refreshing = false;
        let updateAvailable = false;
        let updateToast = null;

        navigator.serviceWorker.ready.then(function(registration) {
            registration.addEventListener('updatefound', function() {
                const newWorker = registration.installing;
                if (newWorker) {
                    newWorker.addEventListener('statechange', function() {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            updateAvailable = true;
                            showUpdateNotification();
                        }
                    });
                }
            });
        });

        navigator.serviceWorker.addEventListener('message', function(event) {
            const data = event.data;
            if (!data) return;

            if (data.type === 'UPDATE_AVAILABLE') {
                updateAvailable = true;
                showUpdateNotification(data.version);
            }

            if (data.type === 'SW_ACTIVATED') {
                console.log('[App] Service Worker активирован, версия:', data.version);
            }

            if (data.type === 'CONNECTION_STATUS') {
                updateOfflineIndicatorUI(!data.isOnline);
            }

            if (data.type === 'SW_VERSION') {
                console.log('[App] Текущая версия SW:', data.version);
            }
        });

        navigator.serviceWorker.addEventListener('controllerchange', function() {
            if (refreshing) return;
            refreshing = true;
            showToast('🔄', 'Приложение обновлено! Страница будет перезагружена.', 'success');
            setTimeout(function() {
                window.location.reload();
            }, 1500);
        });

        // Периодическая проверка обновлений
        var updateInterval = 3600000;
        if (typeof TIMERS !== 'undefined' && TIMERS.UPDATE_CHECK_INTERVAL_MS) {
            updateInterval = TIMERS.UPDATE_CHECK_INTERVAL_MS;
        }

        setInterval(function() {
            if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage('checkUpdate');
            }
        }, updateInterval);

        document.addEventListener('visibilitychange', function() {
            if (!document.hidden && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage('checkUpdate');
            }
        });
    }

    function showUpdateNotification(version) {
        if (updateToast) return;

        var notification = document.createElement('div');
        notification.className = 'update-notification';
        notification.innerHTML = `
            <div class="update-notification__content">
                <div class="update-notification__icon">🔄</div>
                <div class="update-notification__text">
                    <strong>Доступна новая версия!</strong>
                    <span>Обновите приложение для новых функций</span>
                </div>
                <button class="update-notification__btn" id="update-now-btn">Обновить</button>
                <button class="update-notification__close" id="update-close-btn">×</button>
            </div>
        `;

        // Стили для уведомления (если ещё не добавлены)
        if (!document.getElementById('update-notification-styles')) {
            var style = document.createElement('style');
            style.id = 'update-notification-styles';
            style.textContent = `
                .update-notification {
                    position: fixed;
                    bottom: 20px;
                    left: 20px;
                    right: 20px;
                    z-index: 10000;
                    animation: slideUp 0.3s ease;
                    max-width: 400px;
                    margin: 0 auto;
                }
                .update-notification__content {
                    background: var(--color-surface, #ffffff);
                    border-radius: 12px;
                    padding: 16px 20px;
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.2);
                    border-left: 4px solid #2e86de;
                }
                .update-notification__icon { font-size: 1.8rem; }
                .update-notification__text { flex: 1; display: flex; flex-direction: column; }
                .update-notification__text strong { font-size: 0.9rem; }
                .update-notification__text span { font-size: 0.7rem; color: var(--color-text-light, #636e72); }
                .update-notification__btn {
                    background: #2e86de;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 32px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .update-notification__btn:active { transform: scale(0.96); }
                .update-notification__close {
                    background: none;
                    border: none;
                    font-size: 1.2rem;
                    cursor: pointer;
                    color: var(--color-text-light, #636e72);
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .update-notification__close:active { background: var(--color-border, #dfe6e9); }
                @keyframes slideUp {
                    from { transform: translateY(100px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);
        updateToast = notification;

        var updateBtn = document.getElementById('update-now-btn');
        var closeBtn = document.getElementById('update-close-btn');

        if (updateBtn) {
            updateBtn.onclick = function() {
                notification.remove();
                updateToast = null;
                if (navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage('skipWaiting');
                }
                showToast('🔄', 'Обновление...', 'success');
            };
        }

        if (closeBtn) {
            closeBtn.onclick = function() {
                notification.remove();
                updateToast = null;
            };
        }

        setTimeout(function() {
            if (updateToast && updateToast === notification) {
                notification.remove();
                updateToast = null;
            }
        }, 15000);
    }

    // ===== АВТОСОХРАНЕНИЕ =====

    var autoSaveTimer = null;
    var lastSaveState = null;

    function setupAutoSave() {
        var autoSaveInterval = 30000;
        if (typeof AUTOSAVE_CONFIG !== 'undefined' && AUTOSAVE_CONFIG.INTERVAL_MS) {
            autoSaveInterval = AUTOSAVE_CONFIG.INTERVAL_MS;
        }
        var saveOnBeforeUnload = (typeof AUTOSAVE_CONFIG !== 'undefined') ?
            AUTOSAVE_CONFIG.SAVE_ON_BEFORE_UNLOAD : true;
        var saveOnVisibilityChange = (typeof AUTOSAVE_CONFIG !== 'undefined') ?
            AUTOSAVE_CONFIG.SAVE_ON_VISIBILITY_CHANGE : true;

        if (saveOnBeforeUnload) {
            window.addEventListener('beforeunload', function() {
                if (AppState.currentScenario) {
                    saveCurrentProgress();
                }
            });
        }

        if (saveOnVisibilityChange) {
            document.addEventListener('visibilitychange', function() {
                if (document.hidden && AppState.currentScenario) {
                    saveCurrentProgress();
                }
            });
        }

        setInterval(function() {
            if (AppState.currentScenario) {
                saveCurrentProgress();
            }
        }, autoSaveInterval);
    }

    function saveCurrentProgress() {
        if (!AppState.currentScenario) return;

        var currentState = {
            scenarioId: AppState.currentScenario.id,
            stepIndex: AppState.currentStepIndex,
            stepStats: AppState.stepStats,
            quizAnswers: AppState.quizAnswers || [],
            mapPlacedJks: AppState.placedJks ? Array.from(AppState.placedJks.entries()) : []
        };

        var stateKey = JSON.stringify(currentState);
        if (lastSaveState === stateKey) return;
        lastSaveState = stateKey;

        User.saveDetailedScenarioProgress(
            AppState.currentScenario.id,
            AppState.currentStepIndex,
            AppState.stepStats,
            AppState.quizAnswers || [],
            AppState.placedJks ? Array.from(AppState.placedJks.entries()) : []
        );

        logInfo('Автосохранение:', AppState.currentScenario.name, 'шаг', AppState.currentStepIndex + 1);
    }

    function checkForSavedProgress() {
        if (!AppState.scenarios) return;

        for (var i = 0; i < AppState.scenarios.length; i++) {
            var scenario = AppState.scenarios[i];
            var saved = User.getDetailedScenarioProgress(scenario.id);
            if (saved && saved.stepIndex < scenario.steps.length - 1) {
                var lastStep = scenario.steps[saved.stepIndex];
                if (lastStep.type !== 'finish') {
                    showToast('💾', 'Найден сохранённый прогресс: "' + scenario.name + '"', 'success');
                    break;
                }
            }
        }
    }

    // ===== УПРАВЛЕНИЕ СЦЕНАРИЯМИ =====

    function startScenario(scenario) {
        var savedProgress = User.getDetailedScenarioProgress(scenario.id);

        if (savedProgress && savedProgress.stepIndex > 0 &&
            savedProgress.stepIndex < scenario.steps.length - 1) {
            showContinueModal(scenario, savedProgress);
            return;
        }

        startScenarioFresh(scenario);
    }

    function startScenarioFresh(scenario) {
        AppState.currentScenario = scenario;
        AppState.currentStepIndex = 0;
        AppState.stepStats = [];
        AppState.quizAnswers = [];
        AppState.placedJks = new Map();
        AppState.scenarioStartTime = Date.now();

        if (typeof sendScenarioStart === 'function') {
            sendScenarioStart(scenario.id, scenario.name, scenario.steps.length);
        }

        if (typeof startStepTimer === 'function') {
            startStepTimer();
        }

        document.getElementById('scenario-screen').classList.add('hidden');
        document.getElementById('header-info').innerHTML =
            (scenario.icon ? '<i class="fas ' + scenario.icon + '"></i>' : '') + ' ' + scenario.name;

        if (window.ProgressBar) {
            ProgressBar.init();
            ProgressBar.update(0, scenario.steps.length - 1, scenario.steps);
        }

        runStep();
    }

    function showContinueModal(scenario, savedProgress) {
        var overlay = document.createElement('div');
        overlay.className = 'continue-modal-overlay';
        overlay.innerHTML = `
            <div class="continue-modal">
                <div class="continue-modal__icon">💾</div>
                <h3 class="continue-modal__title">Найден сохранённый прогресс</h3>
                <p class="continue-modal__text">
                    Сценарий <strong>${escapeHtml(scenario.name)}</strong> уже был начат ранее.
                </p>
                <div class="continue-modal__progress">
                    <div class="continue-modal__progress-bar">
                        <div class="continue-modal__progress-fill" style="width: ${Math.round((savedProgress.stepIndex / scenario.steps.length) * 100)}%"></div>
                    </div>
                    <div class="continue-modal__progress-text">
                        Пройдено шагов: ${savedProgress.stepIndex + 1} из ${scenario.steps.length}
                    </div>
                </div>
                <div class="continue-modal__actions">
                    <button class="btn btn--primary" id="continue-modal-resume">Продолжить</button>
                    <button class="btn btn--secondary" id="continue-modal-restart">Начать заново</button>
                </div>
                <button class="continue-modal__close" id="continue-modal-close">✕</button>
            </div>
        `;

        document.body.appendChild(overlay);

        if (!document.getElementById('continue-modal-styles')) {
            var style = document.createElement('style');
            style.id = 'continue-modal-styles';
            style.textContent = `
                .continue-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 3000;
                    animation: fadeIn 0.3s ease;
                }
                .continue-modal {
                    background: var(--color-surface, #ffffff);
                    border-radius: 12px;
                    max-width: 400px;
                    width: 90%;
                    padding: 32px 28px;
                    text-align: center;
                    position: relative;
                    box-shadow: 0 24px 48px rgba(0,0,0,0.3);
                    animation: slideUp 0.4s ease;
                }
                .continue-modal__icon { font-size: 3rem; margin-bottom: 16px; }
                .continue-modal__title { font-size: 1.3rem; font-weight: 700; margin-bottom: 12px; }
                .continue-modal__text { font-size: 0.95rem; color: var(--color-text-light, #636e72); margin-bottom: 20px; }
                .continue-modal__progress { margin: 20px 0; padding: 16px; background: var(--color-bg, #f5f6fa); border-radius: 8px; }
                .continue-modal__progress-bar { height: 8px; background: var(--color-border, #dfe6e9); border-radius: 4px; overflow: hidden; margin-bottom: 8px; }
                .continue-modal__progress-fill { height: 100%; background: linear-gradient(90deg, #2e86de, #27ae60); border-radius: 4px; }
                .continue-modal__progress-text { font-size: 0.8rem; color: var(--color-text-light, #636e72); }
                .continue-modal__actions { display: flex; gap: 12px; justify-content: center; margin-top: 20px; }
                .continue-modal__close { position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 1.2rem; cursor: pointer; color: var(--color-text-light, #636e72); width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
                .continue-modal__close:hover { background: var(--color-border, #dfe6e9); }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            `;
            document.head.appendChild(style);
        }

        var resumeBtn = document.getElementById('continue-modal-resume');
        var restartBtn = document.getElementById('continue-modal-restart');
        var closeBtn = document.getElementById('continue-modal-close');

        var closeModal = function() { overlay.remove(); };

        if (resumeBtn) {
            resumeBtn.addEventListener('click', function() {
                closeModal();
                AppState.currentScenario = scenario;
                AppState.currentStepIndex = savedProgress.stepIndex;
                AppState.stepStats = savedProgress.stepStats || [];
                AppState.quizAnswers = savedProgress.quizAnswers || [];

                if (savedProgress.mapPlacedJks && savedProgress.mapPlacedJks.length > 0) {
                    AppState.placedJks = new Map(savedProgress.mapPlacedJks);
                }

                AppState.scenarioStartTime = Date.now();

                if (typeof startStepTimer === 'function') {
                    startStepTimer();
                }

                document.getElementById('scenario-screen').classList.add('hidden');
                document.getElementById('header-info').innerHTML =
                    (scenario.icon ? '<i class="fas ' + scenario.icon + '"></i>' : '') + ' ' + scenario.name;

                if (window.ProgressBar) {
                    ProgressBar.init();
                    ProgressBar.update(savedProgress.stepIndex, scenario.steps.length - 1, scenario.steps);
                }

                runStep();
            });
        }

        if (restartBtn) {
            restartBtn.addEventListener('click', function() {
                closeModal();
                User.clearScenarioProgress(scenario.id);
                startScenarioFresh(scenario);
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', closeModal);
        }

        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) closeModal();
        });
    }

    function runStep() {
        if (AppState.currentStepIndex >= AppState.currentScenario.steps.length) {
            showFinish();
            return;
        }

        var step = AppState.currentScenario.steps[AppState.currentStepIndex];

        document.getElementById('map-screen').classList.add('hidden');
        document.getElementById('quiz-screen').classList.add('hidden');
        document.getElementById('client-journey-screen').classList.add('hidden');
        document.getElementById('finish-screen').classList.add('hidden');

        if (step.type !== 'finish') {
            if (window.ProgressBar) {
                ProgressBar.show();
                ProgressBar.update(
                    AppState.currentStepIndex,
                    AppState.currentScenario.steps.length - 1,
                    AppState.currentScenario.steps
                );
            }
        }

        if (step.type === 'finish') {
            showFinish();
            return;
        }

        if (typeof startStepTimer === 'function') {
            startStepTimer();
        }

        var handled = false;
        if (window.StepRegistry && typeof StepRegistry.run === 'function') {
            handled = StepRegistry.run(step, AppState);
        }

        if (!handled) {
            logWarn('Неизвестный тип шага: ' + step.type + ', пропускаем');
            AppState.currentStepIndex++;
            runStep();
        }
    }

    function updateHeaderAfterXP(xpResult) {
        if (xpResult && xpResult.leveledUp) {
            showToast('🎉', 'Поздравляем! Вы достигли ' + xpResult.newLevel + ' уровня!', 'success');
        }
        if (typeof updateHeaderXP === 'function') {
            updateHeaderXP();
        }
        if (typeof updateContinueLearning === 'function') {
            updateContinueLearning();
        }
        if (typeof refreshMainScreen === 'function') {
            refreshMainScreen();
        }
    }

    function showFinish() {
        document.getElementById('map-screen').classList.add('hidden');
        document.getElementById('quiz-screen').classList.add('hidden');
        document.getElementById('client-journey-screen').classList.add('hidden');
        document.getElementById('finish-screen').classList.remove('hidden');
        document.getElementById('header-info').innerHTML = AppState.currentScenario ? AppState.currentScenario.name : '';
        if (window.ProgressBar) {
            ProgressBar.hide();
        }

        var totalCorrect = AppState.stepStats.reduce(function(sum, s) {
            if (s.type === 'map') return sum + s.placed;
            return sum + (s.correct || 0);
        }, 0);

        var totalItems = AppState.stepStats.reduce(function(sum, s) {
            if (s.type === 'map') return sum + s.total;
            return sum + (s.total || 0);
        }, 0);

        var isPerfect = totalCorrect === totalItems && totalItems > 0;
        var durationSec = AppState.scenarioStartTime ?
            Math.round((Date.now() - AppState.scenarioStartTime) / 1000) : 0;

        var finishText = document.getElementById('finish-text');
        if (finishText) {
            finishText.textContent = 'Вы успешно завершили сценарий «' +
                (AppState.currentScenario ? AppState.currentScenario.name : '') + '»!';
        }

        var finishStats = document.getElementById('finish-stats');
        if (finishStats) {
            finishStats.textContent = 'Правильно: ' + totalCorrect + ' из ' + totalItems;
        }

        if (typeof sendScenarioComplete === 'function' && AppState.currentScenario) {
            sendScenarioComplete(
                AppState.currentScenario.id,
                AppState.currentScenario.name,
                AppState.currentStepIndex + 1,
                AppState.currentScenario.steps.length,
                totalCorrect,
                isPerfect
            );
        }

        var xpResult = User.sendResult(
            AppState.currentScenario ? AppState.currentScenario.name : '',
            AppState.stepStats,
            totalCorrect,
            totalItems,
            durationSec
        );

        if (xpResult) {
            updateHeaderAfterXP(xpResult);
        }

        if (AppState.currentScenario && AppState.currentScenario.id) {
            User.clearScenarioProgress(AppState.currentScenario.id);
        }

        if (AppState.currentScenario && AppState.currentScenario.badge) {
            var isNew = Badges.award(AppState.currentScenario.badge);
            if (isNew) {
                Badges.showBadgeToast(AppState.currentScenario.badge);
            }
            Badges.renderOnFinish('.finish-content');
        }

        if (isPerfect && totalItems > 5) {
            var perfectBadge = 'Идеальное прохождение';
            var isNewPerfect = Badges.award(perfectBadge);
            if (isNewPerfect) {
                setTimeout(function() {
                    Badges.showBadgeToast(perfectBadge);
                }, 2000);
            }
        }

        if (typeof refreshMainScreen === 'function') {
            setTimeout(function() {
                refreshMainScreen();
            }, 500);
        }
    }

    function exitToScenarios() {
        if (AppState.currentScenario && typeof sendScenarioDropOff === 'function') {
            var currentStep = AppState.currentScenario.steps[AppState.currentStepIndex];
            sendScenarioDropOff(
                AppState.currentScenario.id,
                AppState.currentScenario.name,
                AppState.currentStepIndex,
                AppState.currentScenario.steps.length,
                currentStep ? currentStep.type : null
            );
        }

        saveCurrentProgress();
        AppState.currentScenario = null;
        AppState.placedJks = new Map();
        document.getElementById('map-screen').classList.add('hidden');
        document.getElementById('quiz-screen').classList.add('hidden');
        document.getElementById('client-journey-screen').classList.add('hidden');
        document.getElementById('finish-screen').classList.add('hidden');
        document.getElementById('scenario-screen').classList.remove('hidden');
        document.getElementById('header-info').innerHTML = '';
        if (window.ProgressBar) {
            ProgressBar.hide();
        }
        if (typeof renderScenarios === 'function') {
            renderScenarios();
        }
    }

    function initAnalytics() {
        window.addEventListener('beforeunload', function() {
            if (AppState.currentScenario && typeof sendScenarioDropOff === 'function') {
                var currentStep = AppState.currentScenario.steps[AppState.currentStepIndex];
                sendScenarioDropOff(
                    AppState.currentScenario.id,
                    AppState.currentScenario.name,
                    AppState.currentStepIndex,
                    AppState.currentScenario.steps.length,
                    currentStep ? currentStep.type : null
                );
            }
        });

        document.addEventListener('visibilitychange', function() {
            if (document.hidden && AppState.currentScenario && typeof sendScenarioDropOff === 'function') {
                var currentStep = AppState.currentScenario.steps[AppState.currentStepIndex];
                sendScenarioDropOff(
                    AppState.currentScenario.id,
                    AppState.currentScenario.name,
                    AppState.currentStepIndex,
                    AppState.currentScenario.steps.length,
                    currentStep ? currentStep.type : null
                );
            }
        });
    }

    // ===== ОБРАБОТЧИКИ СОБЫТИЙ =====

    function setupEventListeners() {
        var journeyBackBtn = document.getElementById('journey-back-btn');
        var backToScenariosBtn = document.getElementById('back-to-scenarios-btn');
        var quizBackBtn = document.getElementById('quiz-back-btn');
        var finishScenariosBtn = document.getElementById('finish-scenarios-btn');
        var finishRestartBtn = document.getElementById('finish-restart-btn');
        var hintBtn = document.getElementById('hint-btn');
        var resetBtn = document.getElementById('reset-step-btn');

        if (journeyBackBtn) journeyBackBtn.addEventListener('click', exitToScenarios);
        if (backToScenariosBtn) backToScenariosBtn.addEventListener('click', exitToScenarios);
        if (quizBackBtn) quizBackBtn.addEventListener('click', exitToScenarios);
        if (finishScenariosBtn) finishScenariosBtn.addEventListener('click', exitToScenarios);

        if (finishRestartBtn) {
            finishRestartBtn.addEventListener('click', function() {
                if (AppState.currentScenario) {
                    User.clearScenarioProgress(AppState.currentScenario.id);
                    AppState.currentStepIndex = 0;
                    AppState.stepStats = [];
                    AppState.quizAnswers = [];
                    AppState.placedJks = new Map();
                    AppState.scenarioStartTime = Date.now();
                    document.getElementById('finish-screen').classList.add('hidden');
                    runStep();
                }
            });
        }

        if (hintBtn) {
            hintBtn.addEventListener('click', function() {
                if (AppState.selectedJkId === null) {
                    showToast('💡', 'Сначала выберите ЖК из списка', 'info');
                    return;
                }
                var jk = AppState.allJks.find(function(j) { return j.id === AppState.selectedJkId; });
                if (jk) {
                    showToast('💡', jk.hint || 'Подсказка недоступна', 'error');
                    if (typeof sendHintUsed === 'function') {
                        sendHintUsed('map', 'Расстановка ЖК', 'location_hint');
                    }
                }
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', function() {
                if (typeof resetMapStep === 'function') {
                    resetMapStep();
                }
            });
        }
    }

    // ===== PWA УСТАНОВКА =====

    function setupPWAInstall() {
        var deferredPrompt;

        window.addEventListener('beforeinstallprompt', function(e) {
            e.preventDefault();
            deferredPrompt = e;

            var installDelay = 10000;
            if (typeof TIMERS !== 'undefined' && TIMERS.INSTALL_PROMPT_DELAY_MS) {
                installDelay = TIMERS.INSTALL_PROMPT_DELAY_MS;
            }

            setTimeout(function() {
                if (deferredPrompt && !localStorage.getItem('pwa-install-dismissed')) {
                    showInstallButton(deferredPrompt);
                }
            }, installDelay);
        });

        window.addEventListener('appinstalled', function() {
            deferredPrompt = null;
            localStorage.setItem('pwa-installed', 'true');
            showToast('✅', 'Приложение установлено на ваш телефон!', 'success');
        });
    }

    function showInstallButton(promptEvent) {
        if (window.matchMedia('(display-mode: standalone)').matches) return;
        if (localStorage.getItem('pwa-installed')) return;

        var btnDisplayTime = 15000;
        if (typeof TIMERS !== 'undefined' && TIMERS.INSTALL_BTN_DISPLAY_MS) {
            btnDisplayTime = TIMERS.INSTALL_BTN_DISPLAY_MS;
        }

        var btn = document.createElement('button');
        btn.innerHTML = '<i class="fas fa-download"></i> Установить приложение';
        btn.className = 'btn btn--primary';
        btn.style.position = 'fixed';
        btn.style.bottom = '80px';
        btn.style.left = '50%';
        btn.style.transform = 'translateX(-50%)';
        btn.style.zIndex = '1000';
        btn.style.padding = '12px 24px';
        btn.style.borderRadius = '32px';
        btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        btn.style.animation = 'pulse 1.5s infinite';

        btn.addEventListener('click', function() {
            btn.remove();
            localStorage.setItem('pwa-install-dismissed', 'true');
            promptEvent.prompt();
            promptEvent.userChoice.then(function(result) {
                if (result.outcome === 'accepted') {
                    showToast('✅', 'Спасибо за установку!', 'success');
                }
                promptEvent = null;
            });
        });

        document.body.appendChild(btn);

        setTimeout(function() {
            if (document.body.contains(btn)) btn.remove();
        }, btnDisplayTime);
    }

    // ===== ОФЛАЙН-ИНДИКАТОР =====

    function initOfflineIndicator() {
        var indicator = document.getElementById('offline-indicator');
        if (!indicator) return;

        var updateUI = function(isOffline) {
            if (!indicator) return;
            if (isOffline) {
                indicator.classList.add('offline-indicator--visible');
            } else {
                indicator.classList.remove('offline-indicator--visible');
            }
        };

        var updateStatus = function(isOnline) {
            if (!indicator) return;
            if (!isOnline) {
                indicator.classList.add('offline-indicator--visible');
                showToast('📡', 'Нет соединения с интернетом. Данные сохраняются локально.', 'error', false);
            } else {
                indicator.classList.remove('offline-indicator--visible');
                if (window.OfflineQueue && window.OfflineQueue.hasPendingRequests &&
                    window.OfflineQueue.hasPendingRequests()) {
                    showToast('📤', 'Соединение восстановлено. Отправка накопленных данных...', 'success');
                    window.OfflineQueue.processQueue();
                }
            }
        };

        updateUI(!navigator.onLine);

        window.addEventListener('online', function() {
            updateStatus(true);
            if (window.User && window.User.sendPendingResults) {
                window.User.sendPendingResults();
            }
        });

        window.addEventListener('offline', function() {
            updateStatus(false);
        });

        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.addEventListener('message', function(event) {
                if (event.data && event.data.type === 'CONNECTION_STATUS') {
                    updateStatus(event.data.isOnline);
                    updateUI(!event.data.isOnline);
                }
            });

            navigator.serviceWorker.controller.postMessage('getConnectionStatus');
        }
    }

    function updateOfflineIndicatorUI(isOffline) {
        var indicator = document.getElementById('offline-indicator');
        if (!indicator) return;
        if (isOffline) {
            indicator.classList.add('offline-indicator--visible');
        } else {
            indicator.classList.remove('offline-indicator--visible');
        }
    }

    // ===== PULSE СТИЛЬ ДЛЯ КНОПКИ УСТАНОВКИ =====

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

    // ===== ТОЧКА ВХОДА (С ИНИЦИАЛИЗАЦИЕЙ СОГЛАСИЯ) =====

    function bootApp() {
        console.log('[App] Запуск приложения...');

        // 1. Убеждаемся, что стиль pulse есть
        ensurePulseStyle();

        // 2. Навешиваем обработчики событий
        setupEventListeners();

        // 3. Service Worker
        if ('serviceWorker' in navigator) {
            setupPWAInstall();

            window.addEventListener('load', function() {
                navigator.serviceWorker.register('./sw.js')
                    .then(function(registration) {
                        logInfo('Service Worker зарегистрирован:', registration.scope);

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
                        logError('Ошибка регистрации Service Worker:', error);
                    });
            });
        }

        // 4. ИНИЦИАЛИЗАЦИЯ СОГЛАСИЯ (САМОЕ ВАЖНОЕ)
        // Проверяем, загружены ли модули согласия
        if (window.Consent && window.ConsentBanner) {
            console.log('[App] Инициализация баннера согласия...');

            // Показываем баннер и ждём решение пользователя
            window.ConsentBanner.init(
                // onAccept — пользователь согласился
                function() {
                    console.log('[App] Пользователь дал согласие');
                    initializeAppAfterConsent();
                },
                // onDecline — пользователь отказался
                function() {
                    console.log('[App] Пользователь отказался от согласия');
                    handleConsentDeclined();
                }
            );
        } else {
            // Если модули согласия не загружены — загружаем всё как обычно (fallback)
            console.warn('[App] Модули согласия не загружены, работаем без них');
            initializeAppAfterConsent();
        }
    }

    // ===== ЭКСПОРТ В ГЛОБАЛЬНУЮ ОБЛАСТЬ =====

    // Основные функции, используемые из других модулей
    window.loadData = loadData;
    window.loadYandexMaps = loadYandexMaps;
    window.startScenario = startScenario;
    window.runStep = runStep;
    window.exitToScenarios = exitToScenarios;
    window.showFinish = showFinish;
    window.updateHeaderAfterXP = updateHeaderAfterXP;
    window.saveCurrentProgress = saveCurrentProgress;
    window.checkForSavedProgress = checkForSavedProgress;
    window.initOfflineIndicator = initOfflineIndicator;
    window.updateOfflineIndicatorUI = updateOfflineIndicatorUI;
    window.setupAutoSave = setupAutoSave;
    window.initAnalytics = initAnalytics;
    window.initPWAUpdates = initPWAUpdates;

    // Запускаем приложение после загрузки DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootApp);
    } else {
        bootApp();
    }

    console.log('[App] Модуль загружен, версия: 2.0 (с интеграцией 152-ФЗ)');

})();
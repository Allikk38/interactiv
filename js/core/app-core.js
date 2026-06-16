/**
 * ============================================================
 * ЯДРО ПРИЛОЖЕНИЯ
 * Версия: 1.0.0
 * 
 * Отвечает за:
 * - Инициализацию приложения
 * - Управление жизненным циклом
 * - Координацию между модулями
 * - Обработку глобальных событий
 * ============================================================
 */

(function() {
    'use strict';

    // ===== СОСТОЯНИЕ =====
    const state = {
        isInitialized: false,
        isBooted: false,
        isUserReady: false,
        isDataLoaded: false,
        pendingCallbacks: [],
        bootPromise: null
    };

    // ===== ПРИВАТНЫЕ МЕТОДЫ =====

    /**
     * Проверяет, загружены ли все зависимости
     * @returns {boolean}
     */
    function _checkDependencies() {
        const required = [
            'StoreInstance',
            'User',
            'Badges',
            'ProgressBar',
            'Drawer'
        ];

        for (const dep of required) {
            if (typeof window[dep] === 'undefined') {
                console.warn(`[AppCore] Зависимость не найдена: ${dep}`);
                return false;
            }
        }

        return true;
    }

    /**
     * Загружает данные с сервера
     * @returns {Promise}
     */
    function _loadData() {
        if (state.isDataLoaded) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            const jksPromise = fetch('data/jks.json');
            const questionsPromise = fetch('data/questions.json');
            const scenariosPromise = fetch('data/scenarios.json');

            Promise.all([jksPromise, questionsPromise, scenariosPromise])
                .then(responses => {
                    const jksRes = responses[0];
                    const questionsRes = responses[1];
                    const scenariosRes = responses[2];

                    if (!jksRes.ok || !scenariosRes.ok) {
                        throw new Error('Ошибка загрузки данных');
                    }

                    return Promise.all([
                        jksRes.json(),
                        scenariosRes.json(),
                        questionsRes.ok ? questionsRes.json() : Promise.resolve([])
                    ]);
                })
                .then(([jksData, scenariosData, questionsData]) => {
                    // Сохраняем в Store
                    StoreInstance.setAllJks(jksData);
                    StoreInstance.setScenarios(scenariosData);
                    StoreInstance.setAllQuestions(questionsData);

                    // Загружаем marketing-steps.json
                    return fetch('data/marketing-steps.json')
                        .then(res => res.ok ? res.json() : null)
                        .then(marketingData => {
                            if (marketingData) {
                                StoreInstance.setMarketingData(marketingData);
                            }
                            state.isDataLoaded = true;
                            resolve({ jksData, scenariosData, questionsData, marketingData });
                        });
                })
                .catch(error => {
                    console.error('[AppCore] Ошибка загрузки данных:', error);
                    reject(error);
                });
        });
    }

    /**
     * Инициализирует пользователя
     * @param {Function} callback - вызывается после инициализации
     */
    function _initUser(callback) {
        const user = User.get();
        if (user) {
            state.isUserReady = true;
            if (callback) callback(user);
            return;
        }

        // Показываем экран ввода имени
        User.showNamePrompt(function(name) {
            state.isUserReady = true;
            if (callback) callback(User.get());
        });
    }

    /**
     * Запускает основной цикл приложения
     */
    function _bootApp() {
        if (state.isBooted) return;

        console.log('[AppCore] Запуск приложения...');

        // Рендерим сценарии
        if (typeof renderScenarios === 'function') {
            renderScenarios();
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

        state.isBooted = true;
        console.log('[AppCore] Приложение запущено');

        // Вызываем все отложенные колбэки
        const callbacks = state.pendingCallbacks;
        state.pendingCallbacks = [];
        for (const cb of callbacks) {
            try {
                cb();
            } catch (error) {
                console.error('[AppCore] Ошибка в отложенном колбэке:', error);
            }
        }
    }

    /**
     * Основной процесс инициализации
     */
    function _init() {
        if (state.isInitialized) return;

        console.log('[AppCore] Инициализация...');

        // Проверяем зависимости
        if (!_checkDependencies()) {
            console.warn('[AppCore] Зависимости не загружены, повторная попытка через 500мс');
            setTimeout(_init, 500);
            return;
        }

        state.isInitialized = true;

        // Инициализируем пользователя
        _initUser(function() {
            // Загружаем данные
            _loadData()
                .then(function() {
                    // Запускаем приложение
                    _bootApp();

                    // Показываем приветствие
                    const user = User.get();
                    if (user) {
                        showToast('👋', 'С возвращением, ' + user.name + '!', 'success');
                    }
                })
                .catch(function(error) {
                    console.error('[AppCore] Ошибка загрузки данных:', error);
                    showToast('❌', 'Не удалось загрузить данные. Обновите страницу.', 'error');
                });
        });
    }

    // ===== ПУБЛИЧНЫЙ API =====

    const AppCore = {

        /**
         * Инициализирует приложение
         * @param {Object} options - опции
         * @param {Function} options.onReady - вызывается после полной инициализации
         * @param {Function} options.onError - вызывается при ошибке
         */
        init: function(options = {}) {
            if (state.isInitialized && state.isBooted) {
                if (options.onReady) options.onReady();
                return;
            }

            if (state.isInitialized) {
                state.pendingCallbacks.push(options.onReady);
                return;
            }

            if (options.onReady) {
                state.pendingCallbacks.push(options.onReady);
            }

            _init();
        },

        /**
         * Проверяет, готово ли приложение
         * @returns {boolean}
         */
        isReady: function() {
            return state.isBooted && state.isDataLoaded;
        },

        /**
         * Перезагружает данные (синхронизация)
         * @returns {Promise}
         */
        reloadData: function() {
            state.isDataLoaded = false;
            return _loadData();
        },

        /**
         * Сбрасывает состояние приложения (для тестирования)
         */
        reset: function() {
            state.isInitialized = false;
            state.isBooted = false;
            state.isDataLoaded = false;
            state.pendingCallbacks = [];
        },

        /**
         * Получает состояние приложения
         * @returns {Object}
         */
        getState: function() {
            return { ...state };
        },

        version: '1.0.0'
    };

    // ===== ЭКСПОРТ =====
    window.AppCore = AppCore;

    // ===== АВТОЗАПУСК =====
    // Автоматически запускаем инициализацию после загрузки страницы
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(function() {
            AppCore.init();
        }, 200);
    } else {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(function() {
                AppCore.init();
            }, 200);
        });
    }

    console.log('[AppCore] Модуль загружен, версия 1.0.0');

})();
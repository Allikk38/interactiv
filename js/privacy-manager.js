/**
 * ============================================================
 * ЕДИНЫЙ МЕНЕДЖЕР КОНФИДЕНЦИАЛЬНОСТИ
 * Версия: 1.0.0
 * 
 * Отвечает за:
 * - Управление состоянием согласия пользователя
 * - Хранение и проверку согласия
 * - Отзыв согласия
 * - Уведомление подписчиков об изменении статуса
 * - Централизованную проверку перед отправкой данных
 * ============================================================
 */

(function() {
    'use strict';

    // ===== КОНСТАНТЫ =====
    const STORAGE_KEY = 'user_consent_given';
    const TIMESTAMP_KEY = 'consent_timestamp';
    const CONSENT_VERSION = '2.6';
    const CONSENT_CATEGORIES = {
        NECESSARY: 'necessary',     // Строго необходимые (всегда активны)
        FUNCTIONAL: 'functional',   // Функциональные (локальное хранилище, UX)
        ANALYTICS: 'analytics',     // Аналитика (Google Sheets, метрики)
        MARKETING: 'marketing'      // Маркетинговые (рекламные пиксели, трекеры)
    };

    // ===== ПРИВАТНОЕ СОСТОЯНИЕ =====
    let _state = {
        consentGiven: false,
        timestamp: null,
        categories: {
            [CONSENT_CATEGORIES.NECESSARY]: true,  // Всегда true
            [CONSENT_CATEGORIES.FUNCTIONAL]: false,
            [CONSENT_CATEGORIES.ANALYTICS]: false,
            [CONSENT_CATEGORIES.MARKETING]: false
        },
        isInitialized: false
    };

    let _listeners = [];
    let _isProcessing = false;

    // ===== ПРИВАТНЫЕ МЕТОДЫ =====

    /**
     * Загружает сохранённое состояние из localStorage
     */
    function _loadState() {
        try {
            const consentGiven = localStorage.getItem(STORAGE_KEY) === 'true';
            const timestamp = localStorage.getItem(TIMESTAMP_KEY) || null;
            
            // Загружаем категории, если они сохранены
            let categories = null;
            try {
                const categoriesData = localStorage.getItem('user_consent_categories');
                if (categoriesData) {
                    categories = JSON.parse(categoriesData);
                }
            } catch (_) {}

            _state.consentGiven = consentGiven;
            _state.timestamp = timestamp;
            
            if (categories) {
                _state.categories = {
                    ..._state.categories,
                    ...categories
                };
                // Убеждаемся, что necessary всегда true
                _state.categories[CONSENT_CATEGORIES.NECESSARY] = true;
            }

            console.log('[PrivacyManager] Состояние загружено:', {
                consentGiven: _state.consentGiven,
                categories: _state.categories,
                timestamp: _state.timestamp
            });

            return true;
        } catch (error) {
            console.error('[PrivacyManager] Ошибка загрузки состояния:', error);
            return false;
        }
    }

    /**
     * Сохраняет текущее состояние в localStorage
     */
    function _saveState() {
        try {
            localStorage.setItem(STORAGE_KEY, _state.consentGiven ? 'true' : 'false');
            if (_state.timestamp) {
                localStorage.setItem(TIMESTAMP_KEY, _state.timestamp);
            } else {
                localStorage.removeItem(TIMESTAMP_KEY);
            }
            
            // Сохраняем категории
            const categoriesToSave = { ..._state.categories };
            localStorage.setItem('user_consent_categories', JSON.stringify(categoriesToSave));

            console.log('[PrivacyManager] Состояние сохранено');
            return true;
        } catch (error) {
            console.error('[PrivacyManager] Ошибка сохранения состояния:', error);
            return false;
        }
    }

    /**
     * Уведомляет всех подписчиков об изменении состояния
     */
    function _notifyListeners() {
        const eventData = _getPublicState();
        _listeners.forEach(callback => {
            try {
                callback(eventData);
            } catch (error) {
                console.error('[PrivacyManager] Ошибка в подписчике:', error);
            }
        });
    }

    /**
     * Возвращает публичное состояние (без приватных полей)
     */
    function _getPublicState() {
        return {
            consentGiven: _state.consentGiven,
            timestamp: _state.timestamp,
            categories: { ..._state.categories },
            isInitialized: _state.isInitialized
        };
    }

    /**
     * Проверяет, можно ли отправлять данные определённой категории
     */
    function _isCategoryAllowed(category) {
        // Если согласие не дано — запрещаем всё, кроме necessary
        if (!_state.consentGiven) {
            return category === CONSENT_CATEGORIES.NECESSARY;
        }
        
        // Проверяем конкретную категорию
        return _state.categories[category] === true;
    }

    // ===== ПУБЛИЧНЫЙ API =====

    const PrivacyManager = {

        /**
         * Инициализирует менеджер
         * @param {Object} options - опции
         * @param {Function} options.onStateChange - колбэк при изменении состояния
         * @returns {Object} текущее состояние
         */
        init(options = {}) {
            if (_state.isInitialized) {
                return _getPublicState();
            }

            console.log('[PrivacyManager] Инициализация...');

            // Загружаем состояние
            _loadState();
            _state.isInitialized = true;

            // Добавляем подписчика, если передан
            if (typeof options.onStateChange === 'function') {
                _listeners.push(options.onStateChange);
            }

            // Уведомляем о начальном состоянии
            _notifyListeners();

            console.log('[PrivacyManager] Инициализация завершена. Состояние:', _getPublicState());
            return _getPublicState();
        },

        /**
         * Проверяет, дано ли согласие
         * @returns {boolean}
         */
        hasConsent() {
            return _state.consentGiven === true;
        },

        /**
         * Проверяет, разрешена ли конкретная категория
         * @param {string} category - категория из CONSENT_CATEGORIES
         * @returns {boolean}
         */
        isAllowed(category) {
            return _isCategoryAllowed(category);
        },

        /**
         * Проверяет, разрешена ли аналитика
         * @returns {boolean}
         */
        isAnalyticsAllowed() {
            return _isCategoryAllowed(CONSENT_CATEGORIES.ANALYTICS);
        },

        /**
         * Проверяет, разрешены ли маркетинговые данные
         * @returns {boolean}
         */
        isMarketingAllowed() {
            return _isCategoryAllowed(CONSENT_CATEGORIES.MARKETING);
        },

        /**
         * Даёт согласие
         * @param {Object} categories - объект с категориями для включения
         * @param {Function} onComplete - колбэк после сохранения
         */
        giveConsent(categories = null, onComplete = null) {
            if (_isProcessing) {
                console.warn('[PrivacyManager] Уже обрабатывается запрос');
                return;
            }

            _isProcessing = true;

            try {
                // Если переданы категории — обновляем их
                if (categories && typeof categories === 'object') {
                    for (const [key, value] of Object.entries(categories)) {
                        if (key in _state.categories && key !== CONSENT_CATEGORIES.NECESSARY) {
                            _state.categories[key] = !!value;
                        }
                    }
                } else {
                    // Если категории не переданы — включаем всё, кроме necessary
                    _state.categories[CONSENT_CATEGORIES.FUNCTIONAL] = true;
                    _state.categories[CONSENT_CATEGORIES.ANALYTICS] = true;
                    _state.categories[CONSENT_CATEGORIES.MARKETING] = true;
                }

                _state.consentGiven = true;
                _state.timestamp = new Date().toISOString();

                // Сохраняем состояние
                _saveState();

                // Уведомляем подписчиков
                _notifyListeners();

                console.log('[PrivacyManager] Согласие дано. Категории:', _state.categories);

                if (typeof onComplete === 'function') {
                    onComplete(_getPublicState());
                }

                _isProcessing = false;
                return _getPublicState();
            } catch (error) {
                console.error('[PrivacyManager] Ошибка при даче согласия:', error);
                _isProcessing = false;
                return null;
            }
        },

        /**
         * Отзывает согласие полностью или частично
         * @param {string|null} category - категория для отзыва (если null — отзыв всего)
         * @param {Function} onComplete - колбэк после сохранения
         */
        revokeConsent(category = null, onComplete = null) {
            if (_isProcessing) {
                console.warn('[PrivacyManager] Уже обрабатывается запрос');
                return;
            }

            _isProcessing = true;

            try {
                if (category === null) {
                    // Полный отзыв
                    _state.consentGiven = false;
                    _state.timestamp = null;
                    _state.categories[CONSENT_CATEGORIES.FUNCTIONAL] = false;
                    _state.categories[CONSENT_CATEGORIES.ANALYTICS] = false;
                    _state.categories[CONSENT_CATEGORIES.MARKETING] = false;
                    
                    // Очищаем данные аналитики (очистка localStorage)
                    _clearAnalyticsData();
                    
                    console.log('[PrivacyManager] Согласие полностью отозвано');
                } else if (category in _state.categories && category !== CONSENT_CATEGORIES.NECESSARY) {
                    // Отзыв конкретной категории
                    _state.categories[category] = false;
                    
                    // Если отзываем аналитику — очищаем данные
                    if (category === CONSENT_CATEGORIES.ANALYTICS) {
                        _clearAnalyticsData();
                    }
                    
                    console.log(`[PrivacyManager] Категория "${category}" отключена`);
                } else {
                    console.warn(`[PrivacyManager] Некорректная категория: ${category}`);
                    _isProcessing = false;
                    return;
                }

                // Сохраняем состояние
                _saveState();

                // Уведомляем подписчиков
                _notifyListeners();

                if (typeof onComplete === 'function') {
                    onComplete(_getPublicState());
                }

                _isProcessing = false;
                return _getPublicState();
            } catch (error) {
                console.error('[PrivacyManager] Ошибка при отзыве согласия:', error);
                _isProcessing = false;
                return null;
            }
        },

        /**
         * Обновляет настройки категорий без изменения статуса согласия
         * @param {Object} categories - объект с категориями
         * @param {Function} onComplete - колбэк после сохранения
         */
        updateCategories(categories, onComplete = null) {
            if (!_state.consentGiven) {
                console.warn('[PrivacyManager] Нельзя обновлять категории без согласия');
                return;
            }

            try {
                for (const [key, value] of Object.entries(categories)) {
                    if (key in _state.categories && key !== CONSENT_CATEGORIES.NECESSARY) {
                        _state.categories[key] = !!value;
                    }
                }

                _saveState();
                _notifyListeners();

                if (typeof onComplete === 'function') {
                    onComplete(_getPublicState());
                }

                return _getPublicState();
            } catch (error) {
                console.error('[PrivacyManager] Ошибка обновления категорий:', error);
                return null;
            }
        },

        /**
         * Подписывается на изменения состояния
         * @param {Function} callback - функция-обработчик
         * @returns {Function} функция для отписки
         */
        subscribe(callback) {
            if (typeof callback !== 'function') {
                console.warn('[PrivacyManager] Подписчик должен быть функцией');
                return () => {};
            }

            _listeners.push(callback);
            console.log('[PrivacyManager] Добавлен подписчик. Всего:', _listeners.length);

            // Возвращаем функцию для отписки
            return () => {
                const index = _listeners.indexOf(callback);
                if (index !== -1) {
                    _listeners.splice(index, 1);
                    console.log('[PrivacyManager] Подписчик удалён. Осталось:', _listeners.length);
                }
            };
        },

        /**
         * Возвращает текущее состояние
         * @returns {Object}
         */
        getState() {
            return _getPublicState();
        },

        /**
         * Возвращает список категорий
         * @returns {Object}
         */
        getCategories() {
            return { ..._state.categories };
        },

        /**
         * Возвращает версию согласия
         * @returns {string}
         */
        getVersion() {
            return CONSENT_VERSION;
        },

        /**
         * Возвращает время получения согласия
         * @returns {string|null}
         */
        getConsentTime() {
            return _state.timestamp;
        },

        /**
         * Проверяет, инициализирован ли менеджер
         * @returns {boolean}
         */
        isInitialized() {
            return _state.isInitialized;
        },

        /**
         * Сбрасывает состояние (для тестирования)
         */
        reset() {
            _state = {
                consentGiven: false,
                timestamp: null,
                categories: {
                    [CONSENT_CATEGORIES.NECESSARY]: true,
                    [CONSENT_CATEGORIES.FUNCTIONAL]: false,
                    [CONSENT_CATEGORIES.ANALYTICS]: false,
                    [CONSENT_CATEGORIES.MARKETING]: false
                },
                isInitialized: false
            };
            _listeners = [];
            _isProcessing = false;
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(TIMESTAMP_KEY);
            localStorage.removeItem('user_consent_categories');
            console.log('[PrivacyManager] Состояние сброшено');
        }
    };

    // ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====

    /**
     * Очищает данные аналитики при отзыве согласия
     */
    function _clearAnalyticsData() {
        try {
            // Очищаем очередь офлайн-запросов
            if (window.OfflineQueue && typeof window.OfflineQueue.clearQueue === 'function') {
                window.OfflineQueue.clearQueue();
            }
            
            // Удаляем данные аналитики из localStorage
            const analyticsKeys = [
                'analytics_session_id',
                'offline_request_queue'
            ];
            for (const key of analyticsKeys) {
                localStorage.removeItem(key);
            }
            
            console.log('[PrivacyManager] Данные аналитики очищены');
        } catch (error) {
            console.warn('[PrivacyManager] Ошибка очистки аналитики:', error);
        }
    }

    // ===== ЭКСПОРТ =====
    window.PrivacyManager = PrivacyManager;
    window.CONSENT_CATEGORIES = CONSENT_CATEGORIES;

    console.log('[PrivacyManager] Модуль загружен, версия: 1.0.0');

})();
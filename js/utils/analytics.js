// ===== АНАЛИТИКА И МЕТРИКИ (ОБНОВЛЁННАЯ) =====
// Версия: 2.1.1
// 
// Отвечает за:
// - Отправку аналитических данных
// - Проверку согласия перед отправкой
// - Отслеживание времени на шагах
// - Сбор метрик производительности
// - ИСПРАВЛЕНИЕ: исправлен URL Google Apps Script

(function() {
    'use strict';

    // ===== КОНСТАНТЫ =====
    // ИСПРАВЛЕНИЕ: используем тот же URL, что и в остальных модулях
    var GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwk8iTsw9gEEKFuPZm2tO4Uyt2IlSPX-Z06hqPE6FfqoG72tYiwgfzTQPHVOjQiBnlh/exec';
    var ANALYTICS_ENABLED_KEY = 'analytics_enabled';
    var SESSION_ID_KEY = 'analytics_session_id';
    var SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 минут

    // ===== СОСТОЯНИЕ =====
    var _sessionId = null;
    var _sessionStartTime = null;
    var _isInitialized = false;
    var _pendingEvents = [];
    var _flushInterval = null;
    var _isFlushing = false;
    var _isEnabled = true; // По умолчанию включено, но проверяем согласие

    // ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====

    /**
     * Проверяет, можно ли отправлять аналитику
     * @returns {boolean}
     */
    function _canSendAnalytics() {
        // Проверяем через PrivacyManager
        if (window.PrivacyManager) {
            return window.PrivacyManager.isAnalyticsAllowed();
        }

        // Fallback: проверяем локальное хранилище
        try {
            var consent = localStorage.getItem('user_consent_given');
            if (consent !== 'true') return false;
            
            // Проверяем, не отключена ли аналитика вручную
            var analyticsEnabled = localStorage.getItem(ANALYTICS_ENABLED_KEY);
            if (analyticsEnabled === 'false') return false;
            
            return true;
        } catch (_) {
            return false;
        }
    }

    /**
     * Получает или создаёт ID сессии
     * @returns {string}
     */
    function _getSessionId() {
        if (_sessionId) return _sessionId;

        try {
            var storedId = localStorage.getItem(SESSION_ID_KEY);
            var storedTime = localStorage.getItem('analytics_session_time');
            var now = Date.now();

            // Если есть сохранённая сессия и она не истекла
            if (storedId && storedTime) {
                var sessionAge = now - parseInt(storedTime, 10);
                if (sessionAge < SESSION_TIMEOUT_MS) {
                    _sessionId = storedId;
                    _sessionStartTime = parseInt(storedTime, 10);
                    return _sessionId;
                }
            }

            // Создаём новую сессию
            _sessionId = 'sess_' + now + '_' + Math.random().toString(36).substr(2, 9);
            _sessionStartTime = now;
            
            localStorage.setItem(SESSION_ID_KEY, _sessionId);
            localStorage.setItem('analytics_session_time', String(now));

            return _sessionId;
        } catch (_) {
            // Если localStorage недоступен
            _sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            return _sessionId;
        }
    }

    /**
     * Получает тип устройства
     * @returns {string}
     */
    function _getDeviceType() {
        var ua = navigator.userAgent;
        if (/Mobile|Android|iPhone|iPad|iPod/i.test(ua)) {
            return 'mobile';
        }
        if (/Tablet|iPad/i.test(ua)) {
            return 'tablet';
        }
        return 'desktop';
    }

    /**
     * Отправляет событие аналитики (внутренняя функция)
     * @param {Object} payload - данные для отправки
     * @param {boolean} force - принудительная отправка без проверки согласия
     */
    function _sendEvent(payload, force) {
        // Проверяем согласие, если не принудительно
        if (!force && !_canSendAnalytics()) {
            // Сохраняем событие в очередь для отправки позже (если согласие будет дано)
            _pendingEvents.push(payload);
            console.log('[Analytics] Событие добавлено в очередь (нет согласия):', payload.event_type);
            return;
        }

        // Добавляем общие поля
        var user = null;
        try {
            if (window.User && typeof window.User.get === 'function') {
                user = window.User.get();
            }
        } catch (_) {}

        var fullPayload = {
            action: 'analytics',
            user_name: user ? user.name : 'Аноним',
            session_id: _getSessionId(),
            device_type: _getDeviceType(),
            screen_width: window.innerWidth || 0,
            screen_height: window.innerHeight || 0,
            user_agent: navigator.userAgent || 'unknown',
            language: navigator.language || 'unknown',
            timestamp: new Date().toISOString(),
            ...payload
        };

        // Отправляем без ожидания ответа (fire-and-forget)
        try {
            if (window.OfflineQueue && typeof window.OfflineQueue.add === 'function') {
                window.OfflineQueue.add(fullPayload, GOOGLE_SCRIPT_URL, 'POST');
            } else {
                fetch(GOOGLE_SCRIPT_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(fullPayload)
                }).catch(function(err) {
                    console.warn('[Analytics] Ошибка отправки:', err);
                });
            }
        } catch (err) {
            console.warn('[Analytics] Ошибка отправки:', err);
        }
    }

    /**
     * Обрабатывает очередь накопленных событий
     */
    function _flushPendingEvents() {
        if (_isFlushing) return;
        if (_pendingEvents.length === 0) return;
        if (!_canSendAnalytics()) return;

        _isFlushing = true;
        var events = _pendingEvents.slice();
        _pendingEvents = [];

        console.log('[Analytics] Отправка накопленных событий:', events.length);

        for (var i = 0; i < events.length; i++) {
            _sendEvent(events[i], true);
        }

        _isFlushing = false;
    }

    // ===== ПУБЛИЧНЫЙ API =====

    var Analytics = {

        /**
         * Инициализирует аналитику
         * @param {Object} options - опции
         * @param {boolean} options.debug - включить отладку
         * @param {Function} options.onConsentChange - колбэк при изменении согласия
         */
        init: function(options) {
            if (_isInitialized) return;

            console.log('[Analytics] Инициализация...');

            // Подписываемся на изменения согласия через PrivacyManager
            if (window.PrivacyManager) {
                var unsubscribe = window.PrivacyManager.subscribe(function(state) {
                    console.log('[Analytics] Статус согласия изменён:', state);
                    
                    // Если согласие дано и есть накопленные события — отправляем
                    if (state.consentGiven && state.categories.analytics) {
                        _flushPendingEvents();
                    }
                });

                // Сохраняем функцию отписки для очистки
                this._unsubscribe = unsubscribe;
            }

            // Периодическая проверка очереди (каждые 30 секунд)
            _flushInterval = setInterval(function() {
                if (_canSendAnalytics() && _pendingEvents.length > 0) {
                    _flushPendingEvents();
                }
            }, 30000);

            _isInitialized = true;
            console.log('[Analytics] Инициализация завершена');
        },

        /**
         * Отправляет событие аналитики
         * @param {string} eventType - тип события
         * @param {Object} data - данные события
         */
        send: function(eventType, data) {
            var payload = {
                event_type: eventType,
                ...(data || {})
            };

            _sendEvent(payload, false);
        },

        /**
         * Отправляет событие принудительно (без проверки согласия)
         * Используется только для критических событий (ошибки, производительность)
         * @param {string} eventType - тип события
         * @param {Object} data - данные события
         */
        sendForce: function(eventType, data) {
            var payload = {
                event_type: eventType,
                ...(data || {})
            };

            _sendEvent(payload, true);
        },

        /**
         * Проверяет, включена ли аналитика
         * @returns {boolean}
         */
        isEnabled: function() {
            return _canSendAnalytics();
        },

        /**
         * Получает ID текущей сессии
         * @returns {string}
         */
        getSessionId: function() {
            return _getSessionId();
        },

        /**
         * Получает количество накопленных событий в очереди
         * @returns {number}
         */
        getPendingCount: function() {
            return _pendingEvents.length;
        },

        /**
         * Принудительно отправляет накопленные события
         */
        flush: function() {
            if (_canSendAnalytics()) {
                _flushPendingEvents();
            } else {
                console.log('[Analytics] Нельзя отправить накопленные события: нет согласия');
            }
        },

        /**
         * Очищает очередь накопленных событий
         */
        clearPending: function() {
            _pendingEvents = [];
            console.log('[Analytics] Очередь очищена');
        },

        /**
         * Отключает аналитику (программно)
         */
        disable: function() {
            try {
                localStorage.setItem(ANALYTICS_ENABLED_KEY, 'false');
                _pendingEvents = [];
                console.log('[Analytics] Аналитика отключена');
            } catch (_) {}
        },

        /**
         * Включает аналитику (программно)
         */
        enable: function() {
            try {
                localStorage.removeItem(ANALYTICS_ENABLED_KEY);
                console.log('[Analytics] Аналитика включена');
            } catch (_) {}
        },

        /**
         * Очищает ресурсы (при выгрузке страницы)
         */
        destroy: function() {
            if (_flushInterval) {
                clearInterval(_flushInterval);
                _flushInterval = null;
            }

            if (this._unsubscribe && typeof this._unsubscribe === 'function') {
                this._unsubscribe();
                this._unsubscribe = null;
            }

            _isInitialized = false;
            console.log('[Analytics] Очищено');
        }
    };

    // ===== ОБЁРТКИ ДЛЯ СТАРЫХ ФУНКЦИЙ (ОБРАТНАЯ СОВМЕСТИМОСТЬ) =====

    // Сохраняем старые глобальные функции как обёртки над новым API
    window.sendAnalytics = function(eventType, data) {
        Analytics.send(eventType, data);
    };

    window.sendStepResult = function(stepIndex, stepType, stepTitle, correct, total, details) {
        Analytics.send('step_result', {
            step_index: stepIndex,
            step_type: stepType,
            step_title: stepTitle,
            correct: correct,
            total: total,
            percent: total > 0 ? Math.round((correct / total) * 100) : 0,
            ...(details || {})
        });
    };

    window.sendQuizAnswer = function(questionId, questionText, userAnswer, isCorrect, timeSpentSec, hintUsed) {
        Analytics.send('quiz_answer', {
            question_id: questionId,
            question_text: questionText,
            user_answer: Array.isArray(userAnswer) ? userAnswer.join(', ') : userAnswer,
            is_correct: isCorrect,
            time_spent_sec: timeSpentSec || 0,
            hint_used: hintUsed || false
        });
    };

    window.sendMapClick = function(jkId, jkName, clickLat, clickLng, actualLat, actualLng, distanceM, isCorrect, timeToPlaceSec) {
        Analytics.send('map_click', {
            jk_id: jkId,
            jk_name: jkName,
            click_lat: clickLat,
            click_lng: clickLng,
            actual_lat: actualLat,
            actual_lng: actualLng,
            distance_m: Math.round(distanceM || 0),
            is_correct: isCorrect,
            time_to_place_sec: timeToPlaceSec || 0
        });
    };

    window.sendScenarioStart = function(scenarioId, scenarioName, totalSteps) {
        Analytics.send('scenario_start', {
            scenario_id: scenarioId,
            scenario_name: scenarioName,
            total_steps: totalSteps
        });
    };

    window.sendScenarioComplete = function(scenarioId, scenarioName, completedSteps, totalSteps, totalScore, isPerfect) {
        Analytics.send('scenario_complete', {
            scenario_id: scenarioId,
            scenario_name: scenarioName,
            completed_steps: completedSteps,
            total_steps: totalSteps,
            total_score: totalScore || 0,
            is_perfect: isPerfect || false
        });
    };

    window.sendScenarioDropOff = function(scenarioId, scenarioName, completedSteps, totalSteps, lastStepType) {
        Analytics.send('scenario_drop_off', {
            scenario_id: scenarioId,
            scenario_name: scenarioName,
            completed_steps: completedSteps,
            total_steps: totalSteps,
            last_step_type: lastStepType || null
        });
    };

    window.sendHintUsed = function(stepType, stepTitle, hintType) {
        Analytics.send('hint_used', {
            step_type: stepType,
            step_title: stepTitle,
            hint_type: hintType || 'general'
        });
    };

    window.sendError = function(errorCode, errorMessage, context) {
        Analytics.sendForce('error', {
            error_code: errorCode,
            error_message: errorMessage,
            context: JSON.stringify(context || {})
        });
    };

    window.sendDragDropAction = function(stepType, action, fromZone, toZone, itemId, isCorrect) {
        Analytics.send('drag_drop', {
            step_type: stepType,
            action: action,
            from_zone: fromZone,
            to_zone: toZone,
            item_id: itemId,
            is_correct: isCorrect
        });
    };

    // ===== ТАЙМЕРЫ ШАГОВ (ГЛОБАЛЬНЫЕ) =====

    var _stepStartTime = null;
    var _currentStepType = null;
    var _currentStepTitle = null;
    var _currentStepIndex = null;

    window.startStepTimer = function(stepType, stepTitle, stepIndex) {
        _stepStartTime = Date.now();
        _currentStepType = stepType || null;
        _currentStepTitle = stepTitle || null;
        _currentStepIndex = stepIndex !== undefined ? stepIndex : null;
    };

    window.endStepTimer = function(isCompleted, extraData) {
        if (!_stepStartTime) return 0;
        var durationSec = Math.round((Date.now() - _stepStartTime) / 1000);
        
        if (_currentStepType) {
            Analytics.send('step_complete', {
                step_type: _currentStepType,
                step_title: _currentStepTitle,
                step_index: _currentStepIndex,
                duration_sec: durationSec,
                completed: isCompleted !== false,
                ...(extraData || {})
            });
        }

        _stepStartTime = null;
        return durationSec;
    };

    // ===== АВТОМАТИЧЕСКАЯ ИНИЦИАЛИЗАЦИЯ =====
    // Ждём загрузки DOM и PrivacyManager

    function _autoInit() {
        if (_isInitialized) return;

        // Ждём PrivacyManager
        if (!window.PrivacyManager) {
            setTimeout(_autoInit, 200);
            return;
        }

        Analytics.init();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', _autoInit);
    } else {
        setTimeout(_autoInit, 100);
    }

    // ===== ЭКСПОРТ =====
    window.Analytics = Analytics;

    console.log('[Analytics] Модуль загружен, версия: 2.1.1');

})();
// ============================================================
// МОДУЛЬ СОГЛАСИЯ (ОБНОВЛЁННЫЙ)
// Версия: 3.0.0
// 
// Отвечает за:
// - Обратную совместимость со старым кодом
// - Делегирование всех операций PrivacyManager
// - Отправку данных о согласии в Google Sheets
// - Обработку ответов от баннера
// ============================================================

(function() {
    'use strict';

    // ===== ПРИВАТНЫЕ КОНСТАНТЫ =====
    var GOOGLE_SCRIPT_URL = window.GOOGLE_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbzHxrLqYze95Sws7gCvUEz8g4jzBVI3NdTDm_jLLZ-YWYD-ofjsD1iGC7S0UGf-wb2x/exec';
    var CONSENT_VERSION = '3.0.0';

    // ===== ПРИВАТНОЕ СОСТОЯНИЕ =====
    var _callbacks = {
        onAccepted: null,
        onDeclined: null
    };
    var _isInitialized = false;
    var _isProcessing = false;

    // ===== ПРИВАТНЫЕ МЕТОДЫ =====

    /**
     * Проверяет, является ли IP локальным
     */
    function _isLocalIP(ip) {
        if (!ip || typeof ip !== 'string') return true;
        return ip.startsWith('192.168.') ||
               ip.startsWith('10.') ||
               ip.startsWith('172.16.') ||
               ip.startsWith('172.17.') ||
               ip.startsWith('172.18.') ||
               ip.startsWith('172.19.') ||
               ip.startsWith('172.20.') ||
               ip.startsWith('172.21.') ||
               ip.startsWith('172.22.') ||
               ip.startsWith('172.23.') ||
               ip.startsWith('172.24.') ||
               ip.startsWith('172.25.') ||
               ip.startsWith('172.26.') ||
               ip.startsWith('172.27.') ||
               ip.startsWith('172.28.') ||
               ip.startsWith('172.29.') ||
               ip.startsWith('172.30.') ||
               ip.startsWith('172.31.') ||
               ip.startsWith('127.0.0.1') ||
               ip === '0.0.0.0' ||
               ip === '::1' ||
               ip === 'localhost';
    }

    /**
     * Получить IP-адрес АСИНХРОННО через fetch
     */
    function _getIPAsync(callback) {
        var services = [
            'https://api.ipify.org?format=json',
            'https://api.my-ip.io/ip.json',
            'https://ipapi.co/json/',
            'https://ip-api.com/json/',
            'https://icanhazip.com'
        ];

        var index = 0;

        function tryNext() {
            if (index >= services.length) {
                // Пробуем WebRTC как fallback
                try {
                    var pc = new RTCPeerConnection({ iceServers: [] });
                    pc.createDataChannel('');
                    pc.createOffer()
                        .then(function(offer) {
                            return pc.setLocalDescription(offer);
                        })
                        .catch(function() {});

                    var ipFromWebRTC = null;
                    pc.onicecandidate = function(e) {
                        if (e.candidate) {
                            var match = /([0-9]{1,3}\.){3}[0-9]{1,3}/.exec(e.candidate.candidate);
                            if (match) {
                                var localIP = match[0];
                                if (!_isLocalIP(localIP)) {
                                    ipFromWebRTC = localIP;
                                }
                            }
                        }
                    };

                    setTimeout(function() {
                        if (ipFromWebRTC) {
                            callback(ipFromWebRTC);
                        } else {
                            callback('unknown');
                        }
                    }, 1500);
                } catch (_) {
                    callback('unknown');
                }
                return;
            }

            var url = services[index];
            index++;

            fetch(url, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                cache: 'no-cache'
            })
            .then(function(response) {
                if (!response.ok) throw new Error('Network error');
                return response.text();
            })
            .then(function(text) {
                var ip = null;
                try {
                    var data = JSON.parse(text);
                    ip = data.ip || data.query || null;
                } catch (_) {
                    ip = text.trim();
                }

                if (ip && ip !== 'unknown' && ip !== 'undefined' && ip !== 'null') {
                    var ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
                    if (ipPattern.test(ip) && !_isLocalIP(ip)) {
                        callback(ip);
                        return;
                    }
                }
                tryNext();
            })
            .catch(function() {
                tryNext();
            });
        }

        tryNext();
    }

    /**
     * Получить данные пользователя АСИНХРОННО
     */
    function _getUserDataAsync(callback) {
        var userName = 'Аноним';
        try {
            if (window.User && typeof window.User.get === 'function') {
                var user = window.User.get();
                if (user && user.name) {
                    userName = user.name;
                }
            }
        } catch (_) {}

        _getIPAsync(function(ip) {
            callback({
                name: userName,
                agent: navigator.userAgent || 'unknown',
                ip: ip || 'unknown',
                screenWidth: window.screen ? window.screen.width : 'unknown',
                language: navigator.language || 'unknown',
                platform: navigator.platform || 'unknown'
            });
        });
    }

    /**
     * Отправить данные о согласии в Google Таблицу
     */
    function _sendConsentToServer(userData, categories) {
        var payload = {
            action: 'save_consent',
            user_name: userData.name,
            consent_version: CONSENT_VERSION,
            user_agent: userData.agent,
            ip: userData.ip,
            screen_width: userData.screenWidth,
            language: userData.language,
            platform: userData.platform,
            timestamp: new Date().toISOString(),
            consent_given: true,
            categories: categories || {
                functional: true,
                analytics: true,
                marketing: true
            }
        };

        console.log('[Consent] Отправка согласия:', payload);

        if (window.OfflineQueue && typeof window.OfflineQueue.add === 'function') {
            window.OfflineQueue.add(payload, GOOGLE_SCRIPT_URL, 'POST');
        } else {
            try {
                fetch(GOOGLE_SCRIPT_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                }).catch(function(err) {
                    console.warn('[Consent] Ошибка отправки согласия:', err);
                });
            } catch (err) {
                console.warn('[Consent] Ошибка отправки согласия:', err);
            }
        }
    }

    /**
     * Обработчик кнопки "Согласен"
     */
    function _handleAccept() {
        if (_isProcessing) return;
        _isProcessing = true;

        // Показываем индикатор загрузки на кнопке
        var acceptBtn = document.getElementById('consent-accept');
        if (acceptBtn) {
            acceptBtn.disabled = true;
            acceptBtn.innerHTML = '⏳ Подождите...';
        }

        _getUserDataAsync(function(userData) {
            // Восстанавливаем кнопку
            if (acceptBtn) {
                acceptBtn.disabled = false;
                acceptBtn.innerHTML = '<i class="fas fa-check"></i> Принимаю';
            }

            // Используем PrivacyManager для сохранения согласия
            if (window.PrivacyManager) {
                var state = window.PrivacyManager.giveConsent({
                    functional: true,
                    analytics: true,
                    marketing: true
                });

                if (state) {
                    console.log('[Consent] Согласие сохранено через PrivacyManager');
                }
            } else {
                // Fallback на старую логику (для обратной совместимости)
                try {
                    localStorage.setItem('user_consent_given', 'true');
                    localStorage.setItem('consent_timestamp', new Date().toISOString());
                } catch (_) {}
            }

            // Отправляем данные на сервер
            _sendConsentToServer(userData, {
                functional: true,
                analytics: true,
                marketing: true
            });

            // Скрываем баннер через ConsentBanner
            if (window.ConsentBanner && typeof window.ConsentBanner.hide === 'function') {
                window.ConsentBanner.hide();
            }

            // Уведомляем о принятии
            if (typeof _callbacks.onAccepted === 'function') {
                _callbacks.onAccepted();
            }

            console.log('[Consent] Согласие получено для:', userData.name, 'IP:', userData.ip);
            _isProcessing = false;
        });
    }

    /**
     * Обработчик кнопки "Отказаться"
     */
    function _handleDecline() {
        if (_isProcessing) return;
        _isProcessing = true;

        // Отзываем согласие через PrivacyManager
        if (window.PrivacyManager) {
            window.PrivacyManager.revokeConsent(null);
            console.log('[Consent] Согласие отозвано через PrivacyManager');
        } else {
            // Fallback на старую логику
            try {
                localStorage.removeItem('user_consent_given');
                localStorage.removeItem('consent_timestamp');
                localStorage.removeItem('user_consent_categories');
            } catch (_) {}
        }

        // Скрываем баннер через ConsentBanner
        if (window.ConsentBanner && typeof window.ConsentBanner.hide === 'function') {
            window.ConsentBanner.hide();
        }

        // Уведомляем об отказе
        if (typeof _callbacks.onDeclined === 'function') {
            _callbacks.onDeclined();
        }

        console.log('[Consent] Пользователь отказался от согласия');
        _isProcessing = false;
    }

    /**
     * Навесить обработчики на кнопки баннера
     */
    function _bindEvents() {
        var acceptBtn = document.getElementById('consent-accept');
        var declineBtn = document.getElementById('consent-decline');

        if (acceptBtn) {
            // Удаляем старые обработчики через замену
            var newAccept = acceptBtn.cloneNode(true);
            acceptBtn.parentNode.replaceChild(newAccept, acceptBtn);
            newAccept.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                _handleAccept();
            });
        }

        if (declineBtn) {
            var newDecline = declineBtn.cloneNode(true);
            declineBtn.parentNode.replaceChild(newDecline, declineBtn);
            newDecline.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                _handleDecline();
            });
        }
    }

    /**
     * Создание баннера вручную (fallback)
     */
    function _createFallbackBanner() {
        if (document.getElementById('consent-banner')) return;

        var banner = document.createElement('div');
        banner.id = 'consent-banner';
        banner.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:linear-gradient(135deg,#1a1a2e,#16213e);color:#fff;padding:20px 24px;z-index:9999;border-top:3px solid #f39c12;display:flex;flex-direction:column;align-items:center;gap:16px;font-family:sans-serif;box-shadow:0 -8px 32px rgba(0,0,0,0.4);max-height:90vh;overflow-y:auto;';
        banner.innerHTML = `
            <div style="max-width:900px;width:100%;text-align:center;">
                <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:8px;flex-wrap:wrap;">
                    <span style="font-size:1.5rem;">🛡️</span>
                    <span style="font-weight:700;font-size:1.1rem;color:#f39c12;">Ваша конфиденциальность</span>
                </div>
                <p style="margin:0;font-size:0.9rem;line-height:1.5;color:rgba(255,255,255,0.85);max-width:700px;margin:0 auto;">
                    Мы используем cookies и собираем технические данные
                    (имя, IP-адрес, прогресс обучения) для работы тренажёра.
                    <br>
                    <a href="./privacy.html" target="_blank" style="color:#f39c12;text-decoration:underline;font-weight:500;">
                        Подробнее в Политике конфиденциальности
                    </a>
                </p>
            </div>
            <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;">
                <button id="consent-accept" style="min-width:140px;padding:12px 24px;background:linear-gradient(135deg,#f39c12,#e67e22);border:none;border-radius:32px;color:#fff;font-weight:700;font-size:0.95rem;cursor:pointer;">
                    <i class="fas fa-check"></i> Принимаю
                </button>
                <button id="consent-decline" style="min-width:140px;padding:12px 24px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.25);border-radius:32px;color:#fff;font-weight:600;font-size:0.95rem;cursor:pointer;">
                    <i class="fas fa-times"></i> Отказаться
                </button>
            </div>
            <div style="font-size:0.7rem;color:rgba(255,255,255,0.4);text-align:center;max-width:600px;">
                Вы можете отозвать согласие в любой момент, очистив данные сайта в настройках браузера
            </div>
        `;
        document.body.appendChild(banner);
        _bindEvents();
        console.log('[Consent] Баннер создан вручную (fallback)');
    }

    // ===== ПУБЛИЧНЫЙ API =====

    var publicAPI = {

        /**
         * Проверяет, дано ли согласие
         * @returns {boolean}
         */
        hasConsent: function() {
            // Используем PrivacyManager, если доступен
            if (window.PrivacyManager) {
                return window.PrivacyManager.hasConsent();
            }

            // Fallback на старую логику
            try {
                return localStorage.getItem('user_consent_given') === 'true';
            } catch (_) {
                return false;
            }
        },

        /**
         * Запрашивает согласие у пользователя
         * @param {Function} onAccepted - колбэк при принятии
         * @param {Function} onDeclined - колбэк при отказе
         */
        requestConsent: function(onAccepted, onDeclined) {
            _callbacks.onAccepted = onAccepted || null;
            _callbacks.onDeclined = onDeclined || null;

            // Если согласие уже есть — сразу вызываем onAccepted
            if (this.hasConsent()) {
                if (window.ConsentBanner && typeof window.ConsentBanner.hide === 'function') {
                    window.ConsentBanner.hide();
                }
                if (typeof _callbacks.onAccepted === 'function') {
                    _callbacks.onAccepted();
                }
                return;
            }

            // Показываем баннер через ConsentBanner
            if (window.ConsentBanner && typeof window.ConsentBanner.show === 'function') {
                window.ConsentBanner.show();
                // Перепривязываем события после показа
                setTimeout(_bindEvents, 50);
            } else {
                // Fallback: если ConsentBanner не загружен
                console.warn('[Consent] ConsentBanner не загружен, создаём баннер вручную');
                _createFallbackBanner();
            }
        },

        /**
         * Даёт согласие (программно)
         */
        giveConsent: function() {
            _handleAccept();
        },

        /**
         * Отзывает согласие (программно)
         */
        revokeConsent: function() {
            _handleDecline();
        },

        /**
         * Возвращает версию модуля
         */
        getVersion: function() {
            return CONSENT_VERSION;
        },

        /**
         * Возвращает время получения согласия
         */
        getConsentTime: function() {
            if (window.PrivacyManager) {
                return window.PrivacyManager.getConsentTime();
            }

            try {
                return localStorage.getItem('consent_timestamp') || null;
            } catch (_) {
                return null;
            }
        },

        /**
         * Получает данные пользователя
         */
        getUserData: function(callback) {
            _getUserDataAsync(callback || function(data) {
                console.log('[Consent] Данные пользователя:', data);
            });
        },

        /**
         * Сбрасывает состояние (для тестирования)
         */
        reset: function() {
            if (window.PrivacyManager) {
                window.PrivacyManager.reset();
            } else {
                try {
                    localStorage.removeItem('user_consent_given');
                    localStorage.removeItem('consent_timestamp');
                    localStorage.removeItem('user_consent_categories');
                } catch (_) {}
            }
            _callbacks = {
                onAccepted: null,
                onDeclined: null
            };
            _isProcessing = false;
            console.log('[Consent] Состояние сброшено');
        }
    };

    // ===== ЭКСПОРТ =====
    window.Consent = publicAPI;

    console.log('[Consent] Модуль загружен, версия:', CONSENT_VERSION);

})();
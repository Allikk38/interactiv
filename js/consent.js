// ============================================================
// МОДУЛЬ СОГЛАСИЯ НА ОБРАБОТКУ ПДн (152-ФЗ)
// Версия: 2.2
// Зависимости: User (для имени), OfflineQueue (опционально)
// ============================================================

(function() {
    'use strict';

    // ===== ПРИВАТНЫЕ КОНСТАНТЫ =====
    var STORAGE_KEY = 'user_consent_given';
    var TIMESTAMP_KEY = 'consent_timestamp';
    var CONSENT_VERSION = '2.2';
    var BANNER_SELECTOR = '#consent-banner';
    var ACCEPT_BTN_SELECTOR = '#consent-accept';
    var DECLINE_BTN_SELECTOR = '#consent-decline';

    // ===== ПРИВАТНОЕ СОСТОЯНИЕ =====
    var _callbacks = {
        onAccepted: null,
        onDeclined: null
    };
    var _isBannerShown = false;

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
     * Получить IP-адрес через несколько сервисов с fallback
     * @returns {string} IP-адрес или 'unknown'
     */
    function _getIP() {
        // Список сервисов для получения IP
        var services = [
            'https://api.ipify.org?format=json',
            'https://api.my-ip.io/ip.json',
            'https://ipapi.co/json/',
            'https://ip-api.com/json/',
            'https://icanhazip.com'
        ];

        // Пробуем синхронно через XHR
        for (var i = 0; i < services.length; i++) {
            try {
                var xhr = new XMLHttpRequest();
                xhr.open('GET', services[i], false);
                xhr.timeout = 3000;
                xhr.send();

                if (xhr.status === 200 && xhr.responseText) {
                    var ip = null;
                    try {
                        var data = JSON.parse(xhr.responseText);
                        ip = data.ip || data.query || null;
                    } catch (_) {
                        ip = xhr.responseText.trim();
                    }

                    if (ip && ip !== 'unknown' && ip !== 'undefined' && ip !== 'null') {
                        var ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
                        if (ipPattern.test(ip) && !_isLocalIP(ip)) {
                            return ip;
                        }
                    }
                }
            } catch (_) {
                continue;
            }
        }

        // Пробуем через WebRTC
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

            var startTime = Date.now();
            while (!ipFromWebRTC && (Date.now() - startTime) < 2000) {
                // Ждём
            }

            if (ipFromWebRTC) {
                return ipFromWebRTC;
            }
        } catch (_) {}

        return 'unknown';
    }

    /**
     * Получить данные пользователя
     */
    function _getUserData() {
        var userName = 'Аноним';
        try {
            if (window.User && typeof window.User.get === 'function') {
                var user = window.User.get();
                if (user && user.name) {
                    userName = user.name;
                }
            }
        } catch (_) {}

        var ip = 'unknown';
        // Пробуем до 5 раз с задержкой
        for (var attempt = 0; attempt < 5; attempt++) {
            ip = _getIP();
            if (ip !== 'unknown') break;
            // Небольшая задержка между попытками
            var start = Date.now();
            while (Date.now() - start < 200) {}
        }

        return {
            name: userName,
            agent: navigator.userAgent || 'unknown',
            ip: ip,
            screenWidth: window.screen ? window.screen.width : 'unknown',
            language: navigator.language || 'unknown',
            platform: navigator.platform || 'unknown'
        };
    }

    /**
     * Отправить данные о согласии в Google Таблицу
     */
    function _sendConsentToServer(userData) {
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
            consent_given: true
        };

        if (window.OfflineQueue && typeof window.OfflineQueue.add === 'function') {
            window.OfflineQueue.add(payload, window.GOOGLE_SCRIPT_URL, 'POST');
        } else {
            try {
                fetch(window.GOOGLE_SCRIPT_URL, {
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
     * Показать баннер согласия
     */
    function _showBanner() {
        var banner = document.querySelector(BANNER_SELECTOR);
        if (!banner || _isBannerShown) return;
        banner.style.display = 'flex';
        _isBannerShown = true;
    }

    /**
     * Скрыть баннер согласия
     */
    function _hideBanner() {
        var banner = document.querySelector(BANNER_SELECTOR);
        if (!banner) return;
        banner.style.display = 'none';
        _isBannerShown = false;
    }

    /**
     * Обработчик кнопки "Согласен"
     */
    function _handleAccept() {
        var userData = _getUserData();

        try {
            localStorage.setItem(STORAGE_KEY, 'true');
            localStorage.setItem(TIMESTAMP_KEY, new Date().toISOString());
        } catch (_) {}

        _sendConsentToServer(userData);
        _hideBanner();

        if (typeof _callbacks.onAccepted === 'function') {
            _callbacks.onAccepted();
        }

        console.log('[Consent] Согласие получено для:', userData.name, 'IP:', userData.ip);
    }

    /**
     * Обработчик кнопки "Отказаться"
     */
    function _handleDecline() {
        try {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(TIMESTAMP_KEY);
        } catch (_) {}

        _hideBanner();

        if (typeof _callbacks.onDeclined === 'function') {
            _callbacks.onDeclined();
        }

        console.log('[Consent] Пользователь отказался от согласия');
    }

    /**
     * Навесить обработчики на кнопки баннера
     */
    function _bindEvents() {
        var acceptBtn = document.querySelector(ACCEPT_BTN_SELECTOR);
        var declineBtn = document.querySelector(DECLINE_BTN_SELECTOR);

        if (acceptBtn) {
            var newAccept = acceptBtn.cloneNode(true);
            acceptBtn.parentNode.replaceChild(newAccept, acceptBtn);
            newAccept.addEventListener('click', _handleAccept);
        }

        if (declineBtn) {
            var newDecline = declineBtn.cloneNode(true);
            declineBtn.parentNode.replaceChild(newDecline, declineBtn);
            newDecline.addEventListener('click', _handleDecline);
        }
    }

    // ===== ПУБЛИЧНЫЙ API =====

    var publicAPI = {

        hasConsent: function() {
            try {
                return localStorage.getItem(STORAGE_KEY) === 'true';
            } catch (_) {
                return false;
            }
        },

        requestConsent: function(onAccepted, onDeclined) {
            _callbacks.onAccepted = onAccepted || null;
            _callbacks.onDeclined = onDeclined || null;

            if (this.hasConsent()) {
                _hideBanner();
                if (typeof _callbacks.onAccepted === 'function') {
                    _callbacks.onAccepted();
                }
                return;
            }

            _showBanner();
            _bindEvents();
        },

        giveConsent: function() {
            _handleAccept();
        },

        revokeConsent: function() {
            try {
                localStorage.removeItem(STORAGE_KEY);
                localStorage.removeItem(TIMESTAMP_KEY);
            } catch (_) {}
            console.log('[Consent] Согласие отозвано');
            _showBanner();
            _bindEvents();
        },

        getVersion: function() {
            return CONSENT_VERSION;
        },

        getConsentTime: function() {
            try {
                return localStorage.getItem(TIMESTAMP_KEY) || null;
            } catch (_) {
                return null;
            }
        },

        refreshIP: function() {
            return _getIP();
        },

        getUserData: function() {
            return _getUserData();
        }
    };

    window.Consent = publicAPI;
    console.log('[Consent] Модуль загружен, версия:', CONSENT_VERSION);

})();
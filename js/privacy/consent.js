// ============================================================
// МОДУЛЬ СОГЛАСИЯ (ИСПРАВЛЕННЫЙ)
// Версия: 4.0.2
// ============================================================

(function() {
    'use strict';

    // ===== ПРИВАТНЫЕ КОНСТАНТЫ =====
    var GOOGLE_SCRIPT_URL = window.GOOGLE_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbwk8iTsw9gEEKFuPZm2tO4Uyt2IlSPX-Z06hqPE6FfqoG72tYiwgfzTQPHVOjQiBnlh/exec';
    var CONSENT_VERSION = '4.0.2';
    var IP_NOT_AVAILABLE = 'IP_NOT_AVAILABLE';

    // ===== ПРИВАТНОЕ СОСТОЯНИЕ =====
    var _callbacks = {
        onAccepted: null,
        onDeclined: null
    };
    var _isInitialized = false;
    var _isProcessing = false;

    // ===== ПРИВАТНЫЕ МЕТОДЫ =====

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

    function _getIPAsync() {
        return new Promise(function(resolve) {
            if (window.IPHelper && typeof window.IPHelper.getIP === 'function') {
                window.IPHelper.getIP()
                    .then(function(ip) {
                        console.log('[Consent] IPHelper.getIP вернул:', ip);
                        resolve(ip || IP_NOT_AVAILABLE);
                    })
                    .catch(function(err) {
                        console.warn('[Consent] IPHelper.getIP ошибка:', err);
                        resolve(IP_NOT_AVAILABLE);
                    });
                return;
            }

            console.warn('[Consent] IPHelper не загружен, используем fallback');

            var services = [
                'https://api.ipify.org?format=json',
                'https://api.my-ip.io/ip.json',
                'https://ipapi.co/json/',
                'https://ip-api.com/json/',
                'https://icanhazip.com'
            ];

            var index = 0;
            var timeoutMs = 5000;

            function tryNext() {
                if (index >= services.length) {
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
                                resolve(ipFromWebRTC);
                            } else {
                                resolve(IP_NOT_AVAILABLE);
                            }
                        }, 1500);
                    } catch (_) {
                        resolve(IP_NOT_AVAILABLE);
                    }
                    return;
                }

                var url = services[index];
                index++;

                var controller = new AbortController();
                var timeoutId = setTimeout(function() {
                    controller.abort();
                }, timeoutMs);

                fetch(url, {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' },
                    cache: 'no-cache',
                    signal: controller.signal
                })
                .then(function(response) {
                    clearTimeout(timeoutId);
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
                            console.log('[Consent] Получен IP через fallback:', ip);
                            resolve(ip);
                            return;
                        }
                    }
                    tryNext();
                })
                .catch(function() {
                    clearTimeout(timeoutId);
                    tryNext();
                });
            }

            tryNext();
        });
    }

    function _getUserDataAsync() {
        return new Promise(function(resolve) {
            var userName = 'Аноним';
            try {
                if (window.User && typeof window.User.get === 'function') {
                    var user = window.User.get();
                    if (user && user.name) {
                        userName = user.name;
                    }
                }
            } catch (_) {}

            var userAgent = navigator.userAgent || 'unknown';
            var screenWidth = window.screen ? window.screen.width : 'unknown';
            var screenHeight = window.screen ? window.screen.height : 'unknown';
            var language = navigator.language || 'unknown';
            var platform = navigator.platform || 'unknown';
            var cookieEnabled = navigator.cookieEnabled || false;
            var doNotTrack = navigator.doNotTrack || 'unknown';

            if (window.IPHelper && typeof window.IPHelper.getAll === 'function') {
                window.IPHelper.getAll()
                    .then(function(data) {
                        console.log('[Consent] IPHelper.getAll вернул данные:', data);
                        resolve({
                            name: userName,
                            agent: data.userAgent || userAgent,
                            ip: data.ip || IP_NOT_AVAILABLE,
                            screenWidth: data.screenWidth || screenWidth,
                            screenHeight: data.screenHeight || screenHeight,
                            language: data.language || language,
                            platform: data.platform || platform,
                            cookieEnabled: data.cookieEnabled !== undefined ? data.cookieEnabled : cookieEnabled,
                            doNotTrack: data.doNotTrack || doNotTrack
                        });
                    })
                    .catch(function(err) {
                        console.warn('[Consent] IPHelper.getAll ошибка:', err);
                        _getIPAsync().then(function(ip) {
                            resolve({
                                name: userName,
                                agent: userAgent,
                                ip: ip,
                                screenWidth: screenWidth,
                                screenHeight: screenHeight,
                                language: language,
                                platform: platform,
                                cookieEnabled: cookieEnabled,
                                doNotTrack: doNotTrack
                            });
                        });
                    });
                return;
            }

            _getIPAsync().then(function(ip) {
                resolve({
                    name: userName,
                    agent: userAgent,
                    ip: ip,
                    screenWidth: screenWidth,
                    screenHeight: screenHeight,
                    language: language,
                    platform: platform,
                    cookieEnabled: cookieEnabled,
                    doNotTrack: doNotTrack
                });
            });
        });
    }

    // ===== ОТПРАВКА СОГЛАСИЯ (no-cors, без попытки прочитать ответ) =====
    function _sendConsentToServer(userData, categories) {
        var now = new Date();
        var payload = {
            action: 'save_consent',
            consent_version: CONSENT_VERSION,
            ip: userData.ip || IP_NOT_AVAILABLE,
            user_agent: userData.agent || navigator.userAgent || 'unknown',
            timestamp: now.toISOString(),
            formatted_date: now.toLocaleString('ru-RU', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            }),
            consent_given: true,
            user_name: userData.name || 'Аноним',
            categories: categories || {
                functional: true,
                analytics: true,
                marketing: true
            },
            screen_width: window.screen ? window.screen.width : 'unknown',
            screen_height: window.screen ? window.screen.height : 'unknown',
            language: navigator.language || 'unknown',
            platform: navigator.platform || 'unknown',
            cookie_enabled: navigator.cookieEnabled || false,
            do_not_track: navigator.doNotTrack || 'unknown'
        };

        console.log('[Consent] Отправка согласия, IP:', payload.ip);

        // Только отправка, без обработки ответа (no-cors)
        fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
        .catch(function(err) {
            console.error('[Consent] Ошибка отправки:', err);
        });
        
        // Сразу логируем успех, так как no-cors не даёт прочитать ответ
        console.log('[Consent] ✅ Запрос отправлен (результат в Google Sheets)');
    }

    // ===== ОБРАБОТЧИКИ =====

    function _handleAccept() {
        if (_isProcessing) return;
        _isProcessing = true;

        var acceptBtn = document.getElementById('consent-accept');
        if (acceptBtn) {
            acceptBtn.disabled = true;
            acceptBtn.innerHTML = '⏳ Подождите...';
        }

        console.log('[Consent] Начало получения данных пользователя...');

        _getUserDataAsync().then(function(userData) {
            console.log('[Consent] Данные пользователя получены:', {
                name: userData.name,
                ip: userData.ip,
                agent: userData.agent
            });

            if (acceptBtn) {
                acceptBtn.disabled = false;
                acceptBtn.innerHTML = '<i class="fas fa-check"></i> Принимаю';
            }

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
                try {
                    localStorage.setItem('user_consent_given', 'true');
                    localStorage.setItem('consent_timestamp', new Date().toISOString());
                } catch (_) {}
            }

            _sendConsentToServer(userData, {
                functional: true,
                analytics: true,
                marketing: true
            });

            if (window.ConsentBanner && typeof window.ConsentBanner.hide === 'function') {
                window.ConsentBanner.hide();
            }

            if (typeof _callbacks.onAccepted === 'function') {
                _callbacks.onAccepted();
            }

            console.log('[Consent] Согласие получено для:', userData.name, 'IP:', userData.ip);
            _isProcessing = false;
        }).catch(function(err) {
            console.error('[Consent] Ошибка получения данных пользователя:', err);
            if (acceptBtn) {
                acceptBtn.disabled = false;
                acceptBtn.innerHTML = '<i class="fas fa-check"></i> Принимаю';
            }
            _isProcessing = false;
        });
    }

    function _handleDecline() {
        if (_isProcessing) return;
        _isProcessing = true;

        if (window.PrivacyManager) {
            window.PrivacyManager.revokeConsent(null);
            console.log('[Consent] Согласие отозвано через PrivacyManager');
        } else {
            try {
                localStorage.removeItem('user_consent_given');
                localStorage.removeItem('consent_timestamp');
                localStorage.removeItem('user_consent_categories');
            } catch (_) {}
        }

        if (window.ConsentBanner && typeof window.ConsentBanner.hide === 'function') {
            window.ConsentBanner.hide();
        }

        if (typeof _callbacks.onDeclined === 'function') {
            _callbacks.onDeclined();
        }

        console.log('[Consent] Пользователь отказался от согласия');
        _isProcessing = false;
    }

    function _bindEvents() {
        var acceptBtn = document.getElementById('consent-accept');
        var declineBtn = document.getElementById('consent-decline');

        if (acceptBtn) {
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

        hasConsent: function() {
            if (window.PrivacyManager) {
                return window.PrivacyManager.hasConsent();
            }
            try {
                return localStorage.getItem('user_consent_given') === 'true';
            } catch (_) {
                return false;
            }
        },

        requestConsent: function(onAccepted, onDeclined) {
            _callbacks.onAccepted = onAccepted || null;
            _callbacks.onDeclined = onDeclined || null;

            if (this.hasConsent()) {
                if (window.ConsentBanner && typeof window.ConsentBanner.hide === 'function') {
                    window.ConsentBanner.hide();
                }
                if (typeof _callbacks.onAccepted === 'function') {
                    _callbacks.onAccepted();
                }
                return;
            }

            if (window.ConsentBanner && typeof window.ConsentBanner.show === 'function') {
                window.ConsentBanner.show();
                setTimeout(_bindEvents, 50);
            } else {
                console.warn('[Consent] ConsentBanner не загружен, создаём баннер вручную');
                _createFallbackBanner();
            }
        },

        giveConsent: function(extraData) {
            return new Promise(function(resolve) {
                console.log('[Consent] giveConsent вызван с extraData:', extraData);

                _getUserDataAsync().then(function(userData) {
                    if (extraData) {
                        userData = { ...userData, ...extraData };
                    }

                    console.log('[Consent] Итоговые данные для отправки:', {
                        name: userData.name,
                        ip: userData.ip,
                        agent: userData.agent
                    });

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
                        try {
                            localStorage.setItem('user_consent_given', 'true');
                            localStorage.setItem('consent_timestamp', new Date().toISOString());
                        } catch (_) {}
                    }

                    _sendConsentToServer(userData, {
                        functional: true,
                        analytics: true,
                        marketing: true
                    });

                    if (window.ConsentBanner && typeof window.ConsentBanner.hide === 'function') {
                        window.ConsentBanner.hide();
                    }

                    if (typeof _callbacks.onAccepted === 'function') {
                        _callbacks.onAccepted();
                    }

                    console.log('[Consent] Согласие отправлено, IP:', userData.ip);
                    resolve({ success: true, ip: userData.ip });
                }).catch(function(err) {
                    console.error('[Consent] Ошибка в giveConsent:', err);
                    resolve({ success: false, error: err.message });
                });
            });
        },

        revokeConsent: function() {
            _handleDecline();
        },

        getVersion: function() {
            return CONSENT_VERSION;
        },

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

        getUserData: function(callback) {
            _getUserDataAsync().then(function(data) {
                if (callback) callback(data);
            }).catch(function() {
                if (callback) callback({
                    ip: IP_NOT_AVAILABLE,
                    agent: navigator.userAgent || 'unknown',
                    name: 'Аноним'
                });
            });
        },

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
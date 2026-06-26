// ============================================================
// IP HELPER — ПОЛУЧЕНИЕ ПУБЛИЧНОГО IP-АДРЕСА
// Версия: 1.1.0
// ============================================================

(function() {
    'use strict';

    // ===== КОНСТАНТЫ =====
    var IP_SERVICE_URL = 'https://api.ipify.org?format=json';
    var TIMEOUT_MS = 5000;
    var IP_NOT_AVAILABLE = 'IP_NOT_AVAILABLE';

    // ===== ПРИВАТНЫЕ МЕТОДЫ =====

    /**
     * Проверяет, является ли IP локальным
     * @param {string} ip - IP-адрес для проверки
     * @returns {boolean}
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
     * Выполняет запрос к сервису получения IP
     * @param {string} url - URL сервиса
     * @param {number} timeoutMs - таймаут в миллисекундах
     * @returns {Promise<string>} - промис с IP-адресом
     */
    function _fetchIP(url, timeoutMs) {
        return new Promise(function(resolve, reject) {
            var controller = new AbortController();
            var timeoutId = setTimeout(function() {
                controller.abort();
                reject(new Error('Timeout'));
            }, timeoutMs);

            fetch(url, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                cache: 'no-cache',
                signal: controller.signal
            })
            .then(function(response) {
                clearTimeout(timeoutId);
                if (!response.ok) {
                    throw new Error('Network response was not ok: ' + response.status);
                }
                return response.json();
            })
            .then(function(data) {
                if (data && data.ip) {
                    resolve(data.ip);
                } else {
                    reject(new Error('Invalid response format'));
                }
            })
            .catch(function(error) {
                clearTimeout(timeoutId);
                reject(error);
            });
        });
    }

    /**
     * Пытается получить IP через несколько сервисов (fallback)
     * @param {number} timeoutMs - таймаут в миллисекундах
     * @returns {Promise<string>} - промис с IP-адресом или строкой 'IP_NOT_AVAILABLE'
     */
    function _getIPWithFallback(timeoutMs) {
        var services = [
            'https://api.ipify.org?format=json',
            'https://api.my-ip.io/ip.json',
            'https://ipapi.co/json/',
            'https://ip-api.com/json/'
        ];

        var index = 0;
        var timeout = timeoutMs || TIMEOUT_MS;

        return new Promise(function(resolve) {
            function tryNext() {
                if (index >= services.length) {
                    resolve(IP_NOT_AVAILABLE);
                    return;
                }

                var url = services[index];
                index++;

                _fetchIP(url, timeout)
                    .then(function(ip) {
                        if (_isLocalIP(ip)) {
                            tryNext();
                        } else {
                            resolve(ip);
                        }
                    })
                    .catch(function() {
                        tryNext();
                    });
            }

            tryNext();
        });
    }

    // ===== ПУБЛИЧНЫЙ API =====

    var IPHelper = {

        /**
         * Получает публичный IP-адрес пользователя
         * @param {number} timeoutMs - таймаут в миллисекундах (по умолчанию 5000)
         * @returns {Promise<string>} - промис с IP-адресом или строкой 'IP_NOT_AVAILABLE'
         */
        getIP: function(timeoutMs) {
            return _getIPWithFallback(timeoutMs || TIMEOUT_MS);
        },

        /**
         * Возвращает User Agent браузера
         * @returns {string}
         */
        getUserAgent: function() {
            return navigator.userAgent || 'unknown';
        },

        /**
         * Возвращает информацию об устройстве
         * @returns {Object}
         */
        getDeviceInfo: function() {
            return {
                screenWidth: window.screen ? window.screen.width : 'unknown',
                screenHeight: window.screen ? window.screen.height : 'unknown',
                language: navigator.language || 'unknown',
                platform: navigator.platform || 'unknown',
                cookieEnabled: navigator.cookieEnabled || false,
                doNotTrack: navigator.doNotTrack || 'unknown'
            };
        },

        /**
         * Получает все данные: IP, User Agent и информацию об устройстве
         * @param {number} timeoutMs - таймаут для получения IP
         * @returns {Promise<Object>}
         */
        getAll: function(timeoutMs) {
            var self = this;
            return this.getIP(timeoutMs)
                .then(function(ip) {
                    var deviceInfo = self.getDeviceInfo();
                    return {
                        ip: ip,
                        userAgent: self.getUserAgent(),
                        screenWidth: deviceInfo.screenWidth,
                        screenHeight: deviceInfo.screenHeight,
                        language: deviceInfo.language,
                        platform: deviceInfo.platform,
                        cookieEnabled: deviceInfo.cookieEnabled,
                        doNotTrack: deviceInfo.doNotTrack
                    };
                });
        },

        /**
         * Проверяет, доступен ли сервис получения IP
         * @returns {Promise<boolean>}
         */
        checkAvailability: function() {
            return this.getIP(3000)
                .then(function(ip) {
                    return ip !== IP_NOT_AVAILABLE;
                })
                .catch(function() {
                    return false;
                });
        },

        IP_NOT_AVAILABLE: IP_NOT_AVAILABLE
    };

    // ===== ЭКСПОРТ =====
    window.IPHelper = IPHelper;

    console.log('[IPHelper] Модуль загружен, версия: 1.1.0');

})();
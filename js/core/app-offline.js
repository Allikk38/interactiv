// ============================================================
// ОФЛАЙН-ИНДИКАТОР
// Версия: 1.0
// Отвечает за: отображение статуса соединения
// ============================================================

(function() {
    'use strict';

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
                if (typeof showToast === 'function') {
                    showToast('📡', 'Нет соединения с интернетом. Данные сохраняются локально.', 'error', false);
                }
            } else {
                indicator.classList.remove('offline-indicator--visible');
                if (window.OfflineQueue && window.OfflineQueue.hasPendingRequests &&
                    window.OfflineQueue.hasPendingRequests()) {
                    if (typeof showToast === 'function') {
                        showToast('📤', 'Соединение восстановлено. Отправка накопленных данных...', 'success');
                    }
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

    // ===== ЭКСПОРТ В ГЛОБАЛЬНУЮ ОБЛАСТЬ =====
    window.initOfflineIndicator = initOfflineIndicator;
    window.updateOfflineIndicatorUI = updateOfflineIndicatorUI;

    console.log('[AppOffline] Модуль загружен, версия: 1.0');

})();
// ============================================================
// PWA ФУНКЦИОНАЛ
// Версия: 1.0
// Отвечает за: PWA обновления, установку приложения
// ============================================================

(function() {
    'use strict';

    // ===== PWA ОБНОВЛЕНИЯ =====

    function initPWAUpdates() {
        if (!('serviceWorker' in navigator)) return;

        var refreshing = false;
        var updateAvailable = false;
        var updateToast = null;

        navigator.serviceWorker.ready.then(function(registration) {
            registration.addEventListener('updatefound', function() {
                var newWorker = registration.installing;
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
            var data = event.data;
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
            if (typeof showToast === 'function') {
                showToast('🔄', 'Приложение обновлено! Страница будет перезагружена.', 'success');
            }
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
                if (typeof showToast === 'function') {
                    showToast('🔄', 'Обновление...', 'success');
                }
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
            if (typeof showToast === 'function') {
                showToast('✅', 'Приложение установлено на ваш телефон!', 'success');
            }
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
                    if (typeof showToast === 'function') {
                        showToast('✅', 'Спасибо за установку!', 'success');
                    }
                }
                promptEvent = null;
            });
        });

        document.body.appendChild(btn);

        setTimeout(function() {
            if (document.body.contains(btn)) btn.remove();
        }, btnDisplayTime);
    }

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

    // ===== ЭКСПОРТ В ГЛОБАЛЬНУЮ ОБЛАСТЬ =====
    window.initPWAUpdates = initPWAUpdates;
    window.setupPWAInstall = setupPWAInstall;
    window.ensurePulseStyle = ensurePulseStyle;

    console.log('[AppPWA] Модуль загружен, версия: 1.0');

})();
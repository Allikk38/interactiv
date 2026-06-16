// ============================================================
// ЗАПУСК ПРИЛОЖЕНИЯ — ТОЧКА ВХОДА
// Версия: 1.0
// Отвечает за: инициализацию приложения, управление согласием
// ============================================================

(function() {
    'use strict';

    /**
     * Запуск приложения
     */
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
                        console.log('[App] Service Worker зарегистрирован:', registration.scope);

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
                        console.error('[App] Ошибка регистрации Service Worker:', error);
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
    window.bootApp = bootApp;

    console.log('[AppBootstrap] Модуль загружен, версия: 1.0');

})();
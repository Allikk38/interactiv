// ============================================================
// МОДУЛЬ БАННЕРА СОГЛАСИЯ
// Версия: 2.0 — Премиум-обновление
// Зависимости: Consent (основной модуль)
// Ответственность: рендер и управление видимостью баннера
// ============================================================

var ConsentBanner = (function() {
    'use strict';

    // ===== ПРИВАТНЫЕ КОНСТАНТЫ =====
    var BANNER_HTML = `
        <div id="consent-banner" class="consent-banner" style="
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, rgba(15, 15, 30, 0.95) 0%, rgba(26, 26, 62, 0.95) 50%, rgba(42, 26, 78, 0.95) 100%);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            color: #ffffff;
            padding: 24px 32px;
            z-index: 9999;
            border-top: 2px solid rgba(91, 91, 255, 0.3);
            display: none;
            flex-direction: column;
            align-items: center;
            gap: 16px;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            box-shadow: 0 -8px 48px rgba(0, 0, 0, 0.5);
            max-height: 90vh;
            overflow-y: auto;
            transform: translateY(100%);
            transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.5s ease;
            opacity: 0;
        ">
            <div style="max-width: 900px; width: 100%; text-align: center;">
                <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 10px; flex-wrap: wrap;">
                    <span style="font-size: 1.6rem; line-height: 1;">🛡️</span>
                    <span style="font-weight: 700; font-size: 1.1rem; color: #a89bff; letter-spacing: -0.3px;">Ваша конфиденциальность</span>
                </div>
                <p style="margin: 0; font-size: 0.9rem; line-height: 1.6; color: rgba(255, 255, 255, 0.7); max-width: 700px; margin: 0 auto;">
                    Мы используем cookies и собираем технические данные
                    (имя, IP-адрес, прогресс обучения) для работы тренажёра.
                    <br>
                    <a href="./privacy.html" target="_blank" style="color: #a89bff; text-decoration: underline; font-weight: 500; transition: color 0.2s ease;">
                        Подробнее в Политике конфиденциальности
                    </a>
                </p>
            </div>
            <div style="display: flex; gap: 12px; flex-wrap: wrap; justify-content: center;">
                <button id="consent-accept" class="consent-btn consent-btn--primary" style="
                    min-width: 140px;
                    padding: 12px 28px;
                    background: linear-gradient(135deg, #5B5BFF, #7B5BFF);
                    border: none;
                    border-radius: 40px;
                    color: #fff;
                    font-weight: 600;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                    box-shadow: 0 4px 20px rgba(91, 91, 255, 0.3);
                    letter-spacing: -0.2px;
                ">
                    <i class="fas fa-check" style="margin-right: 8px;"></i> Принимаю
                </button>
                <button id="consent-decline" class="consent-btn consent-btn--secondary" style="
                    min-width: 140px;
                    padding: 12px 28px;
                    background: rgba(255, 255, 255, 0.06);
                    border: 1px solid rgba(255, 255, 255, 0.12);
                    border-radius: 40px;
                    color: rgba(255, 255, 255, 0.7);
                    font-weight: 500;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                    letter-spacing: -0.2px;
                ">
                    <i class="fas fa-times" style="margin-right: 8px;"></i> Отказаться
                </button>
            </div>
            <div style="font-size: 0.7rem; color: rgba(255, 255, 255, 0.3); text-align: center; max-width: 600px; letter-spacing: 0.3px;">
                Вы можете отозвать согласие в любой момент, очистив данные сайта в настройках браузера
            </div>
        </div>
    `;

    // ===== ДОПОЛНИТЕЛЬНЫЕ СТИЛИ ДЛЯ БАННЕРА =====
    var BANNER_STYLES = `
        <style id="consent-banner-styles">
            .consent-banner {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }

            .consent-banner.visible {
                transform: translateY(0);
                opacity: 1;
            }

            .consent-btn {
                position: relative;
                overflow: hidden;
                transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                will-change: transform, box-shadow;
            }

            .consent-btn--primary:hover {
                transform: translateY(-2px) scale(1.02);
                box-shadow: 0 8px 32px rgba(91, 91, 255, 0.4);
            }

            .consent-btn--primary:active {
                transform: scale(0.97);
                transition: transform 0.1s ease;
            }

            .consent-btn--secondary:hover {
                background: rgba(255, 255, 255, 0.12);
                border-color: rgba(255, 255, 255, 0.2);
                color: #ffffff;
                transform: translateY(-2px);
            }

            .consent-btn--secondary:active {
                transform: scale(0.97);
                transition: transform 0.1s ease;
            }

            .consent-btn--loading {
                pointer-events: none;
                opacity: 0.7;
            }

            .consent-btn--loading::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 20px;
                height: 20px;
                margin-top: -10px;
                margin-left: -10px;
                border: 2px solid rgba(255, 255, 255, 0.2);
                border-top-color: #ffffff;
                border-radius: 50%;
                animation: consentSpinner 0.8s linear infinite;
            }

            @keyframes consentSpinner {
                to { transform: rotate(360deg); }
            }

            @media (max-width: 768px) {
                .consent-banner {
                    padding: 20px 20px 24px !important;
                }

                .consent-banner p {
                    font-size: 0.8rem !important;
                }

                .consent-btn {
                    min-width: 120px !important;
                    padding: 10px 20px !important;
                    font-size: 0.8rem !important;
                }

                .consent-banner [style*="flex-wrap"] {
                    flex-direction: column !important;
                    width: 100% !important;
                }

                .consent-btn {
                    width: 100% !important;
                    justify-content: center !important;
                }
            }

            @media (max-width: 480px) {
                .consent-banner {
                    padding: 16px 16px 20px !important;
                }

                .consent-banner p {
                    font-size: 0.75rem !important;
                }

                .consent-btn {
                    font-size: 0.75rem !important;
                    padding: 8px 16px !important;
                    min-width: 100px !important;
                }

                .consent-banner [style*="font-size: 1.6rem"] {
                    font-size: 1.3rem !important;
                }

                .consent-banner [style*="font-size: 1.1rem"] {
                    font-size: 0.95rem !important;
                }
            }

            @media (prefers-reduced-motion: reduce) {
                .consent-banner {
                    transition: none !important;
                }

                .consent-btn {
                    transition: none !important;
                }

                .consent-btn:hover {
                    transform: none !important;
                }

                @keyframes consentSpinner {
                    to { transform: rotate(0deg); }
                }
            }
        </style>
    `;

    // ===== ПРИВАТНОЕ СОСТОЯНИЕ =====
    var _isRendered = false;
    var _callbacks = {
        onAccept: null,
        onDecline: null
    };
    var _isShown = false;
    var _isProcessing = false;
    var _isInitialized = false;
    var _isVisible = false;

    // ===== ПРИВАТНЫЕ МЕТОДЫ =====

    /**
     * Вставить баннер в DOM, если его нет
     */
    function _renderBanner() {
        if (_isRendered) return;
        if (document.getElementById('consent-banner')) {
            _isRendered = true;
            return;
        }

        // Вставляем стили
        if (!document.getElementById('consent-banner-styles')) {
            document.head.insertAdjacentHTML('beforeend', BANNER_STYLES);
        }

        // Вставляем баннер в конец body
        document.body.insertAdjacentHTML('beforeend', BANNER_HTML);
        _isRendered = true;
        console.log('[ConsentBanner] Баннер вставлен в DOM');
    }

    /**
     * Показать баннер с анимацией
     */
    function _show() {
        // Проверяем, есть ли уже согласие
        if (window.Consent && window.Consent.hasConsent()) {
            console.log('[ConsentBanner] Согласие уже есть, баннер не показываем');
            _hide();
            return;
        }

        var banner = document.getElementById('consent-banner');
        if (!banner) {
            _renderBanner();
            banner = document.getElementById('consent-banner');
            if (!banner) return;
        }

        // Принудительно делаем баннер видимым перед анимацией
        banner.style.display = 'flex';
        banner.style.position = 'fixed';
        banner.style.bottom = '0';
        banner.style.left = '0';
        banner.style.right = '0';
        banner.style.zIndex = '9999';

        // Запускаем анимацию появления
        requestAnimationFrame(function() {
            banner.classList.add('visible');
            _isVisible = true;
        });

        _isShown = true;
        console.log('[ConsentBanner] Баннер показан с анимацией');
    }

    /**
     * Скрыть баннер с анимацией
     */
    function _hide() {
        var banner = document.getElementById('consent-banner');
        if (!banner) return;

        banner.classList.remove('visible');

        // Скрываем после завершения анимации
        setTimeout(function() {
            if (banner) {
                banner.style.display = 'none';
            }
        }, 500);

        _isShown = false;
        _isVisible = false;
        console.log('[ConsentBanner] Баннер скрыт');
    }

    /**
     * Навесить обработчики на кнопки
     */
    function _bindEvents() {
        var acceptBtn = document.getElementById('consent-accept');
        var declineBtn = document.getElementById('consent-decline');

        if (acceptBtn) {
            var newAccept = acceptBtn.cloneNode(true);
            acceptBtn.parentNode.replaceChild(newAccept, acceptBtn);
            newAccept.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('[ConsentBanner] Нажата кнопка "Принимаю"');

                if (_isProcessing) return;
                _isProcessing = true;

                // Показываем состояние загрузки
                this.classList.add('consent-btn--loading');
                this.innerHTML = 'Обработка...';

                // Скрываем баннер
                _hide();

                if (typeof _callbacks.onAccept === 'function') {
                    _callbacks.onAccept();
                }

                setTimeout(function() {
                    _isProcessing = false;
                }, 1000);
            });
        }

        if (declineBtn) {
            var newDecline = declineBtn.cloneNode(true);
            declineBtn.parentNode.replaceChild(newDecline, declineBtn);
            newDecline.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('[ConsentBanner] Нажата кнопка "Отказаться"');

                if (_isProcessing) return;
                _isProcessing = true;

                // Показываем состояние загрузки
                this.classList.add('consent-btn--loading');
                this.innerHTML = 'Обработка...';

                // Скрываем баннер
                _hide();

                if (typeof _callbacks.onDecline === 'function') {
                    _callbacks.onDecline();
                }

                setTimeout(function() {
                    _isProcessing = false;
                }, 1000);
            });
        }
    }

    // ===== ПУБЛИЧНЫЙ API =====

    return {

        /**
         * Инициализировать баннер
         * @param {Function} onAccept - колбэк при нажатии "Принимаю"
         * @param {Function} onDecline - колбэк при нажатии "Отказаться"
         */
        init: function(onAccept, onDecline) {
            if (_isInitialized) {
                console.log('[ConsentBanner] Уже инициализирован');
                return;
            }
            _isInitialized = true;

            _callbacks.onAccept = onAccept || null;
            _callbacks.onDecline = onDecline || null;

            _renderBanner();

            if (window.Consent && window.Consent.hasConsent()) {
                _hide();
                if (typeof _callbacks.onAccept === 'function') {
                    _callbacks.onAccept();
                }
                return;
            }

            _show();
            _bindEvents();
        },

        /**
         * Показать баннер принудительно
         */
        show: function() {
            if (window.Consent && window.Consent.hasConsent()) {
                _hide();
                return;
            }
            _show();
            _bindEvents();
        },

        /**
         * Скрыть баннер принудительно
         */
        hide: function() {
            _hide();
        },

        /**
         * Проверить, виден ли баннер
         */
        isVisible: function() {
            return _isVisible;
        },

        /**
         * Получить состояние рендера
         */
        isRendered: function() {
            return _isRendered;
        },

        /**
         * Сбросить состояние (для тестирования)
         */
        reset: function() {
            _isInitialized = false;
            _isRendered = false;
            _isShown = false;
            _isProcessing = false;
            _isVisible = false;
        }
    };

})();

// ===== ЭКСПОРТ В ГЛОБАЛЬНУЮ ОБЛАСТЬ =====
window.ConsentBanner = ConsentBanner;

console.log('[ConsentBanner] Модуль загружен, версия 2.0');
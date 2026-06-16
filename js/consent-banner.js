// ============================================================
// МОДУЛЬ БАННЕРА СОГЛАСИЯ
// Версия: 1.5 — ИСПРАВЛЕН ПОКАЗ НА ЛЕНДИНГЕ
// Зависимости: Consent (основной модуль)
// Ответственность: рендер и управление видимостью баннера
// ============================================================

var ConsentBanner = (function() {
    'use strict';

    // ===== ПРИВАТНЫЕ КОНСТАНТЫ =====
    var BANNER_HTML = `
        <div id="consent-banner" style="
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: #ffffff;
            padding: 20px 24px;
            z-index: 9999;
            border-top: 3px solid #f39c12;
            display: none;
            flex-direction: column;
            align-items: center;
            gap: 16px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            box-shadow: 0 -8px 32px rgba(0,0,0,0.4);
            max-height: 90vh;
            overflow-y: auto;
        ">
            <div style="max-width: 900px; width: 100%; text-align: center;">
                <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 8px; flex-wrap: wrap;">
                    <span style="font-size: 1.5rem;">🛡️</span>
                    <span style="font-weight: 700; font-size: 1.1rem; color: #f39c12;">Ваша конфиденциальность</span>
                </div>
                <p style="margin: 0; font-size: 0.9rem; line-height: 1.5; color: rgba(255,255,255,0.85); max-width: 700px; margin: 0 auto;">
                    Мы используем cookies и собираем технические данные
                    (имя, IP-адрес, прогресс обучения) для работы тренажёра.
                    <br>
                    <a href="./privacy.html" target="_blank" style="color: #f39c12; text-decoration: underline; font-weight: 500;">
                        Подробнее в Политике конфиденциальности
                    </a>
                </p>
            </div>
            <div style="display: flex; gap: 12px; flex-wrap: wrap; justify-content: center;">
                <button id="consent-accept" class="btn btn--primary" style="
                    min-width: 140px;
                    padding: 12px 24px;
                    background: linear-gradient(135deg, #f39c12, #e67e22);
                    border: none;
                    border-radius: 32px;
                    color: #fff;
                    font-weight: 700;
                    font-size: 0.95rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                ">
                    <i class="fas fa-check"></i> Принимаю
                </button>
                <button id="consent-decline" class="btn btn--secondary" style="
                    min-width: 140px;
                    padding: 12px 24px;
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.25);
                    border-radius: 32px;
                    color: #fff;
                    font-weight: 600;
                    font-size: 0.95rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                ">
                    <i class="fas fa-times"></i> Отказаться
                </button>
            </div>
            <div style="font-size: 0.7rem; color: rgba(255,255,255,0.4); text-align: center; max-width: 600px;">
                Вы можете отозвать согласие в любой момент, очистив данные сайта в настройках браузера
            </div>
        </div>
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

        // Вставляем баннер в конец body (перед закрывающим тегом)
        document.body.insertAdjacentHTML('beforeend', BANNER_HTML);
        _isRendered = true;
        console.log('[ConsentBanner] Баннер вставлен в DOM');
    }

    /**
     * Показать баннер
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
        
        // Убеждаемся, что баннер прижат к низу экрана
        banner.style.position = 'fixed';
        banner.style.bottom = '0';
        banner.style.left = '0';
        banner.style.right = '0';
        banner.style.display = 'flex';
        banner.style.zIndex = '9999';
        
        _isShown = true;
        console.log('[ConsentBanner] Баннер показан');
    }

    /**
     * Скрыть баннер
     */
    function _hide() {
        var banner = document.getElementById('consent-banner');
        if (!banner) return;
        banner.style.display = 'none';
        _isShown = false;
        console.log('[ConsentBanner] Баннер скрыт');
    }

    /**
     * Навесить обработчики на кнопки
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
                console.log('[ConsentBanner] Нажата кнопка "Принимаю"');
                
                // Предотвращаем повторные клики
                if (_isProcessing) return;
                _isProcessing = true;
                
                // Сразу скрываем баннер
                _hide();
                
                if (typeof _callbacks.onAccept === 'function') {
                    _callbacks.onAccept();
                }
                
                // Сбрасываем флаг через секунду
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
                
                // Предотвращаем повторные клики
                if (_isProcessing) return;
                _isProcessing = true;
                
                // Сразу скрываем баннер
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
            // Предотвращаем повторную инициализацию
            if (_isInitialized) {
                console.log('[ConsentBanner] Уже инициализирован');
                return;
            }
            _isInitialized = true;

            // Сохраняем колбэки
            _callbacks.onAccept = onAccept || null;
            _callbacks.onDecline = onDecline || null;

            // Рендерим баннер в DOM
            _renderBanner();

            // Проверяем, есть ли уже согласие
            if (window.Consent && window.Consent.hasConsent()) {
                _hide();
                if (typeof _callbacks.onAccept === 'function') {
                    _callbacks.onAccept();
                }
                return;
            }

            // Показываем баннер
            _show();

            // Навешиваем обработчики
            _bindEvents();
        },

        /**
         * Показать баннер принудительно
         */
        show: function() {
            // Проверяем, есть ли уже согласие
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
            return _isShown;
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
        }
    };

})();

// ===== ЭКСПОРТ В ГЛОБАЛЬНУЮ ОБЛАСТЬ =====
window.ConsentBanner = ConsentBanner;

console.log('[ConsentBanner] Модуль загружен, версия 1.5');
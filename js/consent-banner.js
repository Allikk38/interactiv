// ============================================================
// МОДУЛЬ БАННЕРА СОГЛАСИЯ
// Версия: 1.0
// Зависимости: Consent (основной модуль)
// Ответственность: только рендер и управление видимостью баннера
// ============================================================

const ConsentBanner = (function() {
    'use strict';

    // ===== ПРИВАТНЫЕ КОНСТАНТЫ =====
    const BANNER_HTML = `
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
    let _isRendered = false;

    // ===== ПРИВАТНЫЕ МЕТОДЫ =====

    /**
     * Вставить баннер в DOM, если его нет
     */
    function _renderBanner() {
        if (_isRendered) return;
        if (document.getElementById('consent-banner')) return;

        // Вставляем баннер в начало body
        document.body.insertAdjacentHTML('afterbegin', BANNER_HTML);
        _isRendered = true;
        console.log('[ConsentBanner] Баннер вставлен в DOM');
    }

    /**
     * Показать баннер
     */
    function _show() {
        const banner = document.getElementById('consent-banner');
        if (!banner) {
            _renderBanner();
            // Повторно ищем после рендера
            const newBanner = document.getElementById('consent-banner');
            if (newBanner) newBanner.style.display = 'flex';
            return;
        }
        banner.style.display = 'flex';
    }

    /**
     * Скрыть баннер
     */
    function _hide() {
        const banner = document.getElementById('consent-banner');
        if (!banner) return;
        banner.style.display = 'none';
    }

    /**
     * Навесить обработчики на кнопки
     */
    function _bindEvents(onAccept, onDecline) {
        const acceptBtn = document.getElementById('consent-accept');
        const declineBtn = document.getElementById('consent-decline');

        if (acceptBtn) {
            // Удаляем старые обработчики через замену
            const newAccept = acceptBtn.cloneNode(true);
            acceptBtn.parentNode.replaceChild(newAccept, acceptBtn);
            newAccept.addEventListener('click', function(e) {
                e.preventDefault();
                if (typeof onAccept === 'function') onAccept();
            });
        }

        if (declineBtn) {
            const newDecline = declineBtn.cloneNode(true);
            declineBtn.parentNode.replaceChild(newDecline, declineBtn);
            newDecline.addEventListener('click', function(e) {
                e.preventDefault();
                if (typeof onDecline === 'function') onDecline();
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
            // Рендерим баннер в DOM
            _renderBanner();

            // Проверяем, есть ли уже согласие
            if (window.Consent && window.Consent.hasConsent()) {
                _hide();
                if (typeof onAccept === 'function') onAccept();
                return;
            }

            // Показываем баннер
            _show();

            // Навешиваем обработчики
            _bindEvents(
                function() {
                    _hide();
                    if (window.Consent) {
                        window.Consent.giveConsent();
                    }
                    if (typeof onAccept === 'function') onAccept();
                },
                function() {
                    _hide();
                    if (typeof onDecline === 'function') onDecline();
                }
            );
        },

        /**
         * Показать баннер принудительно (например, после отзыва согласия)
         */
        show: function() {
            _show();
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
            const banner = document.getElementById('consent-banner');
            return banner && banner.style.display === 'flex';
        }
    };

})();

// ===== ЭКСПОРТ В ГЛОБАЛЬНУЮ ОБЛАСТЬ =====
window.ConsentBanner = ConsentBanner;

console.log('[ConsentBanner] Модуль загружен');
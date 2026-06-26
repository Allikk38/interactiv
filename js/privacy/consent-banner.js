// ============================================================
// МОДУЛЬ БАННЕРА СОГЛАСИЯ (ИСПРАВЛЕННЫЙ)
// Версия: 2.4.0
// 
// ИСПРАВЛЕНИЯ:
// - Добавлено сохранение согласия в localStorage через PrivacyManager
// - Добавлена проверка hasConsent() перед показом
// - Исправлена последовательность: сначала сохранение, потом отправка
// ============================================================

(function() {
    'use strict';

    // ===== КОНСТАНТЫ =====
    var BANNER_ID = 'consent-banner';
    var OVERLAY_ID = 'consent-overlay';
    var STORAGE_KEY = 'consent_banner_dismissed';

    // ===== СОСТОЯНИЕ =====
    var _isRendered = false;
    var _isVisible = false;
    var _isProcessing = false;
    var _callbacks = {
        onAccept: null,
        onDecline: null,
        onSettings: null
    };
    var _bannerElement = null;
    var _overlayElement = null;

    // ===== HTML ШАБЛОН БАННЕРА =====
    function getBannerHTML() {
        return `
            <div id="${BANNER_ID}" class="consent-banner" role="dialog" aria-modal="true" aria-label="Настройки конфиденциальности">
                <div class="consent-banner__inner">
                    <div class="consent-banner__header">
                        <div class="consent-banner__icon">🛡️</div>
                        <div class="consent-banner__title">Ваша конфиденциальность</div>
                    </div>
                    
                    <div class="consent-banner__body">
                        <p class="consent-banner__text">
                            Мы используем cookies и собираем технические данные для работы тренажёра.
                            Вы можете настроить, какие данные мы можем собирать.
                        </p>
                        
                        <div class="consent-banner__categories">
                            <div class="consent-category consent-category--necessary">
                                <div class="consent-category__header">
                                    <span class="consent-category__icon">🔒</span>
                                    <span class="consent-category__name">Необходимые</span>
                                    <span class="consent-category__status">Всегда активны</span>
                                </div>
                                <div class="consent-category__desc">
                                    Обеспечивают работу тренажёра: сохранение прогресса, имя пользователя.
                                </div>
                            </div>
                            
                            <div class="consent-category">
                                <div class="consent-category__header">
                                    <span class="consent-category__icon">📊</span>
                                    <span class="consent-category__name">Аналитика</span>
                                    <label class="consent-toggle">
                                        <input type="checkbox" id="consent-analytics" checked>
                                        <span class="consent-toggle__slider"></span>
                                    </label>
                                </div>
                                <div class="consent-category__desc">
                                    Помогает нам улучшать тренажёр: статистика использования, ошибки, время прохождения.
                                </div>
                            </div>
                            
                            <div class="consent-category">
                                <div class="consent-category__header">
                                    <span class="consent-category__icon">🎯</span>
                                    <span class="consent-category__name">Маркетинг</span>
                                    <label class="consent-toggle">
                                        <input type="checkbox" id="consent-marketing" checked>
                                        <span class="consent-toggle__slider"></span>
                                    </label>
                                </div>
                                <div class="consent-category__desc">
                                    Персонализация рекомендаций и улучшение качества контента.
                                </div>
                            </div>
                        </div>
                        
                        <div class="consent-banner__links">
                            <a href="./privacy.html" target="_blank" class="consent-banner__link">
                                <i class="fas fa-shield-alt"></i> Политика конфиденциальности
                            </a>
                        </div>
                    </div>
                    
                    <div class="consent-banner__footer">
                        <button class="consent-banner__btn consent-banner__btn--settings" id="consent-settings-btn">
                            <i class="fas fa-cog"></i> Настроить
                        </button>
                        <button class="consent-banner__btn consent-banner__btn--decline" id="consent-decline-btn">
                            Отказаться
                        </button>
                        <button class="consent-banner__btn consent-banner__btn--accept" id="consent-accept-btn">
                            <i class="fas fa-check"></i> Принимаю всё
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // ===== СТИЛИ ДЛЯ БАННЕРА =====
    function injectBannerStyles() {
        if (document.getElementById('consent-banner-styles')) return;

        var styles = document.createElement('style');
        styles.id = 'consent-banner-styles';
        styles.textContent = `
            /* ===== ОВЕРЛЕЙ ===== */
            #${OVERLAY_ID} {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(4px);
                -webkit-backdrop-filter: blur(4px);
                z-index: 9998;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.3s ease, visibility 0.3s ease;
            }
            
            #${OVERLAY_ID}.consent-overlay--visible {
                opacity: 1;
                visibility: visible;
            }

            /* ===== БАННЕР ===== */
            .consent-banner {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                z-index: 9999;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                color: #ffffff;
                box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.4);
                border-top: 3px solid #f39c12;
                transform: translateY(100%);
                transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                max-height: 90vh;
                overflow-y: auto;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }
            
            .consent-banner--visible {
                transform: translateY(0);
            }
            
            .consent-banner__inner {
                max-width: 900px;
                margin: 0 auto;
                padding: 24px 32px 32px;
            }
            
            /* ===== HEADER ===== */
            .consent-banner__header {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 16px;
            }
            
            .consent-banner__icon {
                font-size: 1.8rem;
            }
            
            .consent-banner__title {
                font-size: 1.2rem;
                font-weight: 700;
                color: #f39c12;
            }
            
            /* ===== BODY ===== */
            .consent-banner__body {
                margin-bottom: 20px;
            }
            
            .consent-banner__text {
                font-size: 0.95rem;
                line-height: 1.6;
                color: rgba(255, 255, 255, 0.85);
                margin-bottom: 16px;
            }
            
            /* ===== КАТЕГОРИИ ===== */
            .consent-banner__categories {
                display: flex;
                flex-direction: column;
                gap: 12px;
                margin: 16px 0;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 12px;
                padding: 16px;
            }
            
            .consent-category {
                display: flex;
                flex-direction: column;
                gap: 4px;
                padding: 8px 0;
                border-bottom: 1px solid rgba(255, 255, 255, 0.06);
            }
            
            .consent-category:last-child {
                border-bottom: none;
            }
            
            .consent-category__header {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .consent-category__icon {
                font-size: 1.1rem;
            }
            
            .consent-category__name {
                font-size: 0.9rem;
                font-weight: 600;
                flex: 1;
            }
            
            .consent-category__status {
                font-size: 0.7rem;
                color: rgba(255, 255, 255, 0.4);
                background: rgba(255, 255, 255, 0.08);
                padding: 2px 10px;
                border-radius: 12px;
            }
            
            .consent-category__desc {
                font-size: 0.8rem;
                color: rgba(255, 255, 255, 0.5);
                padding-left: 34px;
                line-height: 1.4;
            }
            
            /* ===== TOGGLE ===== */
            .consent-toggle {
                position: relative;
                display: inline-block;
                width: 44px;
                height: 24px;
                flex-shrink: 0;
            }
            
            .consent-toggle input {
                opacity: 0;
                width: 0;
                height: 0;
            }
            
            .consent-toggle__slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 24px;
                transition: background 0.3s ease;
            }
            
            .consent-toggle__slider::before {
                content: '';
                position: absolute;
                height: 18px;
                width: 18px;
                left: 3px;
                bottom: 3px;
                background: #fff;
                border-radius: 50%;
                transition: transform 0.3s ease;
            }
            
            .consent-toggle input:checked + .consent-toggle__slider {
                background: #f39c12;
            }
            
            .consent-toggle input:checked + .consent-toggle__slider::before {
                transform: translateX(20px);
            }
            
            .consent-category--necessary .consent-toggle {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .consent-category--necessary .consent-toggle input {
                pointer-events: none;
            }
            
            /* ===== LINKS ===== */
            .consent-banner__links {
                display: flex;
                gap: 16px;
                flex-wrap: wrap;
                margin-top: 8px;
            }
            
            .consent-banner__link {
                color: #f39c12;
                text-decoration: none;
                font-size: 0.85rem;
                display: inline-flex;
                align-items: center;
                gap: 6px;
                transition: color 0.2s ease;
            }
            
            .consent-banner__link:hover {
                color: #f1c40f;
                text-decoration: underline;
            }
            
            /* ===== FOOTER ===== */
            .consent-banner__footer {
                display: flex;
                gap: 12px;
                flex-wrap: wrap;
                justify-content: center;
                margin-top: 8px;
            }
            
            .consent-banner__btn {
                padding: 12px 24px;
                min-height: 44px;
                border: none;
                border-radius: 32px;
                font-size: 0.95rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                display: inline-flex;
                align-items: center;
                gap: 8px;
                min-width: 120px;
                justify-content: center;
            }
            
            .consent-banner__btn:active {
                transform: scale(0.96);
            }
            
            .consent-banner__btn--accept {
                background: linear-gradient(135deg, #f39c12, #e67e22);
                color: #fff;
                box-shadow: 0 4px 16px rgba(243, 156, 18, 0.3);
            }
            
            .consent-banner__btn--accept:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 24px rgba(243, 156, 18, 0.4);
            }
            
            .consent-banner__btn--decline {
                background: rgba(255, 255, 255, 0.08);
                color: rgba(255, 255, 255, 0.8);
                border: 1px solid rgba(255, 255, 255, 0.15);
            }
            
            .consent-banner__btn--decline:hover {
                background: rgba(255, 255, 255, 0.15);
            }
            
            .consent-banner__btn--settings {
                background: transparent;
                color: rgba(255, 255, 255, 0.6);
                border: 1px solid rgba(255, 255, 255, 0.08);
                min-width: auto;
            }
            
            .consent-banner__btn--settings:hover {
                background: rgba(255, 255, 255, 0.05);
                color: rgba(255, 255, 255, 0.8);
            }
            
            /* ===== АДАПТИВ ===== */
            @media (max-width: 768px) {
                .consent-banner__inner {
                    padding: 20px 16px 24px;
                }
                
                .consent-banner__title {
                    font-size: 1rem;
                }
                
                .consent-banner__text {
                    font-size: 0.85rem;
                }
                
                .consent-banner__categories {
                    padding: 12px;
                }
                
                .consent-category__desc {
                    font-size: 0.75rem;
                    padding-left: 28px;
                }
                
                .consent-banner__footer {
                    flex-direction: column-reverse;
                    gap: 8px;
                }
                
                .consent-banner__btn {
                    width: 100%;
                    padding: 10px 16px;
                    font-size: 0.9rem;
                    min-height: 44px;
                }
                
                .consent-banner__btn--settings {
                    order: 10;
                }
            }
            
            @media (max-width: 480px) {
                .consent-banner__inner {
                    padding: 16px 12px 20px;
                }
                
                .consent-category__header {
                    flex-wrap: wrap;
                }
            }
            
            /* Отключаем анимации для пользователей с vestibular disorders */
            @media (prefers-reduced-motion: reduce) {
                .consent-banner {
                    transform: translateY(0);
                    transition: none;
                }
                
                .consent-toggle__slider {
                    transition: none;
                }
                
                .consent-toggle__slider::before {
                    transition: none;
                }
            }
        `;
        document.head.appendChild(styles);
    }

    // ===== ПРИВАТНЫЕ МЕТОДЫ =====

    /**
     * Создаёт оверлей для баннера
     */
    function _createOverlay() {
        if (_overlayElement) return;

        _overlayElement = document.createElement('div');
        _overlayElement.id = OVERLAY_ID;
        
        if (document.documentElement) {
            document.documentElement.appendChild(_overlayElement);
        } else {
            document.body.appendChild(_overlayElement);
        }
    }

    /**
     * Создаёт баннер в DOM
     */
    function _createBanner() {
        if (_bannerElement) return;

        injectBannerStyles();
        _createOverlay();

        var tempDiv = document.createElement('div');
        tempDiv.innerHTML = getBannerHTML();
        _bannerElement = tempDiv.firstElementChild;
        
        if (document.documentElement) {
            document.documentElement.appendChild(_bannerElement);
        } else {
            document.body.appendChild(_bannerElement);
        }

        _isRendered = true;
        console.log('[ConsentBanner] Баннер создан в DOM');
    }

    /**
     * Показывает баннер с анимацией
     */
    function _showBanner() {
        // ===== ПРОВЕРКА: если согласие уже есть — не показываем =====
        if (window.PrivacyManager && window.PrivacyManager.hasConsent()) {
            console.log('[ConsentBanner] Согласие уже есть, баннер не показываем');
            return;
        }

        if (!_bannerElement) {
            _createBanner();
        }

        if (_overlayElement) {
            _overlayElement.classList.add('consent-overlay--visible');
        }

        _bannerElement.classList.add('consent-banner--visible');
        _isVisible = true;

        _bannerElement.focus();
        document.body.style.overflow = 'hidden';

        console.log('[ConsentBanner] Баннер показан');
    }

    /**
     * Скрывает баннер с анимацией
     */
    function _hideBanner() {
        if (!_bannerElement) return;

        _bannerElement.classList.remove('consent-banner--visible');
        _isVisible = false;

        if (_overlayElement) {
            setTimeout(function() {
                _overlayElement.classList.remove('consent-overlay--visible');
            }, 300);
        }

        document.body.style.overflow = '';

        console.log('[ConsentBanner] Баннер скрыт');
    }

    /**
     * Навешивает обработчики событий на кнопки
     */
    function _bindEvents() {
        if (!_bannerElement) return;

        var acceptBtn = _bannerElement.querySelector('#consent-accept-btn');
        if (acceptBtn) {
            acceptBtn.addEventListener('click', function(e) {
                e.preventDefault();
                _handleAccept();
            });
        }

        var declineBtn = _bannerElement.querySelector('#consent-decline-btn');
        if (declineBtn) {
            declineBtn.addEventListener('click', function(e) {
                e.preventDefault();
                _handleDecline();
            });
        }

        var settingsBtn = _bannerElement.querySelector('#consent-settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', function(e) {
                e.preventDefault();
                _toggleCategories();
            });
        }

        if (_overlayElement) {
            _overlayElement.addEventListener('click', function(e) {
                if (e.target === _overlayElement) {
                }
            });
        }

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && _isVisible) {
            }
        });

        var toggles = _bannerElement.querySelectorAll('.consent-toggle input');
        toggles.forEach(function(toggle) {
            toggle.addEventListener('change', function() {
                console.log('[ConsentBanner] Изменён toggle:', toggle.id, toggle.checked);
            });
        });
    }

    /**
     * Переключает отображение категорий
     */
    function _toggleCategories() {
        var categories = _bannerElement.querySelector('.consent-banner__categories');
        if (!categories) return;

        var isHidden = categories.style.display === 'none';
        categories.style.display = isHidden ? 'flex' : 'none';

        var settingsBtn = _bannerElement.querySelector('#consent-settings-btn');
        if (settingsBtn) {
            settingsBtn.innerHTML = isHidden ?
                '<i class="fas fa-check"></i> Готово' :
                '<i class="fas fa-cog"></i> Настроить';
        }
    }

    /**
     * Получает текущие настройки категорий из toggle-ов
     */
    function _getCategorySettings() {
        var settings = {
            functional: true,
            analytics: true,
            marketing: true
        };

        if (!_bannerElement) return settings;

        var analyticsToggle = _bannerElement.querySelector('#consent-analytics');
        var marketingToggle = _bannerElement.querySelector('#consent-marketing');

        if (analyticsToggle) {
            settings.analytics = analyticsToggle.checked;
        }
        if (marketingToggle) {
            settings.marketing = marketingToggle.checked;
        }

        return settings;
    }

    /**
     * Обработчик кнопки "Принимаю всё"
     * 
     * ПОРЯДОК ДЕЙСТВИЙ:
     * 1. Сохраняем согласие в localStorage (PrivacyManager)
     * 2. Отправляем на бэкенд (Consent.giveConsent)
     * 3. Скрываем баннер
     * 4. Вызываем колбэк
     */
    function _handleAccept() {
        if (_isProcessing) return;
        _isProcessing = true;

        var acceptBtn = _bannerElement.querySelector('#consent-accept-btn');
        if (acceptBtn) {
            acceptBtn.disabled = true;
            acceptBtn.innerHTML = '⏳ Сохранение...';
        }

        console.log('[ConsentBanner] _handleAccept: начало');

        var categories = _getCategorySettings();

        // ===== ШАГ 1: СОХРАНЯЕМ В localStorage через PrivacyManager =====
        if (window.PrivacyManager) {
            console.log('[ConsentBanner] Сохранение согласия через PrivacyManager');
            window.PrivacyManager.giveConsent(categories);
        } else {
            console.warn('[ConsentBanner] PrivacyManager не найден, сохраняем напрямую');
            try {
                localStorage.setItem('user_consent_given', 'true');
                localStorage.setItem('consent_timestamp', new Date().toISOString());
                localStorage.setItem('user_consent_categories', JSON.stringify(categories));
            } catch (_) {}
        }

        // ===== ШАГ 2: ОТПРАВЛЯЕМ НА БЭКЕНД =====
        if (window.Consent && typeof window.Consent.giveConsent === 'function') {
            console.log('[ConsentBanner] Отправка на бэкенд через Consent.giveConsent()');
            
            window.Consent.giveConsent()
                .then(function(result) {
                    console.log('[ConsentBanner] Consent.giveConsent завершён:', result);
                    
                    // ШАГ 3: Скрываем баннер
                    _hideBanner();
                    
                    // ШАГ 4: Вызываем колбэк
                    if (typeof _callbacks.onAccept === 'function') {
                        _callbacks.onAccept(categories);
                    }
                    
                    _isProcessing = false;
                    
                    if (acceptBtn) {
                        acceptBtn.disabled = false;
                        acceptBtn.innerHTML = '<i class="fas fa-check"></i> Принимаю всё';
                    }
                })
                .catch(function(err) {
                    console.error('[ConsentBanner] Ошибка в Consent.giveConsent():', err);
                    
                    // Даже при ошибке отправки — согласие уже сохранено локально
                    _hideBanner();
                    
                    if (typeof _callbacks.onAccept === 'function') {
                        _callbacks.onAccept(categories);
                    }
                    
                    _isProcessing = false;
                    
                    if (acceptBtn) {
                        acceptBtn.disabled = false;
                        acceptBtn.innerHTML = '<i class="fas fa-check"></i> Принимаю всё';
                    }
                });
        } else {
            // Fallback: если Consent не загружен
            console.warn('[ConsentBanner] window.Consent не найден, отправка пропущена');
            
            _hideBanner();

            if (typeof _callbacks.onAccept === 'function') {
                _callbacks.onAccept(categories);
            }

            _isProcessing = false;
            
            if (acceptBtn) {
                acceptBtn.disabled = false;
                acceptBtn.innerHTML = '<i class="fas fa-check"></i> Принимаю всё';
            }
        }
    }

    /**
     * Обработчик кнопки "Отказаться"
     */
    function _handleDecline() {
        if (_isProcessing) return;
        _isProcessing = true;

        console.log('[ConsentBanner] Отказ от согласия');

        if (window.PrivacyManager) {
            window.PrivacyManager.revokeConsent(null);
        } else {
            try {
                localStorage.removeItem('user_consent_given');
                localStorage.removeItem('consent_timestamp');
                localStorage.removeItem('user_consent_categories');
            } catch (_) {}
        }

        _hideBanner();

        if (typeof _callbacks.onDecline === 'function') {
            _callbacks.onDecline();
        }

        _isProcessing = false;
        console.log('[ConsentBanner] Отказ от согласия');
    }

    // ===== ПУБЛИЧНЫЙ API =====

    var ConsentBanner = {

        /**
         * Инициализирует баннер
         * @param {Function} onAccept - колбэк при принятии
         * @param {Function} onDecline - колбэк при отказе
         * @param {Function} onSettings - колбэк при настройке
         */
        init: function(onAccept, onDecline, onSettings) {
            _callbacks.onAccept = onAccept || null;
            _callbacks.onDecline = onDecline || null;
            _callbacks.onSettings = onSettings || null;

            _createBanner();
            _bindEvents();

            console.log('[ConsentBanner] Инициализирован');
        },

        /**
         * Показывает баннер
         * Проверяет, есть ли уже согласие
         */
        show: function() {
            // ===== ПРОВЕРКА: если согласие уже есть — не показываем =====
            if (window.PrivacyManager && window.PrivacyManager.hasConsent()) {
                console.log('[ConsentBanner] Согласие уже есть, баннер не показываем');
                return;
            }

            _showBanner();
        },

        /**
         * Скрывает баннер
         */
        hide: function() {
            _hideBanner();
        },

        /**
         * Проверяет, виден ли баннер
         * @returns {boolean}
         */
        isVisible: function() {
            return _isVisible;
        },

        /**
         * Проверяет, создан ли баннер в DOM
         * @returns {boolean}
         */
        isRendered: function() {
            return _isRendered;
        },

        /**
         * Сбрасывает состояние (для тестирования)
         */
        reset: function() {
            if (_bannerElement) {
                _bannerElement.remove();
                _bannerElement = null;
            }
            if (_overlayElement) {
                _overlayElement.remove();
                _overlayElement = null;
            }
            _isRendered = false;
            _isVisible = false;
            _isProcessing = false;
            document.body.style.overflow = '';
            console.log('[ConsentBanner] Сброшен');
        }
    };

    // ===== ЭКСПОРТ =====
    window.ConsentBanner = ConsentBanner;

    console.log('[ConsentBanner] Модуль загружен, версия: 2.4.0');

})();
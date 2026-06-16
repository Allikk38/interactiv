// ============================================================
// PREMIUM UI — УЛУЧШЕННЫЙ ИНТЕРФЕЙС
// Версия: 1.2 — ИСПРАВЛЕН ЗАПУСК СЦЕНАРИЕВ
// ============================================================

(function() {
    'use strict';

    // ===== СОСТОЯНИЕ =====
    var _isInitialized = false;
    var _isUpgrading = false;

    // ===== ИНИЦИАЛИЗАЦИЯ =====
    function initPremiumUI() {
        if (_isInitialized) return;
        console.log('[PremiumUI] Инициализация...');
        
        // Добавляем класс на body
        document.body.classList.add('premium-page');
        
        // Ждём загрузку данных и рендеринг сценариев
        waitForScenarios(function() {
            // Создаём премиум-хедер (только если ещё не создан)
            if (!document.querySelector('.premium-header')) {
                createPremiumHeader();
            }
            
            // Создаём премиум-баннер
            createPremiumBanner();
            
            // Оборачиваем сценарии в премиум-контейнер
            wrapScenariosInPremiumContainer();
            
            // Преобразуем категории в премиум-стиль
            upgradeCategories();
            
            // Преобразуем карточки сценариев в премиум-стиль
            upgradeScenarioCards();
            
            _isInitialized = true;
        });
    }

    // ===== ОЖИДАНИЕ СЦЕНАРИЕВ =====
    function waitForScenarios(callback) {
        var attempts = 0;
        var maxAttempts = 50; // 5 секунд
        
        function check() {
            attempts++;
            
            // Проверяем наличие allScenarios
            if (typeof allScenarios !== 'undefined' && allScenarios && allScenarios.length > 0) {
                callback();
                return;
            }
            
            // Проверяем наличие карточек в DOM
            var grid = document.getElementById('scenarios-grid');
            if (grid && grid.children.length > 0) {
                callback();
                return;
            }
            
            if (attempts < maxAttempts) {
                setTimeout(check, 100);
            } else {
                console.warn('[PremiumUI] Таймаут ожидания сценариев');
                callback();
            }
        }
        
        check();
    }

    // ===== СОЗДАНИЕ ПРЕМИУМ-ХЕДЕРА =====
    function createPremiumHeader() {
        var existingHeader = document.querySelector('.header');
        if (!existingHeader) return;
        
        // Сохраняем данные пользователя
        var user = User.get();
        var xpProgress = user ? User.getXPProgress() : { level: 1, currentXP: 0, percentToNext: 0 };
        var badges = user ? Badges.getAll() : [];
        
        // Создаём новый хедер
        var premiumHeader = document.createElement('header');
        premiumHeader.className = 'premium-header';
        premiumHeader.innerHTML = `
            <div class="premium-header__inner">
                <a href="./" class="premium-header__logo">
                    <div class="premium-header__logo-icon">
                        <i class="fas fa-building"></i>
                    </div>
                    <span class="premium-header__logo-text">
                        Тренажёр <span>агента</span>
                    </span>
                </a>
                
                <div class="premium-header__right">
                    ${user ? `
                        <div class="premium-xp-bar">
                            <span style="font-size:0.8rem;">⚡</span>
                            <div class="premium-xp-bar__track">
                                <div class="premium-xp-bar__fill" style="width: ${xpProgress.percentToNext}%"></div>
                            </div>
                            <span class="premium-xp-bar__text">${xpProgress.currentXP} XP</span>
                        </div>
                        
                        <div class="premium-user-card" onclick="if(confirm('Сменить пользователя?')){User.clear();location.reload();}">
                            <div class="premium-user-card__avatar">
                                ${user.name.charAt(0).toUpperCase()}
                            </div>
                            <div class="premium-user-card__info">
                                <span class="premium-user-card__name">${escapeHtml(user.name)}</span>
                                <span class="premium-user-card__level">
                                    <span class="level-dot"></span>
                                    Уровень ${xpProgress.level} · ${badges.length} бейджей
                                </span>
                            </div>
                        </div>
                    ` : `
                        <button class="premium-user-card" onclick="User.showNamePrompt(() => location.reload())">
                            <div class="premium-user-card__avatar">
                                <i class="fas fa-user" style="font-size:0.9rem;"></i>
                            </div>
                            <span style="font-weight:500;font-size:0.85rem;">Войти</span>
                        </button>
                    `}
                    
                    <a href="ratings.html" class="premium-banner__btn" style="padding:8px 20px;font-size:0.8rem;">
                        <i class="fas fa-trophy"></i> Рейтинг
                    </a>
                </div>
            </div>
        `;
        
        // Заменяем старый хедер
        existingHeader.replaceWith(premiumHeader);
        
        // Добавляем эффект скролла
        window.addEventListener('scroll', function() {
            var header = document.querySelector('.premium-header');
            if (header) {
                header.classList.toggle('scrolled', window.scrollY > 20);
            }
        });
    }

    // ===== СОЗДАНИЕ ПРЕМИУМ-БАННЕРА =====
    function createPremiumBanner() {
        var user = User.get();
        var xpProgress = user ? User.getXPProgress() : { level: 1, currentXP: 0 };
        var badges = user ? Badges.getAll() : [];
        var totalScenarios = (typeof allScenarios !== 'undefined' && allScenarios) ? allScenarios.length : 0;
        var completedScenarios = badges.length;
        
        var scenarioScreen = document.getElementById('scenario-screen');
        if (!scenarioScreen) return;
        
        // Удаляем старый дашборд и статистику
        var oldDashboard = document.getElementById('agent-dashboard');
        if (oldDashboard) oldDashboard.style.display = 'none';
        
        var oldStats = document.getElementById('quick-stats');
        if (oldStats) oldStats.style.display = 'none';
        
        if (document.querySelector('.premium-banner')) return;
        
        var banner = document.createElement('div');
        banner.className = 'premium-banner';
        banner.innerHTML = `
            <div class="premium-banner__content">
                <div class="premium-banner__row">
                    <div class="premium-banner__left">
                        <div class="premium-banner__greeting">
                            ${user ? `👋 С возвращением, <span class="highlight">${escapeHtml(user.name.split(' ')[0])}</span>` : '👋 Добро пожаловать!'}
                        </div>
                        <div class="premium-banner__sub">
                            ${user ? 'Продолжайте обучение и становитесь лучшим агентом!' : 'Начните обучение и станьте экспертом по новостройкам!'}
                        </div>
                    </div>
                    <div class="premium-banner__right">
                        <div class="premium-banner__stat">
                            <span class="premium-banner__stat-value">${user ? xpProgress.level : '—'}</span>
                            <span class="premium-banner__stat-label">Уровень</span>
                        </div>
                        <div class="premium-banner__stat">
                            <span class="premium-banner__stat-value">${user ? xpProgress.currentXP : '0'}</span>
                            <span class="premium-banner__stat-label">XP</span>
                        </div>
                        <div class="premium-banner__stat">
                            <span class="premium-banner__stat-value"><span class="accent">${user ? completedScenarios : 0}</span>/${totalScenarios || '—'}</span>
                            <span class="premium-banner__stat-label">Сценариев</span>
                        </div>
                        <div class="premium-banner__stat">
                            <span class="premium-banner__stat-value">${user ? badges.length : '—'}</span>
                            <span class="premium-banner__stat-label">Бейджей</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        var header = document.querySelector('.premium-header');
        if (header && header.nextSibling) {
            header.parentNode.insertBefore(banner, header.nextSibling);
        } else {
            scenarioScreen.insertBefore(banner, scenarioScreen.firstChild);
        }
    }

    // ===== ОБЁРТКА СЦЕНАРИЕВ =====
    function wrapScenariosInPremiumContainer() {
        var scenarioScreen = document.getElementById('scenario-screen');
        if (!scenarioScreen) return;
        
        var categoriesScroll = document.querySelector('.categories-scroll');
        var scenariosGrid = document.getElementById('scenarios-grid');
        var recommendations = document.getElementById('recommendations');
        var continueLearning = document.getElementById('continue-learning');
        
        if (document.querySelector('.premium-container')) return;
        
        var container = document.createElement('div');
        container.className = 'premium-container';
        
        var elements = [categoriesScroll, scenariosGrid, recommendations, continueLearning];
        elements.forEach(function(el) {
            if (el && el.parentNode === scenarioScreen) {
                container.appendChild(el);
            }
        });
        
        if (container.children.length > 0) {
            scenarioScreen.appendChild(container);
        }
    }

    // ===== АПГРЕЙД КАТЕГОРИЙ =====
    function upgradeCategories() {
        var categoriesList = document.querySelector('.categories-list');
        if (!categoriesList) return;
        
        categoriesList.className = 'premium-categories';
        
        var chips = categoriesList.querySelectorAll('.category-chip');
        chips.forEach(function(chip) {
            chip.className = 'premium-category';
            if (chip.classList.contains('category-chip--active')) {
                chip.classList.add('active');
            }
            
            var count = chip.querySelector('.category-chip__count');
            if (count) {
                count.className = 'premium-category__count';
            }
        });
    }

    // ===== АПГРЕЙД КАРТОЧЕК СЦЕНАРИЕВ =====
    function upgradeScenarioCards() {
        var cards = document.querySelectorAll('.scenario-card-new');
        cards.forEach(function(card) {
            upgradeCard(card);
        });
        
        var grid = document.getElementById('scenarios-grid');
        if (grid) {
            var observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === 1 && node.classList && node.classList.contains('scenario-card-new')) {
                            upgradeCard(node);
                        }
                    });
                });
            });
            observer.observe(grid, { childList: true, subtree: true });
        }
    }

    // ===== АПГРЕЙД ОДНОЙ КАРТОЧКИ =====
    function upgradeCard(card) {
        if (card.classList.contains('premium-card')) return;
        if (_isUpgrading) return;
        _isUpgrading = true;
        
        try {
            var title = card.querySelector('.scenario-card-new__title')?.textContent || '';
            var description = card.querySelector('.scenario-card-new__description')?.textContent || '';
            var preview = card.querySelector('.scenario-card-new__preview');
            var difficulty = card.querySelector('.scenario-card-new__difficulty');
            var badge = card.querySelector('.scenario-card-new__badge');
            var steps = card.querySelector('.scenario-card-new__steps');
            var progress = card.querySelector('.scenario-card-new__progress');
            
            var icon = 'fas fa-book-open';
            if (preview) {
                var iconEl = preview.querySelector('i');
                if (iconEl) icon = iconEl.className;
            }
            
            var isCompleted = badge && badge.textContent && badge.textContent.includes('Пройдено');
            var difficultyText = difficulty ? difficulty.textContent : 'Средний';
            
            var progressPercent = '0%';
            var progressText = '';
            if (progress) {
                var fill = progress.querySelector('.scenario-card-new__progress-fill');
                if (fill) progressPercent = fill.style.width || '0%';
                var textEl = progress.querySelector('.scenario-card-new__progress-text');
                if (textEl) progressText = textEl.textContent || '';
            }
            
            var scenarioId = card.dataset.scenarioId || '';
            
            var tagsHTML = '';
            if (steps) {
                var tagEls = steps.querySelectorAll('.step-tag');
                if (tagEls.length > 0) {
                    tagEls.forEach(function(tag) {
                        tagsHTML += `<span class="premium-card__tag">${tag.innerHTML}</span>`;
                    });
                } else {
                    tagsHTML = '<span class="premium-card__tag"><i class="fas fa-cog"></i> Интерактивный</span>';
                }
            } else {
                tagsHTML = '<span class="premium-card__tag"><i class="fas fa-cog"></i> Интерактивный</span>';
            }
            
            card.className = 'premium-card';
            card.style.opacity = '0';
            card.style.animation = 'premiumFadeUp 0.6s ease forwards';
            
            card.innerHTML = `
                <div class="premium-card__header">
                    <div class="premium-card__header-bg" style="background: ${getRandomGradient()}">
                        <span class="icon"><i class="${icon}"></i></span>
                    </div>
                    ${isCompleted ? '<div class="premium-card__badge completed"><i class="fas fa-check"></i> Пройдено</div>' : ''}
                    <div class="premium-card__difficulty">${difficultyText}</div>
                </div>
                <div class="premium-card__body">
                    <div class="premium-card__title">
                        ${escapeHtml(title)}
                        ${isCompleted ? '<span class="check"><i class="fas fa-check-circle"></i></span>' : ''}
                    </div>
                    <div class="premium-card__description">${escapeHtml(description)}</div>
                    <div class="premium-card__tags">
                        ${tagsHTML}
                    </div>
                    ${progress ? `
                        <div class="premium-card__progress">
                            <div class="premium-card__progress-track">
                                <div class="premium-card__progress-fill" style="width: ${progressPercent}"></div>
                            </div>
                            <div class="premium-card__progress-text">
                                <span>${progressText}</span>
                                <span class="percent">${progressPercent}</span>
                            </div>
                        </div>
                    ` : ''}
                </div>
                <div class="premium-card__footer">
                    ${isCompleted ? 
                        '<span class="status"><i class="fas fa-check-circle"></i> Завершён</span>' : 
                        '<span></span>'
                    }
                    <button class="btn btn-primary start-scenario-btn" data-scenario-id="${scenarioId}">
                        ${isCompleted ? '<i class="fas fa-redo"></i> Повторить' : '<i class="fas fa-play"></i> Начать'}
                    </button>
                </div>
            `;
            
            // Навешиваем обработчик на кнопку с использованием делегирования
            var btn = card.querySelector('.start-scenario-btn');
            if (btn && scenarioId) {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    e.preventDefault();
                    console.log('[PremiumUI] Клик по кнопке, ID:', scenarioId);
                    handleScenarioStart(scenarioId);
                });
            }
            
            // Клик по карточке
            card.addEventListener('click', function(e) {
                if (e.target.closest('.btn') || e.target.closest('.start-scenario-btn')) return;
                console.log('[PremiumUI] Клик по карточке, ID:', scenarioId);
                handleScenarioStart(scenarioId);
            });
            
        } catch (error) {
            console.warn('[PremiumUI] Ошибка обновления карточки:', error);
        }
        
        _isUpgrading = false;
    }

    // ===== ЗАПУСК СЦЕНАРИЯ =====
    function handleScenarioStart(scenarioId) {
        if (!scenarioId) {
            console.warn('[PremiumUI] Нет ID сценария');
            return;
        }
        
        // Получаем сценарий
        var scenario = getScenarioById(scenarioId);
        if (!scenario) {
            console.warn('[PremiumUI] Сценарий не найден:', scenarioId);
            return;
        }
        
        console.log('[PremiumUI] Запуск сценария:', scenario.name);
        
        // Проверяем, что функция startScenario существует
        if (typeof startScenario === 'function') {
            startScenario(scenario);
        } else {
            console.warn('[PremiumUI] startScenario не определена, пробуем через window');
            if (window.startScenario) {
                window.startScenario(scenario);
            } else {
                console.error('[PremiumUI] startScenario не найдена!');
                showToast('❌', 'Не удалось запустить сценарий', 'error');
            }
        }
    }

    // ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
    function getScenarioById(id) {
        if (typeof allScenarios === 'undefined' || !allScenarios) {
            console.warn('[PremiumUI] allScenarios не определён');
            return null;
        }
        return allScenarios.find(function(s) { return s.id === id; });
    }

    function getRandomGradient() {
        var gradients = [
            'linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%)',
            'linear-gradient(135deg, #00CEC9 0%, #55EFC4 100%)',
            'linear-gradient(135deg, #FD79A8 0%, #FDCB6E 100%)',
            'linear-gradient(135deg, #0984E3 0%, #74B9FF 100%)',
            'linear-gradient(135deg, #E17055 0%, #FDCB6E 100%)',
            'linear-gradient(135deg, #00B894 0%, #55EFC4 100%)',
            'linear-gradient(135deg, #6C5CE7 0%, #FD79A8 100%)',
            'linear-gradient(135deg, #2D3436 0%, #636E72 100%)'
        ];
        return gradients[Math.floor(Math.random() * gradients.length)];
    }

    // ===== ПОВТОРНАЯ ИНИЦИАЛИЗАЦИЯ =====
    function reinit() {
        _isInitialized = false;
        initPremiumUI();
    }

    // ===== ЗАПУСК =====
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(initPremiumUI, 500);
        });
    } else {
        setTimeout(initPremiumUI, 500);
    }

    // ===== ЭКСПОРТ =====
    window.PremiumUI = {
        init: initPremiumUI,
        reinit: reinit,
        upgradeCard: upgradeCard,
        handleScenarioStart: handleScenarioStart
    };

    console.log('[PremiumUI] Модуль загружен, версия: 1.2');

})();
// ===== UI КОМПОНЕНТЫ =====

function showContinueButton() {
    if (document.getElementById('step-continue-btn')) return;
    
    const continueBtn = document.createElement('button');
    continueBtn.id = 'step-continue-btn';
    continueBtn.className = 'btn btn--primary';
    continueBtn.textContent = 'Продолжить →';
    continueBtn.style.position = 'fixed';
    continueBtn.style.bottom = '20px';
    continueBtn.style.left = '50%';
    continueBtn.style.transform = 'translateX(-50%)';
    continueBtn.style.zIndex = '30';
    continueBtn.style.padding = '12px 24px';
    continueBtn.style.borderRadius = '32px';
    continueBtn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    continueBtn.style.cursor = 'pointer';
    
    continueBtn.addEventListener('click', () => {
        continueBtn.remove();
        AppState.currentStepIndex++;
        runStep();
    });
    
    document.body.appendChild(continueBtn);
    
    setTimeout(() => {
        if (document.getElementById('step-continue-btn')) {
            continueBtn.style.opacity = '0.7';
        }
    }, 5000);
}

function addUserChangeButton() {
    const user = User.get();
    if (!user) return;

    const oldBtn = document.getElementById('user-change-btn');
    if (oldBtn) oldBtn.remove();

    const changeBtn = document.createElement('button');
    changeBtn.id = 'user-change-btn';
    changeBtn.className = 'btn btn--small btn--secondary';
    changeBtn.innerHTML = '<i class="fas fa-user-switch"></i>';
    changeBtn.title = `Сменить пользователя (сейчас: ${user.name})`;
    changeBtn.style.marginLeft = '12px';
    changeBtn.style.cursor = 'pointer';
    changeBtn.addEventListener('click', () => {
        User.clear();
        location.reload();
    });

    const headerInfoEl = document.getElementById('header-info');
    if (headerInfoEl) {
        headerInfoEl.after(changeBtn);
    }
}

// ===== ФУНКЦИИ ДЛЯ НОВОГО ДИЗАЙНА =====

// Определение сложности сценария
function getDifficultyInfo(scenario) {
    const stepCount = scenario.steps.length;
    let difficulty = 'medium';
    let difficultyLabel = 'Средний';
    let difficultyStars = '★★';
    
    if (stepCount <= 3) {
        difficulty = 'easy';
        difficultyLabel = 'Лёгкий';
        difficultyStars = '★';
    } else if (stepCount >= 8) {
        difficulty = 'hard';
        difficultyLabel = 'Сложный';
        difficultyStars = '★★★';
    }
    
    return { difficulty, difficultyLabel, difficultyStars };
}

// Получение иконки для категории шагов
function getStepIcon(stepType) {
    const icons = {
        'map': '<i class="fas fa-map-marker-alt"></i>',
        'quiz': '<i class="fas fa-question-circle"></i>',
        'brief': '<i class="fas fa-book-open"></i>',
        'matching': '<i class="fas fa-puzzle-piece"></i>',
        'pipeline': '<i class="fas fa-chart-line"></i>',
        'dialogue': '<i class="fas fa-comments"></i>',
        'platforms': '<i class="fab fa-instagram"></i>',
        'rule3t': '<i class="fas fa-music"></i>',
        'profile': '<i class="fas fa-user-circle"></i>',
        'content-plan': '<i class="fas fa-calendar-alt"></i>',
        'funnel': '<i class="fas fa-funnel-dollar"></i>',
        'ai-tools': '<i class="fas fa-robot"></i>',
        'analytics': '<i class="fas fa-chart-simple"></i>',
        'timer-quiz': '<i class="fas fa-stopwatch"></i>',
        'decision-chain': '<i class="fas fa-code-branch"></i>',
        'client-journey': '<i class="fas fa-handshake"></i>'
    };
    return icons[stepType] || '<i class="fas fa-cog"></i>';
}

// Подсчёт количества шагов по типам
function countStepsByType(steps) {
    const counts = {};
    for (const step of steps) {
        if (step.type === 'finish') continue;
        counts[step.type] = (counts[step.type] || 0) + 1;
    }
    return counts;
}

// Рендер дашборда агента
function renderAgentDashboard() {
    const user = User.get();
    if (!user) return;
    
    const dashboard = document.getElementById('agent-dashboard');
    const quickStats = document.getElementById('quick-stats');
    if (!dashboard) return;
    
    dashboard.style.display = 'block';
    quickStats.style.display = 'grid';
    
    // Аватар и имя
    const initial = user.name.charAt(0).toUpperCase();
    document.getElementById('dashboard-avatar').textContent = initial;
    document.getElementById('dashboard-name').textContent = user.name;
    
    // Дата регистрации (первое сохранение)
    const savedAt = user.savedAt;
    if (savedAt) {
        const date = new Date(savedAt);
        const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
        document.getElementById('dashboard-joined').textContent = `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    }
    
    // XP и уровень
    const xpProgress = User.getXPProgress();
    document.getElementById('dashboard-level').textContent = xpProgress.level;
    const percentToNext = xpProgress.percentToNext;
    document.getElementById('dashboard-progress-fill').style.width = `${percentToNext}%`;
    document.getElementById('dashboard-next').textContent = `До следующего уровня: ${xpProgress.xpNeededForNext} XP`;
    
    // Серия (стрик)
    const streak = User.getStreak();
    const streakEl = document.getElementById('dashboard-streak');
    if (streak && streak.count > 0) {
        streakEl.style.display = 'flex';
        document.getElementById('streak-count').textContent = streak.count;
    } else {
        streakEl.style.display = 'none';
    }
    
    // Кольцевой прогресс
    updateRingProgress();
}

function updateRingProgress() {
    const canvas = document.getElementById('ring-canvas');
    if (!canvas) return;
    
    const totalScenarios = allScenarios.length;
    const badges = Badges.getAll();
    const completed = allScenarios.filter(s => badges.includes(s.badge)).length;
    const percent = totalScenarios > 0 ? Math.round((completed / totalScenarios) * 100) : 0;
    
    const size = 80;
    const center = size / 2;
    const radius = 32;
    const startAngle = -0.5 * Math.PI;
    const endAngle = startAngle + (2 * Math.PI * percent / 100);
    
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, size, size);
    
    // Фон
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 6;
    ctx.stroke();
    
    // Прогресс
    ctx.beginPath();
    ctx.arc(center, center, radius, startAngle, endAngle);
    ctx.strokeStyle = '#f39c12';
    ctx.lineWidth = 6;
    ctx.stroke();
    
    document.getElementById('ring-value').textContent = `${percent}%`;
}

function updateQuickStats() {
    const badges = Badges.getAll();
    const completedCount = allScenarios.filter(s => badges.includes(s.badge)).length;
    const xpProgress = User.getXPProgress();
    
    document.getElementById('quick-scenarios').innerHTML = `${completedCount}/<span id="quick-total">${allScenarios.length}</span>`;
    document.getElementById('quick-xp').textContent = xpProgress.currentXP;
    document.getElementById('quick-badges').textContent = badges.length;
}

// ===== КАТЕГОРИИ =====
let currentCategory = 'all';
let allScenarios = [];

function renderCategoryChips() {
    const container = document.getElementById('categories-list');
    if (!container) return;
    
    const categories = new Set();
    const categoryCounts = {};
    
    categories.add('all');
    categoryCounts['all'] = allScenarios.length;
    
    for (const scenario of allScenarios) {
        if (scenario.group) {
            categories.add(scenario.group);
            categoryCounts[scenario.group] = (categoryCounts[scenario.group] || 0) + 1;
        }
    }
    
    const sortedCategories = Array.from(categories).sort((a, b) => {
        if (a === 'all') return -1;
        if (b === 'all') return 1;
        return a.localeCompare(b);
    });
    
    let chipsHTML = '';
    for (const cat of sortedCategories) {
        const displayName = cat === 'all' ? 'Все' : cat;
        const activeClass = currentCategory === cat ? 'category-chip--active' : '';
        const icon = cat === 'all' ? '<i class="fas fa-th-large"></i>' : 
                     cat === 'Картография' ? '<i class="fas fa-map-marked-alt"></i>' :
                     cat === 'Обучение' ? '<i class="fas fa-graduation-cap"></i>' :
                     cat === 'Практика: работа с клиентом' ? '<i class="fas fa-handshake"></i>' :
                     cat === 'Быстрые игры' ? '<i class="fas fa-stopwatch"></i>' :
                     '<i class="fas fa-folder"></i>';
        
        chipsHTML += `
            <button class="category-chip ${activeClass}" data-category="${escapeHtml(cat)}">
                ${icon} ${escapeHtml(displayName)}
                <span class="category-chip__count">${categoryCounts[cat]}</span>
            </button>
        `;
    }
    
    container.innerHTML = chipsHTML;
    
    document.querySelectorAll('.category-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const category = chip.dataset.category;
            if (category === currentCategory) return;
            
            currentCategory = category;
            
            document.querySelectorAll('.category-chip').forEach(c => {
                c.classList.remove('category-chip--active');
            });
            chip.classList.add('category-chip--active');
            
            renderScenariosGrid();
        });
    });
}

// Функция сортировки сценариев
function sortScenarios(scenarios) {
    return [...scenarios].sort((a, b) => {
        // Сначала сортируем по полю order (если есть)
        const orderA = a.order !== undefined ? a.order : Infinity;
        const orderB = b.order !== undefined ? b.order : Infinity;
        
        if (orderA !== orderB) {
            return orderA - orderB;
        }
        
        // Если order одинаковый или отсутствует — сортируем по названию
        return a.name.localeCompare(b.name, 'ru');
    });
}

// Рендер сетки сценариев (новая версия с сортировкой)
function renderScenariosGrid() {
    const container = document.getElementById('scenarios-grid');
    if (!container) return;
    
    container.innerHTML = '';
    
    let filteredScenarios = allScenarios;
    if (currentCategory !== 'all') {
        filteredScenarios = allScenarios.filter(s => s.group === currentCategory);
    }
    
    // СОРТИРУЕМ сценарии внутри категории
    filteredScenarios = sortScenarios(filteredScenarios);
    
    if (filteredScenarios.length === 0) {
        container.innerHTML = '<div class="empty-message"><i class="fas fa-folder-open"></i> Нет сценариев в этой категории</div>';
        return;
    }
    
    for (const scenario of filteredScenarios) {
        const hasBadge = Badges.has(scenario.badge);
        const { difficulty, difficultyLabel, difficultyStars } = getDifficultyInfo(scenario);
        const difficultyClass = difficulty === 'easy' ? 'scenario-card-new__difficulty--easy' : 
                                (difficulty === 'hard' ? 'scenario-card-new__difficulty--hard' : 'scenario-card-new__difficulty--medium');
        
        // Иконка сценария
        const icon = scenario.icon || 'fa-book-open';
        
        // Подсчёт шагов по типам
        const stepCounts = countStepsByType(scenario.steps);
        let stepsHtml = '';
        const stepTypes = ['map', 'quiz', 'timer-quiz', 'decision-chain', 'client-journey', 'platforms', 'rule3t', 'profile', 'content-plan', 'funnel', 'ai-tools', 'analytics', 'matching', 'pipeline', 'dialogue', 'brief'];
        for (const type of stepTypes) {
            if (stepCounts[type]) {
                stepsHtml += `<span class="step-tag">${getStepIcon(type)} ${stepCounts[type]}</span>`;
            }
        }
        if (!stepsHtml) {
            stepsHtml = `<span class="step-tag"><i class="fas fa-cog"></i> ${scenario.steps.filter(s => s.type !== 'finish').length}</span>`;
        }
        
        // Прогресс
        let progressHtml = '';
        let actionHtml = '';
        const savedProgress = User.getScenarioProgress(scenario.id);
        
        if (savedProgress && savedProgress.stepIndex > 0) {
            const percent = Math.round((savedProgress.stepIndex / scenario.steps.filter(s => s.type !== 'finish').length) * 100);
            progressHtml = `
                <div class="scenario-card-new__progress">
                    <div class="scenario-card-new__progress-bar">
                        <div class="scenario-card-new__progress-fill" style="width: ${percent}%"></div>
                    </div>
                    <div class="scenario-card-new__progress-text">
                        <span>${percent}%</span>
                        <span>шаг ${savedProgress.stepIndex + 1}/${scenario.steps.length}</span>
                    </div>
                </div>
            `;
            actionHtml = `
                <div class="scenario-card-new__action">
                    <button class="scenario-card-new__btn" data-scenario-id="${scenario.id}">
                        <i class="fas fa-play"></i> Продолжить
                    </button>
                </div>
            `;
        } else if (hasBadge) {
            actionHtml = `
                <div class="scenario-card-new__action">
                    <span style="font-size:0.7rem; color:var(--color-success);"><i class="fas fa-check-circle"></i> Пройден</span>
                </div>
            `;
        } else {
            actionHtml = `
                <div class="scenario-card-new__action">
                    <button class="scenario-card-new__btn" data-scenario-id="${scenario.id}">
                        <i class="fas fa-play"></i> Начать
                    </button>
                </div>
            `;
        }
        
        const card = document.createElement('div');
        card.className = 'scenario-card-new';
        card.dataset.scenarioId = scenario.id;
        
        card.innerHTML = `
            <div class="scenario-card-new__preview">
                <i class="fas ${icon}"></i>
                ${hasBadge ? '<div class="scenario-card-new__badge"><i class="fas fa-check"></i> Пройдено</div>' : ''}
                <div class="scenario-card-new__difficulty ${difficultyClass}">
                    ${difficultyStars} ${difficultyLabel}
                </div>
            </div>
            <div class="scenario-card-new__content">
                <div class="scenario-card-new__title">
                    ${escapeHtml(scenario.name)}
                    ${hasBadge ? '<i class="fas fa-check-circle scenario-card-new__completed-icon"></i>' : ''}
                </div>
                <div class="scenario-card-new__description">${escapeHtml(scenario.description)}</div>
                <div class="scenario-card-new__steps">${stepsHtml}</div>
                ${progressHtml}
                ${actionHtml}
            </div>
        `;
        
        // Обработчик клика
        card.addEventListener('click', (e) => {
            // Если клик на кнопке, не запускаем повторно
            if (e.target.closest('.scenario-card-new__btn')) return;
            startScenario(scenario);
        });
        
        // Обработчик кнопки
        const btn = card.querySelector('.scenario-card-new__btn');
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                startScenario(scenario);
            });
        }
        
        container.appendChild(card);
    }
}

// Рекомендации
function renderRecommendations() {
    const container = document.getElementById('recommendations');
    const grid = document.getElementById('recommendations-grid');
    if (!container || !grid) return;
    
    const badges = Badges.getAll();
    const completedIds = allScenarios.filter(s => badges.includes(s.badge)).map(s => s.id);
    
    // Находим непройденные сценарии
    const notCompleted = allScenarios.filter(s => !badges.includes(s.badge));
    
    if (notCompleted.length === 0 || notCompleted.length === allScenarios.length) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    
    // Берём 3 случайных непройденных сценария
    const shuffled = [...notCompleted].sort(() => 0.5 - Math.random());
    const recommendations = shuffled.slice(0, 3);
    
    let recHtml = '';
    for (const rec of recommendations) {
        const icon = rec.icon || 'fa-book-open';
        recHtml += `
            <div class="recommendation-card" data-scenario-id="${rec.id}">
                <div class="recommendation-card__icon"><i class="fas ${icon}"></i></div>
                <div class="recommendation-card__title">${escapeHtml(rec.name)}</div>
                <div class="recommendation-card__desc">${escapeHtml(rec.description.substring(0, 60))}${rec.description.length > 60 ? '…' : ''}</div>
            </div>
        `;
    }
    
    grid.innerHTML = recHtml;
    
    document.querySelectorAll('.recommendation-card').forEach(card => {
        card.addEventListener('click', () => {
            const scenarioId = card.dataset.scenarioId;
            const scenario = allScenarios.find(s => s.id === scenarioId);
            if (scenario) startScenario(scenario);
        });
    });
}

// Обновление прогресса и рекомендаций после завершения сценария
function refreshMainScreen() {
    updateRingProgress();
    updateQuickStats();
    renderScenariosGrid();
    renderRecommendations();
    updateContinueLearning();
    updateHeaderXP();
}

// ===== СТАРЫЕ ФУНКЦИИ (адаптированы под новый дизайн) =====

function updateHeaderXP() {
    const xpCard = document.getElementById('xp-card');
    const userLevelEl = document.getElementById('user-level');
    const userXpEl = document.getElementById('user-xp');
    const progressFill = document.getElementById('level-progress-fill');
    
    if (!xpCard) return;
    
    const user = User.get();
    if (!user) {
        xpCard.style.display = 'none';
        return;
    }
    
    const progress = User.getXPProgress();
    xpCard.style.display = 'flex';
    
    if (userLevelEl) userLevelEl.textContent = `Уровень ${progress.level}`;
    if (userXpEl) userXpEl.textContent = `${progress.currentXP} XP`;
    if (progressFill) progressFill.style.width = `${progress.percentToNext}%`;
}

function updateHeaderUser() {
    const userNameBtn = document.getElementById('user-name-btn');
    const userNameText = document.getElementById('user-name-text');
    const userAvatar = document.getElementById('user-avatar');
    
    const user = User.get();
    if (!user) {
        if (userNameBtn) userNameBtn.style.display = 'none';
        return;
    }
    
    if (userNameBtn) userNameBtn.style.display = 'flex';
    if (userNameText) userNameText.textContent = user.name;
    if (userAvatar) {
        const initial = user.name.charAt(0).toUpperCase();
        userAvatar.textContent = initial;
    }
    
    if (userNameBtn) {
        userNameBtn.onclick = () => {
            if (confirm('Сменить пользователя? Весь текущий прогресс будет сохранён.')) {
                User.clear();
                location.reload();
            }
        };
    }
}

function updateContinueLearning() {
    const container = document.getElementById('continue-learning');
    if (!container) return;
    
    const user = User.get();
    if (!user) {
        container.style.display = 'none';
        container.classList.remove('continue-learning--visible');
        return;
    }
    
    let lastScenario = null;
    let lastProgress = null;
    
    // Сортируем сценарии для поиска последнего активного
    const sortedScenarios = sortScenarios(allScenarios);
    
    for (const scenario of sortedScenarios) {
        const progress = User.getScenarioProgress(scenario.id);
        if (progress && progress.stepIndex < scenario.steps.length - 1) {
            const lastStep = scenario.steps[progress.stepIndex];
            if (lastStep.type !== 'finish') {
                lastScenario = scenario;
                lastProgress = progress;
                break;
            }
        }
    }
    
    if (!lastScenario || !lastProgress) {
        container.style.display = 'none';
        container.classList.remove('continue-learning--visible');
        return;
    }
    
    // ПОКАЗЫВАЕМ БЛОК
    container.style.display = 'block';
    container.classList.add('continue-learning--visible');
    
    const greetingEl = document.getElementById('continue-greeting');
    const subEl = document.getElementById('continue-sub');
    const titleEl = document.getElementById('continue-title');
    const descEl = document.getElementById('continue-desc');
    const progressFill = document.getElementById('continue-progress-fill');
    const progressText = document.getElementById('continue-progress-text');
    const continueBtn = document.getElementById('continue-btn');
    
    if (greetingEl) greetingEl.textContent = `👋 С возвращением, ${user.name.split(' ')[0]}!`;
    if (subEl) subEl.textContent = 'Продолжите с того места, где остановились';
    if (titleEl) titleEl.textContent = lastScenario.name;
    if (descEl) descEl.textContent = lastScenario.description;
    
    const totalSteps = lastScenario.steps.length;
    const currentStep = lastProgress.stepIndex;
    const percent = Math.round((currentStep / totalSteps) * 100);
    
    if (progressFill) progressFill.style.width = `${percent}%`;
    if (progressText) progressText.textContent = `${percent}% завершено (шаг ${currentStep + 1} из ${totalSteps})`;
    
    if (continueBtn) {
        continueBtn.onclick = () => {
            AppState.currentScenario = lastScenario;
            AppState.currentStepIndex = lastProgress.stepIndex;
            AppState.stepStats = lastProgress.stepStats || [];
            AppState.scenarioStartTime = Date.now();
            
            document.getElementById('scenario-screen').classList.add('hidden');
            document.getElementById('header-info').innerHTML = `${lastScenario.icon ? '<i class="fas ' + lastScenario.icon + '"></i>' : ''} ${lastScenario.name}`;
            
            ProgressBar.init();
            ProgressBar.update(lastProgress.stepIndex, lastScenario.steps.length - 1, lastScenario.steps);
            ProgressBar.show();
            
            runStep();
        };
    }
}

// ===== ГЛАВНАЯ ФУНКЦИЯ РЕНДЕРИНГА =====
function renderScenarios() {
    if (!AppState.scenarios) return;
    
    allScenarios = AppState.scenarios;
    
    renderAgentDashboard();
    updateQuickStats();
    renderCategoryChips();
    renderScenariosGrid();
    renderRecommendations();
    updateContinueLearning();
    updateHeaderXP();
    updateHeaderUser();
}

// ===== КНОПКА "ПРОПУСТИТЬ ШАГ" (ДЛЯ АДМИНИСТРАТОРА/ТРЕНЕРА) =====

// Проверка, является ли пользователь администратором
// Внутренний инструмент — можно добавить простую проверку
function isAdmin() {
    // Вариант 1: проверка по имени (для тестирования)
    const user = User.get();
    if (!user) return false;
    
    // Список администраторов (можно расширить)
    const adminNames = ['admin', 'тренер', 'Админ', 'Admin', 'Тренер'];
    if (adminNames.includes(user.name.toLowerCase())) return true;
    
    // Вариант 2: проверка по секретному ключу в localStorage
    const adminKey = localStorage.getItem('realty_admin_key');
    if (adminKey === 'true') return true;
    
    // Вариант 3: проверка по уровню (админы могут быть на уровне 10+)
    const xpProgress = User.getXPProgress();
    if (xpProgress.level >= 10) return true;
    
    return false;
}

// Установка режима администратора
function enableAdminMode() {
    localStorage.setItem('realty_admin_key', 'true');
    showToast('🔑', 'Режим администратора включён. Доступен пропуск шагов.', 'success');
    // Перезагружаем интерфейс, чтобы показать кнопку
    if (typeof renderScenarios === 'function') {
        renderScenarios();
    }
    // Если мы в сценарии — добавляем кнопку
    addSkipStepButton();
}

// Отключение режима администратора
function disableAdminMode() {
    localStorage.removeItem('realty_admin_key');
    showToast('🔒', 'Режим администратора выключен.', 'warning');
    removeSkipStepButton();
}

// Добавление кнопки пропуска шага
let skipButtonAdded = false;

function addSkipStepButton() {
    if (!isAdmin()) return;
    if (skipButtonAdded) return;
    
    // Проверяем, находимся ли мы в сценарии
    if (!AppState.currentScenario) return;
    
    // Находим контейнер для кнопки (рядом с шапкой шага)
    const stepHeader = document.querySelector('.step-header');
    if (!stepHeader) return;
    
    // Проверяем, нет ли уже такой кнопки
    if (document.getElementById('skip-step-btn')) return;
    
    const skipBtn = document.createElement('button');
    skipBtn.id = 'skip-step-btn';
    skipBtn.className = 'btn btn--warning btn--small';
    skipBtn.innerHTML = '<i class="fas fa-forward"></i> Пропустить шаг';
    skipBtn.style.marginLeft = 'auto';
    skipBtn.style.backgroundColor = '#f39c12';
    skipBtn.style.color = '#fff';
    skipBtn.style.border = 'none';
    skipBtn.style.cursor = 'pointer';
    
    skipBtn.addEventListener('click', () => {
        if (confirm('Вы уверены, что хотите пропустить текущий шаг? Прогресс этого шага будет потерян.')) {
            skipCurrentStep();
        }
    });
    
    stepHeader.appendChild(skipBtn);
    skipButtonAdded = true;
}

function removeSkipStepButton() {
    const skipBtn = document.getElementById('skip-step-btn');
    if (skipBtn) skipBtn.remove();
    skipButtonAdded = false;
}

function skipCurrentStep() {
    if (!AppState.currentScenario) return;
    
    const currentStep = AppState.currentScenario.steps[AppState.currentStepIndex];
    
    // Добавляем запись о пропуске в статистику
    AppState.stepStats.push({
        step: AppState.currentStepIndex + 1,
        type: currentStep.type,
        title: currentStep.title,
        skipped: true,
        correct: 0,
        total: 0
    });
    
    // Сохраняем прогресс
    if (typeof saveCurrentProgress === 'function') {
        saveCurrentProgress();
    }
    
    // Переходим к следующему шагу
    AppState.currentStepIndex++;
    
    showToast('⏭️', `Шаг "${currentStep.title}" пропущен`, 'warning');
    
    // Обновляем прогресс-бар
    ProgressBar.update(
        AppState.currentStepIndex, 
        AppState.currentScenario.steps.length - 1, 
        AppState.currentScenario.steps
    );
    
    // Запускаем следующий шаг
    if (typeof runStep === 'function') {
        runStep();
    }
}

// Обновление видимости кнопки пропуска при смене шага
// Эту функцию нужно вызывать при каждом новом шаге
function updateSkipButtonVisibility() {
    if (isAdmin() && AppState.currentScenario) {
        addSkipStepButton();
    } else {
        removeSkipStepButton();
    }
}

// Перехватываем runStep для обновления кнопки
// Сохраняем оригинальную функцию
const originalRunStep = window.runStep;
if (originalRunStep) {
    window.runStep = function() {
        // Удаляем старую кнопку перед рендером нового шага
        removeSkipStepButton();
        // Вызываем оригинальную функцию
        originalRunStep();
        // Добавляем кнопку, если нужно
        setTimeout(() => updateSkipButtonVisibility(), 100);
    };
}
// ===== HAPTIC FEEDBACK ДЛЯ КНОПОК (ОПЦИОНАЛЬНО) =====
function initHapticFeedback() {
    // Добавляем вибрацию на все кнопки (кроме тех, где это не нужно)
    const hapticSelectors = [
        '.btn',
        '.category-chip',
        '.scenario-card-new',
        '.quiz-option',
        '.dialogue-option',
        '.jk-card',
        '.jk-list__item',
        '.floating-list-btn',
        '.continue-learning__btn'
    ];
    
    const selector = hapticSelectors.join(',');
    
    document.addEventListener('click', (e) => {
        const target = e.target.closest(selector);
        if (!target) return;
        
        // Проверяем, не отключено ли через атрибут data-haptic="false"
        if (target.dataset.haptic === 'false') return;
        
        // Лёгкая вибрация при клике (только если не на disabled)
        if (!target.disabled && window.vibrate) {
            window.vibrate('light');
        }
    });
}

// Инициализируем при загрузке DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHapticFeedback);
} else {
    initHapticFeedback();
}
// Экспорт функций для использования в консоли (для администратора)
window.enableAdminMode = enableAdminMode;
window.disableAdminMode = disableAdminMode;
window.isAdmin = isAdmin;
window.skipCurrentStep = skipCurrentStep;
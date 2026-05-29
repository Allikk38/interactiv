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

// ===== НОВЫЕ ФУНКЦИИ ДЛЯ ИНТЕРФЕЙСА =====

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
        container.classList.remove('continue-learning--visible');
        return;
    }
    
    let lastScenario = null;
    let lastProgress = null;
    
    for (const scenario of AppState.scenarios) {
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
        container.classList.remove('continue-learning--visible');
        return;
    }
    
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

let currentCategory = 'all';
let allScenarios = [];

function renderCategoryTabs() {
    const tabsContainer = document.getElementById('category-tabs');
    if (!tabsContainer) return;
    
    const categories = new Set();
    categories.add('all');
    
    for (const scenario of allScenarios) {
        if (scenario.group) {
            categories.add(scenario.group);
        }
    }
    
    const sortedCategories = Array.from(categories).sort();
    
    let tabsHTML = '';
    for (const cat of sortedCategories) {
        const displayName = cat === 'all' ? 'Все' : cat;
        const activeClass = currentCategory === cat ? 'category-tab--active' : '';
        tabsHTML += `<button class="category-tab ${activeClass}" data-category="${escapeHtml(cat)}">${escapeHtml(displayName)}</button>`;
    }
    
    tabsContainer.innerHTML = tabsHTML;
    
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const category = tab.dataset.category;
            if (category === currentCategory) return;
            
            currentCategory = category;
            
            document.querySelectorAll('.category-tab').forEach(t => {
                t.classList.remove('category-tab--active');
            });
            tab.classList.add('category-tab--active');
            
            renderScenariosGrid();
        });
    });
}

function renderScenariosGrid() {
    const scenariosGrid = document.getElementById('scenarios-grid');
    if (!scenariosGrid) return;
    
    scenariosGrid.innerHTML = '';
    
    let filteredScenarios = allScenarios;
    if (currentCategory !== 'all') {
        filteredScenarios = allScenarios.filter(s => s.group === currentCategory);
    }
    
    if (filteredScenarios.length === 0) {
        scenariosGrid.innerHTML = '<div class="empty-message" style="text-align:center; padding:40px; color:var(--color-text-light);">Нет сценариев в этой категории</div>';
        return;
    }
    
    for (const scenario of filteredScenarios) {
        const hasBadge = Badges.has(scenario.badge);
        const scenarioIcon = scenario.icon || 'fa-book-open';
        const isCompleted = hasBadge;
        
        let difficulty = 'medium';
        let difficultyColor = '#f39c12';
        if (scenario.steps.length <= 3) {
            difficulty = 'easy';
            difficultyColor = '#27ae60';
        } else if (scenario.steps.length >= 8) {
            difficulty = 'hard';
            difficultyColor = '#e74c3c';
        }
        
        const mapSteps = scenario.steps.filter(s => s.type === 'map').length;
        const quizSteps = scenario.steps.filter(s => s.type === 'quiz').length;
        const interactiveSteps = scenario.steps.filter(s => !['map', 'quiz', 'finish', 'brief', 'client-journey'].includes(s.type)).length;
        
        let stepsDesc = [];
        if (mapSteps > 0) stepsDesc.push(`${mapSteps} карт`);
        if (quizSteps > 0) stepsDesc.push(`${quizSteps} тестов`);
        if (interactiveSteps > 0) stepsDesc.push(`${interactiveSteps} заданий`);
        
        const stepsText = stepsDesc.join(' · ') || `${scenario.steps.length} шагов`;
        
        let progressPercent = 0;
        let progressHtml = '';
        const savedProgress = User.getScenarioProgress(scenario.id);
        if (savedProgress && savedProgress.stepIndex > 0) {
            progressPercent = Math.round((savedProgress.stepIndex / scenario.steps.length) * 100);
            progressHtml = `
                <div style="margin-top: 12px;">
                    <div style="height: 4px; background: var(--color-border); border-radius: 2px; overflow: hidden;">
                        <div style="width: ${progressPercent}%; height: 100%; background: #f39c12; border-radius: 2px;"></div>
                    </div>
                    <div style="font-size: 0.65rem; color: var(--color-text-light); margin-top: 4px;">${progressPercent}% завершено</div>
                </div>
            `;
        }
        
        const card = document.createElement('div');
        card.className = 'scenario-card';
        card.style.position = 'relative';
        card.style.overflow = 'hidden';
        card.style.cursor = 'pointer';
        
        card.innerHTML = `
            <div style="position: absolute; top: 12px; right: 12px;">
                <span style="background: ${difficultyColor}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.65rem; font-weight: 600;">
                    ${difficulty === 'easy' ? '★ Лёгкий' : difficulty === 'hard' ? '★★★ Сложный' : '★★ Средний'}
                </span>
            </div>
            <div class="scenario-card__icon" style="position: relative;">
                <i class="fas ${scenarioIcon}" style="font-size: 2rem; color: #f39c12;"></i>
                ${hasBadge ? '<i class="fas fa-check-circle" style="position: absolute; bottom: -8px; right: -8px; color: #27ae60; background: white; border-radius: 50%; font-size: 1rem;"></i>' : ''}
            </div>
            <div class="scenario-card__name">${escapeHtml(scenario.name)}</div>
            <div class="scenario-card__description">${escapeHtml(scenario.description)}</div>
            <div class="scenario-card__steps">${stepsText}</div>
            ${progressHtml}
            ${isCompleted ? '<div style="margin-top: 8px;"><span style="background: #eafaf1; color: #27ae60; padding: 4px 12px; border-radius: 16px; font-size: 0.7rem; font-weight: 600;"><i class="fas fa-check"></i> Пройдено</span></div>' : ''}
            ${!isCompleted && progressPercent > 0 ? '<div style="margin-top: 8px;"><span style="background: #fef9e7; color: #f39c12; padding: 4px 12px; border-radius: 16px; font-size: 0.7rem; font-weight: 600;"><i class="fas fa-play"></i> Продолжить</span></div>' : ''}
        `;
        
        card.addEventListener('click', () => startScenario(scenario));
        scenariosGrid.appendChild(card);
    }
}

function renderScenarios() {
    if (!AppState.scenarios) return;
    
    allScenarios = AppState.scenarios;
    
    updateHeaderXP();
    updateHeaderUser();
    renderCategoryTabs();
    renderScenariosGrid();
    updateContinueLearning();
}

window.updateHeaderXP = updateHeaderXP;
window.updateHeaderUser = updateHeaderUser;
window.updateContinueLearning = updateContinueLearning;
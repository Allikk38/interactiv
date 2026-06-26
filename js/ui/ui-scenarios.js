// ===== РЕНДЕРИНГ СЦЕНАРИЕВ =====

// Используем глобальную переменную, объявленную в ui.js
// currentCategory уже объявлена в ui.js, не объявляем её заново

function sortScenarios(scenarios) {
    return [...scenarios].sort(function(a, b) {
        var orderA = a.order !== undefined ? a.order : Infinity;
        var orderB = b.order !== undefined ? b.order : Infinity;
        if (orderA !== orderB) return orderA - orderB;
        return a.name.localeCompare(b.name, 'ru');
    });
}

function renderScenariosGrid() {
    var container = document.getElementById('scenarios-grid');
    if (!container) return;
    
    container.innerHTML = '';
    
    var scenarios = window.StoreInstance ? StoreInstance.getScenarios() : [];
    if (scenarios.length === 0) {
        scenarios = window.allScenarios || [];
    }
    
    window.allScenarios = scenarios;
    
    var filteredScenarios = scenarios;
    if (window.currentCategory !== undefined && window.currentCategory !== 'all') {
        filteredScenarios = scenarios.filter(function(s) {
            return s.group === window.currentCategory;
        });
    }
    
    filteredScenarios = sortScenarios(filteredScenarios);
    
    if (filteredScenarios.length === 0) {
        container.innerHTML = '<div class="empty-message"><i class="fas fa-folder-open"></i> Нет сценариев в этой категории</div>';
        return;
    }
    
    for (var i = 0; i < filteredScenarios.length; i++) {
        var scenario = filteredScenarios[i];
        var card = createScenarioCard(scenario);
        container.appendChild(card);
    }
}

function createScenarioCard(scenario) {
    var hasBadge = false;
    try {
        hasBadge = Badges.has(scenario.badge);
    } catch (e) {
        hasBadge = false;
    }
    
    var difficultyInfo = getDifficultyInfo(scenario);
    var difficulty = difficultyInfo.difficulty;
    var difficultyLabel = difficultyInfo.difficultyLabel;
    var difficultyStars = difficultyInfo.difficultyStars;
    
    var difficultyClass = difficulty === 'easy' ? 'scenario-card-new__difficulty--easy' : 
                            (difficulty === 'hard' ? 'scenario-card-new__difficulty--hard' : 'scenario-card-new__difficulty--medium');
    var icon = scenario.icon || 'fa-book-open';
    
    var stepCounts = countStepsByType(scenario.steps);
    var stepsHtml = '';
    var stepTypes = ['map', 'quiz', 'timer-quiz', 'decision-chain', 'client-journey', 
                       'platforms', 'rule3t', 'profile', 'content-plan', 'funnel', 
                       'ai-tools', 'analytics', 'matching', 'pipeline', 'dialogue', 'brief'];
    for (var i = 0; i < stepTypes.length; i++) {
        var type = stepTypes[i];
        if (stepCounts[type]) {
            stepsHtml += '<span class="step-tag">' + getStepIcon(type) + ' ' + stepCounts[type] + '</span>';
        }
    }
    if (!stepsHtml) {
        var stepCount = scenario.steps.filter(function(s) { return s.type !== 'finish'; }).length;
        stepsHtml = '<span class="step-tag"><i class="fas fa-cog"></i> ' + stepCount + '</span>';
    }
    
    var progressHtml = '';
    var actionHtml = '';
    var savedProgress = null;
    try {
        savedProgress = User.getScenarioProgress(scenario.id);
    } catch (e) {
        savedProgress = null;
    }
    
    if (savedProgress && savedProgress.stepIndex > 0) {
        var totalSteps = scenario.steps.filter(function(s) { return s.type !== 'finish'; }).length;
        var percent = Math.round((savedProgress.stepIndex / totalSteps) * 100);
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
    
    var card = document.createElement('div');
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
    
    card.addEventListener('click', function(e) {
        if (e.target.closest('.scenario-card-new__btn')) return;
        if (typeof startScenario === 'function') {
            startScenario(scenario);
        }
    });
    
    var btn = card.querySelector('.scenario-card-new__btn');
    if (btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (typeof startScenario === 'function') {
                startScenario(scenario);
            }
        });
    }
    
    return card;
}

function renderScenarios() {
    var scenarios = window.StoreInstance ? StoreInstance.getScenarios() : [];
    if (scenarios.length === 0) {
        scenarios = window.allScenarios || [];
    }
    
    if (!scenarios || scenarios.length === 0) {
        console.warn('[UI] Сценарии ещё не загружены');
        return;
    }
    
    window.allScenarios = scenarios;
    
    if (typeof renderAgentDashboard === 'function') {
        renderAgentDashboard();
    }
    
    if (typeof updateQuickStats === 'function') {
        updateQuickStats();
    }
    
    if (typeof renderCategoryChips === 'function') {
        renderCategoryChips();
    }
    
    if (typeof renderScenariosGrid === 'function') {
        renderScenariosGrid();
    }
    
    if (typeof renderRecommendations === 'function') {
        renderRecommendations();
    }
    
    if (typeof updateContinueLearning === 'function') {
        updateContinueLearning();
    }
    
    if (typeof updateHeaderXP === 'function') {
        updateHeaderXP();
    }
    
    if (typeof updateHeaderUser === 'function') {
        updateHeaderUser();
    }
}

// Экспортируем функции в глобальную область
window.renderScenarios = renderScenarios;
window.renderScenariosGrid = renderScenariosGrid;
window.sortScenarios = sortScenarios;
window.createScenarioCard = createScenarioCard;
// ===== РЕНДЕРИНГ СЦЕНАРИЕВ =====

function sortScenarios(scenarios) {
    return [...scenarios].sort((a, b) => {
        const orderA = a.order !== undefined ? a.order : Infinity;
        const orderB = b.order !== undefined ? b.order : Infinity;
        if (orderA !== orderB) return orderA - orderB;
        return a.name.localeCompare(b.name, 'ru');
    });
}

function renderScenariosGrid() {
    const container = document.getElementById('scenarios-grid');
    if (!container) return;
    
    container.innerHTML = '';
    
    let filteredScenarios = allScenarios;
    if (currentCategory !== 'all') {
        filteredScenarios = allScenarios.filter(s => s.group === currentCategory);
    }
    
    filteredScenarios = sortScenarios(filteredScenarios);
    
    if (filteredScenarios.length === 0) {
        container.innerHTML = '<div class="empty-message"><i class="fas fa-folder-open"></i> Нет сценариев в этой категории</div>';
        return;
    }
    
    for (const scenario of filteredScenarios) {
        const card = createScenarioCard(scenario);
        container.appendChild(card);
    }
}

function createScenarioCard(scenario) {
    const hasBadge = Badges.has(scenario.badge);
    const { difficulty, difficultyLabel, difficultyStars } = getDifficultyInfo(scenario);
    const difficultyClass = difficulty === 'easy' ? 'scenario-card-new__difficulty--easy' : 
                            (difficulty === 'hard' ? 'scenario-card-new__difficulty--hard' : 'scenario-card-new__difficulty--medium');
    const icon = scenario.icon || 'fa-book-open';
    
    const stepCounts = countStepsByType(scenario.steps);
    let stepsHtml = '';
    const stepTypes = ['map', 'quiz', 'timer-quiz', 'decision-chain', 'client-journey', 
                       'platforms', 'rule3t', 'profile', 'content-plan', 'funnel', 
                       'ai-tools', 'analytics', 'matching', 'pipeline', 'dialogue', 'brief'];
    for (const type of stepTypes) {
        if (stepCounts[type]) {
            stepsHtml += `<span class="step-tag">${getStepIcon(type)} ${stepCounts[type]}</span>`;
        }
    }
    if (!stepsHtml) {
        stepsHtml = `<span class="step-tag"><i class="fas fa-cog"></i> ${scenario.steps.filter(s => s.type !== 'finish').length}</span>`;
    }
    
    let progressHtml = '';
    let actionHtml = '';
    const savedProgress = User.getScenarioProgress(scenario.id);
    
    if (savedProgress && savedProgress.stepIndex > 0) {
        const totalSteps = scenario.steps.filter(s => s.type !== 'finish').length;
        const percent = Math.round((savedProgress.stepIndex / totalSteps) * 100);
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
    
    card.addEventListener('click', (e) => {
        if (e.target.closest('.scenario-card-new__btn')) return;
        if (typeof startScenario === 'function') startScenario(scenario);
    });
    
    const btn = card.querySelector('.scenario-card-new__btn');
    if (btn) {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (typeof startScenario === 'function') startScenario(scenario);
        });
    }
    
    return card;
}

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
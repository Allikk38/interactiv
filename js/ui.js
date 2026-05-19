// ===== UI КОМПОНЕНТЫ =====

function showToast(icon, message, type) {
    const toast = document.getElementById('toast');
    const toastIcon = document.getElementById('toast-icon');
    const toastMessage = document.getElementById('toast-message');
    
    clearTimeout(AppState.toastTimer);
    toastIcon.textContent = icon;
    toastMessage.textContent = message;
    toast.className = `toast toast--${type} toast--show`;
    AppState.toastTimer = setTimeout(() => {
        toast.classList.remove('toast--show');
    }, 3000);
}

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
    changeBtn.textContent = '🔁';
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

function renderScenarios() {
    const scenariosGrid = document.getElementById('scenarios-grid');
    scenariosGrid.innerHTML = '';

    AppState.scenarios.forEach(scenario => {
        const mapSteps = scenario.steps.filter(s => s.type === 'map').length;
        const quizSteps = scenario.steps.filter(s => s.type === 'quiz').length;
        const interactiveSteps = scenario.steps.filter(s => !['map', 'quiz', 'finish', 'brief'].includes(s.type)).length;

        let stepsDesc = [];
        if (mapSteps > 0) stepsDesc.push(`${mapSteps} карт`);
        if (quizSteps > 0) stepsDesc.push(`${quizSteps} тестов`);
        if (interactiveSteps > 0) stepsDesc.push(`${interactiveSteps} заданий`);

        const icon = scenario.icon || '📋';
        const hasBadge = Badges.has(scenario.badge);

        const card = document.createElement('div');
        card.className = 'scenario-card';
        card.style.cursor = 'pointer';
        card.innerHTML = `
            <div class="scenario-card__icon">${icon}${hasBadge ? ' 🏅' : ''}</div>
            <div class="scenario-card__name">${scenario.name}</div>
            <div class="scenario-card__description">${scenario.description}</div>
            <div class="scenario-card__steps">${stepsDesc.join(' + ') || scenario.steps.length + ' шагов'}</div>
        `;

        card.addEventListener('click', () => startScenario(scenario));
        scenariosGrid.appendChild(card);
    });
}
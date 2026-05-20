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

function renderScenarios() {
    const scenariosGrid = document.getElementById('scenarios-grid');
    scenariosGrid.innerHTML = '';

    // Группируем сценарии
    const grouped = {};
    AppState.scenarios.forEach(scenario => {
        const groupName = scenario.group || 'Другие';
        if (!grouped[groupName]) {
            grouped[groupName] = [];
        }
        grouped[groupName].push(scenario);
    });

    // Сортируем группы
    const sortedGroups = Object.keys(grouped).sort();

    // Создаём аккордеон
    sortedGroups.forEach((groupName, groupIndex) => {
        const scenarios = grouped[groupName];
        
        // Контейнер группы
        const groupContainer = document.createElement('div');
        groupContainer.className = 'scenario-group';
        groupContainer.dataset.group = groupName;
        
        // Заголовок аккордеона
        const groupHeader = document.createElement('div');
        groupHeader.className = 'scenario-group__header';
        
        // Иконка для группы
        let groupIcon = 'fa-folder';
        if (groupName.includes('Картография')) groupIcon = 'fa-map';
        if (groupName.includes('Маркетинг')) groupIcon = 'fa-chart-line';
        if (groupName.includes('Урок')) groupIcon = 'fa-graduation-cap';
        
        groupHeader.innerHTML = `
            <div class="scenario-group__title">
                <i class="fas ${groupIcon} scenario-group__icon"></i>
                <span>${groupName}</span>
                <span class="scenario-group__count">${scenarios.length}</span>
            </div>
            <i class="fas fa-chevron-down scenario-group__toggle"></i>
        `;
        
        // Контент группы (карточки)
        const groupContent = document.createElement('div');
        groupContent.className = 'scenario-group__content';
        
        scenarios.forEach(scenario => {
            const mapSteps = scenario.steps.filter(s => s.type === 'map').length;
            const quizSteps = scenario.steps.filter(s => s.type === 'quiz').length;
            const interactiveSteps = scenario.steps.filter(s => !['map', 'quiz', 'finish', 'brief'].includes(s.type)).length;

            let stepsDesc = [];
            if (mapSteps > 0) stepsDesc.push(`${mapSteps} карт`);
            if (quizSteps > 0) stepsDesc.push(`${quizSteps} тестов`);
            if (interactiveSteps > 0) stepsDesc.push(`${interactiveSteps} заданий`);

            const hasBadge = Badges.has(scenario.badge);
            
            // Используем иконку из сценария или стандартную
            const scenarioIcon = scenario.icon || 'fa-book-open';

            const card = document.createElement('div');
            card.className = 'scenario-card';
            card.innerHTML = `
                <div class="scenario-card__icon">
                    <i class="fas ${scenarioIcon}"></i>
                    ${hasBadge ? '<i class="fas fa-certificate scenario-card__badge"></i>' : ''}
                </div>
                <div class="scenario-card__name">${scenario.name}</div>
                <div class="scenario-card__description">${scenario.description}</div>
                <div class="scenario-card__steps">${stepsDesc.join(' · ') || scenario.steps.length + ' шагов'}</div>
            `;
            
            card.addEventListener('click', () => startScenario(scenario));
            groupContent.appendChild(card);
        });
        
        groupContainer.appendChild(groupHeader);
        groupContainer.appendChild(groupContent);
        scenariosGrid.appendChild(groupContainer);
        
        // Анимация открытия/закрытия
        groupHeader.addEventListener('click', () => {
            const isOpen = groupContainer.classList.contains('scenario-group--open');
            if (isOpen) {
                groupContainer.classList.remove('scenario-group--open');
            } else {
                groupContainer.classList.add('scenario-group--open');
            }
        });
        
        // По умолчанию первая группа открыта, остальные закрыты
        if (groupIndex === 0) {
            groupContainer.classList.add('scenario-group--open');
        }
    });
}

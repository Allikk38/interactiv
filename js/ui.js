// ===== UI КОМПОНЕНТЫ =====

// Функция showToast теперь глобальная (из utils/toast.js)
// Локальное определение УДАЛЕНО

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
        
        // Определяем иконку для группы
        let groupIcon = 'fa-folder';
        if (groupName.includes('Картография')) groupIcon = 'fa-map';
        if (groupName.includes('Маркетинг')) groupIcon = 'fa-chart-line';
        if (groupName.includes('Урок')) groupIcon = 'fa-graduation-cap';
        if (groupName.includes('Практика')) groupIcon = 'fa-handshake';
        
        // Создаём контейнер для карточек внутри группы
        const cardsGrid = document.createElement('div');
        cardsGrid.className = 'scenarios-grid';
        
        // Генерируем карточки
        scenarios.forEach(scenario => {
            const mapSteps = scenario.steps.filter(s => s.type === 'map').length;
            const quizSteps = scenario.steps.filter(s => s.type === 'quiz').length;
            const interactiveSteps = scenario.steps.filter(s => !['map', 'quiz', 'finish', 'brief', 'client-journey'].includes(s.type)).length;

            let stepsDesc = [];
            if (mapSteps > 0) stepsDesc.push(`${mapSteps} карт`);
            if (quizSteps > 0) stepsDesc.push(`${quizSteps} тестов`);
            if (interactiveSteps > 0) stepsDesc.push(`${interactiveSteps} заданий`);

            const hasBadge = Badges.has(scenario.badge);
            const scenarioIcon = scenario.icon || 'fa-book-open';

            // Создаём карточку через DOM-элементы (для привязки события click)
            const card = document.createElement('div');
            card.className = 'scenario-card';
            // Используем шаблон для внутреннего HTML
            card.innerHTML = renderScenarioCard(scenario, hasBadge, stepsDesc, scenarioIcon);
            
            card.addEventListener('click', () => startScenario(scenario));
            cardsGrid.appendChild(card);
        });
        
        // Создаём группу через шаблон, затем добавляем cardsGrid
        const groupContainer = document.createElement('div');
        groupContainer.className = 'scenario-group';
        groupContainer.dataset.group = groupName;
        
        const headerHtml = renderScenarioGroupHeader(groupName, scenarios.length, groupIcon);
        const headerDiv = document.createElement('div');
        headerDiv.className = 'scenario-group__header';
        headerDiv.innerHTML = headerHtml;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'scenario-group__content';
        contentDiv.appendChild(cardsGrid);
        
        groupContainer.appendChild(headerDiv);
        groupContainer.appendChild(contentDiv);
        scenariosGrid.appendChild(groupContainer);
        
        // Обработчик клика по заголовку
        headerDiv.addEventListener('click', (e) => {
            e.stopPropagation();
            groupContainer.classList.toggle('scenario-group--open');
        });
        
        // По умолчанию первая группа открыта
        if (groupIndex === 0) {
            groupContainer.classList.add('scenario-group--open');
        }
    });
}

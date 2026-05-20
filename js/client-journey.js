// ===== СКВОЗНОЙ СЦЕНАРИЙ: ПУТЬ КЛИЕНТА С МИНИ-ЗАДАНИЯМИ =====

const ClientJourney = {
    currentStage: 0,
    stages: [],
    decisions: [],
    journeyData: null
};

window.runClientJourneyStep = function(step) {
    const journeyData = AppState.currentScenario.clientJourney;
    if (!journeyData || !journeyData.stages) {
        console.error('Нет данных для сценария клиентского пути');
        AppState.currentStepIndex++;
        if (typeof runStep === 'function') runStep();
        return;
    }
    
    ClientJourney.currentStage = 0;
    ClientJourney.stages = journeyData.stages;
    ClientJourney.decisions = [];
    ClientJourney.journeyData = journeyData;
    
    showClientJourneyScreen();
    renderClientJourneyStage(0);
};

function showClientJourneyScreen() {
    const mapScreen = document.getElementById('map-screen');
    const quizScreen = document.getElementById('quiz-screen');
    const finishScreen = document.getElementById('finish-screen');
    const journeyScreen = document.getElementById('client-journey-screen');
    
    if (mapScreen) mapScreen.classList.add('hidden');
    if (quizScreen) quizScreen.classList.add('hidden');
    if (finishScreen) finishScreen.classList.add('hidden');
    if (journeyScreen) journeyScreen.classList.remove('hidden');
}

function renderClientJourneyStage(stageIndex) {
    const stages = ClientJourney.stages;
    
    if (stageIndex >= stages.length) {
        finishClientJourney();
        return;
    }
    
    const stage = stages[stageIndex];
    const currentStepNumber = AppState.currentStepIndex + 1;
    const totalSteps = AppState.currentScenario.steps.length;
    
    const stepTitle = document.getElementById('journey-step-title');
    const stepCounter = document.getElementById('journey-step-counter');
    if (stepTitle) stepTitle.textContent = stage.title;
    if (stepCounter) stepCounter.textContent = `Шаг ${currentStepNumber} из ${totalSteps} · Этап ${stageIndex + 1} из ${stages.length}`;
    
    const container = document.getElementById('journey-container');
    if (!container) return;
    
    // В зависимости от типа задания рендерим разный интерфейс
    if (stage.type === 'select-plans') {
        renderSelectPlansStage(stage, container, stageIndex);
    } else if (stage.type === 'notify-developer') {
        renderNotifyDeveloperStage(stage, container, stageIndex);
    } else if (stage.type === 'calculate-benefit') {
        renderCalculateBenefitStage(stage, container, stageIndex);
    } else if (stage.type === 'sort-steps') {
        renderSortStepsStage(stage, container, stageIndex);
    } else {
        renderDialogueStage(stage, container, stageIndex);
    }
}

// ===== ОБЫЧНЫЙ ДИАЛОГ (как было) =====
function renderDialogueStage(stage, container, stageIndex) {
    let optionsHTML = '';
    if (stage.options) {
        stage.options.forEach((opt, idx) => {
            optionsHTML += `
                <div class="journey-option" data-opt-index="${idx}" data-next-stage="${opt.nextStage !== undefined ? opt.nextStage : stageIndex + 1}">
                    <div class="journey-option__text">${escapeHtml(opt.text)}</div>
                </div>
            `;
        });
    }
    
    container.innerHTML = `
        <div class="journey-container-inner">
            <div class="journey-progress">
                <div class="journey-progress__bar" style="width: ${((stageIndex + 1) / ClientJourney.stages.length) * 100}%"></div>
            </div>
            <div class="journey-client">
                <div class="journey-client__avatar"><i class="fas ${stage.clientIcon || 'fa-user-circle'}"></i></div>
                <div class="journey-client__name">${escapeHtml(stage.clientName || 'Клиент')}</div>
                <div class="journey-client__message">${escapeHtml(stage.clientMessage || '')}</div>
            </div>
            <div class="journey-agent">
                <div class="journey-agent__label"><i class="fas fa-comment-dots"></i> Ваш ответ:</div>
                <div class="journey-agent__options">${optionsHTML}</div>
            </div>
            <div class="journey-feedback" style="display: none;"></div>
            <button class="btn btn--primary journey-next-btn" style="display: none;">Далее</button>
        </div>
    `;
    
    attachDialogueHandlers(stage, stageIndex);
}

function attachDialogueHandlers(stage, stageIndex) {
    document.querySelectorAll('.journey-option').forEach(opt => {
        opt.addEventListener('click', () => {
            if (opt.classList.contains('journey-option--selected')) return;
            
            const optIndex = parseInt(opt.dataset.optIndex);
            const selectedOption = stage.options[optIndex];
            const isCorrect = selectedOption.correct || false;
            
            document.querySelectorAll('.journey-option').forEach(o => {
                o.style.pointerEvents = 'none';
            });
            opt.classList.add('journey-option--selected');
            if (isCorrect) opt.classList.add('journey-option--correct');
            else opt.classList.add('journey-option--wrong');
            
            const feedbackDiv = document.querySelector('.journey-feedback');
            if (feedbackDiv) {
                feedbackDiv.style.display = 'flex';
                feedbackDiv.innerHTML = `
                    <div class="journey-feedback__icon"><i class="fas ${isCorrect ? 'fa-check-circle' : 'fa-exclamation-triangle'}"></i></div>
                    <div class="journey-feedback__text"><strong>${isCorrect ? 'Верно' : 'Можно лучше:'}</strong><br>${escapeHtml(selectedOption.feedback)}</div>
                `;
                feedbackDiv.classList.add(isCorrect ? 'journey-feedback--correct' : 'journey-feedback--wrong');
            }
            
            ClientJourney.decisions.push({
                stage: ClientJourney.currentStage,
                stageTitle: stage.title,
                choice: selectedOption.text,
                isCorrect: isCorrect
            });
            
            const nextBtn = document.querySelector('.journey-next-btn');
            if (nextBtn) {
                nextBtn.style.display = 'block';
                const nextStage = selectedOption.nextStage !== undefined ? parseInt(selectedOption.nextStage) : ClientJourney.currentStage + 1;
                nextBtn.onclick = () => {
                    ClientJourney.currentStage = nextStage;
                    renderClientJourneyStage(nextStage);
                };
            }
        });
    });
}

// ===== ЗАДАНИЕ 1: ВЫБОР ПЛАНИРОВОК =====
async function renderSelectPlansStage(stage, container, stageIndex) {
    // Загружаем планировки
    let plans = [];
    try {
        const response = await fetch('data/floorplans.json');
        plans = await response.json();
    } catch(e) {
        console.error('Ошибка загрузки планировок', e);
    }
    
    let plansHTML = '';
    plans.forEach(plan => {
        plansHTML += `
            <div class="plan-card" data-plan-id="${plan.id}" data-price="${plan.price}" data-rooms="${plan.rooms}">
                <div class="plan-card__image">
                    ${plan.image ? `<img src="${plan.image}" alt="${plan.name}">` : '<div class="plan-card__placeholder"><i class="fas fa-building"></i></div>'}
                </div>
                <div class="plan-card__info">
                    <h4>${escapeHtml(plan.name)}</h4>
                    <p>${plan.rooms} комната · ${plan.area} м²</p>
                    <p class="plan-card__price">${(plan.price / 1000000).toFixed(1)} млн ₽</p>
                    <p class="plan-card__complex">${escapeHtml(plan.complex)}</p>
                </div>
                <div class="plan-card__select">
                    <i class="far fa-square"></i>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = `
        <div class="journey-container-inner">
            <div class="journey-progress">
                <div class="journey-progress__bar" style="width: ${((stageIndex + 1) / ClientJourney.stages.length) * 100}%"></div>
            </div>
            <div class="journey-client">
                <div class="journey-client__avatar"><i class="fas ${stage.clientIcon || 'fa-user-circle'}"></i></div>
                <div class="journey-client__name">${escapeHtml(stage.clientName || 'Клиент')}</div>
                <div class="journey-client__message">${escapeHtml(stage.clientMessage || '')}</div>
            </div>
            <div class="journey-task">
                <div class="journey-task__title">${stage.taskTitle || 'Выберите подходящие планировки'}</div>
                <div class="journey-task__desc">${stage.taskDescription || ''}</div>
                <div class="plans-grid" id="plans-grid">${plansHTML}</div>
                <button class="btn btn--primary check-plans-btn">Проверить</button>
            </div>
            <div class="journey-feedback" style="display: none;"></div>
            <button class="btn btn--primary journey-next-btn" style="display: none;">Далее</button>
        </div>
    `;
    
    // Обработка выбора планировок
    let selectedPlans = [];
    document.querySelectorAll('.plan-card').forEach(card => {
        card.addEventListener('click', () => {
            const icon = card.querySelector('.plan-card__select i');
            if (card.classList.contains('selected')) {
                card.classList.remove('selected');
                icon.className = 'far fa-square';
                selectedPlans = selectedPlans.filter(id => id !== parseInt(card.dataset.planId));
            } else {
                card.classList.add('selected');
                icon.className = 'fas fa-check-square';
                selectedPlans.push(parseInt(card.dataset.planId));
            }
        });
    });
    
    document.querySelector('.check-plans-btn').addEventListener('click', () => {
        const correctIds = stage.correctPlanIds || [1, 2];
        const isCorrect = correctIds.length === selectedPlans.length && correctIds.every(id => selectedPlans.includes(id));
        
        document.querySelectorAll('.plan-card').forEach(card => {
            card.style.pointerEvents = 'none';
        });
        
        const feedbackDiv = document.querySelector('.journey-feedback');
        feedbackDiv.style.display = 'flex';
        if (isCorrect) {
            feedbackDiv.innerHTML = `<div class="journey-feedback__icon"><i class="fas fa-check-circle"></i></div><div class="journey-feedback__text"><strong>Верно!</strong><br>${stage.correctFeedback || 'Вы выбрали подходящие под бюджет планировки.'}</div>`;
            feedbackDiv.classList.add('journey-feedback--correct');
        } else {
            feedbackDiv.innerHTML = `<div class="journey-feedback__icon"><i class="fas fa-exclamation-triangle"></i></div><div class="journey-feedback__text"><strong>Неверно</strong><br>${stage.wrongFeedback || 'Учтите бюджет клиента и его пожелания.'}</div>`;
            feedbackDiv.classList.add('journey-feedback--wrong');
        }
        
        ClientJourney.decisions.push({
            stage: ClientJourney.currentStage,
            stageTitle: stage.title,
            choice: selectedPlans,
            isCorrect: isCorrect
        });
        
        const nextBtn = document.querySelector('.journey-next-btn');
        nextBtn.style.display = 'block';
        nextBtn.onclick = () => {
            ClientJourney.currentStage = stageIndex + 1;
            renderClientJourneyStage(stageIndex + 1);
        };
    });
}

// ===== ЗАДАНИЕ 2: УВЕДОМЛЕНИЕ ЗАСТРОЙЩИКА =====
function renderNotifyDeveloperStage(stage, container, stageIndex) {
    let optionsHTML = '';
    stage.options.forEach((opt, idx) => {
        optionsHTML += `
            <div class="journey-option notify-option" data-opt-index="${idx}" data-correct="${opt.correct}">
                <div class="journey-option__text">${escapeHtml(opt.text)}</div>
            </div>
        `;
    });
    
    container.innerHTML = `
        <div class="journey-container-inner">
            <div class="journey-progress">
                <div class="journey-progress__bar" style="width: ${((stageIndex + 1) / ClientJourney.stages.length) * 100}%"></div>
            </div>
            <div class="journey-task">
                <div class="journey-task__title">${stage.taskTitle || 'Уведомление застройщика'}</div>
                <div class="journey-task__desc">${stage.taskDescription || ''}</div>
                <div class="journey-agent__options">${optionsHTML}</div>
            </div>
            <div class="journey-feedback" style="display: none;"></div>
            <button class="btn btn--primary journey-next-btn" style="display: none;">Далее</button>
        </div>
    `;
    
    document.querySelectorAll('.notify-option').forEach(opt => {
        opt.addEventListener('click', () => {
            if (opt.classList.contains('journey-option--selected')) return;
            
            const isCorrect = opt.dataset.correct === 'true';
            
            document.querySelectorAll('.notify-option').forEach(o => {
                o.style.pointerEvents = 'none';
            });
            opt.classList.add('journey-option--selected');
            if (isCorrect) opt.classList.add('journey-option--correct');
            else opt.classList.add('journey-option--wrong');
            
            const feedbackDiv = document.querySelector('.journey-feedback');
            feedbackDiv.style.display = 'flex';
            if (isCorrect) {
                feedbackDiv.innerHTML = `<div class="journey-feedback__icon"><i class="fas fa-check-circle"></i></div><div class="journey-feedback__text"><strong>Верно!</strong><br>${stage.correctFeedback || 'Клиент закреплён за вами.'}</div>`;
                feedbackDiv.classList.add('journey-feedback--correct');
            } else {
                feedbackDiv.innerHTML = `<div class="journey-feedback__icon"><i class="fas fa-exclamation-triangle"></i></div><div class="journey-feedback__text"><strong>Неверно</strong><br>${stage.wrongFeedback || 'Нужно зафиксировать клиента в отделе продаж.'}</div>`;
                feedbackDiv.classList.add('journey-feedback--wrong');
            }
            
            ClientJourney.decisions.push({
                stage: ClientJourney.currentStage,
                stageTitle: stage.title,
                choice: opt.querySelector('.journey-option__text').textContent,
                isCorrect: isCorrect
            });
            
            const nextBtn = document.querySelector('.journey-next-btn');
            nextBtn.style.display = 'block';
            nextBtn.onclick = () => {
                ClientJourney.currentStage = stageIndex + 1;
                renderClientJourneyStage(stageIndex + 1);
            };
        });
    });
}

// ===== ЗАДАНИЕ 3: РАСЧЁТ ВЫГОДЫ =====
function renderCalculateBenefitStage(stage, container, stageIndex) {
    container.innerHTML = `
        <div class="journey-container-inner">
            <div class="journey-progress">
                <div class="journey-progress__bar" style="width: ${((stageIndex + 1) / ClientJourney.stages.length) * 100}%"></div>
            </div>
            <div class="journey-client">
                <div class="journey-client__avatar"><i class="fas ${stage.clientIcon || 'fa-user-circle'}"></i></div>
                <div class="journey-client__name">${escapeHtml(stage.clientName || 'Клиент')}</div>
                <div class="journey-client__message">${escapeHtml(stage.clientMessage || '')}</div>
            </div>
            <div class="journey-task">
                <div class="journey-task__title">${stage.taskTitle || 'Рассчитайте выгоду'}</div>
                <div class="journey-task__desc">${stage.taskDescription || ''}</div>
                <div class="benefit-calculator">
                    <div class="benefit-field">
                        <label>Ежемесячный платёж по новостройке (6%):</label>
                        <input type="number" id="new-payment" placeholder="введите сумму в ₽">
                    </div>
                    <div class="benefit-field">
                        <label>Ежемесячный платёж по вторичке (9%):</label>
                        <input type="number" id="old-payment" placeholder="введите сумму в ₽">
                    </div>
                    <div class="benefit-field">
                        <label>Разница в месяц (экономия):</label>
                        <input type="number" id="month-diff" placeholder="введите сумму в ₽">
                    </div>
                    <div class="benefit-field">
                        <label>Экономия в год:</label>
                        <input type="number" id="year-diff" placeholder="введите сумму в ₽">
                    </div>
                    <button class="btn btn--primary check-benefit-btn">Проверить</button>
                </div>
            </div>
            <div class="journey-feedback" style="display: none;"></div>
            <button class="btn btn--primary journey-next-btn" style="display: none;">Далее</button>
        </div>
    `;
    
    document.querySelector('.check-benefit-btn').addEventListener('click', () => {
        const newPayment = parseFloat(document.getElementById('new-payment').value);
        const oldPayment = parseFloat(document.getElementById('old-payment').value);
        const monthDiff = parseFloat(document.getElementById('month-diff').value);
        const yearDiff = parseFloat(document.getElementById('year-diff').value);
        
        const correctNew = 42986;  // 6% от 6 млн на 20 лет
        const correctOld = 53989;   // 9% от 6 млн на 20 лет
        const correctMonthDiff = 11003;
        const correctYearDiff = 132036;
        
        const tolerance = 500;
        const isNewOk = Math.abs(newPayment - correctNew) <= tolerance;
        const isOldOk = Math.abs(oldPayment - correctOld) <= tolerance;
        const isMonthOk = Math.abs(monthDiff - correctMonthDiff) <= tolerance;
        const isYearOk = Math.abs(yearDiff - correctYearDiff) <= tolerance;
        const isCorrect = isNewOk && isOldOk && isMonthOk && isYearOk;
        
        const feedbackDiv = document.querySelector('.journey-feedback');
        feedbackDiv.style.display = 'flex';
        
        if (isCorrect) {
            feedbackDiv.innerHTML = `<div class="journey-feedback__icon"><i class="fas fa-check-circle"></i></div><div class="journey-feedback__text"><strong>Верно!</strong><br>Экономия 11 003 ₽ в месяц и 132 036 ₽ в год. Клиент увидит выгоду!</div>`;
            feedbackDiv.classList.add('journey-feedback--correct');
        } else {
            feedbackDiv.innerHTML = `<div class="journey-feedback__icon"><i class="fas fa-exclamation-triangle"></i></div><div class="journey-feedback__text"><strong>Неверно</strong><br>Правильные цифры: платеж по новостройке ≈ 43 000 ₽, по вторичке ≈ 54 000 ₽, экономия ≈ 11 000 ₽ в месяц.</div>`;
            feedbackDiv.classList.add('journey-feedback--wrong');
        }
        
        ClientJourney.decisions.push({
            stage: ClientJourney.currentStage,
            stageTitle: stage.title,
            choice: { newPayment, oldPayment, monthDiff, yearDiff },
            isCorrect: isCorrect
        });
        
        const nextBtn = document.querySelector('.journey-next-btn');
        nextBtn.style.display = 'block';
        nextBtn.onclick = () => {
            ClientJourney.currentStage = stageIndex + 1;
            renderClientJourneyStage(stageIndex + 1);
        };
    });
}

// ===== ЗАДАНИЕ 4: СОРТИРОВКА ШАГОВ =====
function renderSortStepsStage(stage, container, stageIndex) {
    const steps = [...stage.stepsToSort];
    const shuffled = [...steps].sort(() => Math.random() - 0.5);
    
    let stepsHTML = '';
    shuffled.forEach((step, idx) => {
        stepsHTML += `
            <div class="sort-step" data-step-id="${step.id}" data-order="${step.order}" draggable="true">
                <span class="sort-step__handle"><i class="fas fa-grip-vertical"></i></span>
                <span class="sort-step__text">${escapeHtml(step.text)}</span>
                <span class="sort-step__num"></span>
            </div>
        `;
    });
    
    container.innerHTML = `
        <div class="journey-container-inner">
            <div class="journey-progress">
                <div class="journey-progress__bar" style="width: ${((stageIndex + 1) / ClientJourney.stages.length) * 100}%"></div>
            </div>
            <div class="journey-task">
                <div class="journey-task__title">${stage.taskTitle || 'Расставьте шаги в правильном порядке'}</div>
                <div class="journey-task__desc">${stage.taskDescription || ''}</div>
                <div class="sort-steps-container" id="sort-steps-container">${stepsHTML}</div>
                <button class="btn btn--primary check-sort-btn">Проверить</button>
            </div>
            <div class="journey-feedback" style="display: none;"></div>
            <button class="btn btn--primary journey-next-btn" style="display: none;">Далее</button>
        </div>
    `;
    
    // Drag-and-drop логика
    const containerSort = document.getElementById('sort-steps-container');
    let draggedItem = null;
    
    document.querySelectorAll('.sort-step').forEach(item => {
        item.addEventListener('dragstart', (e) => {
            draggedItem = item;
            item.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });
        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
            draggedItem = null;
        });
        item.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });
        item.addEventListener('drop', (e) => {
            e.preventDefault();
            if (draggedItem && draggedItem !== item) {
                const items = [...containerSort.querySelectorAll('.sort-step')];
                const fromIndex = items.indexOf(draggedItem);
                const toIndex = items.indexOf(item);
                if (fromIndex < toIndex) {
                    containerSort.insertBefore(draggedItem, item.nextSibling);
                } else {
                    containerSort.insertBefore(draggedItem, item);
                }
            }
        });
    });
    
    document.querySelector('.check-sort-btn').addEventListener('click', () => {
        let correct = 0;
        const total = steps.length;
        
        document.querySelectorAll('.sort-step').forEach((item, index) => {
            const expectedOrder = parseInt(item.dataset.order);
            const numSpan = item.querySelector('.sort-step__num');
            numSpan.textContent = index + 1;
            if (expectedOrder === index + 1) {
                item.classList.add('sort-step--correct');
                correct++;
            } else {
                item.classList.add('sort-step--wrong');
            }
            item.setAttribute('draggable', 'false');
        });
        
        const isCorrect = correct === total;
        const feedbackDiv = document.querySelector('.journey-feedback');
        feedbackDiv.style.display = 'flex';
        
        if (isCorrect) {
            feedbackDiv.innerHTML = `<div class="journey-feedback__icon"><i class="fas fa-check-circle"></i></div><div class="journey-feedback__text"><strong>Верно!</strong><br>${stage.correctFeedback || 'Порядок действий соблюдён.'}</div>`;
            feedbackDiv.classList.add('journey-feedback--correct');
        } else {
            feedbackDiv.innerHTML = `<div class="journey-feedback__icon"><i class="fas fa-exclamation-triangle"></i></div><div class="journey-feedback__text"><strong>Неверно</strong><br>${stage.wrongFeedback || 'Правильный порядок: бронирование → эскроу → ДДУ → регистрация → выписка'}</div>`;
            feedbackDiv.classList.add('journey-feedback--wrong');
        }
        
        ClientJourney.decisions.push({
            stage: ClientJourney.currentStage,
            stageTitle: stage.title,
            isCorrect: isCorrect
        });
        
        const nextBtn = document.querySelector('.journey-next-btn');
        nextBtn.style.display = 'block';
        nextBtn.onclick = () => {
            ClientJourney.currentStage = stageIndex + 1;
            renderClientJourneyStage(stageIndex + 1);
        };
    });
}

function finishClientJourney() {
    const total = ClientJourney.decisions.length;
    const correct = ClientJourney.decisions.filter(d => d.isCorrect).length;
    
    if (AppState && AppState.stepStats) {
        AppState.stepStats.push({
            step: AppState.currentStepIndex + 1,
            type: 'client-journey',
            title: AppState.currentScenario.steps[AppState.currentStepIndex].title,
            correct: correct,
            total: total,
            decisions: ClientJourney.decisions
        });
    }
    
    showToast('📋', `Сценарий завершён. Правильных ответов: ${correct}/${total}`, correct === total ? 'success' : 'warning');
    
    setTimeout(() => {
        if (typeof AppState !== 'undefined' && AppState) {
            AppState.currentStepIndex++;
            if (typeof runStep === 'function') runStep();
        }
    }, 2500);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Стили для новых элементов
function ensureJourneyStyles() {
    if (document.getElementById('journey-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'journey-styles';
    style.textContent = `
        .journey-container-inner {
            max-width: 800px;
            margin: 0 auto;
            padding: 24px;
        }
        .journey-progress {
            background-color: var(--color-border);
            border-radius: 10px;
            height: 8px;
            margin-bottom: 32px;
            overflow: hidden;
        }
        .journey-progress__bar {
            background: linear-gradient(90deg, var(--color-primary), var(--color-success));
            height: 100%;
            transition: width 0.3s ease;
        }
        .journey-client {
            background-color: var(--color-bg);
            border-radius: var(--radius);
            padding: 20px;
            margin-bottom: 24px;
            text-align: center;
        }
        .journey-client__avatar {
            font-size: 3rem;
            margin-bottom: 8px;
            color: var(--color-primary);
        }
        .journey-client__name {
            font-weight: 700;
            margin-bottom: 12px;
        }
        .journey-client__message {
            font-size: 1rem;
            line-height: 1.5;
            color: var(--color-text);
        }
        .journey-task {
            background-color: var(--color-surface);
            border-radius: var(--radius);
            padding: 20px;
            box-shadow: 0 2px 8px var(--color-shadow);
        }
        .journey-task__title {
            font-size: 1.2rem;
            font-weight: 700;
            margin-bottom: 8px;
            color: var(--color-primary);
        }
        .journey-task__desc {
            font-size: 0.9rem;
            color: var(--color-text-light);
            margin-bottom: 20px;
        }
        .journey-agent__options {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .journey-option {
            background-color: var(--color-bg);
            border: 2px solid var(--color-border);
            border-radius: var(--radius-sm);
            padding: 14px 18px;
            cursor: pointer;
            transition: all var(--transition);
        }
        .journey-option:hover {
            border-color: var(--color-primary);
            background-color: #eaf2fd;
        }
        .journey-option--selected {
            border-color: var(--color-success);
            background-color: #eafaf1;
        }
        .journey-option--correct {
            border-color: var(--color-success);
            background-color: #eafaf1;
        }
        .journey-option--wrong {
            border-color: var(--color-danger);
            background-color: #fdedec;
        }
        .journey-feedback {
            margin-top: 20px;
            padding: 16px 20px;
            border-radius: var(--radius-sm);
            display: none;
            gap: 12px;
            align-items: flex-start;
        }
        .journey-feedback--correct {
            background-color: #eafaf1;
            border-left: 4px solid var(--color-success);
        }
        .journey-feedback--wrong {
            background-color: #fef9e7;
            border-left: 4px solid var(--color-warning);
        }
        .journey-feedback__icon {
            font-size: 1.3rem;
        }
        .journey-feedback--correct .journey-feedback__icon {
            color: var(--color-success);
        }
        .journey-feedback--wrong .journey-feedback__icon {
            color: var(--color-warning);
        }
        .journey-feedback__text {
            flex: 1;
            line-height: 1.5;
        }
        .plans-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 16px;
            margin-bottom: 20px;
        }
        .plan-card {
            display: flex;
            gap: 12px;
            background-color: var(--color-bg);
            border: 2px solid var(--color-border);
            border-radius: var(--radius);
            padding: 12px;
            cursor: pointer;
            transition: all var(--transition);
        }
        .plan-card:hover {
            border-color: var(--color-primary);
            transform: translateY(-2px);
        }
        .plan-card.selected {
            border-color: var(--color-success);
            background-color: #eafaf1;
        }
        .plan-card__image {
            width: 80px;
            height: 80px;
            background-color: var(--color-border);
            border-radius: var(--radius-sm);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
        .plan-card__placeholder {
            font-size: 2rem;
            color: var(--color-text-light);
        }
        .plan-card__info {
            flex: 1;
        }
        .plan-card__info h4 {
            font-size: 1rem;
            margin-bottom: 4px;
        }
        .plan-card__info p {
            font-size: 0.8rem;
            color: var(--color-text-light);
            margin-bottom: 2px;
        }
        .plan-card__price {
            font-weight: 700;
            color: var(--color-primary);
        }
        .plan-card__select {
            display: flex;
            align-items: center;
            font-size: 1.5rem;
            color: var(--color-primary);
        }
        .benefit-calculator {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }
        .benefit-field {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        .benefit-field label {
            font-weight: 600;
            font-size: 0.9rem;
        }
        .benefit-field input {
            padding: 10px 12px;
            border: 2px solid var(--color-border);
            border-radius: var(--radius-sm);
            font-size: 1rem;
        }
        .sort-steps-container {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 20px;
        }
        .sort-step {
            display: flex;
            align-items: center;
            gap: 12px;
            background-color: var(--color-bg);
            border: 2px solid var(--color-border);
            border-radius: var(--radius-sm);
            padding: 12px 16px;
            cursor: grab;
            transition: all var(--transition);
        }
        .sort-step:active {
            cursor: grabbing;
        }
        .sort-step.dragging {
            opacity: 0.4;
        }
        .sort-step__handle {
            color: var(--color-text-light);
            font-size: 1.2rem;
            cursor: grab;
        }
        .sort-step__text {
            flex: 1;
            font-size: 0.95rem;
        }
        .sort-step__num {
            width: 28px;
            height: 28px;
            background-color: var(--color-border);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 0.8rem;
        }
        .sort-step--correct {
            border-color: var(--color-success);
            background-color: #eafaf1;
        }
        .sort-step--correct .sort-step__num {
            background-color: var(--color-success);
            color: white;
        }
        .sort-step--wrong {
            border-color: var(--color-danger);
            background-color: #fdedec;
        }
        .sort-step--wrong .sort-step__num {
            background-color: var(--color-danger);
            color: white;
        }
        @media (max-width: 600px) {
            .journey-container-inner {
                padding: 16px;
            }
            .plans-grid {
                grid-template-columns: 1fr;
            }
            .sort-step__text {
                font-size: 0.85rem;
            }
        }
    `;
    document.head.appendChild(style);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureJourneyStyles);
} else {
    ensureJourneyStyles();
}

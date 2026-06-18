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
    
    // В зависимости от типа задания рендерим разный интерфейс через шаблоны
    if (stage.type === 'select-plans') {
        renderSelectPlansStageWithTemplate(stage, container, stageIndex);
    } else if (stage.type === 'notify-developer') {
        renderNotifyDeveloperStageWithTemplate(stage, container, stageIndex);
    } else if (stage.type === 'calculate-benefit') {
        renderCalculateBenefitStageWithTemplate(stage, container, stageIndex);
    } else if (stage.type === 'sort-steps') {
        renderSortStepsStageWithTemplate(stage, container, stageIndex);
    } else {
        renderDialogueStageWithTemplate(stage, container, stageIndex);
    }
}

// ===== ДИАЛОГ С ИСПОЛЬЗОВАНИЕМ ШАБЛОНА =====
function renderDialogueStageWithTemplate(stage, container, stageIndex) {
    const totalStages = ClientJourney.stages.length;
    container.innerHTML = renderDialogueStage(stage, stageIndex, totalStages);
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
                feedbackDiv.innerHTML = renderJourneyFeedback(
                    isCorrect, 
                    selectedOption.feedback, 
                    selectedOption.feedback
                );
                feedbackDiv.style.display = 'flex';
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
                let nextStage = parseInt(opt.dataset.nextStage);
                if (isNaN(nextStage) || nextStage === 'next') {
                    nextStage = ClientJourney.currentStage + 1;
                }
                nextBtn.onclick = () => {
                    ClientJourney.currentStage = nextStage;
                    renderClientJourneyStage(nextStage);
                };
            }
        });
    });
}

// ===== ВЫБОР ПЛАНИРОВОК С ИСПОЛЬЗОВАНИЕМ ШАБЛОНА =====
async function renderSelectPlansStageWithTemplate(stage, container, stageIndex) {
    const totalStages = ClientJourney.stages.length;
    
    // Загружаем планировки
    let plans = [];
    try {
        const response = await fetch('data/floorplans.json');
        plans = await response.json();
    } catch(e) {
        console.error('Ошибка загрузки планировок', e);
    }
    
    container.innerHTML = renderSelectPlansStage(stage, stageIndex, totalStages, plans);
    
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
        feedbackDiv.innerHTML = renderJourneyFeedback(
            isCorrect,
            stage.correctFeedback || 'Вы выбрали подходящие под бюджет планировки.',
            stage.wrongFeedback || 'Учтите бюджет клиента и его пожелания.'
        );
        feedbackDiv.style.display = 'flex';
        
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

// ===== УВЕДОМЛЕНИЕ ЗАСТРОЙЩИКА С ИСПОЛЬЗОВАНИЕМ ШАБЛОНА =====
function renderNotifyDeveloperStageWithTemplate(stage, container, stageIndex) {
    const totalStages = ClientJourney.stages.length;
    container.innerHTML = renderNotifyDeveloperStage(stage, stageIndex, totalStages);
    
    document.querySelectorAll('.notify-option').forEach(opt => {
        opt.addEventListener('click', () => {
            if (opt.classList.contains('journey-option--selected')) return;
            
            const isCorrect = opt.dataset.correct === 'true';
            const optionText = opt.querySelector('.journey-option__text').textContent;
            
            document.querySelectorAll('.notify-option').forEach(o => {
                o.style.pointerEvents = 'none';
            });
            opt.classList.add('journey-option--selected');
            if (isCorrect) opt.classList.add('journey-option--correct');
            else opt.classList.add('journey-option--wrong');
            
            const feedbackDiv = document.querySelector('.journey-feedback');
            feedbackDiv.innerHTML = renderJourneyFeedback(
                isCorrect,
                stage.correctFeedback || 'Клиент закреплён за вами.',
                stage.wrongFeedback || 'Нужно зафиксировать клиента в отделе продаж.'
            );
            feedbackDiv.style.display = 'flex';
            
            ClientJourney.decisions.push({
                stage: ClientJourney.currentStage,
                stageTitle: stage.title,
                choice: optionText,
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

// ===== РАСЧЁТ ВЫГОДЫ С ИСПОЛЬЗОВАНИЕМ ШАБЛОНА =====
function renderCalculateBenefitStageWithTemplate(stage, container, stageIndex) {
    const totalStages = ClientJourney.stages.length;
    container.innerHTML = renderCalculateBenefitStage(stage, stageIndex, totalStages);
    
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
        
        if (isCorrect) {
            feedbackDiv.innerHTML = renderJourneyFeedback(
                true,
                'Экономия 11 003 ₽ в месяц и 132 036 ₽ в год. Клиент увидит выгоду!',
                ''
            );
        } else {
            feedbackDiv.innerHTML = renderJourneyFeedback(
                false,
                '',
                'Правильные цифры: платеж по новостройке ≈ 43 000 ₽, по вторичке ≈ 54 000 ₽, экономия ≈ 11 000 ₽ в месяц.'
            );
        }
        feedbackDiv.style.display = 'flex';
        
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

// ===== СОРТИРОВКА ШАГОВ С ИСПОЛЬЗОВАНИЕМ ШАБЛОНА =====
function renderSortStepsStageWithTemplate(stage, container, stageIndex) {
    const totalStages = ClientJourney.stages.length;
    const steps = [...stage.stepsToSort];
    const shuffled = [...steps].sort(() => Math.random() - 0.5);
    
    container.innerHTML = renderSortStepsStage(stage, stageIndex, totalStages, shuffled);
    
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
        
        feedbackDiv.innerHTML = renderJourneyFeedback(
            isCorrect,
            stage.correctFeedback || 'Порядок действий соблюдён.',
            stage.wrongFeedback || 'Правильный порядок: бронирование → эскроу → ДДУ → регистрация → выписка'
        );
        feedbackDiv.style.display = 'flex';
        
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
        
        if (typeof saveCurrentProgress === 'function') {
            saveCurrentProgress();
        }
        
        if (typeof updateHeaderXP === 'function') {
            updateHeaderXP();
        }
    }
    
    showToast('📋', `Сценарий завершён. Правильных ответов: ${correct}/${total}`, correct === total ? 'success' : 'warning');
    
    setTimeout(() => {
        if (typeof AppState !== 'undefined' && AppState) {
            AppState.currentStepIndex++;
            if (typeof runStep === 'function') runStep();
        }
    }, 2500);
}

// ===== СТИЛИ ДЛЯ НОВЫХ ЭЛЕМЕНТОВ =====
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
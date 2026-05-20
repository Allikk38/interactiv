const ClientJourney = {
    currentStage: 0,
    stages: [],
    decisions: [],
    journeyData: null
};

// Глобальная функция для запуска сценария
window.runClientJourneyStep = function(step) {
    // Получаем данные сценария из AppState.currentScenario.clientJourney
    const journeyData = AppState.currentScenario.clientJourney;
    if (!journeyData || !journeyData.stages) {
        console.error('Нет данных для сценария клиентского пути');
        // Если данных нет — пропускаем шаг
        AppState.currentStepIndex++;
        if (typeof runStep === 'function') runStep();
        return;
    }
    
    // Инициализируем состояние
    ClientJourney.currentStage = 0;
    ClientJourney.stages = journeyData.stages;
    ClientJourney.decisions = [];
    ClientJourney.journeyData = journeyData;
    
    // Показываем экран
    showClientJourneyScreen();
    
    // Рендерим первый этап
    renderClientJourneyStage(0);
};

// Показать экран клиентского пути
function showClientJourneyScreen() {
    // Скрываем другие экраны
    const mapScreen = document.getElementById('map-screen');
    const quizScreen = document.getElementById('quiz-screen');
    const finishScreen = document.getElementById('finish-screen');
    const journeyScreen = document.getElementById('client-journey-screen');
    
    if (mapScreen) mapScreen.classList.add('hidden');
    if (quizScreen) quizScreen.classList.add('hidden');
    if (finishScreen) finishScreen.classList.add('hidden');
    
    // Показываем экран клиентского пути
    if (journeyScreen) {
        journeyScreen.classList.remove('hidden');
    } else {
        console.warn('Экран client-journey-screen не найден');
    }
}

// Рендер текущего этапа
function renderClientJourneyStage(stageIndex) {
    const stages = ClientJourney.stages;
    
    if (stageIndex >= stages.length) {
        finishClientJourney();
        return;
    }
    
    const stage = stages[stageIndex];
    const currentStepNumber = AppState.currentStepIndex + 1;
    const totalSteps = AppState.currentScenario.steps.length;
    
    // Обновляем заголовок на экране клиентского пути
    const stepTitle = document.getElementById('journey-step-title');
    const stepCounter = document.getElementById('journey-step-counter');
    if (stepTitle) stepTitle.textContent = stage.title;
    if (stepCounter) stepCounter.textContent = `Шаг ${currentStepNumber} из ${totalSteps} · Этап ${stageIndex + 1} из ${stages.length}`;
    
    // Получаем контейнер
    const container = document.getElementById('journey-container');
    if (!container) return;
    
    // Генерируем HTML для этапа
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
                <div class="journey-progress__bar" style="width: ${((stageIndex + 1) / stages.length) * 100}%"></div>
            </div>
            <div class="journey-client">
                <div class="journey-client__avatar">
                    <i class="fas ${stage.clientIcon || 'fa-user-circle'}"></i>
                </div>
                <div class="journey-client__name">${escapeHtml(stage.clientName || 'Клиент')}</div>
                <div class="journey-client__message">${escapeHtml(stage.clientMessage || '')}</div>
            </div>
            <div class="journey-agent">
                <div class="journey-agent__label">
                    <i class="fas fa-comment-dots"></i> Ваш ответ:
                </div>
                <div class="journey-agent__options">
                    ${optionsHTML}
                </div>
            </div>
            <div class="journey-feedback" id="journey-feedback" style="display: none;"></div>
            <button class="btn btn--primary" id="journey-next-btn" style="display: none;">Далее</button>
        </div>
    `;
    
    // Привязываем обработчики к опциям
    document.querySelectorAll('.journey-option').forEach(opt => {
        opt.addEventListener('click', () => handleJourneyChoice(opt, stage));
    });
}

// Обработка выбора агента
function handleJourneyChoice(element, stage) {
    // Блокируем повторные клики
    if (element.classList.contains('journey-option--selected')) return;
    
    const optIndex = parseInt(element.dataset.optIndex);
    const selectedOption = stage.options[optIndex];
    const isCorrect = selectedOption.correct || false;
    
    // Отмечаем выбранный вариант
    document.querySelectorAll('.journey-option').forEach(opt => {
        opt.style.pointerEvents = 'none';
    });
    element.classList.add('journey-option--selected');
    if (isCorrect) {
        element.classList.add('journey-option--correct');
    } else {
        element.classList.add('journey-option--wrong');
    }
    
    // Показываем обратную связь
    const feedbackDiv = document.getElementById('journey-feedback');
    
    if (feedbackDiv) {
        feedbackDiv.style.display = 'flex';
        feedbackDiv.innerHTML = `
            <div class="journey-feedback__icon">
                <i class="fas ${isCorrect ? 'fa-check-circle' : 'fa-exclamation-triangle'}"></i>
            </div>
            <div class="journey-feedback__text">
                <strong>${isCorrect ? 'Верно' : 'Можно лучше:'}</strong><br>
                ${escapeHtml(selectedOption.feedback || (isCorrect ? stage.correctFeedback : stage.wrongFeedback || 'Попробуйте другой вариант'))}
            </div>
        `;
        feedbackDiv.classList.add(isCorrect ? 'journey-feedback--correct' : 'journey-feedback--wrong');
    }
    
    // Сохраняем решение
    ClientJourney.decisions.push({
        stage: ClientJourney.currentStage,
        stageTitle: stage.title,
        choice: selectedOption.text,
        isCorrect: isCorrect
    });
    
    // Показываем кнопку "Далее"
    const nextBtn = document.getElementById('journey-next-btn');
    if (nextBtn) {
        nextBtn.style.display = 'block';
        
        // Определяем следующий этап (если есть ветвление)
        const nextStage = selectedOption.nextStage !== undefined 
            ? parseInt(selectedOption.nextStage) 
            : ClientJourney.currentStage + 1;
        
        nextBtn.onclick = () => {
            ClientJourney.currentStage = nextStage;
            renderClientJourneyStage(nextStage);
        };
    }
}

// Завершение сценария
function finishClientJourney() {
    // Подсчитываем статистику
    const total = ClientJourney.decisions.length;
    const correct = ClientJourney.decisions.filter(d => d.isCorrect).length;
    
    // Сохраняем статистику
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
    
    const toast = document.getElementById('toast');
    if (toast) {
        showToast('📋', `Сценарий завершён. Правильных ответов: ${correct}/${total}`, correct === total ? 'success' : 'warning');
    }
    
    // Переходим к следующему шагу
    setTimeout(() => {
        if (typeof AppState !== 'undefined' && AppState) {
            AppState.currentStepIndex++;
            if (typeof runStep === 'function') runStep();
        }
    }, 2500);
}

// Вспомогательная функция escapeHtml
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Добавление стилей для клиентского пути (если ещё нет)
function ensureJourneyStyles() {
    if (document.getElementById('journey-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'journey-styles';
    style.textContent = `
        .journey-container-inner {
            max-width: 700px;
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
        .journey-agent {
            background-color: var(--color-surface);
            border-radius: var(--radius);
            padding: 20px;
            box-shadow: 0 2px 8px var(--color-shadow);
        }
        .journey-agent__label {
            font-weight: 600;
            margin-bottom: 16px;
            color: var(--color-primary);
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
            display: flex;
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
        @media (max-width: 600px) {
            .journey-container-inner {
                padding: 16px;
            }
            .journey-client__message {
                font-size: 0.9rem;
            }
            .journey-option {
                padding: 12px 14px;
                font-size: 0.9rem;
            }
        }
    `;
    document.head.appendChild(style);
}

// Вызываем добавление стилей при загрузке
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureJourneyStyles);
} else {
    ensureJourneyStyles();
}

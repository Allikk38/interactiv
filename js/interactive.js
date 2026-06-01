// ===== ВСЕ ИНТЕРАКТИВНЫЕ ШАГИ =====

function runPlatformsStep(step) {
    const quizScreen = document.getElementById('quiz-screen');
    const quizStepTitle = document.getElementById('quiz-step-title');
    const quizStepCounter = document.getElementById('quiz-step-counter');
    const quizContainer = document.getElementById('quiz-container');
    
    quizScreen.classList.remove('hidden');
    quizStepTitle.textContent = step.title;
    quizStepCounter.textContent = `Шаг ${AppState.currentStepIndex + 1} из ${AppState.currentScenario.steps.length}`;

    const data = AppState.marketingData.platforms;
    const items = [...data.items].sort(() => Math.random() - 0.5);

    let itemsHTML = '';
    items.forEach(item => {
        itemsHTML += renderPlatformItem(item);
    });

    quizContainer.innerHTML = renderPlatformsStep(data, itemsHTML);

    const checkBtn = document.getElementById('interactive-check-btn');
    let stepChecked = false;
    let stepStartTime = Date.now();

    if (typeof DragDrop !== 'undefined') {
        DragDrop.init({
            itemsSelector: '.drag-item',
            zonesSelector: '.drag-zone'
        });
    }

    checkBtn.addEventListener('click', () => {
        if (stepChecked) {
            // Фиксируем время окончания шага
            if (typeof endStepTimer === 'function') {
                endStepTimer(true);
            }
            AppState.currentStepIndex++;
            runStep();
            return;
        }

        let correct = 0;
        const total = data.items.length;
        const hintEl = document.getElementById('interactive-hint');

        document.querySelectorAll('.platform-zone__drop .platform-item').forEach(item => {
            const zone = item.parentElement.parentElement.dataset.zone;
            const expectedPlatform = item.dataset.platform;

            if (zone === expectedPlatform) {
                item.classList.add('platform-item--correct');
                correct++;
            } else if (expectedPlatform === 'both' && (zone === 'instagram' || zone === 'telegram')) {
                item.classList.add('platform-item--correct');
                correct++;
            } else {
                item.classList.add('platform-item--wrong');
            }

            item.setAttribute('draggable', 'false');
            item.style.pointerEvents = 'none';
        });

        document.querySelectorAll('#platform-items .platform-item').forEach(item => {
            item.setAttribute('draggable', 'false');
            item.style.pointerEvents = 'none';
            item.classList.add('platform-item--wrong');
        });

        // Отправляем аналитику результата шага
        if (typeof sendStepResult === 'function') {
            sendStepResult(
                AppState.currentStepIndex,
                'platforms',
                step.title,
                correct,
                total
            );
        }

        AppState.stepStats.push({
            step: AppState.currentStepIndex + 1,
            type: 'platforms',
            title: step.title,
            correct: correct,
            total: total,
        });

        if (typeof saveCurrentProgress === 'function') {
            saveCurrentProgress();
        }
        
        if (typeof updateHeaderXP === 'function') {
            updateHeaderXP();
        }

        if (correct < total) {
            hintEl.textContent = '💡 ' + data.hint;
            hintEl.classList.remove('hidden');
        } else {
            showToast('✅', 'Всё верно!', 'success');
        }

        stepChecked = true;
        checkBtn.textContent = 'Далее';
    });
}

function runRule3tStep(step) {
    const quizScreen = document.getElementById('quiz-screen');
    const quizStepTitle = document.getElementById('quiz-step-title');
    const quizStepCounter = document.getElementById('quiz-step-counter');
    const quizContainer = document.getElementById('quiz-container');
    
    quizScreen.classList.remove('hidden');
    quizStepTitle.textContent = step.title;
    quizStepCounter.textContent = `Шаг ${AppState.currentStepIndex + 1} из ${AppState.currentScenario.steps.length}`;

    const data = AppState.marketingData.rule3t;
    const selections = {};

    let pairsHTML = '';
    data.pairs.forEach(pair => {
        const shuffledOptions = [...pair.options].sort(() => Math.random() - 0.5);
        pairsHTML += renderRule3tRow(pair, shuffledOptions);
    });

    quizContainer.innerHTML = renderRule3tStep(data, pairsHTML);

    const checkBtn = document.getElementById('interactive-check-btn');
    let stepChecked = false;
    let stepStartTime = Date.now();

    document.querySelectorAll('.rule3t-option').forEach(opt => {
        opt.addEventListener('click', () => {
            if (stepChecked) return;
            const letter = opt.dataset.letter;
            document.querySelectorAll(`.rule3t-option[data-letter="${letter}"]`).forEach(o => o.classList.remove('rule3t-option--selected'));
            opt.classList.add('rule3t-option--selected');
            selections[letter] = opt.dataset.value;
            checkBtn.disabled = Object.keys(selections).length < 3;
        });
    });

    checkBtn.addEventListener('click', () => {
        if (stepChecked) {
            if (typeof endStepTimer === 'function') {
                endStepTimer(true);
            }
            AppState.currentStepIndex++;
            runStep();
            return;
        }

        let correct = 0;
        const hintEl = document.getElementById('interactive-hint');

        data.pairs.forEach(p => {
            const selected = selections[p.letter];
            document.querySelectorAll(`.rule3t-option[data-letter="${p.letter}"]`).forEach(o => {
                if (o.dataset.value === p.correct) o.classList.add('rule3t-option--correct');
                if (o.dataset.value === selected && selected !== p.correct) o.classList.add('rule3t-option--wrong');
                o.style.pointerEvents = 'none';
            });
            if (selected === p.correct) correct++;
        });

        if (typeof sendStepResult === 'function') {
            sendStepResult(
                AppState.currentStepIndex,
                'rule3t',
                step.title,
                correct,
                3
            );
        }

        AppState.stepStats.push({
            step: AppState.currentStepIndex + 1,
            type: 'rule3t',
            title: step.title,
            correct: correct,
            total: 3,
        });

        if (typeof saveCurrentProgress === 'function') {
            saveCurrentProgress();
        }
        
        if (typeof updateHeaderXP === 'function') {
            updateHeaderXP();
        }

        if (correct < 3) {
            hintEl.textContent = '💡 ' + data.hint;
            hintEl.classList.remove('hidden');
        } else {
            showToast('✅', 'Правило 3Т собрано верно!', 'success');
        }

        stepChecked = true;
        checkBtn.textContent = 'Далее';
    });
}

function runProfileStep(step) {
    const quizScreen = document.getElementById('quiz-screen');
    const quizStepTitle = document.getElementById('quiz-step-title');
    const quizStepCounter = document.getElementById('quiz-step-counter');
    const quizContainer = document.getElementById('quiz-container');
    
    quizScreen.classList.remove('hidden');
    quizStepTitle.textContent = step.title;
    quizStepCounter.textContent = `Шаг ${AppState.currentStepIndex + 1} из ${AppState.currentScenario.steps.length}`;

    const data = AppState.marketingData.profile;
    const selections = {};

    let sectionsHTML = '';
    data.sections.forEach(section => {
        sectionsHTML += renderProfileSection(section);
    });

    quizContainer.innerHTML = renderProfileStep(data, sectionsHTML);

    const checkBtn = document.getElementById('interactive-check-btn');
    let stepChecked = false;
    let stepStartTime = Date.now();

    document.querySelectorAll('.profile-option').forEach(opt => {
        opt.addEventListener('click', () => {
            if (stepChecked) return;
            const section = opt.dataset.section;
            document.querySelectorAll(`.profile-option[data-section="${section}"]`).forEach(o => o.classList.remove('profile-option--selected'));
            opt.classList.add('profile-option--selected');
            selections[section] = opt.dataset.correct === 'true';
            checkBtn.disabled = Object.keys(selections).length < data.sections.length;
        });
    });

    checkBtn.addEventListener('click', () => {
        if (stepChecked) {
            if (typeof endStepTimer === 'function') {
                endStepTimer(true);
            }
            AppState.currentStepIndex++;
            runStep();
            return;
        }

        let correct = 0;
        const hintEl = document.getElementById('interactive-hint');

        document.querySelectorAll('.profile-option').forEach(opt => {
            const isCorrect = opt.dataset.correct === 'true';
            if (isCorrect) opt.classList.add('profile-option--correct');
            if (opt.classList.contains('profile-option--selected') && !isCorrect) opt.classList.add('profile-option--wrong');
            if (opt.classList.contains('profile-option--selected') && isCorrect) correct++;
            opt.style.pointerEvents = 'none';
        });

        if (typeof sendStepResult === 'function') {
            sendStepResult(
                AppState.currentStepIndex,
                'profile',
                step.title,
                correct,
                data.sections.length
            );
        }

        AppState.stepStats.push({
            step: AppState.currentStepIndex + 1,
            type: 'profile',
            title: step.title,
            correct: correct,
            total: data.sections.length,
        });

        if (typeof saveCurrentProgress === 'function') {
            saveCurrentProgress();
        }
        
        if (typeof updateHeaderXP === 'function') {
            updateHeaderXP();
        }

        if (correct < data.sections.length) {
            hintEl.textContent = '💡 ' + data.hint;
            hintEl.classList.remove('hidden');
        } else {
            showToast('✅', 'Профиль оформлен правильно!', 'success');
        }

        stepChecked = true;
        checkBtn.textContent = 'Далее';
    });
}

function runContentPlanStep(step) {
    const quizScreen = document.getElementById('quiz-screen');
    const quizStepTitle = document.getElementById('quiz-step-title');
    const quizStepCounter = document.getElementById('quiz-step-counter');
    const quizContainer = document.getElementById('quiz-container');
    
    quizScreen.classList.remove('hidden');
    quizStepTitle.textContent = step.title;
    quizStepCounter.textContent = `Шаг ${AppState.currentStepIndex + 1} из ${AppState.currentScenario.steps.length}`;

    const data = AppState.marketingData.contentPlan;
    
    // Создаём массив форматов с флагом isBad
    const goodFormats = data.goodFormats.map(f => ({ ...f, isBad: false }));
    const badFormats = data.badFormats.map(f => ({ ...f, isBad: true }));
    const allFormats = [...goodFormats, ...badFormats].sort(() => Math.random() - 0.5);

    let formatsHTML = '';
    allFormats.forEach(format => {
        formatsHTML += renderContentFormatItem(format);
    });

    const daysHTML = renderContentPlanDays();

    quizContainer.innerHTML = renderContentPlanStep(data, formatsHTML, daysHTML);

    const checkBtn = document.getElementById('interactive-check-btn');
    let stepChecked = false;
    let stepStartTime = Date.now();

    if (typeof DragDrop !== 'undefined') {
        DragDrop.init({
            itemsSelector: '.drag-item',
            zonesSelector: '.drag-zone'
        });
    }

    checkBtn.addEventListener('click', () => {
        if (stepChecked) {
            if (typeof endStepTimer === 'function') {
                endStepTimer(true);
            }
            AppState.currentStepIndex++;
            runStep();
            return;
        }

        let correct = 0;
        const total = 7;
        const hintEl = document.getElementById('interactive-hint');

        document.querySelectorAll('.content-day__slot .content-format-item').forEach(item => {
            const isGood = item.dataset.good === 'true';
            if (isGood) {
                item.classList.add('content-format-item--correct');
                correct++;
            } else {
                item.classList.add('content-format-item--wrong');
            }
            item.setAttribute('draggable', 'false');
            item.style.pointerEvents = 'none';
        });

        document.querySelectorAll('#content-formats .content-format-item').forEach(item => {
            item.setAttribute('draggable', 'false');
            item.style.pointerEvents = 'none';
        });

        if (typeof sendStepResult === 'function') {
            sendStepResult(
                AppState.currentStepIndex,
                'content-plan',
                step.title,
                correct,
                total
            );
        }

        AppState.stepStats.push({
            step: AppState.currentStepIndex + 1,
            type: 'content-plan',
            title: step.title,
            correct: correct,
            total: total,
        });

        if (typeof saveCurrentProgress === 'function') {
            saveCurrentProgress();
        }
        
        if (typeof updateHeaderXP === 'function') {
            updateHeaderXP();
        }

        if (correct < total) {
            hintEl.textContent = '💡 ' + data.hint;
            hintEl.classList.remove('hidden');
        } else {
            showToast('✅', 'Контент-план составлен отлично!', 'success');
        }

        stepChecked = true;
        checkBtn.textContent = 'Далее';
    });
}

function runFunnelStep(step) {
    const quizScreen = document.getElementById('quiz-screen');
    const quizStepTitle = document.getElementById('quiz-step-title');
    const quizStepCounter = document.getElementById('quiz-step-counter');
    const quizContainer = document.getElementById('quiz-container');
    
    quizScreen.classList.remove('hidden');
    quizStepTitle.textContent = step.title;
    quizStepCounter.textContent = `Шаг ${AppState.currentStepIndex + 1} из ${AppState.currentScenario.steps.length}`;

    const data = AppState.marketingData.funnel;
    const steps = [...data.steps].sort(() => Math.random() - 0.5);

    let stepsHTML = '';
    steps.forEach(s => {
        stepsHTML += renderFunnelItem(s);
    });

    quizContainer.innerHTML = renderFunnelStep(stepsHTML);

    const container = document.getElementById('funnel-container');
    const checkBtn = document.getElementById('interactive-check-btn');
    let stepChecked = false;
    let stepStartTime = Date.now();
    let draggedItem = null;

    if (container) {
        container.querySelectorAll('.funnel-item').forEach(item => {
            item.addEventListener('dragstart', (e) => {
                draggedItem = item;
                item.classList.add('funnel-item--dragging');
                e.dataTransfer.effectAllowed = 'move';
            });

            item.addEventListener('dragend', () => {
                item.classList.remove('funnel-item--dragging');
                draggedItem = null;
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            });

            item.addEventListener('drop', (e) => {
                e.preventDefault();
                if (draggedItem && draggedItem !== item) {
                    const items = [...container.querySelectorAll('.funnel-item')];
                    const fromIndex = items.indexOf(draggedItem);
                    const toIndex = items.indexOf(item);
                    if (fromIndex < toIndex) {
                        container.insertBefore(draggedItem, item.nextSibling);
                    } else {
                        container.insertBefore(draggedItem, item);
                    }
                }
            });
        });
    }

    checkBtn.addEventListener('click', () => {
        if (stepChecked) {
            if (typeof endStepTimer === 'function') {
                endStepTimer(true);
            }
            AppState.currentStepIndex++;
            runStep();
            return;
        }

        let correct = 0;
        const total = data.steps.length;
        const hintEl = document.getElementById('interactive-hint');

        if (container) {
            container.querySelectorAll('.funnel-item').forEach((item, index) => {
                const expectedOrder = parseInt(item.dataset.order);
                if (expectedOrder === index + 1) {
                    item.classList.add('funnel-item--correct');
                    correct++;
                } else {
                    item.classList.add('funnel-item--wrong');
                }
                item.setAttribute('draggable', 'false');
                item.style.pointerEvents = 'none';
            });
        }

        if (typeof sendStepResult === 'function') {
            sendStepResult(
                AppState.currentStepIndex,
                'funnel',
                step.title,
                correct,
                total
            );
        }

        AppState.stepStats.push({
            step: AppState.currentStepIndex + 1,
            type: 'funnel',
            title: step.title,
            correct: correct,
            total: total,
        });

        if (typeof saveCurrentProgress === 'function') {
            saveCurrentProgress();
        }
        
        if (typeof updateHeaderXP === 'function') {
            updateHeaderXP();
        }

        if (correct < total) {
            hintEl.textContent = '💡 ' + data.hint;
            hintEl.classList.remove('hidden');
        } else {
            showToast('✅', 'Порядок верный!', 'success');
        }

        stepChecked = true;
        checkBtn.textContent = 'Далее';
    });
}

function runAiToolsStep(step) {
    const quizScreen = document.getElementById('quiz-screen');
    const quizStepTitle = document.getElementById('quiz-step-title');
    const quizStepCounter = document.getElementById('quiz-step-counter');
    const quizContainer = document.getElementById('quiz-container');
    
    quizScreen.classList.remove('hidden');
    quizStepTitle.textContent = step.title;
    quizStepCounter.textContent = `Шаг ${AppState.currentStepIndex + 1} из ${AppState.currentScenario.steps.length}`;

    const data = AppState.marketingData.aiTools;
    const allTasks = [...data.allTasks].sort(() => Math.random() - 0.5);

    let toolsHTML = '';
    data.tools.forEach(tool => {
        toolsHTML += renderAiToolColumn(tool);
    });

    let tasksHTML = '';
    allTasks.forEach(task => {
        tasksHTML += renderAiTask(task);
    });

    quizContainer.innerHTML = renderAiToolsStep(data, toolsHTML, tasksHTML);

    const checkBtn = document.getElementById('interactive-check-btn');
    let stepChecked = false;
    let stepStartTime = Date.now();

    if (typeof DragDrop !== 'undefined') {
        DragDrop.init({
            itemsSelector: '.drag-item',
            zonesSelector: '.drag-zone'
        });
    }

    checkBtn.addEventListener('click', () => {
        if (stepChecked) {
            if (typeof endStepTimer === 'function') {
                endStepTimer(true);
            }
            AppState.currentStepIndex++;
            runStep();
            return;
        }

        let correct = 0;
        const total = 9;
        const hintEl = document.getElementById('interactive-hint');

        document.querySelectorAll('.ai-tool__tasks .ai-task').forEach(task => {
            const toolName = task.parentElement.dataset.tool;
            const taskName = task.dataset.task;
            const tool = data.tools.find(t => t.name === toolName);
            if (tool && tool.tasks.includes(taskName)) {
                task.classList.add('ai-task--correct');
                correct++;
            } else {
                task.classList.add('ai-task--wrong');
            }
            task.setAttribute('draggable', 'false');
            task.style.pointerEvents = 'none';
        });

        document.querySelectorAll('#ai-tasks .ai-task').forEach(task => {
            task.setAttribute('draggable', 'false');
            task.style.pointerEvents = 'none';
            task.classList.add('ai-task--wrong');
        });

        if (typeof sendStepResult === 'function') {
            sendStepResult(
                AppState.currentStepIndex,
                'ai-tools',
                step.title,
                correct,
                total
            );
        }

        AppState.stepStats.push({
            step: AppState.currentStepIndex + 1,
            type: 'ai-tools',
            title: step.title,
            correct: correct,
            total: total,
        });

        if (typeof saveCurrentProgress === 'function') {
            saveCurrentProgress();
        }
        
        if (typeof updateHeaderXP === 'function') {
            updateHeaderXP();
        }

        if (correct < total) {
            hintEl.textContent = '💡 ' + data.hint;
            hintEl.classList.remove('hidden');
        } else {
            showToast('✅', 'Все инструменты верно!', 'success');
        }

        stepChecked = true;
        checkBtn.textContent = 'Далее';
    });
}

function runAnalyticsStep(step) {
    const quizScreen = document.getElementById('quiz-screen');
    const quizStepTitle = document.getElementById('quiz-step-title');
    const quizStepCounter = document.getElementById('quiz-step-counter');
    const quizContainer = document.getElementById('quiz-container');
    
    quizScreen.classList.remove('hidden');
    quizStepTitle.textContent = step.title;
    quizStepCounter.textContent = `Шаг ${AppState.currentStepIndex + 1} из ${AppState.currentScenario.steps.length}`;

    const data = AppState.marketingData.analytics;
    const options = [...data.options].sort(() => Math.random() - 0.5);

    let optionsHTML = '';
    options.forEach(opt => {
        optionsHTML += renderAnalyticsOption(opt);
    });

    quizContainer.innerHTML = renderAnalyticsStep(data, optionsHTML);

    const checkBtn = document.getElementById('interactive-check-btn');
    const hintEl = document.getElementById('interactive-hint');
    let stepChecked = false;
    let stepStartTime = Date.now();

    // Получаем все чекбоксы после рендера
    const checkboxes = quizContainer.querySelectorAll('input[type="checkbox"]');
    
    // Функция обновления состояния кнопки
    function updateCheckBtnState() {
        if (stepChecked) return;
        const checked = quizContainer.querySelectorAll('input:checked');
        checkBtn.disabled = checked.length !== 3;
    }
    
    // Добавляем обработчики на каждый чекбокс и его label
    checkboxes.forEach(cb => {
        // Обработчик на сам чекбокс
        cb.addEventListener('change', updateCheckBtnState);
        
        // Находим родительский label
        const label = cb.closest('.analytics-option');
        if (label) {
            // Добавляем обработчик клика на весь label
            label.addEventListener('click', (e) => {
                // Если клик не по чекбоксу (и не по его визуальному элементу)
                if (e.target.tagName !== 'INPUT') {
                    e.preventDefault();
                    cb.checked = !cb.checked;
                    // Создаём событие change вручную
                    const changeEvent = new Event('change', { bubbles: true });
                    cb.dispatchEvent(changeEvent);
                    updateCheckBtnState();
                }
            });
        }
    });

    checkBtn.addEventListener('click', () => {
        if (stepChecked) {
            if (typeof endStepTimer === 'function') {
                endStepTimer(true);
            }
            AppState.currentStepIndex++;
            runStep();
            return;
        }

        let correct = 0;
        const total = 3;

        checkboxes.forEach(cb => {
            cb.disabled = true;
            const label = cb.closest('.analytics-option');
            const isKey = cb.dataset.key === 'true';

            if (cb.checked && isKey) {
                if (label) label.classList.add('analytics-option--correct');
                correct++;
            } else if (cb.checked && !isKey) {
                if (label) label.classList.add('analytics-option--wrong');
            } else if (!cb.checked && isKey) {
                if (label) label.classList.add('analytics-option--missed');
            }
        });

        if (typeof sendStepResult === 'function') {
            sendStepResult(
                AppState.currentStepIndex,
                'analytics',
                step.title,
                correct,
                total
            );
        }

        AppState.stepStats.push({
            step: AppState.currentStepIndex + 1,
            type: 'analytics',
            title: step.title,
            correct: correct,
            total: total,
        });

        if (typeof saveCurrentProgress === 'function') {
            saveCurrentProgress();
        }
        
        if (typeof updateHeaderXP === 'function') {
            updateHeaderXP();
        }

        if (correct < total) {
            hintEl.textContent = '💡 ' + data.hint;
            hintEl.classList.remove('hidden');
        } else {
            showToast('✅', 'Метрики выбраны верно!', 'success');
        }

        stepChecked = true;
        checkBtn.disabled = false;
        checkBtn.textContent = 'Далее';
    });
    
    // Начальное состояние кнопки
    checkBtn.disabled = true;
}
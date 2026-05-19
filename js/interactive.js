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

    let itemsHTML = items.map(item => `
        <div class="platform-item drag-item" data-id="${item.id}" data-platform="${item.platform}" draggable="true" style="background-color:var(--color-surface); border:2px solid var(--color-border); border-radius:var(--radius-sm); padding:12px 18px; cursor:grab; margin:5px; display:inline-block;">
            ${item.text}
        </div>
    `).join('');

    quizContainer.innerHTML = `
        <div class="interactive-step">
            <p class="interactive-step__instruction">${data.instruction}</p>
            <div class="platform-items" id="platform-items" style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom:28px; justify-content:center;">${itemsHTML}</div>
            <div class="platform-zones" style="display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-bottom:28px;">
                <div class="platform-zone" data-zone="instagram" style="background-color:var(--color-surface); border:2px dashed var(--color-border); border-radius:var(--radius); padding:16px; text-align:center;">
                    <h3>📸 Instagram</h3>
                    <div class="platform-zone__drop drag-zone" id="zone-instagram" data-zone="instagram" style="min-height:100px;"></div>
                </div>
                <div class="platform-zone" data-zone="telegram" style="background-color:var(--color-surface); border:2px dashed var(--color-border); border-radius:var(--radius); padding:16px; text-align:center;">
                    <h3>📱 Telegram</h3>
                    <div class="platform-zone__drop drag-zone" id="zone-telegram" data-zone="telegram" style="min-height:100px;"></div>
                </div>
                <div class="platform-zone" data-zone="both" style="background-color:var(--color-surface); border:2px dashed var(--color-border); border-radius:var(--radius); padding:16px; text-align:center;">
                    <h3>🔄 Обе платформы</h3>
                    <div class="platform-zone__drop drag-zone" id="zone-both" data-zone="both" style="min-height:100px;"></div>
                </div>
            </div>
            <div class="quiz-hint hidden" id="interactive-hint" style="margin-top:18px; padding:14px 18px; background-color:#fef9e7; border-left:4px solid var(--color-warning); border-radius:0 var(--radius-sm) var(--radius-sm) 0;"></div>
            <button class="btn btn--primary" id="interactive-check-btn" style="display:block; margin:0 auto; padding:10px 16px;">Проверить</button>
        </div>
    `;

    const checkBtn = document.getElementById('interactive-check-btn');
    let stepChecked = false;

    if (typeof DragDrop !== 'undefined') {
        DragDrop.init({
            itemsSelector: '.drag-item',
            zonesSelector: '.drag-zone'
        });
    }

    checkBtn.addEventListener('click', () => {
        if (stepChecked) {
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

        AppState.stepStats.push({
            step: AppState.currentStepIndex + 1,
            type: 'platforms',
            title: step.title,
            correct: correct,
            total: total,
        });

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

    let pairsHTML = data.pairs.map(p => {
        const shuffledOptions = [...p.options].sort(() => Math.random() - 0.5);
        return `
            <div class="rule3t-row" style="display:flex; align-items:center; gap:16px; margin-bottom:16px;">
                <div class="rule3t-letter" style="background-color:var(--color-primary); color:#fff; padding:14px 20px; border-radius:var(--radius-sm); font-weight:700; min-width:130px; text-align:center;">${p.label}</div>
                <div class="rule3t-options" style="display:flex; gap:10px; flex:1;">
                    ${shuffledOptions.map(opt => `
                        <div class="rule3t-option" data-letter="${p.letter}" data-value="${opt}" style="background-color:var(--color-surface); border:2px solid var(--color-border); border-radius:var(--radius-sm); padding:12px 16px; cursor:pointer; font-size:0.85rem; transition:all var(--transition); flex:1; text-align:center;">${opt}</div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');

    quizContainer.innerHTML = `
        <div class="interactive-step">
            <p class="interactive-step__instruction">${data.instruction}</p>
            <div class="rule3t-container">${pairsHTML}</div>
            <div class="quiz-hint hidden" id="interactive-hint" style="margin-top:18px; padding:14px 18px; background-color:#fef9e7; border-left:4px solid var(--color-warning); border-radius:0 var(--radius-sm) var(--radius-sm) 0;"></div>
            <button class="btn btn--primary" id="interactive-check-btn" disabled style="display:block; margin:0 auto; padding:10px 16px;">Проверить</button>
        </div>
    `;

    const checkBtn = document.getElementById('interactive-check-btn');
    let stepChecked = false;

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

        AppState.stepStats.push({
            step: AppState.currentStepIndex + 1,
            type: 'rule3t',
            title: step.title,
            correct: correct,
            total: 3,
        });

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

    let sectionsHTML = data.sections.map(section => `
        <div class="profile-section" style="margin-bottom:24px;">
            <h3 style="font-size:1rem; font-weight:700; margin-bottom:12px;">${section.name}</h3>
            <div class="profile-options" style="display:flex; gap:10px;">
                ${section.options.map(opt => `
                    <div class="profile-option" data-section="${section.name}" data-id="${opt.id}" data-correct="${opt.correct}" style="background-color:var(--color-surface); border:2px solid var(--color-border); border-radius:var(--radius-sm); padding:14px 18px; cursor:pointer; font-size:0.9rem; transition:all var(--transition); flex:1; text-align:center;">${opt.text}</div>
                `).join('')}
            </div>
        </div>
    `).join('');

    quizContainer.innerHTML = `
        <div class="interactive-step">
            <p class="interactive-step__instruction">${data.instruction}</p>
            <div class="profile-container">${sectionsHTML}</div>
            <div class="quiz-hint hidden" id="interactive-hint" style="margin-top:18px; padding:14px 18px; background-color:#fef9e7; border-left:4px solid var(--color-warning); border-radius:0 var(--radius-sm) var(--radius-sm) 0;"></div>
            <button class="btn btn--primary" id="interactive-check-btn" disabled style="display:block; margin:0 auto; padding:10px 16px;">Проверить</button>
        </div>
    `;

    const checkBtn = document.getElementById('interactive-check-btn');
    let stepChecked = false;

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

        AppState.stepStats.push({
            step: AppState.currentStepIndex + 1,
            type: 'profile',
            title: step.title,
            correct: correct,
            total: data.sections.length,
        });

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
    const allFormats = [...data.goodFormats, ...data.badFormats].sort(() => Math.random() - 0.5);

    let formatsHTML = allFormats.map(f => `
        <div class="content-format-item drag-item" data-id="${f.id}" data-good="${!data.badFormats.includes(f)}" draggable="true" style="background-color:var(--color-surface); border:2px solid var(--color-border); border-radius:var(--radius-sm); padding:10px 16px; cursor:grab; font-size:0.85rem; transition:all var(--transition); display:inline-block; margin:5px;">${f.text}</div>
    `).join('');

    quizContainer.innerHTML = `
        <div class="interactive-step">
            <p class="interactive-step__instruction">${data.instruction}</p>
            <div class="content-plan-formats" id="content-formats" style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom:28px; justify-content:center;">${formatsHTML}</div>
            <div class="content-plan-days" id="content-days" style="display:grid; grid-template-columns:repeat(7,1fr); gap:10px; margin-bottom:28px;">
                ${['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => `
                    <div class="content-day" style="background-color:var(--color-surface); border:2px dashed var(--color-border); border-radius:var(--radius-sm); padding:12px 8px; text-align:center;">
                        <span class="content-day__label" style="font-weight:700; font-size:0.85rem; display:block; margin-bottom:8px; color:var(--color-primary);">${day}</span>
                        <div class="content-day__slot drag-zone" data-day="${day}" data-max-items="1" style="min-height:50px;"></div>
                    </div>
                `).join('')}
            </div>
            <div class="quiz-hint hidden" id="interactive-hint" style="margin-top:18px; padding:14px 18px; background-color:#fef9e7; border-left:4px solid var(--color-warning); border-radius:0 var(--radius-sm) var(--radius-sm) 0;"></div>
            <button class="btn btn--primary" id="interactive-check-btn" style="display:block; margin:0 auto; padding:10px 16px;">Проверить</button>
        </div>
    `;

    const checkBtn = document.getElementById('interactive-check-btn');
    let stepChecked = false;

    if (typeof DragDrop !== 'undefined') {
        DragDrop.init({
            itemsSelector: '.drag-item',
            zonesSelector: '.drag-zone'
        });
    }

    checkBtn.addEventListener('click', () => {
        if (stepChecked) {
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

        AppState.stepStats.push({
            step: AppState.currentStepIndex + 1,
            type: 'content-plan',
            title: step.title,
            correct: correct,
            total: total,
        });

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

    let stepsHTML = steps.map(s => `
        <div class="funnel-item drag-item" data-id="${s.id}" data-order="${s.order}" draggable="true" style="background-color:var(--color-surface); border:2px solid var(--color-border); border-radius:var(--radius-sm); padding:16px 18px; cursor:grab; display:flex; align-items:center; gap:14px; margin-bottom:8px;">
            <span class="funnel-item__handle" style="color:var(--color-text-light); font-size:1.3rem; cursor:grab;">☰</span>
            <span class="funnel-item__text" style="font-size:0.95rem;">${s.text}</span>
        </div>
    `).join('');

    quizContainer.innerHTML = `
        <div class="interactive-step">
            <p class="interactive-step__instruction">${data.instruction}</p>
            <p class="interactive-step__sub" style="font-size:0.9rem; color:var(--color-text-light); margin-bottom:24px;">Перетащите шаги в правильном порядке (сверху вниз: 1 → 6)</p>
            <div class="funnel-container drag-zone" id="funnel-container" data-zone="funnel" style="max-width:600px; margin-bottom:28px;">${stepsHTML}</div>
            <div class="quiz-hint hidden" id="interactive-hint" style="margin-top:18px; padding:14px 18px; background-color:#fef9e7; border-left:4px solid var(--color-warning); border-radius:0 var(--radius-sm) var(--radius-sm) 0;"></div>
            <button class="btn btn--primary" id="interactive-check-btn" style="display:block; margin:0 auto; padding:10px 16px;">Проверить</button>
        </div>
    `;

    const container = document.getElementById('funnel-container');
    const checkBtn = document.getElementById('interactive-check-btn');
    let stepChecked = false;
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

        AppState.stepStats.push({
            step: AppState.currentStepIndex + 1,
            type: 'funnel',
            title: step.title,
            correct: correct,
            total: total,
        });

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

    let toolsHTML = data.tools.map(t => `
        <div class="ai-tool" style="background-color:var(--color-surface); border:2px solid var(--color-border); border-radius:var(--radius); padding:18px; text-align:center;">
            <h3 style="font-size:1rem; margin-bottom:12px;">🛠️ ${t.name}</h3>
            <div class="ai-tool__tasks drag-zone" data-tool="${t.name}" data-max-items="3" style="min-height:100px;"></div>
        </div>
    `).join('');

    let tasksHTML = allTasks.map(task => `
        <div class="ai-task drag-item" data-task="${task}" draggable="true" style="background-color:var(--color-surface); border:2px solid var(--color-border); border-radius:var(--radius-sm); padding:10px 16px; cursor:grab; font-size:0.85rem; transition:all var(--transition); display:inline-block; margin:5px;">${task}</div>
    `).join('');

    quizContainer.innerHTML = `
        <div class="interactive-step">
            <p class="interactive-step__instruction">${data.instruction}</p>
            <div class="ai-tools-container" style="display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-bottom:24px;">${toolsHTML}</div>
            <div class="ai-tasks-container" id="ai-tasks" style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom:28px; justify-content:center;">${tasksHTML}</div>
            <div class="quiz-hint hidden" id="interactive-hint" style="margin-top:18px; padding:14px 18px; background-color:#fef9e7; border-left:4px solid var(--color-warning); border-radius:0 var(--radius-sm) var(--radius-sm) 0;"></div>
            <button class="btn btn--primary" id="interactive-check-btn" style="display:block; margin:0 auto; padding:10px 16px;">Проверить</button>
        </div>
    `;

    const checkBtn = document.getElementById('interactive-check-btn');
    let stepChecked = false;

    if (typeof DragDrop !== 'undefined') {
        DragDrop.init({
            itemsSelector: '.drag-item',
            zonesSelector: '.drag-zone'
        });
    }

    checkBtn.addEventListener('click', () => {
        if (stepChecked) {
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

        AppState.stepStats.push({
            step: AppState.currentStepIndex + 1,
            type: 'ai-tools',
            title: step.title,
            correct: correct,
            total: total,
        });

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

    let optionsHTML = options.map(opt => `
        <label class="analytics-option" style="display:flex; align-items:center; gap:14px; background-color:var(--color-surface); border:2px solid var(--color-border); border-radius:var(--radius-sm); padding:16px 18px; cursor:pointer; margin-bottom:8px;">
            <input type="checkbox" value="${opt.id}" data-key="${opt.key}" style="display:none;">
            <span class="analytics-option__checkmark" style="width:24px; height:24px; border:2px solid var(--color-border); border-radius:4px; flex-shrink:0;"></span>
            <span>${opt.text}</span>
        </label>
    `).join('');

    quizContainer.innerHTML = `
        <div class="interactive-step">
            <p class="interactive-step__instruction">${data.instruction}</p>
            <div class="analytics-container" style="max-width:600px; margin-bottom:28px;">${optionsHTML}</div>
            <div class="quiz-hint hidden" id="interactive-hint" style="margin-top:18px; padding:14px 18px; background-color:#fef9e7; border-left:4px solid var(--color-warning); border-radius:0 var(--radius-sm) var(--radius-sm) 0;"></div>
            <button class="btn btn--primary" id="interactive-check-btn" disabled style="display:block; margin:0 auto; padding:10px 16px;">Проверить</button>
        </div>
    `;

    const checkBtn = document.getElementById('interactive-check-btn');
    const checkboxes = quizContainer.querySelectorAll('input[type="checkbox"]');
    let stepChecked = false;

    checkboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            if (stepChecked) return;
            const checked = quizContainer.querySelectorAll('input:checked');
            checkBtn.disabled = checked.length !== 3;
        });
        
        const label = cb.closest('.analytics-option');
        if (label) {
            label.addEventListener('click', (e) => {
                if (e.target.tagName !== 'INPUT') {
                    cb.checked = !cb.checked;
                    const event = new Event('change');
                    cb.dispatchEvent(event);
                }
            });
        }
    });

    checkBtn.addEventListener('click', () => {
        if (stepChecked) {
            AppState.currentStepIndex++;
            runStep();
            return;
        }

        let correct = 0;
        const total = 3;
        const hintEl = document.getElementById('interactive-hint');

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

        AppState.stepStats.push({
            step: AppState.currentStepIndex + 1,
            type: 'analytics',
            title: step.title,
            correct: correct,
            total: total,
        });

        if (correct < total) {
            hintEl.textContent = '💡 ' + data.hint;
            hintEl.classList.remove('hidden');
        } else {
            showToast('✅', 'Метрики выбраны верно!', 'success');
        }

        stepChecked = true;
        checkBtn.textContent = 'Далее';
    });
}
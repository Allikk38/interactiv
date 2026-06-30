// ===== ИНТЕРАКТИВЫ УРОКА 1 =====

// ----- МАТЧИНГ ТЕРМИНОВ -----
function runMatchingStep(step) {
    const quizScreen = document.getElementById('quiz-screen');
    const quizStepTitle = document.getElementById('quiz-step-title');
    const quizStepCounter = document.getElementById('quiz-step-counter');
    const quizContainer = document.getElementById('quiz-container');
    
    quizScreen.classList.remove('hidden');
    quizStepTitle.textContent = step.title;
    quizStepCounter.textContent = `Шаг ${AppState.currentStepIndex + 1} из ${AppState.currentScenario.steps.length}`;

    const data = AppState.currentScenario.matching;
    const pairs = [...data.pairs];
    const terms = pairs.map(p => p.term).sort(() => Math.random() - 0.5);
    const definitions = pairs.map(p => p.definition).sort(() => Math.random() - 0.5);

    let selectedTerm = null;
    const matches = {};

    const termsHTML = terms.map(t => `
        <div class="matching-item matching-item--term" data-term="${t}">${t}</div>
    `).join('');

    const definitionsHTML = definitions.map(d => `
        <div class="matching-item matching-item--def" data-def="${d}">${d}</div>
    `).join('');

    quizContainer.innerHTML = `
        <div class="interactive-step">
            <p class="interactive-step__instruction">${data.title} — нажмите на термин, затем на его определение</p>
            <div class="matching-container">
                <div class="matching-column">
                    <h3 class="matching-column__title">Термины</h3>
                    <div class="matching-column__list" id="terms-list">${termsHTML}</div>
                </div>
                <div class="matching-column">
                    <h3 class="matching-column__title">Определения</h3>
                    <div class="matching-column__list" id="defs-list">${definitionsHTML}</div>
                </div>
            </div>
            <div class="quiz-hint hidden" id="interactive-hint"></div>
            <button class="btn btn--primary" id="interactive-check-btn" disabled>Проверить</button>
        </div>
    `;

    const checkBtn = document.getElementById('interactive-check-btn');
    const hintEl = document.getElementById('interactive-hint');
    let stepChecked = false;

    document.querySelectorAll('.matching-item--term').forEach(item => {
        item.addEventListener('click', () => {
            if (stepChecked) return;
            document.querySelectorAll('.matching-item--term').forEach(el => el.classList.remove('matching-item--active'));
            item.classList.add('matching-item--active');
            selectedTerm = item.dataset.term;
        });
    });

    document.querySelectorAll('.matching-item--def').forEach(item => {
        item.addEventListener('click', () => {
            if (stepChecked || !selectedTerm) return;
            const def = item.dataset.def;
            const pair = data.pairs.find(p => p.term === selectedTerm);

            if (pair && pair.definition === def) {
                matches[selectedTerm] = def;
                document.querySelector(`.matching-item--term[data-term="${selectedTerm}"]`).classList.add('matching-item--matched');
                item.classList.add('matching-item--matched');
                selectedTerm = null;
                document.querySelectorAll('.matching-item--term').forEach(el => el.classList.remove('matching-item--active'));

                if (Object.keys(matches).length === pairs.length) {
                    checkBtn.disabled = false;
                }
            } else {
                item.classList.add('matching-item--shake');
                setTimeout(() => item.classList.remove('matching-item--shake'), 500);
            }
        });
    });

    checkBtn.addEventListener('click', () => {
        if (stepChecked) {
            AppState.currentStepIndex++;
            runStep();
            return;
        }

        let correct = 0;
        const total = pairs.length;

        document.querySelectorAll('.matching-item--def').forEach(item => {
            const def = item.dataset.def;
            const pair = data.pairs.find(p => p.definition === def);
            if (pair && matches[pair.term] === def) {
                item.classList.add('matching-item--correct');
                correct++;
            } else if (Object.values(matches).includes(def)) {
                item.classList.add('matching-item--wrong');
            }
            item.style.pointerEvents = 'none';
        });

        document.querySelectorAll('.matching-item--term').forEach(item => {
            item.style.pointerEvents = 'none';
            const term = item.dataset.term;
            if (matches[term]) {
                const pair = data.pairs.find(p => p.term === term);
                if (pair && matches[term] === pair.definition) {
                    item.classList.add('matching-item--correct');
                } else {
                    item.classList.add('matching-item--wrong');
                }
            }
        });

        AppState.stepStats.push({
            step: AppState.currentStepIndex + 1,
            type: 'matching',
            title: step.title,
            correct: correct,
            total: total,
        });

        if (correct < total) {
            hintEl.textContent = '💡 Не все пары верны. Перечитайте шпаргалку и попробуйте снова!';
            hintEl.classList.remove('hidden');
        } else {
            showToast('✅', 'Все термины сопоставлены верно!', 'success');
        }

        stepChecked = true;
        checkBtn.textContent = 'Далее';
    });
}

// ----- ПУТЬ СДЕЛКИ (PIPELINE) -----
function runPipelineStep(step) {
    const quizScreen = document.getElementById('quiz-screen');
    const quizStepTitle = document.getElementById('quiz-step-title');
    const quizStepCounter = document.getElementById('quiz-step-counter');
    const quizContainer = document.getElementById('quiz-container');
    
    quizScreen.classList.remove('hidden');
    quizStepTitle.textContent = step.title;
    quizStepCounter.textContent = `Шаг ${AppState.currentStepIndex + 1} из ${AppState.currentScenario.steps.length}`;

    const data = AppState.currentScenario.pipeline;
    const steps = [...data.steps].sort(() => Math.random() - 0.5);

    let stepsHTML = steps.map(s => `
        <div class="pipeline-item drag-item" data-id="${s.id}" data-order="${s.order}" draggable="true">
            <span class="pipeline-item__num">—</span>
            <span class="pipeline-item__text">${s.text}</span>
        </div>
    `).join('');

    quizContainer.innerHTML = `
        <div class="interactive-step">
            <p class="interactive-step__instruction">${data.title} — перетащите этапы в правильном порядке (сверху вниз)</p>
            <div class="pipeline-container drag-zone" id="pipeline-container">${stepsHTML}</div>
            <div class="quiz-hint hidden" id="interactive-hint"></div>
            <button class="btn btn--primary" id="interactive-check-btn">Проверить</button>
        </div>
    `;

    const container = document.getElementById('pipeline-container');
    const checkBtn = document.getElementById('interactive-check-btn');
    const hintEl = document.getElementById('interactive-hint');
    let stepChecked = false;
    let draggedItem = null;

    container.querySelectorAll('.pipeline-item').forEach(item => {
        item.addEventListener('dragstart', (e) => {
            draggedItem = item;
            item.classList.add('pipeline-item--dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        item.addEventListener('dragend', () => {
            item.classList.remove('pipeline-item--dragging');
            draggedItem = null;
        });

        item.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });

        item.addEventListener('drop', (e) => {
            e.preventDefault();
            if (draggedItem && draggedItem !== item) {
                const items = [...container.querySelectorAll('.pipeline-item')];
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

    checkBtn.addEventListener('click', () => {
        if (stepChecked) {
            AppState.currentStepIndex++;
            runStep();
            return;
        }

        let correct = 0;
        const total = data.steps.length;

        container.querySelectorAll('.pipeline-item').forEach((item, index) => {
            const expectedOrder = parseInt(item.dataset.order);
            const numSpan = item.querySelector('.pipeline-item__num');
            numSpan.textContent = index + 1;

            if (expectedOrder === index + 1) {
                item.classList.add('pipeline-item--correct');
                correct++;
            } else {
                item.classList.add('pipeline-item--wrong');
            }
            item.setAttribute('draggable', 'false');
            item.style.pointerEvents = 'none';
        });

        AppState.stepStats.push({
            step: AppState.currentStepIndex + 1,
            type: 'pipeline',
            title: step.title,
            correct: correct,
            total: total,
        });

        if (correct < total) {
            hintEl.textContent = '💡 Правильный порядок: выбор → ДДУ → эскроу → ожидание → приёмка → регистрация';
            hintEl.classList.remove('hidden');
        } else {
            showToast('✅', 'Этапы сделки расставлены верно!', 'success');
        }

        stepChecked = true;
        checkBtn.textContent = 'Далее';
    });
}

// ----- ДИАЛОГ С КЛИЕНТОМ (ИСПРАВЛЕН) -----
function runDialogueStep(step) {
    const quizScreen = document.getElementById('quiz-screen');
    const quizStepTitle = document.getElementById('quiz-step-title');
    const quizStepCounter = document.getElementById('quiz-step-counter');
    const quizContainer = document.getElementById('quiz-container');
    
    quizScreen.classList.remove('hidden');
    quizStepTitle.textContent = step.title;
    quizStepCounter.textContent = `Шаг ${AppState.currentStepIndex + 1} из ${AppState.currentScenario.steps.length}`;

    const data = AppState.currentScenario.dialogue;
    
    // 🔧 ИСПРАВЛЕНИЕ: добавляем fallback для clientQuestion
    // Если clientQuestion отсутствует, пробуем использовать clientMessage
    const questionText = data.clientQuestion || data.clientMessage || 'Сообщение клиента не найдено';

    quizContainer.innerHTML = `
        <div class="interactive-step">
            <div class="dialogue-card">
                <div class="dialogue-card__avatar">👩‍💼</div>
                <div class="dialogue-card__client">${escapeHtml(data.clientName)}</div>
                <div class="dialogue-card__question">«${escapeHtml(questionText)}»</div>
                <div class="dialogue-card__options">
                    ${data.options.map(opt => `
                        <div class="dialogue-option" data-id="${opt.id}" data-correct="${opt.correct}" data-feedback="${escapeHtml(opt.feedback)}">
                            ${escapeHtml(opt.text)}
                        </div>
                    `).join('')}
                </div>
                <div class="dialogue-card__feedback hidden" id="dialogue-feedback"></div>
            </div>
            <button class="btn btn--primary hidden" id="interactive-next-btn">Далее</button>
        </div>
    `;

    const nextBtn = document.getElementById('interactive-next-btn');
    const feedbackEl = document.getElementById('dialogue-feedback');
    let answered = false;

    document.querySelectorAll('.dialogue-option').forEach(opt => {
        opt.addEventListener('click', () => {
            if (answered) return;
            answered = true;

            const isCorrect = opt.dataset.correct === 'true';
            const feedback = opt.dataset.feedback;

            document.querySelectorAll('.dialogue-option').forEach(o => {
                o.style.pointerEvents = 'none';
                if (o.dataset.correct === 'true') o.classList.add('dialogue-option--correct');
                if (o === opt && !isCorrect) o.classList.add('dialogue-option--wrong');
            });

            feedbackEl.textContent = (isCorrect ? '✅ ' : '❌ ') + feedback;
            feedbackEl.classList.remove('hidden');
            feedbackEl.className = `dialogue-card__feedback dialogue-card__feedback--${isCorrect ? 'correct' : 'wrong'}`;
            nextBtn.classList.remove('hidden');

            AppState.stepStats.push({
                step: AppState.currentStepIndex + 1,
                type: 'dialogue',
                title: step.title,
                correct: isCorrect ? 1 : 0,
                total: 1,
            });
        });
    });

    nextBtn.addEventListener('click', () => {
        AppState.currentStepIndex++;
        runStep();
    });
}
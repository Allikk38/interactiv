// ===== КОНФИГУРАЦИЯ =====
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyHh9o63J7uFn6KaiYyDgCSee4L_3tV1NH6iqox7-QtTsx-B-uYapu-wUrtwWyBPxgI/exec';
const MAP_CENTER = [55.018, 82.92];
const MAP_ZOOM = 12;

// ===== DOM-ЭЛЕМЕНТЫ =====
const headerInfo = document.getElementById('header-info');
const scenarioScreen = document.getElementById('scenario-screen');
const scenariosGrid = document.getElementById('scenarios-grid');
const mapScreen = document.getElementById('map-screen');
const mapStepTitle = document.getElementById('map-step-title');
const mapStepCounter = document.getElementById('map-step-counter');
const quizScreen = document.getElementById('quiz-screen');
const quizStepTitle = document.getElementById('quiz-step-title');
const quizStepCounter = document.getElementById('quiz-step-counter');
const quizContainer = document.getElementById('quiz-container');
const quizNextBtn = document.getElementById('quiz-next-btn');
const finishScreen = document.getElementById('finish-screen');
const finishText = document.getElementById('finish-text');
const finishStats = document.getElementById('finish-stats');
const jkListEl = document.getElementById('jk-list');
const hintBtn = document.getElementById('hint-btn');
const resetStepBtn = document.getElementById('reset-step-btn');
const toast = document.getElementById('toast');
const toastIcon = document.getElementById('toast-icon');
const toastMessage = document.getElementById('toast-message');

// ===== СОСТОЯНИЕ =====
let allJks = [];
let allQuestions = [];
let scenarios = [];
let marketingData = {};
let currentScenario = null;
let currentStepIndex = 0;
let selectedJkId = null;
let placedJks = new Map();
let map;
let toastTimer;
let stepStats = [];
let currentMarkers = [];

// ===== ИНИЦИАЛИЗАЦИЯ КАРТЫ (Яндекс.Карты — неинтерактивная) =====
function initMap() {
    const mapContainer = document.getElementById('map');
    mapContainer.innerHTML = '';

    map = new ymaps.Map('map', {
        center: MAP_CENTER,
        zoom: MAP_ZOOM,
        controls: [] // убираем все контролы (зум, поиск, линейка и т.д.)
    }, {
        // Отключаем интерактивность
        suppressMapOpenBlock: true,               // не показывать "Открыть в Яндекс.Картах"
        yandexMapDisablePoiInteractivity: true,   // отключить кликабельность POI (дома, улицы, организации)
        suppressObsoleteBrowserNotifier: true,     // не показывать предупреждение о старом браузере
        // Отключаем поведение по умолчанию
        autoFitToViewport: 'none'
    });

    // Отключаем все события мыши, кроме клика
    map.behaviors.disable([
        'drag',
        'scrollZoom', 
        'dblClickZoom',
        'multiTouch',
        'rightMouseButtonMagnifier',
        'leftMouseButtonMagnifier',
        'ruler'
    ]);

    // Отключаем подсказки при наведении на объекты карты
    map.hint.hide();

    // Подписываемся ТОЛЬКО на клик
    map.events.add('click', onMapClick);
}

// Отрисовка маркеров
function renderMarkers() {
    if (!map) return;

    // Удаляем старые метки
    currentMarkers.forEach(marker => map.geoObjects.remove(marker));
    currentMarkers = [];

    // Рисуем правильные метки
    placedJks.forEach((data, id) => {
        const jk = allJks.find(j => j.id === id);
        if (!jk) return;

        const marker = new ymaps.Placemark([data.lat, data.lng], {
            hintContent: jk.name
        }, {
            preset: 'islands#greenIcon',
            draggable: false
        });

        map.geoObjects.add(marker);
        currentMarkers.push(marker);
    });
}

// ===== ЗАГРУЗКА ДАННЫХ =====
async function loadData() {
    try {
        const [jksRes, questionsRes, scenariosRes] = await Promise.all([
            fetch('data/jks.json'),
            fetch('data/questions.json'),
            fetch('data/scenarios.json'),
        ]);

        if (!jksRes.ok || !scenariosRes.ok) throw new Error('Ошибка загрузки данных');

        allJks = await jksRes.json();
        scenarios = await scenariosRes.json();

        if (questionsRes.ok) {
            allQuestions = await questionsRes.json();
        }

        try {
            const marketingRes = await fetch('data/marketing-steps.json');
            if (marketingRes.ok) {
                marketingData = await marketingRes.json();
            }
        } catch (e) {
            console.log('marketing-steps.json не загружен — интерактивные шаги недоступны');
        }

        // Показываем экран ввода имени перед показом сценариев
        if (!User.get()) {
            User.showNamePrompt(() => {
                renderScenarios();
            });
        } else {
            renderScenarios();
            const user = User.get();
            showToast('👋', `С возвращением, ${user.name}!`, 'success');
        }

        addUserChangeButton();

    } catch (error) {
        console.error('Ошибка загрузки:', error);
        showToast('❌', 'Не удалось загрузить данные. Обновите страницу.', 'error');
    }
}

// ===== КНОПКА СМЕНЫ ПОЛЬЗОВАТЕЛЯ =====
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
    changeBtn.addEventListener('click', () => {
        User.clear();
        location.reload();
    });

    const headerInfoEl = document.getElementById('header-info');
    if (headerInfoEl) {
        headerInfoEl.after(changeBtn);
    }
}

// ===== РЕНДЕР СЦЕНАРИЕВ =====
function renderScenarios() {
    scenariosGrid.innerHTML = '';

    scenarios.forEach(scenario => {
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

// ===== ЗАПУСК СЦЕНАРИЯ =====
function startScenario(scenario) {
    currentScenario = scenario;
    currentStepIndex = 0;
    stepStats = [];
    window.scenarioStartTime = Date.now();

    scenarioScreen.classList.add('hidden');
    headerInfo.textContent = `${scenario.icon || '📋'} ${scenario.name}`;

    ProgressBar.init();
    ProgressBar.update(0, scenario.steps.length - 1, scenario.steps);

    runStep();
}

// ===== ЗАПУСК ШАГА =====
function runStep() {
    if (currentStepIndex >= currentScenario.steps.length) {
        showFinish();
        return;
    }

    const step = currentScenario.steps[currentStepIndex];

    mapScreen.classList.add('hidden');
    quizScreen.classList.add('hidden');
    finishScreen.classList.add('hidden');

    if (step.type !== 'finish') {
        ProgressBar.show();
        ProgressBar.update(currentStepIndex, currentScenario.steps.length - 1, currentScenario.steps);
    }

    switch (step.type) {
        case 'brief': runBriefStep(step); break;
        case 'matching': runMatchingStep(step); break;
        case 'pipeline': runPipelineStep(step); break;
        case 'dialogue': runDialogueStep(step); break;
        case 'map': runMapStep(step); break;
        case 'quiz': runQuizStep(step); break;
        case 'platforms': runPlatformsStep(step); break;
        case 'rule3t': runRule3tStep(step); break;
        case 'profile': runProfileStep(step); break;
        case 'content-plan': runContentPlanStep(step); break;
        case 'funnel': runFunnelStep(step); break;
        case 'ai-tools': runAiToolsStep(step); break;
        case 'analytics': runAnalyticsStep(step); break;
        case 'finish': showFinish(); break;
        default: currentStepIndex++; runStep();
    }
}

// ===== ШАГ: КАРТА =====
function runMapStep(step) {
    mapScreen.classList.remove('hidden');

    const jkIds = step.jk_ids;
    const filteredJks = jkIds.length > 0
        ? allJks.filter(jk => jkIds.includes(jk.id))
        : allJks;

    mapStepTitle.textContent = step.title;
    mapStepCounter.textContent = `Шаг ${currentStepIndex + 1} из ${currentScenario.steps.length}`;
    selectedJkId = null;
    placedJks.clear();

    if (!map) {
        const waitForYmaps = () => {
            if (typeof ymaps !== 'undefined') {
                initMap();
                renderMapStep(filteredJks);
            } else {
                setTimeout(waitForYmaps, 100);
            }
        };
        waitForYmaps();
    } else {
        map.setCenter(MAP_CENTER);
        map.setZoom(MAP_ZOOM);
        renderMapStep(filteredJks);
    }

    window.currentStepJks = filteredJks;
    renderJkList(filteredJks);
    renderMarkers();
}

function renderMapStep(filteredJks) {
    renderJkList(filteredJks);
}

function renderJkList(filteredJks) {
    jkListEl.innerHTML = '';
    filteredJks.forEach(jk => {
        const isPlaced = placedJks.has(jk.id);
        const li = document.createElement('li');
        li.className = 'jk-list__item';
        if (selectedJkId === jk.id) li.classList.add('jk-list__item--selected');
        if (isPlaced) li.classList.add('jk-list__item--placed');
        li.innerHTML = `
            <div class="jk-list__name">${jk.name}</div>
            <div class="jk-list__developer">${jk.developer}</div>
        `;
        if (!isPlaced) li.addEventListener('click', () => selectJk(jk.id));
        jkListEl.appendChild(li);
    });
    hintBtn.disabled = selectedJkId === null;
}

function selectJk(id) {
    if (placedJks.has(id)) return;
    selectedJkId = id;
    const filteredJks = window.currentStepJks || allJks;
    renderJkList(filteredJks);
    // Визуально подсвечиваем выбранный ЖК в списке
    document.querySelectorAll('.jk-list__item').forEach(item => {
        item.classList.remove('jk-list__item--active');
    });
    const activeItem = document.querySelector(`.jk-list__item--selected`);
    if (activeItem) activeItem.classList.add('jk-list__item--active');
}

// Обработчик клика по карте
function onMapClick(e) {
    if (selectedJkId === null) return;
    const jk = allJks.find(j => j.id === selectedJkId);
    if (!jk) return;

    const coords = e.get('coords');
    const lat = coords[0];
    const lng = coords[1];

    const distance = getDistance(lat, lng, jk.lat, jk.lng);
    const isCorrect = distance <= jk.radius;

    if (isCorrect) {
        placedJks.set(jk.id, { lat, lng, correct: true });
        showToast('✅', `Правильно! ${jk.name} на месте.`, 'success');
        selectedJkId = null;
        if (GOOGLE_SCRIPT_URL) sendToGoogle(currentScenario?.name || '', jk.name, true, distance);
    } else {
        // Временная красная метка
        const wrongMarker = new ymaps.Placemark([lat, lng], {
            hintContent: `${jk.name} (неверно)`
        }, {
            preset: 'islands#redIcon',
            draggable: false
        });
        map.geoObjects.add(wrongMarker);

        showToast('❌', `Неправильно. ${jk.hint}`, 'error');
        setTimeout(() => map.geoObjects.remove(wrongMarker), 3000);
        if (GOOGLE_SCRIPT_URL) sendToGoogle(currentScenario?.name || '', jk.name, false, distance);
    }

    const filteredJks = window.currentStepJks || allJks;
    renderJkList(filteredJks);
    renderMarkers();
    checkMapStepComplete(filteredJks);
}

function checkMapStepComplete(filteredJks) {
    if (placedJks.size === filteredJks.length && filteredJks.length > 0) {
        stepStats.push({
            step: currentStepIndex + 1,
            type: 'map',
            title: currentScenario.steps[currentStepIndex].title,
            placed: placedJks.size,
            total: filteredJks.length,
        });
        showToast('🎉', 'Все ЖК расставлены! Переходим дальше.', 'success');
        setTimeout(() => { currentStepIndex++; runStep(); }, 2000);
    }
}

function resetMapStep() {
    placedJks.clear();
    selectedJkId = null;
    if (map) {
        renderMarkers();
    }
    const filteredJks = window.currentStepJks || allJks;
    renderJkList(filteredJks);
    showToast('🔄', 'Шаг сброшен. Начните заново.', 'success');
}

// ===== ШАГ: ВИКТОРИНА =====
function runQuizStep(step) {
    quizScreen.classList.remove('hidden');
    const questionIds = step.question_ids || [];
    const filteredQuestions = questionIds.length > 0
        ? allQuestions.filter(q => questionIds.includes(q.id))
        : allQuestions;
    quizStepTitle.textContent = step.title;
    quizStepCounter.textContent = `Шаг ${currentStepIndex + 1} из ${currentScenario.steps.length}`;
    window.currentStepQuestions = filteredQuestions;
    window.currentQuestionIndex = 0;
    window.quizAnswers = [];
    renderQuestion(0);
}

function renderQuestion(index) {
    const questions = window.currentStepQuestions;
    if (index >= questions.length) {
        finishQuizStep();
        return;
    }
    window.currentQuestionIndex = index;
    const q = questions[index];
    quizNextBtn.disabled = true;
    quizNextBtn.textContent = 'Проверить';
    const isCheckbox = q.type === 'multiple';
    let optionsHTML = '';
    q.options.forEach((opt, i) => {
        optionsHTML += `
            <label class="quiz-option" data-index="${i}">
                <input type="${isCheckbox ? 'checkbox' : 'radio'}" name="quiz-option" value="${opt}">
                <span class="quiz-option__indicator ${isCheckbox ? 'quiz-option__indicator--checkbox' : ''}"></span>
                <span>${opt}</span>
            </label>
        `;
    });
    quizContainer.innerHTML = `
        <div class="quiz-question">
            <div class="quiz-question__text">${index + 1}. ${q.text}</div>
            <div class="quiz-question__options">${optionsHTML}</div>
            <div class="quiz-hint hidden" id="quiz-hint"></div>
        </div>
    `;
    const options = quizContainer.querySelectorAll('.quiz-option');
    const hintEl = document.getElementById('quiz-hint');
    let checked = false;

    options.forEach(opt => {
        opt.addEventListener('click', () => {
            if (checked) return;
            const input = opt.querySelector('input');
            if (isCheckbox) {
                input.checked = !input.checked;
                opt.classList.toggle('quiz-option--selected', input.checked);
            } else {
                options.forEach(o => o.classList.remove('quiz-option--selected'));
                input.checked = true;
                opt.classList.add('quiz-option--selected');
            }
            quizNextBtn.disabled = !quizContainer.querySelectorAll('input:checked').length;
        });
    });

    quizNextBtn.onclick = () => {
        if (!checked) {
            const selectedInputs = quizContainer.querySelectorAll('input:checked');
            const userAnswers = Array.from(selectedInputs).map(inp => inp.value);
            const isCorrect = checkQuizAnswer(q, userAnswers);
            window.quizAnswers.push({ questionId: q.id, userAnswers, isCorrect });

            options.forEach(opt => {
                opt.style.pointerEvents = 'none';
                const inp = opt.querySelector('input');
                const value = inp.value;
                if (q.type === 'single') {
                    if (value === q.correct) opt.classList.add('quiz-option--correct');
                    if (value === userAnswers[0] && value !== q.correct) opt.classList.add('quiz-option--wrong');
                } else {
                    if (q.correct.includes(value)) opt.classList.add('quiz-option--correct');
                    if (userAnswers.includes(value) && !q.correct.includes(value)) opt.classList.add('quiz-option--wrong');
                }
            });

            if (!isCorrect) {
                hintEl.textContent = '💡 ' + q.hint;
                hintEl.classList.remove('hidden');
            }

            checked = true;
            quizNextBtn.textContent = index < questions.length - 1 ? 'Далее' : 'Завершить';
        } else {
            renderQuestion(index + 1);
        }
    };
}

function checkQuizAnswer(question, userAnswers) {
    if (question.type === 'single') return userAnswers[0] === question.correct;
    if (question.type === 'multiple') return question.correct.sort().join(',') === userAnswers.sort().join(',');
    return false;
}

function finishQuizStep() {
    const correctCount = window.quizAnswers.filter(a => a.isCorrect).length;
    const totalCount = window.quizAnswers.length;
    stepStats.push({
        step: currentStepIndex + 1,
        type: 'quiz',
        title: currentScenario.steps[currentStepIndex].title,
        correct: correctCount,
        total: totalCount,
    });
    showToast('🎉', `Викторина пройдена! ${correctCount}/${totalCount} правильно.`, 'success');
    setTimeout(() => { currentStepIndex++; runStep(); }, 2000);
}

// ===== ШАГ: PLATFORMS (drag-and-drop) =====
function runPlatformsStep(step) {
    quizScreen.classList.remove('hidden');
    quizStepTitle.textContent = step.title;
    quizStepCounter.textContent = `Шаг ${currentStepIndex + 1} из ${currentScenario.steps.length}`;

    const data = marketingData.platforms;
    const items = [...data.items].sort(() => Math.random() - 0.5);

    let itemsHTML = items.map(item => `
        <div class="platform-item drag-item" data-id="${item.id}" data-platform="${item.platform}" draggable="true">
            ${item.text}
        </div>
    `).join('');

    quizContainer.innerHTML = `
        <div class="interactive-step">
            <p class="interactive-step__instruction">${data.instruction}</p>
            <div class="platform-items" id="platform-items">${itemsHTML}</div>
            <div class="platform-zones">
                <div class="platform-zone" data-zone="instagram">
                    <h3>📸 Instagram</h3>
                    <div class="platform-zone__drop drag-zone" id="zone-instagram" data-zone="instagram"></div>
                </div>
                <div class="platform-zone" data-zone="telegram">
                    <h3>📱 Telegram</h3>
                    <div class="platform-zone__drop drag-zone" id="zone-telegram" data-zone="telegram"></div>
                </div>
                <div class="platform-zone" data-zone="both">
                    <h3>🔄 Обе платформы</h3>
                    <div class="platform-zone__drop drag-zone" id="zone-both" data-zone="both"></div>
                </div>
            </div>
            <div class="quiz-hint hidden" id="interactive-hint"></div>
            <button class="btn btn--primary" id="interactive-check-btn">Проверить</button>
        </div>
    `;

    const checkBtn = document.getElementById('interactive-check-btn');
    let stepChecked = false;

    DragDrop.init({
        itemsSelector: '.drag-item',
        zonesSelector: '.drag-zone'
    });

    checkBtn.addEventListener('click', () => {
        if (stepChecked) {
            currentStepIndex++;
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

        stepStats.push({
            step: currentStepIndex + 1,
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

// ===== ШАГ: RULE 3T =====
function runRule3tStep(step) {
    quizScreen.classList.remove('hidden');
    quizStepTitle.textContent = step.title;
    quizStepCounter.textContent = `Шаг ${currentStepIndex + 1} из ${currentScenario.steps.length}`;

    const data = marketingData.rule3t;
    const selections = {};

    let pairsHTML = data.pairs.map(p => {
        const shuffledOptions = [...p.options].sort(() => Math.random() - 0.5);
        return `
            <div class="rule3t-row">
                <div class="rule3t-letter">${p.label}</div>
                <div class="rule3t-options">
                    ${shuffledOptions.map(opt => `
                        <div class="rule3t-option" data-letter="${p.letter}" data-value="${opt}">${opt}</div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');

    quizContainer.innerHTML = `
        <div class="interactive-step">
            <p class="interactive-step__instruction">${data.instruction}</p>
            <div class="rule3t-container">${pairsHTML}</div>
            <div class="quiz-hint hidden" id="interactive-hint"></div>
            <button class="btn btn--primary" id="interactive-check-btn" disabled>Проверить</button>
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
            currentStepIndex++;
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

        stepStats.push({
            step: currentStepIndex + 1,
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

// ===== ШАГ: PROFILE =====
function runProfileStep(step) {
    quizScreen.classList.remove('hidden');
    quizStepTitle.textContent = step.title;
    quizStepCounter.textContent = `Шаг ${currentStepIndex + 1} из ${currentScenario.steps.length}`;

    const data = marketingData.profile;
    const selections = {};

    let sectionsHTML = data.sections.map(section => `
        <div class="profile-section">
            <h3>${section.name}</h3>
            <div class="profile-options">
                ${section.options.map(opt => `
                    <div class="profile-option" data-section="${section.name}" data-id="${opt.id}" data-correct="${opt.correct}">
                        ${opt.text}
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');

    quizContainer.innerHTML = `
        <div class="interactive-step">
            <p class="interactive-step__instruction">${data.instruction}</p>
            <div class="profile-container">${sectionsHTML}</div>
            <div class="quiz-hint hidden" id="interactive-hint"></div>
            <button class="btn btn--primary" id="interactive-check-btn" disabled>Проверить</button>
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
            currentStepIndex++;
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

        stepStats.push({
            step: currentStepIndex + 1,
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

// ===== ШАГ: CONTENT PLAN =====
function runContentPlanStep(step) {
    quizScreen.classList.remove('hidden');
    quizStepTitle.textContent = step.title;
    quizStepCounter.textContent = `Шаг ${currentStepIndex + 1} из ${currentScenario.steps.length}`;

    const data = marketingData.contentPlan;
    const allFormats = [...data.goodFormats, ...data.badFormats].sort(() => Math.random() - 0.5);

    let formatsHTML = allFormats.map(f => `
        <div class="content-format-item drag-item" data-id="${f.id}" data-good="${!data.badFormats.includes(f)}" draggable="true">
            ${f.text}
        </div>
    `).join('');

    quizContainer.innerHTML = `
        <div class="interactive-step">
            <p class="interactive-step__instruction">${data.instruction}</p>
            <div class="content-plan-formats" id="content-formats">${formatsHTML}</div>
            <div class="content-plan-days" id="content-days">
                ${['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => `
                    <div class="content-day">
                        <span class="content-day__label">${day}</span>
                        <div class="content-day__slot drag-zone" data-day="${day}" data-max-items="1"></div>
                    </div>
                `).join('')}
            </div>
            <div class="quiz-hint hidden" id="interactive-hint"></div>
            <button class="btn btn--primary" id="interactive-check-btn">Проверить</button>
        </div>
    `;

    const checkBtn = document.getElementById('interactive-check-btn');
    let stepChecked = false;

    DragDrop.init({
        itemsSelector: '.drag-item',
        zonesSelector: '.drag-zone'
    });

    checkBtn.addEventListener('click', () => {
        if (stepChecked) {
            currentStepIndex++;
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

        stepStats.push({
            step: currentStepIndex + 1,
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

// ===== ШАГ: FUNNEL (drag-and-drop) =====
function runFunnelStep(step) {
    quizScreen.classList.remove('hidden');
    quizStepTitle.textContent = step.title;
    quizStepCounter.textContent = `Шаг ${currentStepIndex + 1} из ${currentScenario.steps.length}`;

    const data = marketingData.funnel;
    const steps = [...data.steps].sort(() => Math.random() - 0.5);

    let stepsHTML = steps.map(s => `
        <div class="funnel-item drag-item" data-id="${s.id}" data-order="${s.order}" draggable="true">
            <span class="funnel-item__handle">☰</span>
            <span class="funnel-item__text">${s.text}</span>
        </div>
    `).join('');

    quizContainer.innerHTML = `
        <div class="interactive-step">
            <p class="interactive-step__instruction">${data.instruction}</p>
            <p class="interactive-step__sub">Перетащите шаги в правильном порядке (сверху вниз: 1 → 6)</p>
            <div class="funnel-container drag-zone" id="funnel-container" data-zone="funnel">${stepsHTML}</div>
            <div class="quiz-hint hidden" id="interactive-hint"></div>
            <button class="btn btn--primary" id="interactive-check-btn">Проверить</button>
        </div>
    `;

    const container = document.getElementById('funnel-container');
    const checkBtn = document.getElementById('interactive-check-btn');
    let stepChecked = false;
    let draggedItem = null;

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

    checkBtn.addEventListener('click', () => {
        if (stepChecked) {
            currentStepIndex++;
            runStep();
            return;
        }

        let correct = 0;
        const total = data.steps.length;
        const hintEl = document.getElementById('interactive-hint');

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

        stepStats.push({
            step: currentStepIndex + 1,
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

// ===== ШАГ: AI TOOLS =====
function runAiToolsStep(step) {
    quizScreen.classList.remove('hidden');
    quizStepTitle.textContent = step.title;
    quizStepCounter.textContent = `Шаг ${currentStepIndex + 1} из ${currentScenario.steps.length}`;

    const data = marketingData.aiTools;
    const allTasks = [...data.allTasks].sort(() => Math.random() - 0.5);

    let toolsHTML = data.tools.map(t => `
        <div class="ai-tool">
            <h3>🛠️ ${t.name}</h3>
            <div class="ai-tool__tasks drag-zone" data-tool="${t.name}" data-max-items="3"></div>
        </div>
    `).join('');

    let tasksHTML = allTasks.map(task => `
        <div class="ai-task drag-item" data-task="${task}" draggable="true">${task}</div>
    `).join('');

    quizContainer.innerHTML = `
        <div class="interactive-step">
            <p class="interactive-step__instruction">${data.instruction}</p>
            <div class="ai-tools-container">${toolsHTML}</div>
            <div class="ai-tasks-container" id="ai-tasks">${tasksHTML}</div>
            <div class="quiz-hint hidden" id="interactive-hint"></div>
            <button class="btn btn--primary" id="interactive-check-btn">Проверить</button>
        </div>
    `;

    const checkBtn = document.getElementById('interactive-check-btn');
    let stepChecked = false;

    DragDrop.init({
        itemsSelector: '.drag-item',
        zonesSelector: '.drag-zone'
    });

    checkBtn.addEventListener('click', () => {
        if (stepChecked) {
            currentStepIndex++;
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

        stepStats.push({
            step: currentStepIndex + 1,
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

// ===== ШАГ: ANALYTICS =====
function runAnalyticsStep(step) {
    quizScreen.classList.remove('hidden');
    quizStepTitle.textContent = step.title;
    quizStepCounter.textContent = `Шаг ${currentStepIndex + 1} из ${currentScenario.steps.length}`;

    const data = marketingData.analytics;
    const options = [...data.options].sort(() => Math.random() - 0.5);

    let optionsHTML = options.map(opt => `
        <label class="analytics-option">
            <input type="checkbox" value="${opt.id}" data-key="${opt.key}">
            <span class="analytics-option__checkmark"></span>
            <span>${opt.text}</span>
        </label>
    `).join('');

    quizContainer.innerHTML = `
        <div class="interactive-step">
            <p class="interactive-step__instruction">${data.instruction}</p>
            <div class="analytics-container">${optionsHTML}</div>
            <div class="quiz-hint hidden" id="interactive-hint"></div>
            <button class="btn btn--primary" id="interactive-check-btn" disabled>Проверить</button>
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
    });

    checkBtn.addEventListener('click', () => {
        if (stepChecked) {
            currentStepIndex++;
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
                label.classList.add('analytics-option--correct');
                correct++;
            } else if (cb.checked && !isKey) {
                label.classList.add('analytics-option--wrong');
            } else if (!cb.checked && isKey) {
                label.classList.add('analytics-option--missed');
            }
        });

        stepStats.push({
            step: currentStepIndex + 1,
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

// ===== ФИНИШ =====
function showFinish() {
    mapScreen.classList.add('hidden');
    quizScreen.classList.add('hidden');
    finishScreen.classList.remove('hidden');
    headerInfo.textContent = currentScenario?.name || '';
    ProgressBar.hide();

    const totalCorrect = stepStats.reduce((sum, s) => {
        if (s.type === 'map') return sum + s.placed;
        return sum + (s.correct || 0);
    }, 0);

    const totalItems = stepStats.reduce((sum, s) => {
        if (s.type === 'map') return sum + s.total;
        return sum + (s.total || 0);
    }, 0);

    const isPerfect = totalCorrect === totalItems && totalItems > 0;

    const durationSec = window.scenarioStartTime
        ? Math.round((Date.now() - window.scenarioStartTime) / 1000)
        : 0;

    finishText.textContent = `Вы успешно завершили сценарий «${currentScenario?.name}»!`;
    finishStats.textContent = `Правильно: ${totalCorrect} из ${totalItems}`;

    User.sendResult(
        currentScenario?.name || '',
        stepStats,
        totalCorrect,
        totalItems,
        durationSec
    );

    if (currentScenario?.badge) {
        const isNew = Badges.award(currentScenario.badge);
        if (isNew) {
            Badges.showBadgeToast(currentScenario.badge);
        }
        Badges.renderOnFinish('.finish-content');
    }

    if (isPerfect && totalItems > 5) {
        const perfectBadge = '🎯 Идеальное прохождение';
        const isNewPerfect = Badges.award(perfectBadge);
        if (isNewPerfect) {
            setTimeout(() => Badges.showBadgeToast(perfectBadge), 2000);
        }
    }
}

// ===== ОБЩИЕ ФУНКЦИИ =====
function showToast(icon, message, type) {
    clearTimeout(toastTimer);
    toastIcon.textContent = icon;
    toastMessage.textContent = message;
    toast.className = `toast toast--${type} toast--show`;
    toastTimer = setTimeout(() => {
        toast.classList.remove('toast--show');
    }, 3000);
}

function getDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg) {
    return deg * (Math.PI / 180);
}

function sendToGoogle(agentName, jkName, isCorrect, distance) {
    if (!GOOGLE_SCRIPT_URL) return;

    const user = User.get();
    fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'map_click',
            agent_name: user?.name || agentName || 'Аноним',
            jk_name: jkName,
            is_correct: isCorrect,
            distance_m: Math.round(distance),
            timestamp: new Date().toISOString(),
        }),
    }).catch(err => console.error('Ошибка отправки:', err));
}

// ===== СОБЫТИЯ =====
hintBtn.addEventListener('click', () => {
    if (selectedJkId === null) return;
    const jk = allJks.find(j => j.id === selectedJkId);
    if (jk) showToast('💡', jk.hint, 'error');
});

resetStepBtn.addEventListener('click', resetMapStep);

document.getElementById('back-to-scenarios-btn').addEventListener('click', () => {
    currentScenario = null;
    mapScreen.classList.add('hidden');
    scenarioScreen.classList.remove('hidden');
    headerInfo.textContent = '';
    ProgressBar.hide();
});

document.getElementById('quiz-back-btn').addEventListener('click', () => {
    currentScenario = null;
    quizScreen.classList.add('hidden');
    scenarioScreen.classList.remove('hidden');
    headerInfo.textContent = '';
    ProgressBar.hide();
});

document.getElementById('finish-restart-btn').addEventListener('click', () => {
    if (currentScenario) {
        currentStepIndex = 0;
        stepStats = [];
        window.scenarioStartTime = Date.now();
        finishScreen.classList.add('hidden');
        runStep();
    }
});

document.getElementById('finish-scenarios-btn').addEventListener('click', () => {
    currentScenario = null;
    finishScreen.classList.add('hidden');
    scenarioScreen.classList.remove('hidden');
    headerInfo.textContent = '';
});

// ===== СТАРТ =====
document.addEventListener('DOMContentLoaded', loadData);
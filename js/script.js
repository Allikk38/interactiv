// ===== КОНФИГУРАЦИЯ =====
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzZT7dsLRkNLE0Lp7zzi1oWfGhqdxFhydKV_B-B6GZMBHp7r6OND6LgduyP89YclZQo/exec'; // Замените на ваш URL для отправки в Google Таблицу (опционально)
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
let markersLayer;
let toastTimer;
let stepStats = [];

// ===== ИНИЦИАЛИЗАЦИЯ КАРТЫ =====
function initMap() {
    map = L.map('map', {
        center: MAP_CENTER,
        zoom: MAP_ZOOM,
        zoomControl: true,
        scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
    }).addTo(map);

    markersLayer = L.layerGroup().addTo(map);
    map.on('click', onMapClick);
}

// ===== ЗАГРУЗКА ДАННЫХ =====
async function loadData() {
    try {
        const [jksRes, questionsRes, scenariosRes, marketingRes] = await Promise.all([
            fetch('data/jks.json'),
            fetch('data/questions.json'),
            fetch('data/scenarios.json'),
            fetch('data/marketing-steps.json'),
        ]);

        if (!jksRes.ok || !scenariosRes.ok) throw new Error('Ошибка загрузки данных');

        allJks = await jksRes.json();
        scenarios = await scenariosRes.json();
        marketingData = await marketingRes.json();

        if (questionsRes.ok) {
            allQuestions = await questionsRes.json();
        }

        renderScenarios();
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        showToast('❌', 'Не удалось загрузить данные. Обновите страницу.', 'error');
    }
}

// ===== РЕНДЕР СЦЕНАРИЕВ =====
function renderScenarios() {
    scenariosGrid.innerHTML = '';

    scenarios.forEach(scenario => {
        const stepsCount = scenario.steps.length;
        const mapSteps = scenario.steps.filter(s => s.type === 'map').length;
        const quizSteps = scenario.steps.filter(s => s.type === 'quiz').length;
        const interactiveSteps = scenario.steps.filter(s => !['map', 'quiz', 'finish'].includes(s.type)).length;

        let stepsDesc = [];
        if (mapSteps > 0) stepsDesc.push(`${mapSteps} карт`);
        if (quizSteps > 0) stepsDesc.push(`${quizSteps} тестов`);
        if (interactiveSteps > 0) stepsDesc.push(`${interactiveSteps} заданий`);

        const card = document.createElement('div');
        card.className = 'scenario-card';
        card.innerHTML = `
            <div class="scenario-card__name">${scenario.name}</div>
            <div class="scenario-card__description">${scenario.description}</div>
            <div class="scenario-card__steps">📋 ${stepsDesc.join(' + ') || stepsCount + ' шагов'}</div>
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

    scenarioScreen.classList.add('hidden');
    headerInfo.textContent = scenario.name;

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

    switch (step.type) {
        case 'map':
            runMapStep(step);
            break;
        case 'quiz':
            runQuizStep(step);
            break;
        case 'platforms':
            runPlatformsStep(step);
            break;
        case 'rule3t':
            runRule3tStep(step);
            break;
        case 'profile':
            runProfileStep(step);
            break;
        case 'content-plan':
            runContentPlanStep(step);
            break;
        case 'funnel':
            runFunnelStep(step);
            break;
        case 'ai-tools':
            runAiToolsStep(step);
            break;
        case 'analytics':
            runAnalyticsStep(step);
            break;
        case 'finish':
            showFinish();
            break;
        default:
            currentStepIndex++;
            runStep();
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
        setTimeout(() => {
            initMap();
            renderMapStep(filteredJks);
        }, 100);
    } else {
        map.invalidateSize();
        renderMapStep(filteredJks);
    }

    window.currentStepJks = filteredJks;
    renderJkList(filteredJks);
    renderMarkers();
}

function renderMapStep(filteredJks) {
    markersLayer.clearLayers();
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
}

function onMapClick(e) {
    if (selectedJkId === null) return;
    const jk = allJks.find(j => j.id === selectedJkId);
    if (!jk) return;
    const { lat, lng } = e.latlng;
    const distance = getDistance(lat, lng, jk.lat, jk.lng);
    const isCorrect = distance <= jk.radius;
    if (isCorrect) {
        placedJks.set(jk.id, { lat, lng, correct: true });
        showToast('✅', `Правильно! ${jk.name} на месте.`, 'success');
        selectedJkId = null;
        if (GOOGLE_SCRIPT_URL) sendToGoogle(currentScenario?.name || '', jk.name, true, distance);
    } else {
        const wrongMarker = L.marker([lat, lng], {
            icon: L.divIcon({ className: 'marker-wrong' }),
        }).addTo(markersLayer);
        wrongMarker.bindTooltip(jk.name, { permanent: true, direction: 'bottom', className: 'marker-label' }).openTooltip();
        showToast('❌', `Неправильно. ${jk.hint}`, 'error');
        setTimeout(() => markersLayer.removeLayer(wrongMarker), 3000);
        if (GOOGLE_SCRIPT_URL) sendToGoogle(currentScenario?.name || '', jk.name, false, distance);
    }
    const filteredJks = window.currentStepJks || allJks;
    renderJkList(filteredJks);
    renderMarkers();
    checkMapStepComplete(filteredJks);
}

function renderMarkers() {
    markersLayer.clearLayers();
    placedJks.forEach((data, id) => {
        const jk = allJks.find(j => j.id === id);
        if (!jk) return;
        const marker = L.marker([data.lat, data.lng], {
            icon: L.divIcon({ className: 'marker-correct' }),
        }).addTo(markersLayer);
        marker.bindTooltip(jk.name, { permanent: true, direction: 'bottom', className: 'marker-label' }).openTooltip();
    });
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
    markersLayer.clearLayers();
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
    quizNextBtn.textContent = 'Далее';
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
    options.forEach(opt => {
        opt.addEventListener('click', () => {
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
        quizNextBtn.onclick = () => renderQuestion(index + 1);
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
// ===== ШАГ: PLATFORMS (Instagram vs Telegram) =====
function runPlatformsStep(step) {
    quizScreen.classList.remove('hidden');
    quizStepTitle.textContent = step.title;
    quizStepCounter.textContent = `Шаг ${currentStepIndex + 1} из ${currentScenario.steps.length}`;

    const data = marketingData.platforms;
    const items = [...data.items].sort(() => Math.random() - 0.5);

    let itemsHTML = items.map(item => `
        <div class="platform-item" data-id="${item.id}" data-platform="${item.platform}">
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
                    <div class="platform-zone__drop" id="zone-instagram"></div>
                </div>
                <div class="platform-zone" data-zone="telegram">
                    <h3>📱 Telegram</h3>
                    <div class="platform-zone__drop" id="zone-telegram"></div>
                </div>
                <div class="platform-zone" data-zone="both">
                    <h3>🔄 Обе платформы</h3>
                    <div class="platform-zone__drop" id="zone-both"></div>
                </div>
            </div>
            <div class="quiz-hint hidden" id="interactive-hint"></div>
            <button class="btn btn--primary" id="platforms-check-btn" disabled>Проверить</button>
        </div>
    `;

    let selectedItem = null;

    document.querySelectorAll('.platform-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.platform-item').forEach(i => i.classList.remove('platform-item--selected'));
            item.classList.add('platform-item--selected');
            selectedItem = item;
        });
    });

    document.querySelectorAll('.platform-zone__drop').forEach(zone => {
        zone.addEventListener('click', () => {
            if (!selectedItem) return;
            zone.appendChild(selectedItem);
            selectedItem.classList.remove('platform-item--selected');
            selectedItem = null;
            document.getElementById('platforms-check-btn').disabled =
                document.querySelectorAll('#platform-items .platform-item').length > 0;
        });
    });

    document.getElementById('platforms-check-btn').addEventListener('click', () => {
        let correct = 0;
        let total = data.items.length;
        const hintEl = document.getElementById('interactive-hint');

        document.querySelectorAll('.platform-zone__drop .platform-item').forEach(item => {
            const zone = item.parentElement.parentElement.dataset.zone;
            const expectedPlatform = item.dataset.platform;
            if (zone === expectedPlatform || (expectedPlatform === 'both' && (zone === 'instagram' || zone === 'telegram'))) {
                item.classList.add('platform-item--correct');
                correct++;
            } else {
                item.classList.add('platform-item--wrong');
            }
        });

        const allCorrect = correct === total;
        stepStats.push({
            step: currentStepIndex + 1,
            type: 'platforms',
            title: step.title,
            correct: correct,
            total: total,
        });

        if (!allCorrect) {
            hintEl.textContent = '💡 ' + data.hint;
            hintEl.classList.remove('hidden');
        }

        setTimeout(() => {
            currentStepIndex++;
            runStep();
        }, allCorrect ? 1500 : 3000);
    });
}

// ===== ШАГ: RULE 3T =====
function runRule3tStep(step) {
    quizScreen.classList.remove('hidden');
    quizStepTitle.textContent = step.title;
    quizStepCounter.textContent = `Шаг ${currentStepIndex + 1} из ${currentScenario.steps.length}`;

    const data = marketingData.rule3t;
    let selectedLetter = null;

    let pairsHTML = data.pairs.map(p => {
        const shuffledOptions = [...p.options].sort(() => Math.random() - 0.5);
        return `
            <div class="rule3t-row">
                <div class="rule3t-letter" data-letter="${p.letter}">${p.label}</div>
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
            <button class="btn btn--primary" id="rule3t-check-btn" disabled>Проверить</button>
        </div>
    `;

    const selections = {};

    document.querySelectorAll('.rule3t-option').forEach(opt => {
        opt.addEventListener('click', () => {
            const letter = opt.dataset.letter;
            document.querySelectorAll(`.rule3t-option[data-letter="${letter}"]`).forEach(o => o.classList.remove('rule3t-option--selected'));
            opt.classList.add('rule3t-option--selected');
            selections[letter] = opt.dataset.value;
            document.getElementById('rule3t-check-btn').disabled = Object.keys(selections).length < 3;
        });
    });

    document.getElementById('rule3t-check-btn').addEventListener('click', () => {
        let correct = 0;
        const hintEl = document.getElementById('interactive-hint');

        data.pairs.forEach(p => {
            const selected = selections[p.letter];
            const opts = document.querySelectorAll(`.rule3t-option[data-letter="${p.letter}"]`);
            opts.forEach(o => {
                if (o.dataset.value === p.correct) o.classList.add('rule3t-option--correct');
                if (o.dataset.value === selected && selected !== p.correct) o.classList.add('rule3t-option--wrong');
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
        }

        setTimeout(() => {
            currentStepIndex++;
            runStep();
        }, correct === 3 ? 1500 : 3000);
    });
}

// ===== ШАГ: PROFILE (оформление профиля) =====
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
            <button class="btn btn--primary" id="profile-check-btn" disabled>Проверить</button>
        </div>
    `;

    document.querySelectorAll('.profile-option').forEach(opt => {
        opt.addEventListener('click', () => {
            const section = opt.dataset.section;
            document.querySelectorAll(`.profile-option[data-section="${section}"]`).forEach(o => o.classList.remove('profile-option--selected'));
            opt.classList.add('profile-option--selected');
            selections[section] = opt.dataset.correct === 'true';
            document.getElementById('profile-check-btn').disabled = Object.keys(selections).length < data.sections.length;
        });
    });

    document.getElementById('profile-check-btn').addEventListener('click', () => {
        let correct = 0;
        const hintEl = document.getElementById('interactive-hint');

        document.querySelectorAll('.profile-option').forEach(opt => {
            const isCorrect = opt.dataset.correct === 'true';
            if (isCorrect) opt.classList.add('profile-option--correct');
            if (opt.classList.contains('profile-option--selected') && !isCorrect) opt.classList.add('profile-option--wrong');
            if (opt.classList.contains('profile-option--selected') && isCorrect) correct++;
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
        }

        setTimeout(() => {
            currentStepIndex++;
            runStep();
        }, correct === data.sections.length ? 1500 : 3000);
    });
}
// ===== ШАГ: CONTENT PLAN (контент-план на неделю) =====
function runContentPlanStep(step) {
    quizScreen.classList.remove('hidden');
    quizStepTitle.textContent = step.title;
    quizStepCounter.textContent = `Шаг ${currentStepIndex + 1} из ${currentScenario.steps.length}`;

    const data = marketingData.contentPlan;
    const allFormats = [...data.goodFormats, ...data.badFormats].sort(() => Math.random() - 0.5);
    const selectedFormats = [];

    let formatsHTML = allFormats.map(f => `
        <div class="content-format-item ${data.badFormats.includes(f) ? 'content-format-item--bad-hidden' : ''}" data-id="${f.id}">
            <span class="content-format-item__text">${f.text}</span>
        </div>
    `).join('');

    quizContainer.innerHTML = `
        <div class="interactive-step">
            <p class="interactive-step__instruction">${data.instruction}</p>
            <div class="content-plan-formats" id="content-formats">${formatsHTML}</div>
            <div class="content-plan-days" id="content-days">
                ${['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => `
                    <div class="content-day" data-day="${day}">
                        <span class="content-day__label">${day}</span>
                        <div class="content-day__slot" data-day="${day}"></div>
                    </div>
                `).join('')}
            </div>
            <div class="quiz-hint hidden" id="interactive-hint"></div>
            <button class="btn btn--primary" id="content-plan-check-btn" disabled>Проверить</button>
        </div>
    `;

    let selectedItem = null;

    document.querySelectorAll('.content-format-item').forEach(item => {
        item.addEventListener('click', () => {
            if (item.parentElement.classList.contains('content-day__slot')) return;
            document.querySelectorAll('.content-format-item').forEach(i => i.classList.remove('content-format-item--selected'));
            item.classList.add('content-format-item--selected');
            selectedItem = item;
        });
    });

    document.querySelectorAll('.content-day__slot').forEach(slot => {
        slot.addEventListener('click', () => {
            if (!selectedItem) return;
            if (slot.children.length > 0) {
                const old = slot.children[0];
                document.getElementById('content-formats').appendChild(old);
            }
            slot.appendChild(selectedItem);
            selectedItem.classList.remove('content-format-item--selected');
            selectedItem = null;
            document.getElementById('content-plan-check-btn').disabled =
                document.querySelectorAll('.content-day__slot:empty').length > 0;
        });
    });

    document.getElementById('content-plan-check-btn').addEventListener('click', () => {
        let correct = 0;
        const total = 7;
        const hintEl = document.getElementById('interactive-hint');
        const badIds = data.badFormats.map(f => f.id);

        document.querySelectorAll('.content-day__slot .content-format-item').forEach(item => {
            if (badIds.includes(item.dataset.id)) {
                item.classList.add('content-format-item--wrong');
            } else {
                item.classList.add('content-format-item--correct');
                correct++;
            }
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
        }

        setTimeout(() => {
            currentStepIndex++;
            runStep();
        }, correct === total ? 1500 : 3000);
    });
}

// ===== ШАГ: FUNNEL (воронка привлечения) =====
function runFunnelStep(step) {
    quizScreen.classList.remove('hidden');
    quizStepTitle.textContent = step.title;
    quizStepCounter.textContent = `Шаг ${currentStepIndex + 1} из ${currentScenario.steps.length}`;

    const data = marketingData.funnel;
    const steps = [...data.steps].sort(() => Math.random() - 0.5);

    let stepsHTML = steps.map(s => `
        <div class="funnel-item" data-id="${s.id}" data-order="${s.order}">
            <span class="funnel-item__handle">☰</span>
            <span class="funnel-item__text">${s.text}</span>
        </div>
    `).join('');

    quizContainer.innerHTML = `
        <div class="interactive-step">
            <p class="interactive-step__instruction">${data.instruction}</p>
            <p class="interactive-step__sub">Перетащите шаги в правильном порядке (от 1 к 6)</p>
            <div class="funnel-container" id="funnel-container">${stepsHTML}</div>
            <div class="quiz-hint hidden" id="interactive-hint"></div>
            <button class="btn btn--primary" id="funnel-check-btn">Проверить</button>
        </div>
    `;

    const container = document.getElementById('funnel-container');
    let draggedItem = null;

    container.querySelectorAll('.funnel-item').forEach(item => {
        item.setAttribute('draggable', 'true');
        item.addEventListener('dragstart', (e) => {
            draggedItem = item;
            item.classList.add('funnel-item--dragging');
        });
        item.addEventListener('dragend', () => {
            item.classList.remove('funnel-item--dragging');
            draggedItem = null;
        });
        item.addEventListener('dragover', (e) => e.preventDefault());
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

    document.getElementById('funnel-check-btn').addEventListener('click', () => {
        let correct = 0;
        const total = data.steps.length;
        const hintEl = document.getElementById('interactive-hint');
        const items = container.querySelectorAll('.funnel-item');

        items.forEach((item, index) => {
            const expectedOrder = parseInt(item.dataset.order);
            if (expectedOrder === index + 1) {
                item.classList.add('funnel-item--correct');
                correct++;
            } else {
                item.classList.add('funnel-item--wrong');
            }
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
        }

        setTimeout(() => {
            currentStepIndex++;
            runStep();
        }, correct === total ? 1500 : 3000);
    });
}

// ===== ШАГ: AI TOOLS (мэтчинг) =====
function runAiToolsStep(step) {
    quizScreen.classList.remove('hidden');
    quizStepTitle.textContent = step.title;
    quizStepCounter.textContent = `Шаг ${currentStepIndex + 1} из ${currentScenario.steps.length}`;

    const data = marketingData.aiTools;
    const allTasks = [...data.allTasks].sort(() => Math.random() - 0.5);
    const selections = {};

    let toolsHTML = data.tools.map(t => `
        <div class="ai-tool" data-tool="${t.name}">
            <h3>🛠️ ${t.name}</h3>
            <div class="ai-tool__tasks" data-tool="${t.name}"></div>
        </div>
    `).join('');

    let tasksHTML = allTasks.map(task => `
        <div class="ai-task" data-task="${task}">${task}</div>
    `).join('');

    quizContainer.innerHTML = `
        <div class="interactive-step">
            <p class="interactive-step__instruction">${data.instruction}</p>
            <div class="ai-tools-container">${toolsHTML}</div>
            <div class="ai-tasks-container" id="ai-tasks">${tasksHTML}</div>
            <div class="quiz-hint hidden" id="interactive-hint"></div>
            <button class="btn btn--primary" id="ai-check-btn" disabled>Проверить</button>
        </div>
    `;

    let selectedTask = null;

    document.querySelectorAll('.ai-task').forEach(task => {
        task.addEventListener('click', () => {
            document.querySelectorAll('.ai-task').forEach(t => t.classList.remove('ai-task--selected'));
            task.classList.add('ai-task--selected');
            selectedTask = task;
        });
    });

    document.querySelectorAll('.ai-tool__tasks').forEach(zone => {
        zone.addEventListener('click', () => {
            if (!selectedTask) return;
            const toolName = zone.dataset.tool;
            const taskName = selectedTask.dataset.task;
            if (!selections[toolName]) selections[toolName] = [];
            if (selections[toolName].length >= 3) return;
            selections[toolName].push(taskName);
            zone.appendChild(selectedTask);
            selectedTask.classList.remove('ai-task--selected');
            selectedTask = null;

            const totalPlaced = Object.values(selections).reduce((sum, arr) => sum + arr.length, 0);
            document.getElementById('ai-check-btn').disabled = totalPlaced < 9;
        });
    });

    document.getElementById('ai-check-btn').addEventListener('click', () => {
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
        }

        setTimeout(() => {
            currentStepIndex++;
            runStep();
        }, correct === total ? 1500 : 3000);
    });
}

// ===== ШАГ: ANALYTICS (выбор метрик) =====
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
            <button class="btn btn--primary" id="analytics-check-btn" disabled>Проверить</button>
        </div>
    `;

    const checkboxes = quizContainer.querySelectorAll('input[type="checkbox"]');
    const checkBtn = document.getElementById('analytics-check-btn');

    checkboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            const checked = quizContainer.querySelectorAll('input:checked');
            checkBtn.disabled = checked.length !== 3;
        });
    });

    checkBtn.addEventListener('click', () => {
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
        }

        setTimeout(() => {
            currentStepIndex++;
            runStep();
        }, correct === total ? 1500 : 3000);
    });
}
// ===== ФИНИШ =====
function showFinish() {
    mapScreen.classList.add('hidden');
    quizScreen.classList.add('hidden');
    finishScreen.classList.remove('hidden');
    headerInfo.textContent = currentScenario?.name || '';

    const totalCorrect = stepStats.reduce((sum, s) => {
        if (s.type === 'map') return sum + s.placed;
        return sum + (s.correct || 0);
    }, 0);

    const totalItems = stepStats.reduce((sum, s) => {
        if (s.type === 'map') return sum + s.total;
        return sum + (s.total || 0);
    }, 0);

    finishText.textContent = `Вы успешно завершили сценарий «${currentScenario?.name}»!`;
    finishStats.textContent = `Правильно: ${totalCorrect} из ${totalItems}`;
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

    fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            agent_name: agentName || 'Аноним',
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
});

document.getElementById('quiz-back-btn').addEventListener('click', () => {
    currentScenario = null;
    quizScreen.classList.add('hidden');
    scenarioScreen.classList.remove('hidden');
    headerInfo.textContent = '';
});

document.getElementById('finish-restart-btn').addEventListener('click', () => {
    if (currentScenario) {
        currentStepIndex = 0;
        stepStats = [];
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

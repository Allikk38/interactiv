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
let currentScenario = null;
let currentStepIndex = 0;
let selectedJkId = null;
let placedJks = new Map();
let map;
let markersLayer;
let toastTimer;
let quizAnswers = [];
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

        let stepsDesc = [];
        if (mapSteps > 0) stepsDesc.push(`${mapSteps} карт`);
        if (quizSteps > 0) stepsDesc.push(`${quizSteps} вопросов`);
        const stepsText = stepsDesc.join(' + ') || `${stepsCount} шагов`;

        const card = document.createElement('div');
        card.className = 'scenario-card';
        card.innerHTML = `
            <div class="scenario-card__name">${scenario.name}</div>
            <div class="scenario-card__description">${scenario.description}</div>
            <div class="scenario-card__steps">📋 ${stepsText}</div>
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

        if (!isPlaced) {
            li.addEventListener('click', () => selectJk(jk.id));
        }

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

        if (GOOGLE_SCRIPT_URL) {
            sendToGoogle(currentScenario?.name || '', jk.name, true, distance);
        }
    } else {
        const wrongMarker = L.marker([lat, lng], {
            icon: L.divIcon({ className: 'marker-wrong' }),
        }).addTo(markersLayer);

        wrongMarker.bindTooltip(jk.name, {
            permanent: true,
            direction: 'bottom',
            className: 'marker-label',
        }).openTooltip();

        showToast('❌', `Неправильно. ${jk.hint}`, 'error');

        setTimeout(() => {
            markersLayer.removeLayer(wrongMarker);
        }, 3000);

        if (GOOGLE_SCRIPT_URL) {
            sendToGoogle(currentScenario?.name || '', jk.name, false, distance);
        }
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

        marker.bindTooltip(jk.name, {
            permanent: true,
            direction: 'bottom',
            className: 'marker-label',
        }).openTooltip();
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
        setTimeout(() => {
            currentStepIndex++;
            runStep();
        }, 2000);
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
    quizAnswers = [];
    window.currentStepQuestions = filteredQuestions;
    window.currentQuestionIndex = 0;

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

    let optionsHTML = '';
    q.options.forEach((opt, i) => {
        const isCheckbox = q.type === 'multiple';
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
            const isCheckbox = q.type === 'multiple';
            const input = opt.querySelector('input');

            if (isCheckbox) {
                input.checked = !input.checked;
                opt.classList.toggle('quiz-option--selected', input.checked);
            } else {
                options.forEach(o => o.classList.remove('quiz-option--selected'));
                input.checked = true;
                opt.classList.add('quiz-option--selected');
            }

            const hasSelection = isCheckbox
                ? quizContainer.querySelectorAll('input:checked').length > 0
                : true;

            quizNextBtn.disabled = !hasSelection;
        });
    });

    quizNextBtn.onclick = () => {
        const selectedInputs = quizContainer.querySelectorAll('input:checked');
        const userAnswers = Array.from(selectedInputs).map(inp => inp.value);
        const isCorrect = checkQuizAnswer(q, userAnswers);

        quizAnswers.push({
            questionId: q.id,
            userAnswers,
            isCorrect,
        });

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

        quizNextBtn.textContent = index < questions.length - 1 ? 'Далее' : 'Завершить';
        quizNextBtn.onclick = () => {
            renderQuestion(index + 1);
            quizNextBtn.textContent = 'Далее';
        };
    };
}

function checkQuizAnswer(question, userAnswers) {
    if (question.type === 'single') {
        return userAnswers[0] === question.correct;
    }
    if (question.type === 'multiple') {
        const correct = question.correct.sort().join(',');
        const user = userAnswers.sort().join(',');
        return correct === user;
    }
    return false;
}

function finishQuizStep() {
    const correctCount = quizAnswers.filter(a => a.isCorrect).length;
    const totalCount = quizAnswers.length;

    stepStats.push({
        step: currentStepIndex + 1,
        type: 'quiz',
        title: currentScenario.steps[currentStepIndex].title,
        correct: correctCount,
        total: totalCount,
    });

    showToast('🎉', `Викторина пройдена! ${correctCount}/${totalCount} правильно.`, 'success');
    setTimeout(() => {
        currentStepIndex++;
        runStep();
    }, 2000);
}

// ===== ФИНИШ =====
function showFinish() {
    mapScreen.classList.add('hidden');
    quizScreen.classList.add('hidden');
    finishScreen.classList.remove('hidden');
    headerInfo.textContent = currentScenario?.name || '';

    const totalCorrect = stepStats.reduce((sum, s) => {
        if (s.type === 'map') return sum + s.placed;
        if (s.type === 'quiz') return sum + s.correct;
        return sum;
    }, 0);

    const totalItems = stepStats.reduce((sum, s) => {
        if (s.type === 'map') return sum + s.total;
        if (s.type === 'quiz') return sum + s.total;
        return sum;
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

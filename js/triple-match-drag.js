// ===== РЕЖИМ "ТРОЙНАЯ ЭКСПЕРТИЗА" (TRIPLE MATCH DRAG) =====
// Сопоставление 3 случайным ЖК по 3 характеристики из 5 возможных полей

let tripleMatchGameState = null;

async function runTripleMatchDragStep(step) {
    const quizScreen = document.getElementById('quiz-screen');
    const quizStepTitle = document.getElementById('quiz-step-title');
    const quizStepCounter = document.getElementById('quiz-step-counter');
    const quizContainer = document.getElementById('quiz-container');
    
    // Параметры из шага
    const totalRounds = step.rounds || 5;
    const pointsPerCorrect = step.pointsPerCorrect || 10;
    const pointsPerWrong = step.pointsPerWrong || -5;
    const attributesPerJk = step.attributesPerJk || 3;
    const availableAttributes = step.availableAttributes || ['class_segment', 'build_tech', 'finish_type', 'parking_type', 'has_concierge'];
    
    // Загружаем все ЖК
    const allJks = StoreInstance.getAllJks();
    if (!allJks || allJks.length === 0) {
        logError('TripleMatch: нет данных о ЖК');
        showToast('❌', 'Ошибка загрузки данных о ЖК', 'error');
        AppState.currentStepIndex++;
        runStep();
        return;
    }
    
    // Фильтруем ЖК, у которых есть все необходимые поля
    const validJks = allJks.filter(jk => {
        for (const attr of availableAttributes) {
            const value = jk[attr];
            if (value === undefined || value === null || value === '') {
                return false;
            }
        }
        return true;
    });
    
    if (validJks.length < 3) {
        logError('TripleMatch: недостаточно ЖК с заполненными характеристиками. Доступно: ' + validJks.length);
        showToast('❌', 'Недостаточно данных о ЖК для режима', 'error');
        AppState.currentStepIndex++;
        runStep();
        return;
    }
    
    // Показываем экран
    quizScreen.classList.remove('hidden');
    quizStepTitle.textContent = step.title;
    quizStepCounter.textContent = `Шаг ${AppState.currentStepIndex + 1} из ${AppState.currentScenario.steps.length}`;
    
    // Состояние игры
    tripleMatchGameState = {
        currentRound: 1,
        totalRounds: totalRounds,
        pointsPerCorrect: pointsPerCorrect,
        pointsPerWrong: pointsPerWrong,
        attributesPerJk: attributesPerJk,
        availableAttributes: availableAttributes,
        allJks: allJks,
        validJks: validJks,
        currentJks: [],
        currentAttributes: [], // [{ jkId, attrKey, attrValue, placedInJkId }]
        unplacedAttributes: [],
        totalScore: 0,
        roundResults: [],
        gameActive: true,
        checked: false,
        roundChecked: false,
        dragDropInstance: null
    };
    
    // Запускаем первый раунд
    initTripleMatchRound();
}

function initTripleMatchRound() {
    if (!tripleMatchGameState) return;
    
    const state = tripleMatchGameState;
    
    // Выбираем 3 случайных ЖК
    const shuffledJks = [...state.validJks].sort(() => 0.5 - Math.random());
    state.currentJks = shuffledJks.slice(0, 3);
    
    // Генерируем характеристики для каждого ЖК
    const allAttributes = [];
    
    for (const jk of state.currentJks) {
        // Случайно выбираем attributesPerJk полей из availableAttributes
        const shuffledAttrs = [...state.availableAttributes].sort(() => 0.5 - Math.random());
        const selectedAttrs = shuffledAttrs.slice(0, state.attributesPerJk);
        
        for (const attrKey of selectedAttrs) {
            let attrValue = jk[attrKey];
            // Преобразуем булевы значения в читаемый текст
            if (typeof attrValue === 'boolean') {
                attrValue = attrValue ? 'Есть' : 'Нет';
            }
            // Преобразуем snake_case в читаемый вид
            const displayKey = getAttributeDisplayName(attrKey);
            const displayValue = getValueDisplayName(attrKey, attrValue);
            
            allAttributes.push({
                jkId: jk.id,
                jkName: jk.name,
                attrKey: attrKey,
                attrValue: attrValue,
                displayText: `${displayKey}: ${displayValue}`,
                placedInJkId: null
            });
        }
    }
    
    // Перемешиваем все характеристики
    state.currentAttributes = [...allAttributes].sort(() => 0.5 - Math.random());
    state.unplacedAttributes = [...state.currentAttributes];
    state.roundChecked = false;
    state.checked = false;
    
    // Рендерим интерфейс
    renderTripleMatchRound();
}

function getAttributeDisplayName(attrKey) {
    const names = {
        'class_segment': 'Класс',
        'build_tech': 'Технология',
        'finish_type': 'Отделка',
        'parking_type': 'Парковка',
        'has_concierge': 'Консьерж'
    };
    return names[attrKey] || attrKey;
}

function getValueDisplayName(attrKey, value) {
    if (typeof value === 'string') {
        const mappings = {
            // class_segment
            'эконом': 'Эконом',
            'комфорт': 'Комфорт',
            'бизнес': 'Бизнес',
            'премиум': 'Премиум',
            // build_tech
            'монолит': 'Монолит',
            'кирпич': 'Кирпич',
            'панель': 'Панель',
            'монолит-кирпич': 'Монолит-кирпич',
            // finish_type
            'черновая': 'Черновая',
            'white_box': 'White box',
            'чистовая': 'Чистовая',
            'под_ключ': 'Под ключ',
            // parking_type
            'подземная': 'Подземная',
            'наземная': 'Наземная',
            'многоуровневый': 'Многоуровневый',
            'отсутствует': 'Нет'
        };
        return mappings[value.toLowerCase()] || value;
    }
    return value === true ? 'Есть' : 'Нет';
}

function renderTripleMatchRound() {
    const state = tripleMatchGameState;
    const quizContainer = document.getElementById('quiz-container');
    
    // Формируем HTML
    let jksHTML = '';
    for (let i = 0; i < state.currentJks.length; i++) {
        const jk = state.currentJks[i];
        // Находим уже размещённые характеристики для этого ЖК
        const placedAttrs = state.currentAttributes.filter(a => a.placedInJkId === jk.id);
        
        let placedHTML = '';
        if (placedAttrs.length > 0) {
            placedHTML = placedAttrs.map(attr => `
                <div class="triple-placed-tag" data-attr-idx="${state.currentAttributes.indexOf(attr)}" data-jk-id="${jk.id}">
                    <span class="triple-placed-tag__text">${escapeHtml(attr.displayText)}</span>
                    <span class="triple-placed-tag__remove">×</span>
                </div>
            `).join('');
        } else {
            placedHTML = '<div class="triple-drop-zone__empty">Перетащите сюда характеристики</div>';
        }
        
        jksHTML += `
            <div class="triple-jk-card" data-jk-id="${jk.id}">
                <div class="triple-jk-card__header">
                    <h3 class="triple-jk-card__title">${escapeHtml(jk.name)}</h3>
                    <span class="triple-jk-card__developer">${escapeHtml(jk.developer)}</span>
                </div>
                <div class="triple-jk-card__drop-zone" data-jk-id="${jk.id}">
                    ${placedHTML}
                </div>
            </div>
        `;
    }
    
    // Формируем общую зону с непривязанными характеристиками
    let unplacedHTML = '';
    const unplaced = state.currentAttributes.filter(a => a.placedInJkId === null);
    if (unplaced.length > 0) {
        unplaced.forEach((attr, idx) => {
            const globalIdx = state.currentAttributes.indexOf(attr);
            unplacedHTML += `
                <div class="triple-attr-tag" data-attr-idx="${globalIdx}" draggable="true">
                    ${escapeHtml(attr.displayText)}
                </div>
            `;
        });
    } else {
        unplacedHTML = '<div class="triple-unplaced-empty">Все характеристики размещены! Нажмите "Проверить".</div>';
    }
    
    const progress = `${state.currentRound} / ${state.totalRounds} раундов`;
    const score = state.totalScore;
    
    quizContainer.innerHTML = renderTripleMatchGame(jksHTML, unplacedHTML, progress, score, state.roundChecked);
    
    // Настраиваем Drag-and-Drop
    initTripleMatchDragDrop();
    
    // Кнопка "Проверить"
    const checkBtn = document.getElementById('triple-check-btn');
    if (checkBtn) {
        const allPlaced = state.currentAttributes.every(a => a.placedInJkId !== null);
        checkBtn.disabled = !allPlaced || state.roundChecked;
        
        if (!state.roundChecked) {
            checkBtn.onclick = () => checkTripleMatchRound();
        }
    }
    
    // Кнопка "Далее"
    const nextBtn = document.getElementById('triple-next-btn');
    if (nextBtn) {
        nextBtn.onclick = () => nextTripleMatchRound();
    }
}

function initTripleMatchDragDrop() {
    const state = tripleMatchGameState;
    if (!state) return;
    
    // Удаляем старые обработчики
    if (state.dragDropInstance) {
        // Просто обнуляем, пересоздадим заново
        state.dragDropInstance = null;
    }
    
    const attrTags = document.querySelectorAll('.triple-attr-tag');
    const dropZones = document.querySelectorAll('.triple-jk-card__drop-zone');
    
    let draggedAttrIdx = null;
    let dragClone = null;
    let isDragging = false;
    
    const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Функция обновления отображения после перемещения
    function refreshDisplay() {
        renderTripleMatchRound();
    }
    
    // Функция перемещения атрибута в ЖК
    function moveAttributeToJk(attrIdx, targetJkId) {
        if (state.roundChecked) return false;
        
        const attr = state.currentAttributes[attrIdx];
        if (!attr) return false;
        
        // Проверяем, не превышен ли лимит характеристик для ЖК
        const attrsInTarget = state.currentAttributes.filter(a => a.placedInJkId === targetJkId);
        if (attrsInTarget.length >= state.attributesPerJk) {
            showToast('⚠️', `В этом ЖК уже ${state.attributesPerJk} характеристики. Удалите лишнюю, чтобы добавить новую.`, 'warning');
            return false;
        }
        
        // Если атрибут уже был в другом ЖК, удаляем оттуда
        if (attr.placedInJkId !== null && attr.placedInJkId !== targetJkId) {
            attr.placedInJkId = null;
        }
        
        // Помещаем в новый ЖК
        attr.placedInJkId = targetJkId;
        
        // Обновляем unplacedAttributes
        state.unplacedAttributes = state.currentAttributes.filter(a => a.placedInJkId === null);
        
        refreshDisplay();
        return true;
    }
    
    // Функция удаления атрибута из ЖК (возврат в общую зону)
    function removeAttributeFromJk(attrIdx) {
        if (state.roundChecked) return;
        
        const attr = state.currentAttributes[attrIdx];
        if (!attr) return;
        
        attr.placedInJkId = null;
        state.unplacedAttributes = state.currentAttributes.filter(a => a.placedInJkId === null);
        
        refreshDisplay();
    }
    
    // Настройка для мыши
    if (!isMobile) {
        attrTags.forEach(tag => {
            tag.setAttribute('draggable', 'true');
            
            tag.addEventListener('dragstart', (e) => {
                if (state.roundChecked) {
                    e.preventDefault();
                    return false;
                }
                draggedAttrIdx = parseInt(tag.dataset.attrIdx);
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', draggedAttrIdx.toString());
                tag.classList.add('triple-dragging');
            });
            
            tag.addEventListener('dragend', () => {
                tag.classList.remove('triple-dragging');
                draggedAttrIdx = null;
            });
        });
        
        dropZones.forEach(zone => {
            zone.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                zone.classList.add('triple-drag-over');
            });
            
            zone.addEventListener('dragleave', () => {
                zone.classList.remove('triple-drag-over');
            });
            
            zone.addEventListener('drop', (e) => {
                e.preventDefault();
                zone.classList.remove('triple-drag-over');
                if (draggedAttrIdx !== null && !state.roundChecked) {
                    const targetJkId = parseInt(zone.dataset.jkId);
                    moveAttributeToJk(draggedAttrIdx, targetJkId);
                    draggedAttrIdx = null;
                }
            });
        });
    }
    
    // Настройка для touch (мобильные)
    if (isMobile) {
        let touchStartX = 0, touchStartY = 0;
        
        attrTags.forEach(tag => {
            tag.addEventListener('touchstart', (e) => {
                if (state.roundChecked) return;
                e.preventDefault();
                const touch = e.touches[0];
                touchStartX = touch.clientX;
                touchStartY = touch.clientY;
                draggedAttrIdx = parseInt(tag.dataset.attrIdx);
                
                // Создаём клон для визуального отклика
                const rect = tag.getBoundingClientRect();
                dragClone = tag.cloneNode(true);
                dragClone.style.position = 'fixed';
                dragClone.style.left = rect.left + 'px';
                dragClone.style.top = rect.top + 'px';
                dragClone.style.width = rect.width + 'px';
                dragClone.style.zIndex = '9999';
                dragClone.style.opacity = '0.8';
                dragClone.style.pointerEvents = 'none';
                document.body.appendChild(dragClone);
                
                tag.style.opacity = '0.3';
                
                setTimeout(() => {
                    if (dragClone) {
                        isDragging = true;
                    }
                }, 100);
            });
            
            tag.addEventListener('touchmove', (e) => {
                if (!dragClone) return;
                e.preventDefault();
                const touch = e.touches[0];
                dragClone.style.left = (touch.clientX - 20) + 'px';
                dragClone.style.top = (touch.clientY - 20) + 'px';
                
                // Находим зону под пальцем
                const elemUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
                const zoneUnderTouch = elemUnderTouch?.closest('.triple-jk-card__drop-zone');
                
                document.querySelectorAll('.triple-jk-card__drop-zone').forEach(z => {
                    z.classList.remove('triple-drag-over');
                });
                if (zoneUnderTouch) {
                    zoneUnderTouch.classList.add('triple-drag-over');
                }
            });
            
            tag.addEventListener('touchend', (e) => {
                e.preventDefault();
                
                if (dragClone) {
                    dragClone.remove();
                    dragClone = null;
                }
                tag.style.opacity = '';
                
                if (isDragging && draggedAttrIdx !== null && !state.roundChecked) {
                    const touch = e.changedTouches[0];
                    const elemUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
                    const zoneUnderTouch = elemUnderTouch?.closest('.triple-jk-card__drop-zone');
                    
                    if (zoneUnderTouch) {
                        const targetJkId = parseInt(zoneUnderTouch.dataset.jkId);
                        moveAttributeToJk(draggedAttrIdx, targetJkId);
                    }
                }
                
                document.querySelectorAll('.triple-jk-card__drop-zone').forEach(z => {
                    z.classList.remove('triple-drag-over');
                });
                
                isDragging = false;
                draggedAttrIdx = null;
            });
        });
    }
    
    // Обработчики для удаления характеристик (клик по ×)
    document.querySelectorAll('.triple-placed-tag__remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const parent = btn.closest('.triple-placed-tag');
            if (parent) {
                const attrIdx = parseInt(parent.dataset.attrIdx);
                if (!isNaN(attrIdx)) {
                    removeAttributeFromJk(attrIdx);
                }
            }
        });
    });
}

function checkTripleMatchRound() {
    const state = tripleMatchGameState;
    if (state.roundChecked) return;
    
    let correctCount = 0;
    let wrongCount = 0;
    
    // Проверяем каждую характеристику
    for (const attr of state.currentAttributes) {
        if (attr.placedInJkId === null) continue;
        
        // Находим ЖК, в который поместили характеристику
        const targetJk = state.currentJks.find(jk => jk.id === attr.placedInJkId);
        if (!targetJk) {
            wrongCount++;
            continue;
        }
        
        // Получаем значение этой характеристики у целевого ЖК
        let targetValue = targetJk[attr.attrKey];
        if (typeof targetValue === 'boolean') {
            targetValue = targetValue ? 'Есть' : 'Нет';
        }
        
        // Приводим к строке
        const attrValueStr = String(attr.attrValue).toLowerCase();
        const targetValueStr = String(targetValue).toLowerCase();
        
        // ПРОВЕРКА НА ЧАСТИЧНОЕ СОВПАДЕНИЕ
        // Характеристика правильная, если:
        // 1. Значения полностью совпадают, ИЛИ
        // 2. Значение характеристики содержится в значении ЖК (для случаев с перечислением через запятую)
        // 3. Значение ЖК содержится в значении характеристики
        const isExactMatch = (attrValueStr === targetValueStr);
        const isPartialMatch = (targetValueStr.includes(attrValueStr) || attrValueStr.includes(targetValueStr));
        const isCorrect = isExactMatch || isPartialMatch;
        
        if (isCorrect) {
            correctCount++;
        } else {
            wrongCount++;
        }
    }
    
    // Подсвечиваем правильные и неправильные
    document.querySelectorAll('.triple-placed-tag').forEach(tag => {
        const attrIdx = parseInt(tag.dataset.attrIdx);
        const attr = state.currentAttributes[attrIdx];
        if (attr && attr.placedInJkId !== null) {
            const targetJk = state.currentJks.find(jk => jk.id === attr.placedInJkId);
            if (targetJk) {
                let targetValue = targetJk[attr.attrKey];
                if (typeof targetValue === 'boolean') {
                    targetValue = targetValue ? 'Есть' : 'Нет';
                }
                const attrValueStr = String(attr.attrValue).toLowerCase();
                const targetValueStr = String(targetValue).toLowerCase();
                const isExactMatch = (attrValueStr === targetValueStr);
                const isPartialMatch = (targetValueStr.includes(attrValueStr) || attrValueStr.includes(targetValueStr));
                const isCorrect = isExactMatch || isPartialMatch;
                
                if (isCorrect) {
                    tag.classList.add('triple-placed-tag--correct');
                } else {
                    tag.classList.add('triple-placed-tag--wrong');
                }
            }
        }
    });
    
    state.roundChecked = true;
    
    const roundScore = (correctCount * state.pointsPerCorrect) + (wrongCount * state.pointsPerWrong);
    state.totalScore += roundScore;
    
    state.roundResults.push({
        round: state.currentRound,
        correct: correctCount,
        wrong: wrongCount,
        total: state.currentAttributes.filter(a => a.placedInJkId !== null).length,
        score: roundScore
    });
    
    const feedbackDiv = document.getElementById('triple-feedback');
    if (feedbackDiv) {
        const feedbackClass = roundScore >= 0 ? 'triple-feedback--success' : 'triple-feedback--error';
        feedbackDiv.innerHTML = `
            <div class="${feedbackClass}">
                <i class="fas ${roundScore >= 0 ? 'fa-check-circle' : 'fa-exclamation-triangle'}"></i>
                <span>Раунд ${state.currentRound}: ${correctCount} правильно, ${wrongCount} ошибок. ${roundScore >= 0 ? '+' : ''}${roundScore} XP</span>
            </div>
        `;
        feedbackDiv.style.display = 'block';
    }
    
    const scoreEl = document.getElementById('triple-score-value');
    if (scoreEl) {
        scoreEl.textContent = state.totalScore;
    }
    
    const checkBtn = document.getElementById('triple-check-btn');
    const nextBtn = document.getElementById('triple-next-btn');
    if (checkBtn) checkBtn.style.display = 'none';
    if (nextBtn) nextBtn.style.display = 'block';
}

function nextTripleMatchRound() {
    const state = tripleMatchGameState;
    
    if (state.currentRound < state.totalRounds) {
        state.currentRound++;
        state.roundChecked = false;
        state.checked = false;
        
        // Скрываем обратную связь
        const feedbackDiv = document.getElementById('triple-feedback');
        if (feedbackDiv) {
            feedbackDiv.style.display = 'none';
        }
        
        // Запускаем следующий раунд
        initTripleMatchRound();
    } else {
        // Завершаем режим
        finishTripleMatchGame();
    }
}

function finishTripleMatchGame() {
    const state = tripleMatchGameState;
    
    // Сохраняем статистику
    const totalCorrect = state.roundResults.reduce((sum, r) => sum + r.correct, 0);
    const totalItems = state.roundResults.reduce((sum, r) => sum + r.total, 0);
    
    AppState.stepStats.push({
        step: AppState.currentStepIndex + 1,
        type: 'triple-match-drag',
        title: AppState.currentScenario.steps[AppState.currentStepIndex].title,
        correct: totalCorrect,
        total: totalItems,
        score: state.totalScore,
        rounds: state.roundResults
    });
    
    if (typeof saveCurrentProgress === 'function') {
        saveCurrentProgress();
    }
    
    if (typeof updateHeaderXP === 'function') {
        updateHeaderXP();
    }
    
    showToast('🏆', `Режим пройден! Набрано ${state.totalScore} XP`, 'success');
    
    // Переходим к следующему шагу
    setTimeout(() => {
        AppState.currentStepIndex++;
        runStep();
    }, 2000);
}

// Регистрируем обработчик в глобальном объекте
window.runTripleMatchDragStep = runTripleMatchDragStep;
// ===== ШАБЛОНЫ ДЛЯ СЦЕНАРИЯ "ПУТЬ КЛИЕНТА" =====

/**
 * Возвращает HTML прогресс-бара
 * @param {number} currentStage - текущий этап (0-index)
 * @param {number} totalStages - общее количество этапов
 * @returns {string} HTML строка
 */
function renderJourneyProgressBar(currentStage, totalStages) {
    const percent = ((currentStage + 1) / totalStages) * 100;
    return `
        <div class="journey-progress">
            <div class="journey-progress__bar" style="width: ${percent}%"></div>
        </div>
    `;
}

/**
 * Возвращает HTML блока клиента (аватар, имя, сообщение)
 * @param {Object} stage - объект этапа
 * @returns {string} HTML строка
 */
function renderJourneyClientBlock(stage) {
    return `
        <div class="journey-client">
            <div class="journey-client__avatar"><i class="fas ${stage.clientIcon || 'fa-user-circle'}"></i></div>
            <div class="journey-client__name">${escapeHtml(stage.clientName || 'Клиент')}</div>
            <div class="journey-client__message">${escapeHtml(stage.clientMessage || '')}</div>
        </div>
    `;
}

/**
 * Возвращает HTML опций ответа агента
 * @param {Array} options - массив опций
 * @returns {string} HTML строка
 */
function renderJourneyOptions(options) {
    let optionsHTML = '';
    options.forEach((opt, idx) => {
        optionsHTML += `
            <div class="journey-option" data-opt-index="${idx}" data-next-stage="${opt.nextStage !== undefined ? opt.nextStage : 'next'}">
                <div class="journey-option__text">${escapeHtml(opt.text)}</div>
            </div>
        `;
    });
    return `
        <div class="journey-agent">
            <div class="journey-agent__label"><i class="fas fa-comment-dots"></i> Ваш ответ:</div>
            <div class="journey-agent__options">${optionsHTML}</div>
        </div>
    `;
}

/**
 * Возвращает HTML диалогового этапа
 * @param {Object} stage - объект этапа
 * @param {number} stageIndex - индекс текущего этапа
 * @param {number} totalStages - общее количество этапов
 * @returns {string} HTML строка
 */
function renderDialogueStage(stage, stageIndex, totalStages) {
    return `
        <div class="journey-container-inner">
            ${renderJourneyProgressBar(stageIndex, totalStages)}
            ${renderJourneyClientBlock(stage)}
            ${renderJourneyOptions(stage.options)}
            <div class="journey-feedback" style="display: none;"></div>
            <button class="btn btn--primary journey-next-btn" style="display: none;">Далее</button>
        </div>
    `;
}

/**
 * Возвращает HTML карточки планировки
 * @param {Object} plan - объект планировки
 * @returns {string} HTML строка
 */
function renderPlanCard(plan) {
    const imageHtml = plan.image 
        ? `<img src="${plan.image}" alt="${escapeHtml(plan.name)}">` 
        : `<div class="plan-card__placeholder"><i class="fas fa-building"></i></div>`;
    
    return `
        <div class="plan-card" data-plan-id="${plan.id}" data-price="${plan.price}" data-rooms="${plan.rooms}">
            <div class="plan-card__image">
                ${imageHtml}
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
}

/**
 * Возвращает HTML этапа выбора планировок
 * @param {Object} stage - объект этапа
 * @param {number} stageIndex - индекс текущего этапа
 * @param {number} totalStages - общее количество этапов
 * @param {Array} plans - массив планировок
 * @returns {string} HTML строка
 */
function renderSelectPlansStage(stage, stageIndex, totalStages, plans) {
    let plansHTML = '';
    plans.forEach(plan => {
        plansHTML += renderPlanCard(plan);
    });
    
    return `
        <div class="journey-container-inner">
            ${renderJourneyProgressBar(stageIndex, totalStages)}
            ${renderJourneyClientBlock(stage)}
            <div class="journey-task">
                <div class="journey-task__title">${escapeHtml(stage.taskTitle || 'Выберите подходящие планировки')}</div>
                <div class="journey-task__desc">${escapeHtml(stage.taskDescription || '')}</div>
                <div class="plans-grid" id="plans-grid">${plansHTML}</div>
                <button class="btn btn--primary check-plans-btn">Проверить</button>
            </div>
            <div class="journey-feedback" style="display: none;"></div>
            <button class="btn btn--primary journey-next-btn" style="display: none;">Далее</button>
        </div>
    `;
}

/**
 * Возвращает HTML этапа уведомления застройщика
 * @param {Object} stage - объект этапа
 * @param {number} stageIndex - индекс текущего этапа
 * @param {number} totalStages - общее количество этапов
 * @returns {string} HTML строка
 */
function renderNotifyDeveloperStage(stage, stageIndex, totalStages) {
    let optionsHTML = '';
    stage.options.forEach((opt, idx) => {
        optionsHTML += `
            <div class="journey-option notify-option" data-opt-index="${idx}" data-correct="${opt.correct}">
                <div class="journey-option__text">${escapeHtml(opt.text)}</div>
            </div>
        `;
    });
    
    return `
        <div class="journey-container-inner">
            ${renderJourneyProgressBar(stageIndex, totalStages)}
            <div class="journey-task">
                <div class="journey-task__title">${escapeHtml(stage.taskTitle || 'Уведомление застройщика')}</div>
                <div class="journey-task__desc">${escapeHtml(stage.taskDescription || '')}</div>
                <div class="journey-agent__options">${optionsHTML}</div>
            </div>
            <div class="journey-feedback" style="display: none;"></div>
            <button class="btn btn--primary journey-next-btn" style="display: none;">Далее</button>
        </div>
    `;
}

/**
 * Возвращает HTML этапа расчёта выгоды
 * @param {Object} stage - объект этапа
 * @param {number} stageIndex - индекс текущего этапа
 * @param {number} totalStages - общее количество этапов
 * @returns {string} HTML строка
 */
function renderCalculateBenefitStage(stage, stageIndex, totalStages) {
    return `
        <div class="journey-container-inner">
            ${renderJourneyProgressBar(stageIndex, totalStages)}
            ${renderJourneyClientBlock(stage)}
            <div class="journey-task">
                <div class="journey-task__title">${escapeHtml(stage.taskTitle || 'Рассчитайте выгоду')}</div>
                <div class="journey-task__desc">${escapeHtml(stage.taskDescription || '')}</div>
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
}

/**
 * Возвращает HTML этапа сортировки шагов
 * @param {Object} stage - объект этапа
 * @param {number} stageIndex - индекс текущего этапа
 * @param {number} totalStages - общее количество этапов
 * @param {Array} shuffledSteps - перемешанные шаги
 * @returns {string} HTML строка
 */
function renderSortStepsStage(stage, stageIndex, totalStages, shuffledSteps) {
    let stepsHTML = '';
    shuffledSteps.forEach((step, idx) => {
        stepsHTML += `
            <div class="sort-step" data-step-id="${step.id}" data-order="${step.order}" draggable="true">
                <span class="sort-step__handle"><i class="fas fa-grip-vertical"></i></span>
                <span class="sort-step__text">${escapeHtml(step.text)}</span>
                <span class="sort-step__num"></span>
            </div>
        `;
    });
    
    return `
        <div class="journey-container-inner">
            ${renderJourneyProgressBar(stageIndex, totalStages)}
            <div class="journey-task">
                <div class="journey-task__title">${escapeHtml(stage.taskTitle || 'Расставьте шаги в правильном порядке')}</div>
                <div class="journey-task__desc">${escapeHtml(stage.taskDescription || '')}</div>
                <div class="sort-steps-container" id="sort-steps-container">${stepsHTML}</div>
                <button class="btn btn--primary check-sort-btn">Проверить</button>
            </div>
            <div class="journey-feedback" style="display: none;"></div>
            <button class="btn btn--primary journey-next-btn" style="display: none;">Далее</button>
        </div>
    `;
}

/**
 * Возвращает HTML блока обратной связи
 * @param {boolean} isCorrect - правильный ли ответ
 * @param {string} correctFeedback - текст при правильном ответе
 * @param {string} wrongFeedback - текст при неправильном ответе
 * @returns {string} HTML строка
 */
function renderJourneyFeedback(isCorrect, correctFeedback, wrongFeedback) {
    const icon = isCorrect ? 'fa-check-circle' : 'fa-exclamation-triangle';
    const feedbackClass = isCorrect ? 'journey-feedback--correct' : 'journey-feedback--wrong';
    const message = isCorrect ? correctFeedback : wrongFeedback;
    
    return `
        <div class="journey-feedback ${feedbackClass}" style="display: flex;">
            <div class="journey-feedback__icon"><i class="fas ${icon}"></i></div>
            <div class="journey-feedback__text"><strong>${isCorrect ? 'Верно' : 'Можно лучше:'}</strong><br>${escapeHtml(message)}</div>
        </div>
    `;
}

// Функция escapeHtml теперь глобальная (из utils/escape.js)
// Локальное определение УДАЛЕНО

// ===== ШАБЛОНЫ ДЛЯ ИНТЕРАКТИВНЫХ ШАГОВ =====

/**
 * Возвращает HTML элемента платформы
 * @param {Object} item - объект элемента платформы
 * @returns {string} HTML строка
 */
function renderPlatformItem(item) {
    return `
        <div class="platform-item drag-item" data-id="${item.id}" data-platform="${item.platform}" draggable="true" style="background-color:var(--color-surface); border:2px solid var(--color-border); border-radius:var(--radius-sm); padding:12px 18px; cursor:grab; margin:5px; display:inline-block;">
            ${escapeHtml(item.text)}
        </div>
    `;
}

/**
 * Возвращает HTML зон для drag-drop платформ
 * @returns {string} HTML строка
 */
function renderPlatformZones() {
    return `
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
    `;
}

/**
 * Возвращает HTML этапа выбора платформ
 * @param {Object} data - объект с данными этапа
 * @param {string} itemsHTML - HTML элементов для перетаскивания
 * @returns {string} HTML строка
 */
function renderPlatformsStep(data, itemsHTML) {
    return `
        <div class="interactive-step">
            <p class="interactive-step__instruction">${escapeHtml(data.instruction)}</p>
            <div class="platform-items" id="platform-items" style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom:28px; justify-content:center;">${itemsHTML}</div>
            ${renderPlatformZones()}
            <div class="quiz-hint hidden" id="interactive-hint" style="margin-top:18px; padding:14px 18px; background-color:#fef9e7; border-left:4px solid var(--color-warning); border-radius:0 var(--radius-sm) var(--radius-sm) 0;"></div>
            <button class="btn btn--primary" id="interactive-check-btn" style="display:block; margin:0 auto; padding:10px 16px;">Проверить</button>
        </div>
    `;
}

/**
 * Возвращает HTML строки правила 3Т
 * @param {Object} pair - объект пары (буква, правильный ответ, опции)
 * @param {Array} shuffledOptions - перемешанные опции
 * @returns {string} HTML строка
 */
function renderRule3tRow(pair, shuffledOptions) {
    let optionsHTML = '';
    shuffledOptions.forEach(opt => {
        optionsHTML += `
            <div class="rule3t-option" data-letter="${pair.letter}" data-value="${escapeHtml(opt)}" style="background-color:var(--color-surface); border:2px solid var(--color-border); border-radius:var(--radius-sm); padding:12px 16px; cursor:pointer; font-size:0.85rem; transition:all var(--transition); flex:1; text-align:center;">${escapeHtml(opt)}</div>
        `;
    });
    
    return `
        <div class="rule3t-row" style="display:flex; align-items:center; gap:16px; margin-bottom:16px;">
            <div class="rule3t-letter" style="background-color:var(--color-primary); color:#fff; padding:14px 20px; border-radius:var(--radius-sm); font-weight:700; min-width:130px; text-align:center;">${escapeHtml(pair.label)}</div>
            <div class="rule3t-options" style="display:flex; gap:10px; flex:1;">
                ${optionsHTML}
            </div>
        </div>
    `;
}

/**
 * Возвращает HTML этапа правила 3Т
 * @param {Object} data - объект с данными этапа
 * @param {string} pairsHTML - HTML строк правил
 * @returns {string} HTML строка
 */
function renderRule3tStep(data, pairsHTML) {
    return `
        <div class="interactive-step">
            <p class="interactive-step__instruction">${escapeHtml(data.instruction)}</p>
            <div class="rule3t-container">${pairsHTML}</div>
            <div class="quiz-hint hidden" id="interactive-hint" style="margin-top:18px; padding:14px 18px; background-color:#fef9e7; border-left:4px solid var(--color-warning); border-radius:0 var(--radius-sm) var(--radius-sm) 0;"></div>
            <button class="btn btn--primary" id="interactive-check-btn" disabled style="display:block; margin:0 auto; padding:10px 16px;">Проверить</button>
        </div>
    `;
}

/**
 * Возвращает HTML секции профиля
 * @param {Object} section - объект секции профиля
 * @returns {string} HTML строка
 */
function renderProfileSection(section) {
    let optionsHTML = '';
    section.options.forEach(opt => {
        optionsHTML += `
            <div class="profile-option" data-section="${escapeHtml(section.name)}" data-id="${opt.id}" data-correct="${opt.correct}" style="background-color:var(--color-surface); border:2px solid var(--color-border); border-radius:var(--radius-sm); padding:14px 18px; cursor:pointer; font-size:0.9rem; transition:all var(--transition); flex:1; text-align:center;">${escapeHtml(opt.text)}</div>
        `;
    });
    
    return `
        <div class="profile-section" style="margin-bottom:24px;">
            <h3 style="font-size:1rem; font-weight:700; margin-bottom:12px;">${escapeHtml(section.name)}</h3>
            <div class="profile-options" style="display:flex; gap:10px;">
                ${optionsHTML}
            </div>
        </div>
    `;
}

/**
 * Возвращает HTML этапа оформления профиля
 * @param {Object} data - объект с данными этапа
 * @param {string} sectionsHTML - HTML секций профиля
 * @returns {string} HTML строка
 */
function renderProfileStep(data, sectionsHTML) {
    return `
        <div class="interactive-step">
            <p class="interactive-step__instruction">${escapeHtml(data.instruction)}</p>
            <div class="profile-container">${sectionsHTML}</div>
            <div class="quiz-hint hidden" id="interactive-hint" style="margin-top:18px; padding:14px 18px; background-color:#fef9e7; border-left:4px solid var(--color-warning); border-radius:0 var(--radius-sm) var(--radius-sm) 0;"></div>
            <button class="btn btn--primary" id="interactive-check-btn" disabled style="display:block; margin:0 auto; padding:10px 16px;">Проверить</button>
        </div>
    `;
}

/**
 * Возвращает HTML дней недели для контент-плана
 * @returns {string} HTML строка
 */
function renderContentPlanDays() {
    const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    let daysHTML = '';
    days.forEach(day => {
        daysHTML += `
            <div class="content-day" style="background-color:var(--color-surface); border:2px dashed var(--color-border); border-radius:var(--radius-sm); padding:12px 8px; text-align:center;">
                <span class="content-day__label" style="font-weight:700; font-size:0.85rem; display:block; margin-bottom:8px; color:var(--color-primary);">${day}</span>
                <div class="content-day__slot drag-zone" data-day="${day}" data-max-items="1" style="min-height:50px;"></div>
            </div>
        `;
    });
    return daysHTML;
}

/**
 * Возвращает HTML элемента формата контента
 * @param {Object} format - объект формата
 * @returns {string} HTML строка
 */
function renderContentFormatItem(format) {
    return `
        <div class="content-format-item drag-item" data-id="${format.id}" data-good="${!format.isBad}" draggable="true" style="background-color:var(--color-surface); border:2px solid var(--color-border); border-radius:var(--radius-sm); padding:10px 16px; cursor:grab; font-size:0.85rem; transition:all var(--transition); display:inline-block; margin:5px;">${escapeHtml(format.text)}</div>
    `;
}

/**
 * Возвращает HTML этапа контент-плана
 * @param {Object} data - объект с данными этапа
 * @param {string} formatsHTML - HTML форматов контента
 * @param {string} daysHTML - HTML дней недели
 * @returns {string} HTML строка
 */
function renderContentPlanStep(data, formatsHTML, daysHTML) {
    return `
        <div class="interactive-step">
            <p class="interactive-step__instruction">${escapeHtml(data.instruction)}</p>
            <div class="content-plan-formats" id="content-formats" style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom:28px; justify-content:center;">${formatsHTML}</div>
            <div class="content-plan-days" id="content-days" style="display:grid; grid-template-columns:repeat(7,1fr); gap:10px; margin-bottom:28px;">
                ${daysHTML}
            </div>
            <div class="quiz-hint hidden" id="interactive-hint" style="margin-top:18px; padding:14px 18px; background-color:#fef9e7; border-left:4px solid var(--color-warning); border-radius:0 var(--radius-sm) var(--radius-sm) 0;"></div>
            <button class="btn btn--primary" id="interactive-check-btn" style="display:block; margin:0 auto; padding:10px 16px;">Проверить</button>
        </div>
    `;
}

/**
 * Возвращает HTML этапа воронки
 * @param {string} stepsHTML - HTML шагов для перетаскивания
 * @returns {string} HTML строка
 */
function renderFunnelStep(stepsHTML) {
    return `
        <div class="interactive-step">
            <p class="interactive-step__instruction">Перетащите шаги в правильном порядке (сверху вниз: 1 → 6)</p>
            <div class="funnel-container drag-zone" id="funnel-container" data-zone="funnel" style="max-width:600px; margin-bottom:28px;">${stepsHTML}</div>
            <div class="quiz-hint hidden" id="interactive-hint" style="margin-top:18px; padding:14px 18px; background-color:#fef9e7; border-left:4px solid var(--color-warning); border-radius:0 var(--radius-sm) var(--radius-sm) 0;"></div>
            <button class="btn btn--primary" id="interactive-check-btn" style="display:block; margin:0 auto; padding:10px 16px;">Проверить</button>
        </div>
    `;
}

/**
 * Возвращает HTML элемента шага воронки
 * @param {Object} step - объект шага
 * @returns {string} HTML строка
 */
function renderFunnelItem(step) {
    return `
        <div class="funnel-item drag-item" data-id="${step.id}" data-order="${step.order}" draggable="true" style="background-color:var(--color-surface); border:2px solid var(--color-border); border-radius:var(--radius-sm); padding:16px 18px; cursor:grab; display:flex; align-items:center; gap:14px; margin-bottom:8px;">
            <span class="funnel-item__handle" style="color:var(--color-text-light); font-size:1.3rem; cursor:grab;">☰</span>
            <span class="funnel-item__text" style="font-size:0.95rem;">${escapeHtml(step.text)}</span>
        </div>
    `;
}

/**
 * Возвращает HTML колонки инструмента AI
 * @param {Object} tool - объект инструмента
 * @returns {string} HTML строка
 */
function renderAiToolColumn(tool) {
    return `
        <div class="ai-tool" style="background-color:var(--color-surface); border:2px solid var(--color-border); border-radius:var(--radius); padding:18px; text-align:center;">
            <h3 style="font-size:1rem; margin-bottom:12px;">🛠️ ${escapeHtml(tool.name)}</h3>
            <div class="ai-tool__tasks drag-zone" data-tool="${escapeHtml(tool.name)}" data-max-items="3" style="min-height:100px;"></div>
        </div>
    `;
}

/**
 * Возвращает HTML задачи для AI
 * @param {string} task - название задачи
 * @returns {string} HTML строка
 */
function renderAiTask(task) {
    return `
        <div class="ai-task drag-item" data-task="${escapeHtml(task)}" draggable="true" style="background-color:var(--color-surface); border:2px solid var(--color-border); border-radius:var(--radius-sm); padding:10px 16px; cursor:grab; font-size:0.85rem; transition:all var(--transition); display:inline-block; margin:5px;">${escapeHtml(task)}</div>
    `;
}

/**
 * Возвращает HTML этапа AI-инструментов
 * @param {Object} data - объект с данными этапа
 * @param {string} toolsHTML - HTML колонок инструментов
 * @param {string} tasksHTML - HTML задач
 * @returns {string} HTML строка
 */
function renderAiToolsStep(data, toolsHTML, tasksHTML) {
    return `
        <div class="interactive-step">
            <p class="interactive-step__instruction">${escapeHtml(data.instruction)}</p>
            <div class="ai-tools-container" style="display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-bottom:24px;">${toolsHTML}</div>
            <div class="ai-tasks-container" id="ai-tasks" style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom:28px; justify-content:center;">${tasksHTML}</div>
            <div class="quiz-hint hidden" id="interactive-hint" style="margin-top:18px; padding:14px 18px; background-color:#fef9e7; border-left:4px solid var(--color-warning); border-radius:0 var(--radius-sm) var(--radius-sm) 0;"></div>
            <button class="btn btn--primary" id="interactive-check-btn" style="display:block; margin:0 auto; padding:10px 16px;">Проверить</button>
        </div>
    `;
}

/**
 * Возвращает HTML опции аналитики
 * @param {Object} opt - объект опции
 * @returns {string} HTML строка
 */
function renderAnalyticsOption(opt) {
    return `
        <label class="analytics-option" style="display:flex; align-items:center; gap:14px; background-color:var(--color-surface); border:2px solid var(--color-border); border-radius:var(--radius-sm); padding:16px 18px; cursor:pointer; margin-bottom:8px;">
            <input type="checkbox" value="${opt.id}" data-key="${opt.key}" style="display:none;">
            <span class="analytics-option__checkmark" style="width:24px; height:24px; border:2px solid var(--color-border); border-radius:4px; flex-shrink:0;"></span>
            <span>${escapeHtml(opt.text)}</span>
        </label>
    `;
}

/**
 * Возвращает HTML этапа аналитики
 * @param {Object} data - объект с данными этапа
 * @param {string} optionsHTML - HTML опций
 * @returns {string} HTML строка
 */
function renderAnalyticsStep(data, optionsHTML) {
    return `
        <div class="interactive-step">
            <p class="interactive-step__instruction">${escapeHtml(data.instruction)}</p>
            <div class="analytics-container" style="max-width:600px; margin-bottom:28px;">${optionsHTML}</div>
            <div class="quiz-hint hidden" id="interactive-hint" style="margin-top:18px; padding:14px 18px; background-color:#fef9e7; border-left:4px solid var(--color-warning); border-radius:0 var(--radius-sm) var(--radius-sm) 0;"></div>
            <button class="btn btn--primary" id="interactive-check-btn" disabled style="display:block; margin:0 auto; padding:10px 16px;">Проверить</button>
        </div>
    `;
}

// Функция escapeHtml теперь глобальная (из utils/escape.js)
// Локальное определение УДАЛЕНО

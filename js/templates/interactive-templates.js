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

// ===== ДОПОЛНЕНИЕ ДЛЯ ТАЙМЕР-КВИЗА =====

/**
 * Возвращает HTML игрового экрана таймер-квиза
 * @param {number} score - текущий счёт
 * @param {number} timeLeft - оставшееся время
 * @param {number} highScore - рекорд
 * @param {Object} question - объект вопроса
 * @param {string} progress - прогресс (например "1/5")
 * @param {number} questionIndex - индекс вопроса
 * @returns {string} HTML строка
 */
function renderTimerQuizGame(score, timeLeft, highScore, question, progress, questionIndex) {
    let optionsHTML = '';
    const isCheckbox = question.type === 'multiple';
    
    question.options.forEach((opt, idx) => {
        optionsHTML += `
            <div class="timer-option" data-value="${escapeHtml(opt)}" style="cursor:pointer; display:flex; align-items:flex-start; gap:14px; padding:14px 18px; border:2px solid var(--color-border); border-radius:var(--radius-sm); margin-bottom:8px; transition:all var(--transition);">
                <span class="timer-option__indicator" style="width:22px; height:22px; border:2px solid var(--color-border); border-radius:${isCheckbox ? '4px' : '50%'}; flex-shrink:0; display:inline-block;"></span>
                <span>${escapeHtml(opt)}</span>
            </div>
        `;
    });
    
    return `
        <div class="timer-quiz-container" style="max-width:800px; margin:0 auto; padding:20px;">
            <div class="timer-quiz-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; padding:16px; background:linear-gradient(135deg, #2c3e50, #1a252f); border-radius:var(--radius); color:white;">
                <div class="timer-score" style="text-align:center;">
                    <div style="font-size:0.7rem; opacity:0.8;">🏆 СЧЁТ</div>
                    <div id="timer-score" style="font-size:1.8rem; font-weight:700; color:#27ae60;">${score}</div>
                </div>
                <div class="timer-progress" style="text-align:center;">
                    <div style="font-size:0.7rem; opacity:0.8;">📋 ПРОГРЕСС</div>
                    <div style="font-size:1.2rem; font-weight:700;">${progress}</div>
                </div>
                <div class="timer-clock" style="text-align:center;">
                    <div style="font-size:0.7rem; opacity:0.8;">⏱️ ВРЕМЯ</div>
                    <div id="timer-value" style="font-size:1.8rem; font-weight:700; color:#2e86de;">${timeLeft}</div>
                </div>
                <div class="timer-record" style="text-align:center;">
                    <div style="font-size:0.7rem; opacity:0.8;">🎯 РЕКОРД</div>
                    <div style="font-size:1.2rem; font-weight:700;">${highScore}</div>
                </div>
            </div>
            
            <div class="timer-question" style="background:var(--color-surface); border-radius:var(--radius); padding:28px; margin-bottom:20px; box-shadow:0 4px 16px var(--color-shadow);">
                <div class="timer-question__text" style="font-size:1.2rem; font-weight:700; margin-bottom:24px; line-height:1.5;">
                    ${questionIndex + 1}. ${escapeHtml(question.text)}
                </div>
                <div class="timer-question__options" style="display:flex; flex-direction:column; gap:12px;">
                    ${optionsHTML}
                </div>
            </div>
            
            <div class="timer-hint" style="font-size:0.8rem; text-align:center; color:var(--color-text-light);">
                <i class="fas fa-bolt"></i> +5 баллов за правильный ответ, +2 секунды | -3 балла за ошибку
            </div>
        </div>
    `;
}

/**
 * Возвращает HTML финального экрана таймер-квиза
 * @param {number} score - итоговый счёт
 * @param {number} highScore - рекорд
 * @param {number} correct - количество правильных ответов
 * @param {number} total - всего вопросов
 * @param {boolean} isNewRecord - побит ли рекорд
 * @returns {string} HTML строка
 */
function renderTimerQuizResult(score, highScore, correct, total, isNewRecord) {
    const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
    const medal = score >= 20 ? '🏆' : (score >= 10 ? '🎖️' : '📚');
    
    return `
        <div class="timer-quiz-container" style="max-width:600px; margin:0 auto; padding:20px;">
            <div class="timer-result" style="background:var(--color-surface); border-radius:var(--radius); padding:40px 32px; text-align:center; box-shadow:0 4px 16px var(--color-shadow);">
                <div class="timer-result__icon" style="font-size:4rem; margin-bottom:16px;">${medal}</div>
                <h2 class="timer-result__title" style="font-size:1.6rem; margin-bottom:12px;">Гонка завершена!</h2>
                
                ${isNewRecord ? '<div class="timer-result__record" style="background:linear-gradient(135deg, #ffd700, #ffb300); color:#333; padding:8px 16px; border-radius:32px; display:inline-block; margin-bottom:20px; font-weight:700;">🎉 НОВЫЙ РЕКОРД! 🎉</div>' : ''}
                
                <div class="timer-result__stats" style="margin-bottom:24px;">
                    <div style="margin-bottom:12px;">
                        <span style="font-size:0.9rem; color:var(--color-text-light);">Ваш счёт:</span>
                        <span style="font-size:2rem; font-weight:700; color:${score >= 0 ? '#27ae60' : '#e74c3c'};"> ${score}</span>
                    </div>
                    <div style="margin-bottom:8px;">
                        <span style="font-size:0.9rem; color:var(--color-text-light);">Рекорд:</span>
                        <span style="font-size:1.2rem; font-weight:700;"> ${highScore}</span>
                    </div>
                    <div>
                        <span style="font-size:0.9rem; color:var(--color-text-light);">Правильных ответов:</span>
                        <span style="font-size:1.2rem; font-weight:700;"> ${correct}/${total} (${percent}%)</span>
                    </div>
                </div>
                
                <button class="btn btn--primary" id="timer-next-btn" style="min-width:200px; padding:12px 24px;">
                    <i class="fas fa-arrow-right"></i> Продолжить
                </button>
            </div>
        </div>
    `;
}

// ===== ДОПОЛНЕНИЕ ДЛЯ ЦЕПОЧКИ РЕШЕНИЙ =====

/**
 * Возвращает HTML игрового экрана цепочки решений (без видимых дельт до выбора)
 * @param {number} trust - текущий уровень доверия (0-100)
 * @param {string} clientMessage - сообщение клиента
 * @param {Array} options - массив опций ответа
 * @param {number} stepNumber - номер текущего шага
 * @param {number} totalSteps - общее количество шагов
 * @param {Array} history - история предыдущих выборов
 * @param {boolean} hideDeltas - скрывать ли дельты (по умолчанию true)
 * @returns {string} HTML строка
 */
function renderDecisionChainGame(trust, clientMessage, options, stepNumber, totalSteps, history, hideDeltas = true) {
    // Генерируем опции БЕЗ отображения дельт
    let optionsHTML = '';
    options.forEach((opt, idx) => {
        // Опции выглядят как обычные кнопки — без бейджа с баллами
        optionsHTML += `
            <div class="decision-option" data-opt-index="${idx}" data-delta="${opt.trustDelta}" style="
                background: var(--color-surface);
                border: 2px solid var(--color-border);
                border-radius: var(--radius);
                padding: 16px 20px;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                flex-direction: column;
                gap: 8px;
            ">
                <div class="decision-option__text" style="font-size: 0.95rem; line-height: 1.4; color: var(--color-text);">
                    ${escapeHtml(opt.text)}
                </div>
            </div>
        `;
    });
    
    // Генерируем историю (только после выбора, показывает что было)
    let historyHTML = '';
    if (history && history.length > 0) {
        historyHTML = `
            <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid var(--color-border);">
                <div style="font-size: 0.8rem; font-weight: 600; margin-bottom: 12px; color: var(--color-text-light); text-transform: uppercase; letter-spacing: 0.5px;">
                    <i class="fas fa-history"></i> История решений
                </div>
                <div style="display: flex; flex-direction: column; gap: 8px;">
        `;
        history.forEach(item => {
            const deltaText = item.trustDelta > 0 ? `+${item.trustDelta}` : (item.trustDelta < 0 ? `${item.trustDelta}` : '0');
            let historyDeltaColor = '';
            if (item.trustDelta > 0) historyDeltaColor = '#27ae60';
            else if (item.trustDelta < 0) historyDeltaColor = '#e74c3c';
            else historyDeltaColor = '#f39c12';
            
            const shortText = item.selectedText.length > 55 ? item.selectedText.substring(0, 55) + '…' : item.selectedText;
            
            historyHTML += `
                <div style="
                    background: var(--color-bg);
                    border-radius: var(--radius-sm);
                    padding: 10px 14px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                    font-size: 0.8rem;
                ">
                    <span style="
                        background: var(--color-border);
                        border-radius: 16px;
                        padding: 2px 10px;
                        font-weight: 600;
                        font-size: 0.7rem;
                        white-space: nowrap;
                    ">Шаг ${item.stepId + 1}</span>
                    <span style="flex: 1; color: var(--color-text); line-height: 1.3;">${escapeHtml(shortText)}</span>
                    <span style="font-weight: 700; color: ${historyDeltaColor}; white-space: nowrap;">${deltaText}</span>
                </div>
            `;
        });
        historyHTML += `</div></div>`;
    }
    
    // Определяем цвет шкалы доверия
    let trustBarColor = '#f39c12';
    if (trust >= 70) trustBarColor = '#27ae60';
    if (trust <= 30) trustBarColor = '#e74c3c';
    
    let trustTextColor = trustBarColor;
    
    return `
        <div style="max-width: 700px; margin: 0 auto; padding: 20px;">
            <!-- Шкала доверия -->
            <div style="margin-bottom: 28px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="font-size: 0.85rem; font-weight: 600;"><i class="fas fa-heart" style="color: #e74c3c; margin-right: 6px;"></i> Доверие клиента</span>
                    <span id="decision-trust-value" style="font-size: 1.2rem; font-weight: 700; color: ${trustTextColor};">${trust}%</span>
                </div>
                <div style="background: var(--color-border); border-radius: 16px; height: 10px; overflow: hidden;">
                    <div id="decision-trust-fill" style="width: ${trust}%; height: 100%; background: ${trustBarColor}; transition: width 0.5s ease; border-radius: 16px;"></div>
                </div>
            </div>
            
            <!-- Прогресс -->
            <div style="margin-bottom: 20px; text-align: center;">
                <span style="font-size: 0.75rem; color: var(--color-text-light); background: var(--color-bg); padding: 4px 14px; border-radius: 20px;">
                    <i class="fas fa-comments"></i> Вопрос ${stepNumber} из ${totalSteps}
                </span>
            </div>
            
            <!-- Сообщение клиента -->
            <div style="background: linear-gradient(135deg, var(--color-bg) 0%, var(--color-surface) 100%); border-radius: var(--radius); padding: 24px; margin-bottom: 24px; border-left: 4px solid var(--color-primary);">
                <div style="font-size: 1.6rem; margin-bottom: 6px;">💬</div>
                <div style="font-size: 1rem; line-height: 1.5; color: var(--color-text); font-style: italic;">
                    «${escapeHtml(clientMessage)}»
                </div>
            </div>
            
            <!-- Варианты ответа (без видимых дельт) -->
            <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px;">
                ${optionsHTML}
            </div>
            
            <!-- Обратная связь (здесь будет показана дельта ПОСЛЕ выбора) -->
            <div id="decision-feedback" class="hidden" style="background: #fef9e7; border-left: 4px solid var(--color-warning); border-radius: var(--radius-sm); padding: 14px 18px; margin-bottom: 20px; font-size: 0.9rem; line-height: 1.4;"></div>
            
            <!-- История -->
            ${historyHTML}
        </div>
    `;
}

/**
 * Возвращает HTML финального экрана цепочки решений
 * @param {number} finalTrust - итоговый уровень доверия
 * @param {boolean} isWin - успешно ли завершена цепочка
 * @param {string} message - сообщение о результате
 * @param {Array} history - история выборов
 * @param {number} totalSteps - общее количество шагов
 * @returns {string} HTML строка
 */
function renderDecisionChainResult(finalTrust, isWin, message, history, totalSteps) {
    const medal = isWin ? (finalTrust >= 90 ? '🏆' : (finalTrust >= 70 ? '🎉' : '👍')) : '😞';
    
    const positiveCount = history.filter(h => h.trustDelta > 0).length;
    const negativeCount = history.filter(h => h.trustDelta < 0).length;
    const completedSteps = history.length;
    
    let trustColor = '#f39c12';
    if (finalTrust >= 70) trustColor = '#27ae60';
    if (finalTrust <= 30) trustColor = '#e74c3c';
    
    // Генерируем историю для финального экрана
    let historyHTML = '';
    if (history && history.length > 0) {
        historyHTML = `
            <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--color-border);">
                <div style="font-size: 0.8rem; font-weight: 600; margin-bottom: 12px; color: var(--color-text-light);">
                    <i class="fas fa-list"></i> Детализация ответов:
                </div>
                <div style="display: flex; flex-direction: column; gap: 6px; max-height: 200px; overflow-y: auto;">
        `;
        history.forEach((item, idx) => {
            const deltaText = item.trustDelta > 0 ? `+${item.trustDelta}` : (item.trustDelta < 0 ? `${item.trustDelta}` : '0');
            let deltaColor = '#f39c12';
            if (item.trustDelta > 0) deltaColor = '#27ae60';
            if (item.trustDelta < 0) deltaColor = '#e74c3c';
            
            const shortText = item.selectedText.length > 60 ? item.selectedText.substring(0, 60) + '…' : item.selectedText;
            
            historyHTML += `
                <div style="
                    background: var(--color-bg);
                    border-radius: var(--radius-sm);
                    padding: 8px 12px;
                    font-size: 0.75rem;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                ">
                    <span style="
                        background: var(--color-border);
                        border-radius: 12px;
                        padding: 2px 8px;
                        font-weight: 600;
                        font-size: 0.65rem;
                    ">Шаг ${idx + 1}</span>
                    <span style="flex: 1; color: var(--color-text);">${escapeHtml(shortText)}</span>
                    <span style="font-weight: 700; color: ${deltaColor};">${deltaText}</span>
                </div>
            `;
        });
        historyHTML += `</div></div>`;
    }
    
    return `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: var(--color-surface); border-radius: var(--radius); padding: 32px 24px; text-align: center; box-shadow: 0 4px 16px var(--color-shadow);">
                <div style="font-size: 4rem; margin-bottom: 12px;">${medal}</div>
                <h2 style="font-size: 1.6rem; margin-bottom: 12px; color: var(--color-text);">${isWin ? 'Сделка состоялась!' : 'Сделка сорвалась'}</h2>
                <p style="font-size: 1rem; color: var(--color-text-light); margin-bottom: 24px; line-height: 1.5;">${escapeHtml(message)}</p>
                
                <div style="margin-bottom: 24px; padding: 20px; background: var(--color-bg); border-radius: var(--radius-sm);">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 14px;">
                        <span style="color: var(--color-text-light);">Итоговое доверие:</span>
                        <span style="font-weight: 700; color: ${trustColor};">${finalTrust}%</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 14px;">
                        <span style="color: var(--color-text-light);">Пройдено шагов:</span>
                        <span style="font-weight: 700;">${completedSteps} из ${totalSteps}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: var(--color-text-light);">Баланс доверия:</span>
                        <span style="font-weight: 700; ${positiveCount > negativeCount ? 'color: #27ae60' : (positiveCount < negativeCount ? 'color: #e74c3c' : 'color: #f39c12')}">
                            ${positiveCount > 0 ? `+${positiveCount}` : positiveCount} / ${negativeCount > 0 ? `-${negativeCount}` : negativeCount}
                        </span>
                    </div>
                </div>
                
                ${historyHTML}
                
                <button class="btn btn--primary" id="decision-next-btn" style="min-width: 200px; padding: 12px 24px; margin-top: 20px; cursor: pointer;">
                    <i class="fas fa-arrow-right"></i> Продолжить
                </button>
            </div>
        </div>
    `;
}
// ===== ДОПОЛНЕНИЕ ДЛЯ ЦЕПОЧКИ РЕШЕНИЙ: НОВЫЕ ТИПЫ ШАГОВ =====

/**
 * Возвращает HTML шага выбора документов (без видимых подсказок)
 * @param {number} trust - текущий уровень доверия
 * @param {string} clientMessage - сообщение клиента
 * @param {Array} options - массив опций с полями text, isCorrect
 * @param {number} stepNumber - номер текущего шага
 * @param {number} totalSteps - общее количество шагов
 * @param {Array} history - история предыдущих выборов
 * @returns {string} HTML строка
 */
function renderDocumentSelectStep(trust, clientMessage, options, stepNumber, totalSteps, history) {
    // Генерируем опции с чекбоксами (без визуальных подсказок)
    let optionsHTML = '';
    options.forEach((opt, idx) => {
        optionsHTML += `
            <div class="document-check-item" data-value="${escapeHtml(opt.text)}" data-correct="${opt.isCorrect}" style="
                background: var(--color-surface);
                border: 2px solid var(--color-border);
                border-radius: var(--radius-sm);
                padding: 12px 16px;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 8px;
            ">
                <input type="checkbox" style="width: 18px; height: 18px; cursor: pointer;">
                <span style="flex: 1; font-size: 0.9rem; color: var(--color-text);">${escapeHtml(opt.text)}</span>
            </div>
        `;
    });
    
    // Генерируем историю
    let historyHTML = '';
    if (history && history.length > 0) {
        historyHTML = `
            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--color-border);">
                <div style="font-size: 0.8rem; font-weight: 600; margin-bottom: 10px; color: var(--color-text-light);">
                    <i class="fas fa-history"></i> Предыдущие решения:
                </div>
                <div style="display: flex; flex-direction: column; gap: 6px;">
        `;
        history.slice(-3).forEach((item, idx) => {
            const deltaText = item.trustDelta > 0 ? `+${item.trustDelta}` : (item.trustDelta < 0 ? `${item.trustDelta}` : '0');
            let deltaColor = '#f39c12';
            if (item.trustDelta > 0) deltaColor = '#27ae60';
            if (item.trustDelta < 0) deltaColor = '#e74c3c';
            
            historyHTML += `
                <div style="background: var(--color-bg); border-radius: var(--radius-sm); padding: 6px 10px; font-size: 0.7rem; display: flex; justify-content: space-between;">
                    <span style="color: var(--color-text-light);">Шаг ${item.stepId + 1}:</span>
                    <span style="color: var(--color-text); max-width: 200px; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(item.selectedText.substring(0, 40))}${item.selectedText.length > 40 ? '…' : ''}</span>
                    <span style="font-weight: 700; color: ${deltaColor};">${deltaText}</span>
                </div>
            `;
        });
        historyHTML += `</div></div>`;
    }
    
    // Цвет шкалы доверия
    let trustBarColor = '#f39c12';
    if (trust >= 70) trustBarColor = '#27ae60';
    if (trust <= 30) trustBarColor = '#e74c3c';
    
    return `
        <div style="max-width: 700px; margin: 0 auto; padding: 20px;">
            <!-- Шкала доверия -->
            <div style="margin-bottom: 24px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                    <span style="font-size: 0.8rem; font-weight: 600;"><i class="fas fa-heart" style="color: #e74c3c;"></i> Доверие клиента</span>
                    <span id="decision-trust-value" style="font-size: 1.1rem; font-weight: 700; color: ${trustBarColor};">${trust}%</span>
                </div>
                <div style="background: var(--color-border); border-radius: 12px; height: 8px; overflow: hidden;">
                    <div id="decision-trust-fill" style="width: ${trust}%; height: 100%; background: ${trustBarColor}; transition: width 0.3s ease;"></div>
                </div>
            </div>
            
            <!-- Прогресс -->
            <div style="margin-bottom: 16px; text-align: center;">
                <span style="font-size: 0.7rem; color: var(--color-text-light); background: var(--color-bg); padding: 3px 12px; border-radius: 16px;">
                    <i class="fas fa-check-square"></i> Шаг ${stepNumber} из ${totalSteps}
                </span>
            </div>
            
            <!-- Сообщение клиента -->
            <div style="background: linear-gradient(135deg, var(--color-bg) 0%, var(--color-surface) 100%); border-radius: var(--radius); padding: 20px; margin-bottom: 24px; border-left: 3px solid var(--color-primary);">
                <div style="font-size: 1.3rem; margin-bottom: 4px;">📋</div>
                <div style="font-size: 0.95rem; line-height: 1.5; color: var(--color-text); font-style: italic;">
                    «${escapeHtml(clientMessage)}»
                </div>
            </div>
            
            <!-- Заголовок задания -->
            <div style="margin-bottom: 16px;">
                <div style="font-weight: 600; margin-bottom: 8px;">📌 Выберите все необходимые документы:</div>
                <div style="font-size: 0.8rem; color: var(--color-text-light); margin-bottom: 12px;">Отмечайте чекбоксы</div>
            </div>
            
            <!-- Варианты документов -->
            <div style="margin-bottom: 20px;">
                ${optionsHTML}
            </div>
            
            <!-- Кнопка проверки -->
            <button id="document-check-btn" class="btn btn--primary" style="width: 100%; padding: 12px; cursor: pointer;">
                <i class="fas fa-check-circle"></i> Проверить выбор
            </button>
            
            <!-- Обратная связь -->
            <div id="decision-feedback" class="hidden" style="margin-top: 20px; background: #fef9e7; border-left: 3px solid var(--color-warning); border-radius: var(--radius-sm); padding: 12px 16px; font-size: 0.85rem;"></div>
            
            <!-- История -->
            ${historyHTML}
        </div>
    `;
}
/**
 * Возвращает HTML шага сравнения планировок (без видимых подсказок)
 * @param {number} trust - текущий уровень доверия
 * @param {string} clientMessage - сообщение клиента
 * @param {Array} options - массив опций (планировок)
 * @param {string} taskDescription - описание задания
 * @param {number} stepNumber - номер текущего шага
 * @param {number} totalSteps - общее количество шагов
 * @param {Array} history - история предыдущих выборов
 * @returns {string} HTML строка
 */
function renderComparePlansStep(trust, clientMessage, options, taskDescription, stepNumber, totalSteps, history) {
    // Генерируем карточки планировок БЕЗ индикации правильного ответа
    let plansHTML = '';
    options.forEach((opt, idx) => {
        plansHTML += `
            <div class="plan-compare-card" data-plan-id="${idx}" style="
                background: var(--color-surface);
                border: 2px solid var(--color-border);
                border-radius: var(--radius);
                padding: 16px;
                cursor: pointer;
                transition: all 0.2s ease;
                flex: 1;
                min-width: 200px;
            ">
                <div style="font-weight: 700; margin-bottom: 8px; color: var(--color-text);">${opt.title || 'Вариант ' + (idx + 1)}</div>
                <div style="font-size: 0.85rem; line-height: 1.4; margin-bottom: 12px; color: var(--color-text);">${escapeHtml(opt.text)}</div>
                <div style="font-size: 0.7rem; color: var(--color-text-light); border-top: 1px solid var(--color-border); padding-top: 8px; margin-top: 8px;">
                    ${opt.price ? `💰 ${opt.price} млн ₽` : ''}
                    ${opt.metro ? ` 🚇 ${opt.metro}` : ''}
                    ${opt.rooms ? ` 🏠 ${opt.rooms} комн.` : ''}
                </div>
            </div>
        `;
    });
    
    // Генерируем историю
    let historyHTML = '';
    if (history && history.length > 0) {
        historyHTML = `
            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--color-border);">
                <div style="font-size: 0.8rem; font-weight: 600; margin-bottom: 10px; color: var(--color-text-light);">
                    <i class="fas fa-history"></i> Предыдущие решения:
                </div>
                <div style="display: flex; flex-direction: column; gap: 6px;">
        `;
        history.slice(-3).forEach((item, idx) => {
            const deltaText = item.trustDelta > 0 ? `+${item.trustDelta}` : (item.trustDelta < 0 ? `${item.trustDelta}` : '0');
            let deltaColor = '#f39c12';
            if (item.trustDelta > 0) deltaColor = '#27ae60';
            if (item.trustDelta < 0) deltaColor = '#e74c3c';
            
            historyHTML += `
                <div style="background: var(--color-bg); border-radius: var(--radius-sm); padding: 6px 10px; font-size: 0.7rem; display: flex; justify-content: space-between;">
                    <span style="color: var(--color-text-light);">Шаг ${item.stepId + 1}:</span>
                    <span style="color: var(--color-text); max-width: 200px; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(item.selectedText.substring(0, 40))}${item.selectedText.length > 40 ? '…' : ''}</span>
                    <span style="font-weight: 700; color: ${deltaColor};">${deltaText}</span>
                </div>
            `;
        });
        historyHTML += `</div></div>`;
    }
    
    // Цвет шкалы доверия
    let trustBarColor = '#f39c12';
    if (trust >= 70) trustBarColor = '#27ae60';
    if (trust <= 30) trustBarColor = '#e74c3c';
    
    return `
        <div style="max-width: 800px; margin: 0 auto; padding: 20px;">
            <!-- Шкала доверия -->
            <div style="margin-bottom: 24px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                    <span style="font-size: 0.8rem; font-weight: 600;"><i class="fas fa-heart" style="color: #e74c3c;"></i> Доверие клиента</span>
                    <span id="decision-trust-value" style="font-size: 1.1rem; font-weight: 700; color: ${trustBarColor};">${trust}%</span>
                </div>
                <div style="background: var(--color-border); border-radius: 12px; height: 8px; overflow: hidden;">
                    <div id="decision-trust-fill" style="width: ${trust}%; height: 100%; background: ${trustBarColor}; transition: width 0.3s ease;"></div>
                </div>
            </div>
            
            <!-- Прогресс -->
            <div style="margin-bottom: 16px; text-align: center;">
                <span style="font-size: 0.7rem; color: var(--color-text-light); background: var(--color-bg); padding: 3px 12px; border-radius: 16px;">
                    <i class="fas fa-chart-simple"></i> Шаг ${stepNumber} из ${totalSteps}
                </span>
            </div>
            
            <!-- Сообщение клиента -->
            <div style="background: linear-gradient(135deg, var(--color-bg) 0%, var(--color-surface) 100%); border-radius: var(--radius); padding: 20px; margin-bottom: 24px; border-left: 3px solid var(--color-primary);">
                <div style="font-size: 1.3rem; margin-bottom: 4px;">🏠</div>
                <div style="font-size: 0.95rem; line-height: 1.5; color: var(--color-text); font-style: italic;">
                    «${escapeHtml(clientMessage)}»
                </div>
            </div>
            
            <!-- Заголовок задания -->
            <div style="margin-bottom: 16px;">
                <div style="font-weight: 600; margin-bottom: 8px;">📌 ${escapeHtml(taskDescription)}</div>
                <div style="font-size: 0.8rem; color: var(--color-text-light); margin-bottom: 12px;">Нажмите на карточку, чтобы выбрать вариант</div>
            </div>
            
            <!-- Карточки планировок -->
            <div style="display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 20px;">
                ${plansHTML}
            </div>
            
            <!-- Кнопка выбора -->
            <button id="plan-compare-btn" class="btn btn--primary" style="width: 100%; padding: 12px; cursor: pointer;">
                <i class="fas fa-check-circle"></i> Выбрать этот вариант
            </button>
            
            <!-- Обратная связь -->
            <div id="decision-feedback" class="hidden" style="margin-top: 20px; background: #fef9e7; border-left: 3px solid var(--color-warning); border-radius: var(--radius-sm); padding: 12px 16px; font-size: 0.85rem;"></div>
            
            <!-- История -->
            ${historyHTML}
        </div>
    `;
}
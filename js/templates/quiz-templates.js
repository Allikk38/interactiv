// ===== ШАБЛОНЫ ДЛЯ КОМПОНЕНТОВ ВИКТОРИНЫ =====

/**
 * Возвращает HTML блока вопроса викторины
 * @param {Object} question - объект вопроса
 * @param {number} index - индекс вопроса (для нумерации)
 * @param {boolean} isCheckbox - тип вопроса (true - множественный выбор, false - одиночный)
 * @returns {string} HTML строка
 */
function renderQuizQuestion(question, index, isCheckbox) {
    let optionsHTML = '';
    
    question.options.forEach((opt, i) => {
        optionsHTML += `
            <label class="quiz-option" data-index="${i}" style="cursor:pointer; display:flex; align-items:flex-start; gap:14px; padding:14px 18px; border:2px solid var(--color-border); border-radius:var(--radius-sm); margin-bottom:8px;">
                <input type="${isCheckbox ? 'checkbox' : 'radio'}" name="quiz-option" value="${escapeHtml(opt)}" style="display:none;">
                <span class="quiz-option__indicator ${isCheckbox ? 'quiz-option__indicator--checkbox' : ''}" style="width:22px; height:22px; border:2px solid var(--color-border); border-radius:50%; flex-shrink:0;"></span>
                <span>${escapeHtml(opt)}</span>
            </label>
        `;
    });
    
    return `
        <div class="quiz-question">
            <div class="quiz-question__text">${index + 1}. ${escapeHtml(question.text)}</div>
            <div class="quiz-question__options">${optionsHTML}</div>
            <div class="quiz-hint hidden" id="quiz-hint"></div>
        </div>
    `;
}

/**
 * Возвращает HTML блока подсказки
 * @param {string} hintText - текст подсказки
 * @returns {string} HTML строка
 */
function renderQuizHint(hintText) {
    return `<div class="quiz-hint" id="quiz-hint">💡 ${escapeHtml(hintText)}</div>`;
}

// Функция escapeHtml теперь глобальная (из utils/escape.js)
// Локальное определение УДАЛЕНО

// ===== ШАБЛОНЫ ДЛЯ РЕЖИМА "ТРОЙНАЯ ЭКСПЕРТИЗА" (TRIPLE MATCH DRAG) =====

/**
 * Возвращает HTML основного игрового экрана
 * @param {string} jksHTML - HTML карточек ЖК с зонами для характеристик
 * @param {string} unplacedHTML - HTML непривязанных характеристик
 * @param {string} progress - строка прогресса (например "1 / 5 раундов")
 * @param {number} score - текущий счёт
 * @param {boolean} roundChecked - был ли уже проверен раунд
 * @returns {string} HTML строка
 */
function renderTripleMatchGame(jksHTML, unplacedHTML, progress, score, roundChecked) {
    const checkBtnDisabled = roundChecked ? 'disabled' : '';
    const checkBtnDisplay = roundChecked ? 'none' : 'inline-flex';
    const nextBtnDisplay = roundChecked ? 'inline-flex' : 'none';
    
    return `
        <div class="triple-match-container">
            <div class="triple-match-header">
                <div class="triple-match-progress">
                    <i class="fas fa-layer-group"></i> ${escapeHtml(progress)}
                </div>
                <div class="triple-match-score">
                    <i class="fas fa-star"></i> Счёт: <span id="triple-score-value">${score}</span> XP
                </div>
            </div>
            
            <div class="triple-jks-grid">
                ${jksHTML}
            </div>
            
            <div class="triple-unplaced-section">
                <div class="triple-unplaced-title">
                    <i class="fas fa-arrows-alt"></i> Перетащите характеристики к нужным ЖК
                </div>
                <div class="triple-unplaced-area" id="triple-unplaced-area">
                    ${unplacedHTML}
                </div>
            </div>
            
            <div id="triple-feedback" class="triple-feedback" style="display: none;"></div>
            
            <div class="triple-actions">
                <button class="btn btn--primary" id="triple-check-btn" style="display: ${checkBtnDisplay};" ${checkBtnDisabled}>
                    <i class="fas fa-check-circle"></i> Проверить
                </button>
                <button class="btn btn--primary" id="triple-next-btn" style="display: ${nextBtnDisplay};">
                    <i class="fas fa-arrow-right"></i> Далее
                </button>
            </div>
            
            <div class="triple-hint">
                <i class="fas fa-info-circle"></i> Перетащите каждую характеристику в карточку ЖК. 
                Удалить можно нажатием на ×. После размещения всех 9 характеристик нажмите "Проверить".
            </div>
        </div>
    `;
}

/**
 * Возвращает HTML карточки ЖК
 * @param {Object} jk - объект ЖК
 * @param {number} index - индекс карточки (0-2)
 * @param {Array} placedAttrs - уже размещённые характеристики
 * @param {number} attributesPerJk - сколько характеристик должно быть у ЖК
 * @returns {string} HTML строка
 */
function renderTripleJkCard(jk, index, placedAttrs, attributesPerJk) {
    let placedHTML = '';
    const hasAllAttrs = placedAttrs.length >= attributesPerJk;
    
    if (placedAttrs.length > 0) {
        placedHTML = placedAttrs.map((attr, attrIdx) => `
            <div class="triple-placed-tag" data-attr-idx="${attr.globalIdx}" data-jk-id="${jk.id}">
                <span class="triple-placed-tag__text">${escapeHtml(attr.displayText)}</span>
                <span class="triple-placed-tag__remove" title="Удалить">×</span>
            </div>
        `).join('');
    }
    
    if (!hasAllAttrs && placedAttrs.length < attributesPerJk) {
        const slotsLeft = attributesPerJk - placedAttrs.length;
        placedHTML += `<div class="triple-drop-zone__empty">Осталось слотов: ${slotsLeft}</div>`;
    } else if (placedAttrs.length === attributesPerJk) {
        placedHTML += `<div class="triple-drop-zone__full">✓ Все характеристики</div>`;
    }
    
    return `
        <div class="triple-jk-card" data-jk-id="${jk.id}" data-jk-index="${index}">
            <div class="triple-jk-card__header">
                <div class="triple-jk-card__badge">ЖК ${index + 1}</div>
                <h3 class="triple-jk-card__title">${escapeHtml(jk.name)}</h3>
                <span class="triple-jk-card__developer">${escapeHtml(jk.developer)}</span>
            </div>
            <div class="triple-jk-card__drop-zone" data-jk-id="${jk.id}">
                ${placedHTML}
            </div>
        </div>
    `;
}

/**
 * Возвращает HTML непривязанной характеристики (плитка)
 * @param {Object} attr - объект характеристики
 * @param {number} globalIdx - глобальный индекс в массиве currentAttributes
 * @returns {string} HTML строка
 */
function renderTripleAttrTag(attr, globalIdx) {
    return `
        <div class="triple-attr-tag" data-attr-idx="${globalIdx}" draggable="true">
            <span class="triple-attr-tag__text">${escapeHtml(attr.displayText)}</span>
            <span class="triple-attr-tag__drag-handle"><i class="fas fa-grip-vertical"></i></span>
        </div>
    `;
}

/**
 * Возвращает HTML для пустой зоны (когда все характеристики размещены)
 * @returns {string} HTML строка
 */
function renderTripleUnplacedEmpty() {
    return `
        <div class="triple-unplaced-empty">
            <i class="fas fa-check-circle"></i> Все характеристики размещены! Нажмите "Проверить".
        </div>
    `;
}

/**
 * Возвращает HTML обратной связи после проверки
 * @param {number} round - номер раунда
 * @param {number} correct - количество правильных ответов
 * @param {number} wrong - количество неправильных ответов
 * @param {number} score - очки за раунд
 * @returns {string} HTML строка
 */
function renderTripleFeedback(round, correct, wrong, score) {
    const isPositive = score >= 0;
    const iconClass = isPositive ? 'fa-check-circle' : 'fa-exclamation-triangle';
    const feedbackClass = isPositive ? 'triple-feedback--success' : 'triple-feedback--error';
    const sign = score >= 0 ? '+' : '';
    
    return `
        <div class="${feedbackClass}">
            <i class="fas ${iconClass}"></i>
            <div class="triple-feedback__content">
                <div class="triple-feedback__title">Раунд ${round} завершён</div>
                <div class="triple-feedback__stats">
                    <span class="triple-feedback__correct">✓ Правильно: ${correct}</span>
                    <span class="triple-feedback__wrong">✗ Ошибок: ${wrong}</span>
                    <span class="triple-feedback__score">${sign}${score} XP</span>
                </div>
            </div>
        </div>
    `;
}

/**
 * Возвращает HTML финального экрана после завершения всех раундов
 * @param {number} totalScore - итоговый счёт
 * @param {Array} roundResults - массив результатов по раундам
 * @returns {string} HTML строка
 */
function renderTripleMatchResult(totalScore, roundResults) {
    const maxPossibleScore = roundResults.length * 3 * 10; // 5 раундов × 3 характеристики × 10 XP
    const percent = Math.round((totalScore / maxPossibleScore) * 100);
    
    let roundsHTML = '';
    roundResults.forEach((result, idx) => {
        const roundScoreClass = result.score >= 0 ? 'round-result--positive' : 'round-result--negative';
        roundsHTML += `
            <div class="round-result ${roundScoreClass}">
                <span class="round-result__number">Раунд ${idx + 1}</span>
                <span class="round-result__stats">${result.correct}/${result.total} верно</span>
                <span class="round-result__score">${result.score >= 0 ? '+' : ''}${result.score} XP</span>
            </div>
        `;
    });
    
    let medal = '';
    let medalText = '';
    if (percent >= 90) {
        medal = '🏆';
        medalText = 'Блестящий результат! Вы — эксперт!';
    } else if (percent >= 70) {
        medal = '🎖️';
        medalText = 'Отличный результат! Так держать!';
    } else if (percent >= 50) {
        medal = '📚';
        medalText = 'Хороший результат. Продолжайте изучать ЖК!';
    } else {
        medal = '💪';
        medalText = 'Неплохо. Попробуйте ещё раз, чтобы закрепить знания!';
    }
    
    return `
        <div class="triple-match-result">
            <div class="triple-match-result__icon">${medal}</div>
            <h2 class="triple-match-result__title">Тройная экспертиза завершена!</h2>
            <p class="triple-match-result__text">${medalText}</p>
            
            <div class="triple-match-result__score">
                <span class="triple-match-result__score-label">Итоговый счёт:</span>
                <span class="triple-match-result__score-value">${totalScore} XP</span>
                <span class="triple-match-result__score-percent">(${percent}%)</span>
            </div>
            
            <div class="triple-match-result__rounds">
                <div class="triple-match-result__rounds-title">Детализация по раундам:</div>
                <div class="triple-match-result__rounds-list">
                    ${roundsHTML}
                </div>
            </div>
        </div>
    `;
}

// Экспортируем функции в глобальную область
window.renderTripleMatchGame = renderTripleMatchGame;
window.renderTripleJkCard = renderTripleJkCard;
window.renderTripleAttrTag = renderTripleAttrTag;
window.renderTripleUnplacedEmpty = renderTripleUnplacedEmpty;
window.renderTripleFeedback = renderTripleFeedback;
window.renderTripleMatchResult = renderTripleMatchResult;
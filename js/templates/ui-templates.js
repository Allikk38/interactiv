// ===== ШАБЛОНЫ ДЛЯ UI КОМПОНЕНТОВ =====

/**
 * Возвращает HTML карточки сценария
 * @param {Object} scenario - объект сценария
 * @param {boolean} hasBadge - есть ли бейдж у пользователя
 * @param {Array<string>} stepsDesc - массив описаний шагов
 * @param {string} scenarioIcon - иконка сценария (класс Font Awesome)
 * @returns {string} HTML строка
 */
function renderScenarioCard(scenario, hasBadge, stepsDesc, scenarioIcon) {
    return `
        <div class="scenario-card__icon">
            <i class="fas ${scenarioIcon}"></i>
            ${hasBadge ? '<i class="fas fa-certificate scenario-card__badge"></i>' : ''}
        </div>
        <div class="scenario-card__name">${escapeHtml(scenario.name)}</div>
        <div class="scenario-card__description">${escapeHtml(scenario.description)}</div>
        <div class="scenario-card__steps">${stepsDesc.join(' · ') || scenario.steps.length + ' шагов'}</div>
    `;
}

/**
 * Возвращает HTML заголовка группы сценариев
 * @param {string} groupName - название группы
 * @param {number} scenariosCount - количество сценариев в группе
 * @param {string} groupIcon - иконка группы (класс Font Awesome)
 * @returns {string} HTML строка
 */
function renderScenarioGroupHeader(groupName, scenariosCount, groupIcon) {
    return `
        <div class="scenario-group__title">
            <i class="fas ${groupIcon} scenario-group__icon"></i>
            <span>${escapeHtml(groupName)}</span>
            <span class="scenario-group__count">${scenariosCount}</span>
        </div>
        <i class="fas fa-chevron-down scenario-group__toggle"></i>
    `;
}

/**
 * Возвращает HTML контейнера для карточек сценариев
 * @returns {string} HTML строка
 */
function renderScenariosGrid() {
    return '<div class="scenarios-grid"></div>';
}

/**
 * Возвращает HTML всей группы сценариев (заголовок + контент)
 * @param {string} groupName - название группы
 * @param {number} scenariosCount - количество сценариев
 * @param {string} groupIcon - иконка группы
 * @param {string} cardsHtml - HTML карточек внутри группы
 * @returns {string} HTML строка
 */
function renderScenarioGroup(groupName, scenariosCount, groupIcon, cardsHtml) {
    return `
        <div class="scenario-group" data-group="${escapeHtml(groupName)}">
            <div class="scenario-group__header">
                ${renderScenarioGroupHeader(groupName, scenariosCount, groupIcon)}
            </div>
            <div class="scenario-group__content">
                ${cardsHtml}
            </div>
        </div>
    `;
}

// Функция escapeHtml теперь глобальная (из utils/escape.js)
// Локальное определение УДАЛЕНО

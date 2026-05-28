// ===== ШАБЛОНЫ ДЛЯ КАРТЫ И КАРУСЕЛИ =====

/**
 * Возвращает HTML всей карусели
 * @param {Array} jks - массив ЖК для отображения
 * @returns {string} HTML строка
 */
function renderCarouselHTML(jks) {
    return `
        <div class="jk-carousel">
            <div class="jk-carousel__header">
                <span class="jk-carousel__title"><i class="fas fa-building"></i> Жилые комплексы</span>
                <span class="jk-carousel__counter" id="carousel-counter">0 / ${jks.length} расставлено</span>
            </div>
            <div class="jk-carousel__wrapper">
                <button class="jk-carousel__btn" id="carousel-prev" disabled><i class="fas fa-chevron-left"></i></button>
                <div class="jk-carousel__slides" id="carousel-slides">
                    <div class="jk-carousel__track" id="carousel-track"></div>
                </div>
                <button class="jk-carousel__btn" id="carousel-next"><i class="fas fa-chevron-right"></i></button>
            </div>
        </div>
    `;
}

/**
 * Возвращает HTML карточки ЖК для карусели
 * @param {Object} jk - объект ЖК
 * @param {boolean} isPlaced - расставлен ли ЖК
 * @param {boolean} isSelected - выбран ли ЖК
 * @returns {string} HTML строка
 */
function renderCarouselCard(jk, isPlaced, isSelected) {
    const selectedClass = isSelected ? ' jk-card--selected' : '';
    const placedClass = isPlaced ? ' jk-card--placed' : '';
    const hintHtml = (jk.hint && jk.hint.trim() && !isPlaced) 
        ? `<div class="jk-card__hint">💡 ${escapeHtml(jk.hint.substring(0, 40))}</div>` 
        : '';
    const statusHtml = isPlaced ? '<div class="jk-card__status">✓ Расставлен</div>' : '';
    
    return `
        <div class="jk-card${selectedClass}${placedClass}" data-id="${jk.id}">
            <div class="jk-card__name">${escapeHtml(jk.name)}</div>
            <div class="jk-card__developer">${escapeHtml(jk.developer)}</div>
            ${hintHtml}
            ${statusHtml}
        </div>
    `;
}

/**
 * Возвращает HTML элемента списка для десктопной панели
 * @param {Object} jk - объект ЖК
 * @param {boolean} isPlaced - расставлен ли ЖК
 * @param {boolean} isSelected - выбран ли ЖК
 * @returns {string} HTML строка
 */
function renderDesktopDrawerItem(jk, isPlaced, isSelected) {
    const selectedClass = isSelected ? ' jk-list__item--selected' : '';
    const placedClass = isPlaced ? ' jk-list__item--placed' : '';
    const hintHtml = (jk.hint && jk.hint.trim() && !isPlaced) 
        ? `<div class="jk-list__hint">💡 ${escapeHtml(jk.hint.substring(0, 40))}</div>` 
        : '';
    const statusHtml = isPlaced ? '<div style="font-size:0.7rem; color:var(--color-success); margin-top:4px;">✓ Расставлен</div>' : '';
    
    return `
        <div class="jk-list__item${selectedClass}${placedClass}" data-id="${jk.id}">
            <div class="jk-list__name">${escapeHtml(jk.name)}</div>
            <div class="jk-list__developer">${escapeHtml(jk.developer)}</div>
            ${hintHtml}
            ${statusHtml}
        </div>
    `;
}

/**
 * Возвращает HTML счётчика расставленных ЖК
 * @param {number} placed - количество расставленных
 * @param {number} total - общее количество
 * @returns {string} HTML строка
 */
function renderCarouselCounter(placed, total) {
    return `${placed} / ${total} расставлено`;
}

/**
 * Возвращает HTML индикатора загрузки карты
 * @returns {string} HTML строка
 */
function renderMapLoadingIndicator() {
    return `
        <div style="display: flex; justify-content: center; align-items: center; height: 100%; background: #f5f6fa;">
            <div style="text-align: center;">
                <div style="width: 40px; height: 40px; border: 4px solid #dfe6e9; border-top-color: #2e86de; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px;"></div>
                <p style="color: #636e72;">Загрузка карты...</p>
            </div>
        </div>
    `;
}

/**
 * Возвращает HTML сообщения об ошибке загрузки карты
 * @returns {string} HTML строка
 */
function renderMapErrorIndicator() {
    return `
        <div style="display: flex; justify-content: center; align-items: center; height: 100%; background: #f5f6fa;">
            <div style="text-align: center;">
                <p style="color: #e74c3c;">❌ Ошибка загрузки карты</p>
                <button onclick="location.reload()" style="margin-top: 16px; padding: 8px 16px; background: #2e86de; color: white; border: none; border-radius: 8px; cursor: pointer;">Обновить страницу</button>
            </div>
        </div>
    `;
}

/**
 * Экранирует HTML-спецсимволы
 * @param {string} str - входная строка
 * @returns {string} экранированная строка
 */
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

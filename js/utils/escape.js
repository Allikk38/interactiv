// ===== ЕДИНАЯ ФУНКЦИЯ ДЛЯ ЭКРАНИРОВАНИЯ HTML =====
// Используется во всех шаблонах для предотвращения XSS-атак

/**
 * Экранирует HTML-спецсимволы в строке
 * @param {string} str - входная строка
 *returns {string} экранированная строка
 */
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Для обратной совместимости с map-core.js
// (можно будет заменить прямые вызовы позже)
window.escapeHtml = escapeHtml;

// ===== ЕДИНАЯ ФУНКЦИЯ ДЛЯ ЭКРАНИРОВАНИЯ HTML =====
// Используется во всех шаблонах для предотвращения XSS-атак

/**
 * Экранирует HTML-спецсимволы в строке
 * @param {string} str - входная строка
 * @returns {string} экранированная строка
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

// Явно экспортируем в глобальную область
window.escapeHtml = escapeHtml;

console.log('[escape] Модуль загружен');
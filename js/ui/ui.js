// ===== UI — ТОЧКА ВХОДА =====

// Убеждаемся, что все зависимости загружены
function initUI() {
    if (typeof allScenarios === 'undefined' || !allScenarios.length) {
        console.warn('[UI] Ожидание загрузки сценариев...');
        setTimeout(initUI, 200);
        return;
    }
    
    renderScenarios();
    initHapticFeedback();
}

// Haptic feedback
function initHapticFeedback() {
    const hapticSelectors = [
        '.btn', '.category-chip', '.scenario-card-new', '.quiz-option',
        '.dialogue-option', '.jk-card', '.jk-list__item', '.floating-list-btn',
        '.continue-learning__btn'
    ];
    const selector = hapticSelectors.join(',');
    
    document.addEventListener('click', (e) => {
        const target = e.target.closest(selector);
        if (!target) return;
        if (target.dataset.haptic === 'false') return;
        if (!target.disabled && window.vibrate) {
            window.vibrate('light');
        }
    });
}

// Экспортируем функции для глобального использования
window.renderScenarios = renderScenarios;
window.renderScenariosGrid = renderScenariosGrid;
window.renderRecommendations = renderRecommendations;
window.updateContinueLearning = updateContinueLearning;
window.updateHeaderXP = updateHeaderXP;
window.updateHeaderUser = updateHeaderUser;
window.addUserChangeButton = addUserChangeButton;
window.refreshMainScreen = refreshMainScreen;
window.enableAdminMode = enableAdminMode;
window.disableAdminMode = disableAdminMode;
window.isAdmin = isAdmin;
window.skipCurrentStep = skipCurrentStep;

// Запускаем инициализацию
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUI);
} else {
    setTimeout(initUI, 100);
}
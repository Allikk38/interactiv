// ===== UI — ТОЧКА ВХОДА =====

// Глобальные переменные
var allScenarios = [];
var currentCategory = 'all';
var _uiInitialized = false;

// Убеждаемся, что все зависимости загружены
function initUI() {
    // Проверяем наличие сценариев в StoreInstance
    var hasScenarios = false;
    var scenarios = [];
    
    if (window.StoreInstance) {
        scenarios = StoreInstance.getScenarios();
        if (scenarios && scenarios.length > 0) {
            hasScenarios = true;
            window.allScenarios = scenarios;
            allScenarios = scenarios;
        }
    }
    
    // Проверяем глобальную переменную
    if (!hasScenarios && (typeof allScenarios === 'undefined' || !allScenarios || !allScenarios.length)) {
        console.warn('[UI] Ожидание загрузки сценариев...');
        setTimeout(initUI, 300);
        return;
    }
    
    // Проверяем, что все необходимые функции определены
    var requiredFunctions = [
        'renderScenarios',
        'updateHeaderXP',
        'updateHeaderUser',
        'addUserChangeButton',
        'renderScenariosGrid',
        'renderRecommendations',
        'updateContinueLearning',
        'refreshMainScreen',
        'renderAgentDashboard',
        'updateQuickStats',
        'renderCategoryChips'
    ];
    
    var allDefined = true;
    var missingFunctions = [];
    
    for (var i = 0; i < requiredFunctions.length; i++) {
        if (typeof window[requiredFunctions[i]] !== 'function') {
            missingFunctions.push(requiredFunctions[i]);
            allDefined = false;
        }
    }
    
    if (!allDefined) {
        console.warn('[UI] Не все функции определены, повторная попытка... Отсутствуют:', missingFunctions.join(', '));
        setTimeout(initUI, 300);
        return;
    }
    
    console.log('[UI] Все зависимости загружены, инициализация...');
    
    try {
        renderScenarios();
        _uiInitialized = true;
        console.log('[UI] Инициализация завершена успешно');
    } catch (error) {
        console.error('[UI] Ошибка при инициализации:', error);
    }
    
    initHapticFeedback();
}

// Haptic feedback
function initHapticFeedback() {
    var hapticSelectors = [
        '.btn', '.category-chip', '.scenario-card-new', '.quiz-option',
        '.dialogue-option', '.jk-card', '.jk-list__item', '.floating-list-btn',
        '.continue-learning__btn'
    ];
    var selector = hapticSelectors.join(',');
    
    document.addEventListener('click', function(e) {
        var target = e.target.closest(selector);
        if (!target) return;
        if (target.dataset.haptic === 'false') return;
        if (!target.disabled && window.vibrate) {
            window.vibrate('light');
        }
    });
}

// ===== ЭКСПОРТ ВСЕХ ФУНКЦИЙ В ГЛОБАЛЬНУЮ ОБЛАСТЬ =====

// Функции из ui-scenarios.js
window.renderScenarios = renderScenarios;
window.renderScenariosGrid = renderScenariosGrid;

// Функции из ui-dashboard.js
window.renderAgentDashboard = renderAgentDashboard;
window.updateQuickStats = updateQuickStats;
window.updateHeaderXP = updateHeaderXP;
window.updateHeaderUser = updateHeaderUser;
window.addUserChangeButton = addUserChangeButton;
window.refreshMainScreen = refreshMainScreen;
window.updateRingProgress = updateRingProgress;

// Функции из ui-categories.js
window.renderCategoryChips = renderCategoryChips;

// Функции из ui-recommendations.js
window.renderRecommendations = renderRecommendations;

// Функции из ui-continue.js
window.updateContinueLearning = updateContinueLearning;

// Функции из ui-admin.js
window.enableAdminMode = enableAdminMode;
window.disableAdminMode = disableAdminMode;
window.isAdmin = isAdmin;
window.skipCurrentStep = skipCurrentStep;
window.addSkipStepButton = addSkipStepButton;
window.removeSkipStepButton = removeSkipStepButton;
window.updateSkipButtonVisibility = updateSkipButtonVisibility;

// Функции из ui-helpers.js
window.getDifficultyInfo = getDifficultyInfo;
window.getStepIcon = getStepIcon;
window.countStepsByType = countStepsByType;

// Экспортируем переменные
window.allScenarios = allScenarios;
window.currentCategory = currentCategory;

// Проверяем, что все функции действительно экспортированы
console.log('[UI] Модуль загружен, версия: 2.1');
console.log('[UI] Экспортированные функции:', Object.keys(window).filter(function(key) {
    return typeof window[key] === 'function' && 
           ['renderScenarios', 'updateHeaderXP', 'updateHeaderUser', 'renderScenariosGrid', 
            'renderRecommendations', 'updateContinueLearning', 'refreshMainScreen',
            'renderAgentDashboard', 'updateQuickStats', 'renderCategoryChips'].indexOf(key) !== -1;
}));

// Запускаем инициализацию
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(initUI, 100);
    });
} else {
    setTimeout(initUI, 100);
}
// ============================================================
// АНАЛИТИКА
// Версия: 1.0
// Отвечает за: инициализацию аналитики, отслеживание событий
// ============================================================

(function() {
    'use strict';

    function initAnalytics() {
        window.addEventListener('beforeunload', function() {
            if (AppState.currentScenario && typeof sendScenarioDropOff === 'function') {
                var currentStep = AppState.currentScenario.steps[AppState.currentStepIndex];
                sendScenarioDropOff(
                    AppState.currentScenario.id,
                    AppState.currentScenario.name,
                    AppState.currentStepIndex,
                    AppState.currentScenario.steps.length,
                    currentStep ? currentStep.type : null
                );
            }
        });

        document.addEventListener('visibilitychange', function() {
            if (document.hidden && AppState.currentScenario && typeof sendScenarioDropOff === 'function') {
                var currentStep = AppState.currentScenario.steps[AppState.currentStepIndex];
                sendScenarioDropOff(
                    AppState.currentScenario.id,
                    AppState.currentScenario.name,
                    AppState.currentStepIndex,
                    AppState.currentScenario.steps.length,
                    currentStep ? currentStep.type : null
                );
            }
        });
    }

    // ===== ЭКСПОРТ В ГЛОБАЛЬНУЮ ОБЛАСТЬ =====
    window.initAnalytics = initAnalytics;

    console.log('[AppAnalytics] Модуль загружен, версия: 1.0');

})();
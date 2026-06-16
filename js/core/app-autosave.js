// ============================================================
// АВТОСОХРАНЕНИЕ ПРОГРЕССА
// Версия: 1.0
// Отвечает за: автосохранение, проверку сохранённого прогресса
// ============================================================

(function() {
    'use strict';

    var autoSaveTimer = null;
    var lastSaveState = null;

    function setupAutoSave() {
        var autoSaveInterval = 30000;
        if (typeof AUTOSAVE_CONFIG !== 'undefined' && AUTOSAVE_CONFIG.INTERVAL_MS) {
            autoSaveInterval = AUTOSAVE_CONFIG.INTERVAL_MS;
        }
        var saveOnBeforeUnload = (typeof AUTOSAVE_CONFIG !== 'undefined') ?
            AUTOSAVE_CONFIG.SAVE_ON_BEFORE_UNLOAD : true;
        var saveOnVisibilityChange = (typeof AUTOSAVE_CONFIG !== 'undefined') ?
            AUTOSAVE_CONFIG.SAVE_ON_VISIBILITY_CHANGE : true;

        if (saveOnBeforeUnload) {
            window.addEventListener('beforeunload', function() {
                if (AppState.currentScenario) {
                    saveCurrentProgress();
                }
            });
        }

        if (saveOnVisibilityChange) {
            document.addEventListener('visibilitychange', function() {
                if (document.hidden && AppState.currentScenario) {
                    saveCurrentProgress();
                }
            });
        }

        setInterval(function() {
            if (AppState.currentScenario) {
                saveCurrentProgress();
            }
        }, autoSaveInterval);
    }

    function saveCurrentProgress() {
        if (!AppState.currentScenario) return;

        var currentState = {
            scenarioId: AppState.currentScenario.id,
            stepIndex: AppState.currentStepIndex,
            stepStats: AppState.stepStats,
            quizAnswers: AppState.quizAnswers || [],
            mapPlacedJks: AppState.placedJks ? Array.from(AppState.placedJks.entries()) : []
        };

        var stateKey = JSON.stringify(currentState);
        if (lastSaveState === stateKey) return;
        lastSaveState = stateKey;

        User.saveDetailedScenarioProgress(
            AppState.currentScenario.id,
            AppState.currentStepIndex,
            AppState.stepStats,
            AppState.quizAnswers || [],
            AppState.placedJks ? Array.from(AppState.placedJks.entries()) : []
        );

        console.log('[App] Автосохранение:', AppState.currentScenario.name, 'шаг', AppState.currentStepIndex + 1);
    }

    function checkForSavedProgress() {
        if (!AppState.scenarios) return;

        for (var i = 0; i < AppState.scenarios.length; i++) {
            var scenario = AppState.scenarios[i];
            var saved = User.getDetailedScenarioProgress(scenario.id);
            if (saved && saved.stepIndex < scenario.steps.length - 1) {
                var lastStep = scenario.steps[saved.stepIndex];
                if (lastStep.type !== 'finish') {
                    if (typeof showToast === 'function') {
                        showToast('💾', 'Найден сохранённый прогресс: "' + scenario.name + '"', 'success');
                    }
                    break;
                }
            }
        }
    }

    // ===== ЭКСПОРТ В ГЛОБАЛЬНУЮ ОБЛАСТЬ =====
    window.setupAutoSave = setupAutoSave;
    window.saveCurrentProgress = saveCurrentProgress;
    window.checkForSavedProgress = checkForSavedProgress;

    console.log('[AppAutosave] Модуль загружен, версия: 1.0');

})();
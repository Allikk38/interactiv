// ============================================================
// ОБРАБОТЧИКИ СОБЫТИЙ
// Версия: 1.0
// Отвечает за: навешивание обработчиков на элементы UI
// ============================================================

(function() {
    'use strict';

    function setupEventListeners() {
        var journeyBackBtn = document.getElementById('journey-back-btn');
        var backToScenariosBtn = document.getElementById('back-to-scenarios-btn');
        var quizBackBtn = document.getElementById('quiz-back-btn');
        var finishScenariosBtn = document.getElementById('finish-scenarios-btn');
        var finishRestartBtn = document.getElementById('finish-restart-btn');
        var hintBtn = document.getElementById('hint-btn');
        var resetBtn = document.getElementById('reset-step-btn');

        if (journeyBackBtn) journeyBackBtn.addEventListener('click', exitToScenarios);
        if (backToScenariosBtn) backToScenariosBtn.addEventListener('click', exitToScenarios);
        if (quizBackBtn) quizBackBtn.addEventListener('click', exitToScenarios);
        if (finishScenariosBtn) finishScenariosBtn.addEventListener('click', exitToScenarios);

        if (finishRestartBtn) {
            finishRestartBtn.addEventListener('click', function() {
                if (AppState.currentScenario) {
                    User.clearScenarioProgress(AppState.currentScenario.id);
                    AppState.currentStepIndex = 0;
                    AppState.stepStats = [];
                    AppState.quizAnswers = [];
                    AppState.placedJks = new Map();
                    AppState.scenarioStartTime = Date.now();
                    document.getElementById('finish-screen').classList.add('hidden');
                    runStep();
                }
            });
        }

        if (hintBtn) {
            hintBtn.addEventListener('click', function() {
                if (AppState.selectedJkId === null) {
                    if (typeof showToast === 'function') {
                        showToast('💡', 'Сначала выберите ЖК из списка', 'info');
                    }
                    return;
                }
                var jk = AppState.allJks.find(function(j) { return j.id === AppState.selectedJkId; });
                if (jk) {
                    if (typeof showToast === 'function') {
                        showToast('💡', jk.hint || 'Подсказка недоступна', 'error');
                    }
                    if (typeof sendHintUsed === 'function') {
                        sendHintUsed('map', 'Расстановка ЖК', 'location_hint');
                    }
                }
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', function() {
                if (typeof resetMapStep === 'function') {
                    resetMapStep();
                }
            });
        }
    }

    // ===== ЭКСПОРТ В ГЛОБАЛЬНУЮ ОБЛАСТЬ =====
    window.setupEventListeners = setupEventListeners;

    console.log('[AppEvents] Модуль загружен, версия: 1.0');

})();
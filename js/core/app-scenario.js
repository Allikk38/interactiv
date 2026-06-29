// ============================================================
// УПРАВЛЕНИЕ СЦЕНАРИЯМИ
// Версия: 1.3 — ДОБАВЛЕНА ПОДДЕРЖКА ОНБОРДИНГ-СЦЕНАРИЯ
// ============================================================

(function() {
    'use strict';

    function startScenario(scenario) {
        var savedProgress = User.getDetailedScenarioProgress(scenario.id);

        if (savedProgress && savedProgress.stepIndex > 0 &&
            savedProgress.stepIndex < scenario.steps.length - 1) {
            showContinueModal(scenario, savedProgress);
            return;
        }

        startScenarioFresh(scenario);
    }

    function startScenarioFresh(scenario) {
        AppState.currentScenario = scenario;
        AppState.currentStepIndex = 0;
        AppState.stepStats = [];
        AppState.quizAnswers = [];
        AppState.placedJks = new Map();
        AppState.scenarioStartTime = Date.now();

        if (typeof sendScenarioStart === 'function') {
            sendScenarioStart(scenario.id, scenario.name, scenario.steps.length);
        }

        if (typeof startStepTimer === 'function') {
            startStepTimer();
        }

        var scenarioScreen = document.getElementById('scenario-screen');
        if (scenarioScreen) scenarioScreen.classList.add('hidden');

        var headerInfo = document.getElementById('header-info');
        if (headerInfo) {
            headerInfo.innerHTML = (scenario.icon ? '<i class="fas ' + scenario.icon + '"></i>' : '') + ' ' + scenario.name;
            headerInfo.style.display = 'block';
        }

        var premiumLogo = document.querySelector('.premium-header__logo-text');
        if (premiumLogo) {
            var originalText = premiumLogo.innerHTML;
            if (!premiumLogo.dataset.original) {
                premiumLogo.dataset.original = originalText;
            }
            premiumLogo.innerHTML = (scenario.icon ? '<i class="fas ' + scenario.icon + '" style="margin-right:6px;"></i>' : '') + 
                '<span style="font-weight:400;font-size:0.9rem;">' + escapeHtml(scenario.name) + '</span>';
        }

        var breadcrumb = document.getElementById('breadcrumb');
        var breadcrumbCurrent = document.getElementById('breadcrumb-current');
        if (breadcrumb) breadcrumb.style.display = 'flex';
        if (breadcrumbCurrent) breadcrumbCurrent.textContent = scenario.name;

        if (window.ProgressBar) {
            ProgressBar.init();
            ProgressBar.update(0, scenario.steps.length - 1, scenario.steps);
        }

        runStep();
    }

    function showContinueModal(scenario, savedProgress) {
        var overlay = document.createElement('div');
        overlay.className = 'continue-modal-overlay';
        overlay.innerHTML = `
            <div class="continue-modal">
                <div class="continue-modal__icon">💾</div>
                <h3 class="continue-modal__title">Найден сохранённый прогресс</h3>
                <p class="continue-modal__text">
                    Сценарий <strong>${escapeHtml(scenario.name)}</strong> уже был начат ранее.
                </p>
                <div class="continue-modal__progress">
                    <div class="continue-modal__progress-bar">
                        <div class="continue-modal__progress-fill" style="width: ${Math.round((savedProgress.stepIndex / scenario.steps.length) * 100)}%"></div>
                    </div>
                    <div class="continue-modal__progress-text">
                        Пройдено шагов: ${savedProgress.stepIndex + 1} из ${scenario.steps.length}
                    </div>
                </div>
                <div class="continue-modal__actions">
                    <button class="btn btn--primary" id="continue-modal-resume">Продолжить</button>
                    <button class="btn btn--secondary" id="continue-modal-restart">Начать заново</button>
                </div>
                <button class="continue-modal__close" id="continue-modal-close">✕</button>
            </div>
        `;

        document.body.appendChild(overlay);

        if (!document.getElementById('continue-modal-styles')) {
            var style = document.createElement('style');
            style.id = 'continue-modal-styles';
            style.textContent = `
                .continue-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 3000;
                    animation: fadeIn 0.3s ease;
                }
                .continue-modal {
                    background: var(--color-surface, #ffffff);
                    border-radius: 12px;
                    max-width: 400px;
                    width: 90%;
                    padding: 32px 28px;
                    text-align: center;
                    position: relative;
                    box-shadow: 0 24px 48px rgba(0,0,0,0.3);
                    animation: slideUp 0.4s ease;
                }
                .continue-modal__icon { font-size: 3rem; margin-bottom: 16px; }
                .continue-modal__title { font-size: 1.3rem; font-weight: 700; margin-bottom: 12px; }
                .continue-modal__text { font-size: 0.95rem; color: var(--color-text-light, #636e72); margin-bottom: 20px; }
                .continue-modal__progress { margin: 20px 0; padding: 16px; background: var(--color-bg, #f5f6fa); border-radius: 8px; }
                .continue-modal__progress-bar { height: 8px; background: var(--color-border, #dfe6e9); border-radius: 4px; overflow: hidden; margin-bottom: 8px; }
                .continue-modal__progress-fill { height: 100%; background: linear-gradient(90deg, #2e86de, #27ae60); border-radius: 4px; }
                .continue-modal__progress-text { font-size: 0.8rem; color: var(--color-text-light, #636e72); }
                .continue-modal__actions { display: flex; gap: 12px; justify-content: center; margin-top: 20px; }
                .continue-modal__close { position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 1.2rem; cursor: pointer; color: var(--color-text-light, #636e72); width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
                .continue-modal__close:hover { background: var(--color-border, #dfe6e9); }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            `;
            document.head.appendChild(style);
        }

        var resumeBtn = document.getElementById('continue-modal-resume');
        var restartBtn = document.getElementById('continue-modal-restart');
        var closeBtn = document.getElementById('continue-modal-close');

        var closeModal = function() { overlay.remove(); };

        if (resumeBtn) {
            resumeBtn.addEventListener('click', function() {
                closeModal();
                AppState.currentScenario = scenario;
                AppState.currentStepIndex = savedProgress.stepIndex;
                AppState.stepStats = savedProgress.stepStats || [];
                AppState.quizAnswers = savedProgress.quizAnswers || [];

                if (savedProgress.mapPlacedJks && savedProgress.mapPlacedJks.length > 0) {
                    AppState.placedJks = new Map(savedProgress.mapPlacedJks);
                }

                AppState.scenarioStartTime = Date.now();

                if (typeof startStepTimer === 'function') {
                    startStepTimer();
                }

                var scenarioScreen = document.getElementById('scenario-screen');
                if (scenarioScreen) scenarioScreen.classList.add('hidden');

                var headerInfo = document.getElementById('header-info');
                if (headerInfo) {
                    headerInfo.innerHTML = (scenario.icon ? '<i class="fas ' + scenario.icon + '"></i>' : '') + ' ' + scenario.name;
                    headerInfo.style.display = 'block';
                }

                var premiumLogo = document.querySelector('.premium-header__logo-text');
                if (premiumLogo) {
                    if (!premiumLogo.dataset.original) {
                        premiumLogo.dataset.original = premiumLogo.innerHTML;
                    }
                    premiumLogo.innerHTML = (scenario.icon ? '<i class="fas ' + scenario.icon + '" style="margin-right:6px;"></i>' : '') + 
                        '<span style="font-weight:400;font-size:0.9rem;">' + escapeHtml(scenario.name) + '</span>';
                }

                var breadcrumb = document.getElementById('breadcrumb');
                var breadcrumbCurrent = document.getElementById('breadcrumb-current');
                if (breadcrumb) breadcrumb.style.display = 'flex';
                if (breadcrumbCurrent) breadcrumbCurrent.textContent = scenario.name;

                if (window.ProgressBar) {
                    ProgressBar.init();
                    ProgressBar.update(savedProgress.stepIndex, scenario.steps.length - 1, scenario.steps);
                }

                runStep();
            });
        }

        if (restartBtn) {
            restartBtn.addEventListener('click', function() {
                closeModal();
                User.clearScenarioProgress(scenario.id);
                startScenarioFresh(scenario);
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', closeModal);
        }

        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) closeModal();
        });
    }

    function runStep() {
        if (AppState.currentStepIndex >= AppState.currentScenario.steps.length) {
            showFinish();
            return;
        }

        var step = AppState.currentScenario.steps[AppState.currentStepIndex];

        var mapScreen = document.getElementById('map-screen');
        var quizScreen = document.getElementById('quiz-screen');
        var clientJourneyScreen = document.getElementById('client-journey-screen');
        var finishScreen = document.getElementById('finish-screen');

        if (mapScreen) mapScreen.classList.add('hidden');
        if (quizScreen) quizScreen.classList.add('hidden');
        if (clientJourneyScreen) clientJourneyScreen.classList.add('hidden');
        if (finishScreen) finishScreen.classList.add('hidden');

        if (step.type !== 'finish') {
            if (window.ProgressBar) {
                ProgressBar.show();
                ProgressBar.update(
                    AppState.currentStepIndex,
                    AppState.currentScenario.steps.length - 1,
                    AppState.currentScenario.steps
                );
            }
        }

        if (step.type === 'finish') {
            showFinish();
            return;
        }

        if (typeof startStepTimer === 'function') {
            startStepTimer();
        }

        var handled = false;
        if (window.StepRegistry && typeof StepRegistry.run === 'function') {
            handled = StepRegistry.run(step, AppState);
        }

        if (!handled) {
            console.warn('[App] Неизвестный тип шага: ' + step.type + ', пропускаем');
            AppState.currentStepIndex++;
            runStep();
        }
    }

    function showFinish() {
        var mapScreen = document.getElementById('map-screen');
        var quizScreen = document.getElementById('quiz-screen');
        var clientJourneyScreen = document.getElementById('client-journey-screen');
        var finishScreen = document.getElementById('finish-screen');

        if (mapScreen) mapScreen.classList.add('hidden');
        if (quizScreen) quizScreen.classList.add('hidden');
        if (clientJourneyScreen) clientJourneyScreen.classList.add('hidden');
        if (finishScreen) finishScreen.classList.remove('hidden');

        var headerInfo = document.getElementById('header-info');
        if (headerInfo) headerInfo.innerHTML = AppState.currentScenario ? AppState.currentScenario.name : '';

        var premiumLogo = document.querySelector('.premium-header__logo-text');
        if (premiumLogo && premiumLogo.dataset.original) {
            premiumLogo.innerHTML = premiumLogo.dataset.original;
        }

        var breadcrumb = document.getElementById('breadcrumb');
        if (breadcrumb) breadcrumb.style.display = 'none';

        if (window.ProgressBar) {
            ProgressBar.hide();
        }

        // ===== СПЕЦИАЛЬНАЯ ОБРАБОТКА ДЛЯ ОНБОРДИНГ-СЦЕНАРИЯ =====
        // Проверяем, запущен ли онбординг-сценарий (вводный тур)
        if (window._isOnboardingScenario && AppState.currentScenario && AppState.currentScenario.id === 'onboarding-tutorial') {
            // Завершаем онбординг через Onboarding
            if (typeof Onboarding !== 'undefined' && Onboarding.finishOnboardingScenario) {
                Onboarding.finishOnboardingScenario();
            }
            
            // Показываем специальное сообщение
            var finishText = document.getElementById('finish-text');
            if (finishText) {
                finishText.textContent = '🎉 Отлично! Вы освоили основные механики тренажёра! Теперь вы готовы к полноценному обучению.';
            }
            
            // Меняем кнопки
            var scenariosBtn = document.getElementById('finish-scenarios-btn');
            if (scenariosBtn) {
                scenariosBtn.innerHTML = '<i class="fas fa-th-large"></i> Выбрать сценарий';
                scenariosBtn.onclick = function() {
                    exitToScenarios();
                    if (typeof showToast === 'function') {
                        showToast('🚀', 'Выберите первый сценарий для обучения!', 'success');
                    }
                };
            }
            
            var restartBtn = document.getElementById('finish-restart-btn');
            if (restartBtn) {
                restartBtn.style.display = 'none';
            }
            
            // Скрываем статистику
            var finishStats = document.getElementById('finish-stats');
            if (finishStats) {
                finishStats.style.display = 'none';
            }
            
            // Возвращаемся, чтобы не выполнять обычную логику финиша
            return;
        }

        // ===== ПРОВЕРКА НА ОБЫЧНЫЙ ОНБОРДИНГ (из сценария onboarding-tutorial с флагом isOnboarding) =====
        var isOnboarding = AppState.currentScenario && AppState.currentScenario.isOnboarding === true;
        
        if (isOnboarding) {
            // Отмечаем онбординг как завершённый
            if (window.User) {
                User.completeOnboarding();
            }

            var finishText = document.getElementById('finish-text');
            if (finishText) {
                finishText.textContent = '🎉 Отлично! Вы освоили основные механики тренажёра! Теперь вы готовы к полноценному обучению.';
            }

            var scenariosBtn = document.getElementById('finish-scenarios-btn');
            if (scenariosBtn) {
                scenariosBtn.innerHTML = '<i class="fas fa-th-large"></i> Выбрать сценарий';
                scenariosBtn.onclick = function() {
                    exitToScenarios();
                    var user = User.get();
                    if (user && typeof showToast === 'function') {
                        showToast('🚀', 'Готовы начать обучение? Выберите первый сценарий!', 'success');
                    }
                };
            }

            var restartBtn = document.getElementById('finish-restart-btn');
            if (restartBtn) {
                restartBtn.style.display = 'none';
            }

            var finishStats = document.getElementById('finish-stats');
            if (finishStats) {
                finishStats.style.display = 'none';
            }

            setTimeout(function() {
                if (typeof showToast === 'function') {
                    showToast('🎉', 'Добро пожаловать в тренажёр! Выберите сценарий для обучения.', 'success');
                }
            }, 500);

            return;
        }

        // ===== ОБЫЧНАЯ ОБРАБОТКА ДЛЯ ОСТАЛЬНЫХ СЦЕНАРИЕВ =====
        var totalCorrect = AppState.stepStats.reduce(function(sum, s) {
            if (s.type === 'map') return sum + s.placed;
            return sum + (s.correct || 0);
        }, 0);

        var totalItems = AppState.stepStats.reduce(function(sum, s) {
            if (s.type === 'map') return sum + s.total;
            return sum + (s.total || 0);
        }, 0);

        var isPerfect = totalCorrect === totalItems && totalItems > 0;
        var durationSec = AppState.scenarioStartTime ?
            Math.round((Date.now() - AppState.scenarioStartTime) / 1000) : 0;

        var finishText = document.getElementById('finish-text');
        if (finishText) {
            finishText.textContent = 'Вы успешно завершили сценарий «' +
                (AppState.currentScenario ? AppState.currentScenario.name : '') + '»!';
        }

        var finishStats = document.getElementById('finish-stats');
        if (finishStats) {
            finishStats.textContent = 'Правильно: ' + totalCorrect + ' из ' + totalItems;
        }

        if (typeof sendScenarioComplete === 'function' && AppState.currentScenario) {
            sendScenarioComplete(
                AppState.currentScenario.id,
                AppState.currentScenario.name,
                AppState.currentStepIndex + 1,
                AppState.currentScenario.steps.length,
                totalCorrect,
                isPerfect
            );
        }

        var xpResult = User.sendResult(
            AppState.currentScenario ? AppState.currentScenario.name : '',
            AppState.stepStats,
            totalCorrect,
            totalItems,
            durationSec
        );

        if (xpResult) {
            updateHeaderAfterXP(xpResult);
        }

        if (AppState.currentScenario && AppState.currentScenario.id) {
            User.clearScenarioProgress(AppState.currentScenario.id);
        }

        if (AppState.currentScenario && AppState.currentScenario.badge) {
            var isNew = Badges.award(AppState.currentScenario.badge);
            if (isNew) {
                Badges.showBadgeToast(AppState.currentScenario.badge);
            }
            Badges.renderOnFinish('.finish-content');
        }

        if (isPerfect && totalItems > 5) {
            var perfectBadge = 'Идеальное прохождение';
            var isNewPerfect = Badges.award(perfectBadge);
            if (isNewPerfect) {
                setTimeout(function() {
                    Badges.showBadgeToast(perfectBadge);
                }, 2000);
            }
        }

        if (typeof refreshMainScreen === 'function') {
            setTimeout(function() {
                refreshMainScreen();
            }, 500);
        }
    }

    function exitToScenarios() {
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

        saveCurrentProgress();
        AppState.currentScenario = null;
        AppState.placedJks = new Map();

        var mapScreen = document.getElementById('map-screen');
        var quizScreen = document.getElementById('quiz-screen');
        var clientJourneyScreen = document.getElementById('client-journey-screen');
        var finishScreen = document.getElementById('finish-screen');
        var scenarioScreen = document.getElementById('scenario-screen');

        if (mapScreen) mapScreen.classList.add('hidden');
        if (quizScreen) quizScreen.classList.add('hidden');
        if (clientJourneyScreen) clientJourneyScreen.classList.add('hidden');
        if (finishScreen) finishScreen.classList.add('hidden');
        if (scenarioScreen) scenarioScreen.classList.remove('hidden');

        var headerInfo = document.getElementById('header-info');
        if (headerInfo) headerInfo.innerHTML = '';

        var premiumLogo = document.querySelector('.premium-header__logo-text');
        if (premiumLogo && premiumLogo.dataset.original) {
            premiumLogo.innerHTML = premiumLogo.dataset.original;
        }

        var breadcrumb = document.getElementById('breadcrumb');
        if (breadcrumb) breadcrumb.style.display = 'none';

        if (window.ProgressBar) {
            ProgressBar.hide();
        }

        if (typeof renderScenarios === 'function') {
            renderScenarios();
        }
    }

    function updateHeaderAfterXP(xpResult) {
        if (xpResult && xpResult.leveledUp) {
            if (typeof showToast === 'function') {
                showToast('🎉', 'Поздравляем! Вы достигли ' + xpResult.newLevel + ' уровня!', 'success');
            }
        }
        if (typeof updateHeaderXP === 'function') {
            updateHeaderXP();
        }
        if (typeof updateContinueLearning === 'function') {
            updateContinueLearning();
        }
        if (typeof refreshMainScreen === 'function') {
            refreshMainScreen();
        }
    }

    // ===== ЭКСПОРТ В ГЛОБАЛЬНУЮ ОБЛАСТЬ =====
    window.startScenario = startScenario;
    window.runStep = runStep;
    window.exitToScenarios = exitToScenarios;
    window.showFinish = showFinish;
    window.updateHeaderAfterXP = updateHeaderAfterXP;

    console.log('[AppScenario] Модуль загружен, версия: 1.3');

})();
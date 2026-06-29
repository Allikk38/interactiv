// ===== СПЕЦИАЛЬНЫЕ ШАГИ ДЛЯ ОНБОРДИНГА =====
// Эти шаги используются только во вводном туре и не отображаются в обычных сценариях
// ВНИМАНИЕ: Сейчас онбординг управляется через модуль Onboarding в js/ui/onboarding.js
// Этот файл оставлен для обратной совместимости и на случай использования сценария онбординга

(function() {
    'use strict';

    /**
     * Приветственный шаг онбординга
     * @deprecated Используется только для обратной совместимости
     */
    function runOnboardingWelcomeStep(step) {
        console.warn('[Onboarding] runOnboardingWelcomeStep устарел. Онбординг теперь управляется через модуль Onboarding');
        
        // Проверяем, не запущен ли уже онбординг через новый механизм
        if (window.Onboarding && window.Onboarding.isOpen) {
            console.log('[Onboarding] Онбординг уже запущен через новый механизм, пропускаем');
            AppState.currentStepIndex++;
            runStep();
            return;
        }
        
        var quizScreen = document.getElementById('quiz-screen');
        var quizStepTitle = document.getElementById('quiz-step-title');
        var quizStepCounter = document.getElementById('quiz-step-counter');
        var quizContainer = document.getElementById('quiz-container');
        
        if (!quizScreen || !quizContainer) {
            console.error('[Onboarding] Элементы UI не найдены');
            AppState.currentStepIndex++;
            runStep();
            return;
        }
        
        quizScreen.classList.remove('hidden');
        quizStepTitle.textContent = step.title || 'Добро пожаловать!';
        quizStepCounter.textContent = 'Шаг ' + (AppState.currentStepIndex + 1) + ' из ' + AppState.currentScenario.steps.length;
        
        var text = step.text || 'Добро пожаловать в тренажёр!';
        var lines = text.split('\n');
        var paragraphs = '';
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (line) {
                paragraphs += '<p>' + escapeHtml(line) + '</p>';
            }
        }
        
        quizContainer.innerHTML = `
            <div class="onboarding-welcome" style="max-width: 600px; margin: 40px auto; text-align: center; padding: 0 20px;">
                <div style="font-size: 4rem; margin-bottom: 20px;">🎓</div>
                <h2 style="font-size: 1.6rem; margin-bottom: 16px; color: var(--color-text, #2d3436);">
                    ${escapeHtml(step.title || 'Добро пожаловать!')}
                </h2>
                <div style="font-size: 1rem; line-height: 1.8; color: var(--color-text-light, #636e72); text-align: left; max-width: 500px; margin: 0 auto;">
                    ${paragraphs}
                </div>
                <div style="margin-top: 32px; display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                    <button class="btn btn--secondary" id="onboarding-skip-btn" style="min-width: 120px; padding: 12px 24px;">
                        Пропустить
                    </button>
                    <button class="btn btn--primary" id="onboarding-welcome-btn" style="min-width: 160px; padding: 12px 32px;">
                        Далее →
                    </button>
                </div>
            </div>
        `;
        
        var welcomeBtn = document.getElementById('onboarding-welcome-btn');
        if (welcomeBtn) {
            welcomeBtn.addEventListener('click', function() {
                AppState.currentStepIndex++;
                runStep();
            });
        }
        
        var skipBtn = document.getElementById('onboarding-skip-btn');
        if (skipBtn) {
            skipBtn.addEventListener('click', function() {
                skipOnboardingLegacy();
            });
        }
    }

    /**
     * Шаг онбординга "Прогресс и XP"
     * @deprecated Используется только для обратной совместимости
     */
    function runOnboardingProgressStep(step) {
        console.warn('[Onboarding] runOnboardingProgressStep устарел. Онбординг теперь управляется через модуль Onboarding');
        
        // Проверяем, не запущен ли уже онбординг через новый механизм
        if (window.Onboarding && window.Onboarding.isOpen) {
            console.log('[Onboarding] Онбординг уже запущен через новый механизм, пропускаем');
            AppState.currentStepIndex++;
            runStep();
            return;
        }
        
        var quizScreen = document.getElementById('quiz-screen');
        var quizStepTitle = document.getElementById('quiz-step-title');
        var quizStepCounter = document.getElementById('quiz-step-counter');
        var quizContainer = document.getElementById('quiz-container');
        
        if (!quizScreen || !quizContainer) {
            console.error('[Onboarding] Элементы UI не найдены');
            AppState.currentStepIndex++;
            runStep();
            return;
        }
        
        quizScreen.classList.remove('hidden');
        quizStepTitle.textContent = step.title || 'Прогресс и достижения';
        quizStepCounter.textContent = 'Шаг ' + (AppState.currentStepIndex + 1) + ' из ' + AppState.currentScenario.steps.length;
        
        var user = User.get();
        var xpProgress = user ? User.getXPProgress() : { level: 1, currentXP: 0, percentToNext: 0, xpNeededForNext: 100 };
        var badges = user ? Badges.getAll() : [];
        var text = step.text || 'За прохождение заданий вы получаете XP (опыт). Чем больше XP, тем выше ваш уровень и статус.';
        
        quizContainer.innerHTML = `
            <div class="onboarding-progress" style="max-width: 600px; margin: 20px auto; padding: 0 20px;">
                <h2 style="text-align: center; margin-bottom: 16px; font-size: 1.4rem; color: var(--color-text, #2d3436);">
                    ${escapeHtml(step.title || 'Прогресс и достижения')}
                </h2>
                <p style="text-align: center; font-size: 1rem; color: var(--color-text-light, #636e72); margin-bottom: 32px; line-height: 1.6;">
                    ${escapeHtml(text)}
                </p>
                
                <div style="background: var(--color-surface, #ffffff); border-radius: var(--radius, 12px); padding: 24px; box-shadow: 0 2px 8px var(--color-shadow, rgba(0,0,0,0.08));">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <span style="font-weight: 600; color: var(--color-text, #2d3436);">Ваш уровень</span>
                        <span style="font-size: 1.4rem; font-weight: 700; color: var(--color-warning, #f39c12);">${xpProgress.level}</span>
                    </div>
                    <div style="margin-bottom: 16px;">
                        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 6px; color: var(--color-text-light, #636e72);">
                            <span>${xpProgress.currentXP} XP</span>
                            <span>${xpProgress.xpNeededForNext || 0} XP до следующего уровня</span>
                        </div>
                        <div style="background: var(--color-border, #dfe6e9); border-radius: 8px; height: 8px; overflow: hidden;">
                            <div style="width: ${xpProgress.percentToNext || 0}%; height: 100%; background: linear-gradient(90deg, var(--color-warning, #f39c12), #e67e22); border-radius: 8px; transition: width 0.5s;"></div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; padding-top: 12px; border-top: 1px solid var(--color-border, #dfe6e9);">
                        ${badges.length > 0 ? 
                            badges.map(function(b) {
                                return '<span style="background: linear-gradient(135deg, #f6d365, #fda085); padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; color: #333;">🏅 ' + escapeHtml(b) + '</span>';
                            }).join('') : 
                            '<span style="color: var(--color-text-light, #636e72); font-size: 0.85rem;">Пока нет бейджей. Пройдите сценарии, чтобы получить их!</span>'
                        }
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 32px; display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                    <button class="btn btn--secondary" id="onboarding-progress-skip-btn" style="min-width: 120px; padding: 12px 24px;">
                        Пропустить
                    </button>
                    <button class="btn btn--primary" id="onboarding-progress-btn" style="min-width: 160px; padding: 12px 32px;">
                        Далее →
                    </button>
                </div>
            </div>
        `;
        
        var progressBtn = document.getElementById('onboarding-progress-btn');
        if (progressBtn) {
            progressBtn.addEventListener('click', function() {
                AppState.currentStepIndex++;
                runStep();
            });
        }
        
        var skipBtn = document.getElementById('onboarding-progress-skip-btn');
        if (skipBtn) {
            skipBtn.addEventListener('click', function() {
                skipOnboardingLegacy();
            });
        }
    }

    /**
     * Пропуск онбординга (legacy версия)
     * @deprecated Используется только для обратной совместимости
     */
    function skipOnboardingLegacy() {
        console.log('[Onboarding] Пользователь пропустил онбординг (legacy)');
        
        if (window.User) {
            User.completeOnboarding();
            try {
                localStorage.setItem('onboarding_skipped', 'true');
            } catch (_) {}
        }
        
        if (typeof exitToScenarios === 'function') {
            exitToScenarios();
            if (typeof showToast === 'function') {
                var user = User.get();
                var greeting = user ? user.name.split(' ')[0] : '';
                showToast('👋', (greeting ? greeting + ', ' : '') + 'вы можете начать обучение в любое время!', 'info');
            }
        } else {
            window.location.reload();
        }
    }

    // Регистрируем функции в глобальной области
    window.runOnboardingWelcomeStep = runOnboardingWelcomeStep;
    window.runOnboardingProgressStep = runOnboardingProgressStep;
    window.skipOnboardingLegacy = skipOnboardingLegacy;

    console.log('[OnboardingSteps] Модуль загружен (legacy режим), шаги зарегистрированы в глобальной области');

})();

// Дополнительная регистрация в StepRegistry (на случай, если файл загрузился после инициализации)
if (typeof StepRegistry !== 'undefined') {
    if (typeof runOnboardingWelcomeStep !== 'undefined') {
        StepRegistry.register('onboarding-welcome', runOnboardingWelcomeStep);
        console.log('[OnboardingSteps] Зарегистрирован шаг "onboarding-welcome" в StepRegistry (legacy)');
    }
    if (typeof runOnboardingProgressStep !== 'undefined') {
        StepRegistry.register('onboarding-progress', runOnboardingProgressStep);
        console.log('[OnboardingSteps] Зарегистрирован шаг "onboarding-progress" в StepRegistry (legacy)');
    }
}
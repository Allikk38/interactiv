// ===== ИНИЦИАЛИЗАЦИЯ РЕЕСТРА ШАГОВ =====
// Этот файл подключается после всех *-step.js файлов, но перед app.js

(function initStepRegistry() {
    'use strict';
    
    // Убедимся, что StepRegistry существует
    if (typeof StepRegistry === 'undefined') {
        // Используем console.error вместо logError, так как logger может быть ещё не загружен
        console.error('[StepRegistry] StepRegistry не найден!');
        return;
    }
    
    // Регистрируем все обработчики
    // Из brief.js
    if (typeof runBriefStep === 'function') {
        StepRegistry.register('brief', runBriefStep);
    }
    
    // Из interactive-lesson1.js
    if (typeof runMatchingStep === 'function') {
        StepRegistry.register('matching', runMatchingStep);
    }
    if (typeof runPipelineStep === 'function') {
        StepRegistry.register('pipeline', runPipelineStep);
    }
    if (typeof runDialogueStep === 'function') {
        StepRegistry.register('dialogue', runDialogueStep);
    }
    
    // Из map-step.js
    if (typeof runMapStep === 'function') {
        StepRegistry.register('map', runMapStep);
    }
    
    // Из quiz.js
    if (typeof runQuizStep === 'function') {
        StepRegistry.register('quiz', runQuizStep);
    }
    
    // Из interactive.js
    if (typeof runPlatformsStep === 'function') {
        StepRegistry.register('platforms', runPlatformsStep);
    }
    if (typeof runRule3tStep === 'function') {
        StepRegistry.register('rule3t', runRule3tStep);
    }
    if (typeof runProfileStep === 'function') {
        StepRegistry.register('profile', runProfileStep);
    }
    if (typeof runContentPlanStep === 'function') {
        StepRegistry.register('content-plan', runContentPlanStep);
    }
    if (typeof runFunnelStep === 'function') {
        StepRegistry.register('funnel', runFunnelStep);
    }
    if (typeof runAiToolsStep === 'function') {
        StepRegistry.register('ai-tools', runAiToolsStep);
    }
    if (typeof runAnalyticsStep === 'function') {
        StepRegistry.register('analytics', runAnalyticsStep);
    }
    
    // Из timer-quiz.js
    if (typeof runTimerQuizStep === 'function') {
        StepRegistry.register('timer-quiz', runTimerQuizStep);
        console.log('[StepRegistry] Зарегистрирован тип шага "timer-quiz"');
    }
    
    // Из decision-chain.js
    if (typeof runDecisionChainStep === 'function') {
        StepRegistry.register('decision-chain', runDecisionChainStep);
        console.log('[StepRegistry] Зарегистрирован тип шага "decision-chain"');
    }
    
    // Из triple-match-drag.js
    if (typeof runTripleMatchDragStep === 'function') {
        StepRegistry.register('triple-match-drag', runTripleMatchDragStep);
        console.log('[StepRegistry] Зарегистрирован тип шага "triple-match-drag"');
    }
    
    // Из client-journey.js
    if (typeof runClientJourneyStep === 'function') {
        StepRegistry.register('client-journey', runClientJourneyStep);
    }
    
    // Из consultation-main.js
    if (typeof runConsultationStep === 'function') {
        StepRegistry.register('consultation', runConsultationStep);
    }
    
    // ===== СПЕЦИАЛЬНЫЕ ШАГИ ДЛЯ ОНБОРДИНГА =====
    // Из onboarding-steps.js
    // Регистрируем для обратной совместимости
    if (typeof runOnboardingWelcomeStep === 'function') {
        StepRegistry.register('onboarding-welcome', runOnboardingWelcomeStep);
        console.log('[StepRegistry] Зарегистрирован тип шага "onboarding-welcome" (для обратной совместимости)');
    }
    if (typeof runOnboardingProgressStep === 'function') {
        StepRegistry.register('onboarding-progress', runOnboardingProgressStep);
        console.log('[StepRegistry] Зарегистрирован тип шага "onboarding-progress" (для обратной совместимости)');
    }
    
    // Регистрируем finish как специальный тип (хотя он обрабатывается отдельно)
    // finish не требует обработчика, так как runStep сам его ловит
    
    var registeredTypes = StepRegistry.getRegisteredTypes ? StepRegistry.getRegisteredTypes() : [];
    console.log('[StepRegistry] Зарегистрировано ' + registeredTypes.length + ' типов шагов:', registeredTypes);
    
    // ===== ДОПОЛНИТЕЛЬНАЯ ИНИЦИАЛИЗАЦИЯ ДЛЯ ОНБОРДИНГА =====
    // Убеждаемся, что Onboarding инициализируется после загрузки всех модулей
    if (typeof Onboarding !== 'undefined' && Onboarding.init) {
        // Не вызываем Onboarding.init() здесь, так как он уже вызывается в app.js
        // Просто проверяем, что модуль загружен
        console.log('[StepRegistry] Модуль Onboarding доступен');
    }
    
    // ===== ОБРАБОТКА СЦЕНАРИЯ ОНБОРДИНГА (УСТАРЕВШЕЕ) =====
    // NOTE: Сценарий онбординга больше не используется как отдельный сценарий.
    // Онбординг теперь управляется через Onboarding.checkAndAutoStart() в onboarding.js
    // Этот код оставлен для обратной совместимости, но фактически не используется
    console.log('[StepRegistry] Онбординг теперь управляется через модуль Onboarding');
    
})();

// Дополнительная регистрация в StepRegistry (на случай, если файл загрузился после инициализации)
if (typeof StepRegistry !== 'undefined') {
    // Проверяем, что все обработчики зарегистрированы
    // Если какие-то обработчики отсутствуют, они будут зарегистрированы здесь
    if (typeof runOnboardingWelcomeStep !== 'undefined' && !StepRegistry.hasHandler('onboarding-welcome')) {
        StepRegistry.register('onboarding-welcome', runOnboardingWelcomeStep);
        console.log('[OnboardingSteps] Зарегистрирован шаг "onboarding-welcome" в StepRegistry');
    }
    if (typeof runOnboardingProgressStep !== 'undefined' && !StepRegistry.hasHandler('onboarding-progress')) {
        StepRegistry.register('onboarding-progress', runOnboardingProgressStep);
        console.log('[OnboardingSteps] Зарегистрирован шаг "onboarding-progress" в StepRegistry');
    }
}
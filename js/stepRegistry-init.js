// ===== ИНИЦИАЛИЗАЦИЯ РЕЕСТРА ШАГОВ =====
// Этот файл подключается после всех *-step.js файлов, но перед app.js

(function initStepRegistry() {
    // Убедимся, что StepRegistry существует
    if (typeof StepRegistry === 'undefined') {
        logError('StepRegistry не найден!');
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
    
    // Из client-journey.js
    if (typeof runClientJourneyStep === 'function') {
        StepRegistry.register('client-journey', runClientJourneyStep);
    }
    
    // Регистрируем finish как специальный тип (хотя он обрабатывается отдельно)
    // finish не требует обработчика, так как runStep сам его ловит
    
    logInfo(`StepRegistry: зарегистрировано ${StepRegistry.getRegisteredTypes().length} типов шагов:`, StepRegistry.getRegisteredTypes());
})();

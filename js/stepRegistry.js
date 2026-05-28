// ===== РЕЕСТР ШАГОВ ДЛЯ runStep() =====
// Все обработчики шагов регистрируются здесь, чтобы избавиться от switch/case в app.js

const StepRegistry = {
    // Хранилище обработчиков
    _handlers: {},
    
    // Регистрация обработчика для типа шага
    register(stepType, handlerFn) {
        if (typeof handlerFn !== 'function') {
            console.error(`StepRegistry: обработчик для "${stepType}" не является функцией`);
            return;
        }
        this._handlers[stepType] = handlerFn;
    },
    
    // Получение обработчика по типу
    getHandler(stepType) {
        return this._handlers[stepType] || null;
    },
    
    // Проверка наличия обработчика
    hasHandler(stepType) {
        return !!this._handlers[stepType];
    },
    
    // Выполнение шага (если обработчик найден)
    run(step, context) {
        const handler = this.getHandler(step.type);
        if (!handler) {
            console.error(`StepRegistry: неизвестный тип шага "${step.type}"`);
            return false;
        }
        handler(step, context);
        return true;
    },
    
    // Получить все зарегистрированные типы (для отладки)
    getRegisteredTypes() {
        return Object.keys(this._handlers);
    }
};

// Регистрация всех существующих обработчиков
// ВАЖНО: эти функции должны быть определены ДО регистрации,
// поэтому файл stepRegistry.js подключается ПОСЛЕ всех *-step.js файлов,
// но ДО app.js

// Функции, определённые в других файлах:
// - runBriefStep (brief.js)
// - runMatchingStep, runPipelineStep, runDialogueStep (interactive-lesson1.js)
// - runMapStep (map-step.js)
// - runQuizStep (quiz.js)
// - runPlatformsStep, runRule3tStep, runProfileStep, runContentPlanStep,
//   runFunnelStep, runAiToolsStep, runAnalyticsStep (interactive.js)
// - runClientJourneyStep (client-journey.js)

// Регистрация будет выполнена после загрузки всех скриптов через DOMContentLoaded
// или через отложенную инициализацию, чтобы избежать ошибок ReferenceError

window.StepRegistry = StepRegistry;

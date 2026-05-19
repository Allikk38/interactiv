// ===== ГЛОБАЛЬНОЕ СОСТОЯНИЕ =====
const AppState = {
    // Данные
    allJks: [],
    allQuestions: [],
    scenarios: [],
    marketingData: {},
    
    // Текущий сценарий
    currentScenario: null,
    currentStepIndex: 0,
    stepStats: [],
    scenarioStartTime: null,
    
    // Состояние карты
    map: null,
    selectedJkId: null,
    placedJks: new Map(),
    currentMarkers: [],
    currentStepJks: [],
    
    // UI элементы
    mapProgress: null,
    mapProgressCount: null,
    mapProgressTotal: null,
    
    // Викторина
    currentStepQuestions: [],
    currentQuestionIndex: 0,
    quizAnswers: [],
    
    // Таймеры
    toastTimer: null
};
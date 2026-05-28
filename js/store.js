// ===== УПРАВЛЕНИЕ СОСТОЯНИЕМ (STORE) =====

class Store {
    // Приватные поля
    #state = {
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
    
    #listeners = {};
    
    constructor() {
        // Создаём глобальную ссылку на себя
        if (window.Store) {
            return window.Store;
        }
        window.Store = this;
    }
    
    // Приватные методы
    #notify(key, newValue, oldValue) {
        if (this.#listeners[key]) {
            this.#listeners[key].forEach(cb => {
                try {
                    cb(newValue, oldValue);
                } catch (e) {
                    console.error(`Ошибка в подписчике ${key}:`, e);
                }
            });
        }
    }
    
    // Подписка на изменения
    subscribe(key, callback) {
        if (!this.#listeners[key]) {
            this.#listeners[key] = [];
        }
        this.#listeners[key].push(callback);
        
        // Возвращаем функцию для отписки
        return () => {
            this.#listeners[key] = this.#listeners[key].filter(cb => cb !== callback);
        };
    }
    
    // ----- ГЕТТЕРЫ -----
    getAllJks() { return this.#state.allJks; }
    getAllQuestions() { return this.#state.allQuestions; }
    getScenarios() { return this.#state.scenarios; }
    getMarketingData() { return this.#state.marketingData; }
    getCurrentScenario() { return this.#state.currentScenario; }
    getCurrentStepIndex() { return this.#state.currentStepIndex; }
    getStepStats() { return this.#state.stepStats; }
    getScenarioStartTime() { return this.#state.scenarioStartTime; }
    getMap() { return this.#state.map; }
    getSelectedJkId() { return this.#state.selectedJkId; }
    getPlacedJks() { return this.#state.placedJks; }
    getCurrentMarkers() { return this.#state.currentMarkers; }
    getCurrentStepJks() { return this.#state.currentStepJks; }
    getMapProgress() { return this.#state.mapProgress; }
    getMapProgressCount() { return this.#state.mapProgressCount; }
    getMapProgressTotal() { return this.#state.mapProgressTotal; }
    getCurrentStepQuestions() { return this.#state.currentStepQuestions; }
    getCurrentQuestionIndex() { return this.#state.currentQuestionIndex; }
    getQuizAnswers() { return this.#state.quizAnswers; }
    getToastTimer() { return this.#state.toastTimer; }
    
    // ----- СЕТТЕРЫ -----
    setAllJks(value) {
        const old = this.#state.allJks;
        this.#state.allJks = value;
        this.#notify('allJks', value, old);
    }
    
    setAllQuestions(value) {
        const old = this.#state.allQuestions;
        this.#state.allQuestions = value;
        this.#notify('allQuestions', value, old);
    }
    
    setScenarios(value) {
        const old = this.#state.scenarios;
        this.#state.scenarios = value;
        this.#notify('scenarios', value, old);
    }
    
    setMarketingData(value) {
        const old = this.#state.marketingData;
        this.#state.marketingData = value;
        this.#notify('marketingData', value, old);
    }
    
    setCurrentScenario(value) {
        const old = this.#state.currentScenario;
        this.#state.currentScenario = value;
        this.#notify('currentScenario', value, old);
    }
    
    setCurrentStepIndex(value) {
        const old = this.#state.currentStepIndex;
        this.#state.currentStepIndex = value;
        this.#notify('currentStepIndex', value, old);
    }
    
    setStepStats(value) {
        const old = this.#state.stepStats;
        this.#state.stepStats = value;
        this.#notify('stepStats', value, old);
    }
    
    setScenarioStartTime(value) {
        const old = this.#state.scenarioStartTime;
        this.#state.scenarioStartTime = value;
        this.#notify('scenarioStartTime', value, old);
    }
    
    setMap(value) {
        const old = this.#state.map;
        this.#state.map = value;
        this.#notify('map', value, old);
    }
    
    setSelectedJkId(value) {
        const old = this.#state.selectedJkId;
        this.#state.selectedJkId = value;
        this.#notify('selectedJkId', value, old);
    }
    
    setCurrentMarkers(value) {
        const old = this.#state.currentMarkers;
        this.#state.currentMarkers = value;
        this.#notify('currentMarkers', value, old);
    }
    
    setCurrentStepJks(value) {
        const old = this.#state.currentStepJks;
        this.#state.currentStepJks = value;
        this.#notify('currentStepJks', value, old);
    }
    
    setMapProgress(value) {
        const old = this.#state.mapProgress;
        this.#state.mapProgress = value;
        this.#notify('mapProgress', value, old);
    }
    
    setMapProgressCount(value) {
        const old = this.#state.mapProgressCount;
        this.#state.mapProgressCount = value;
        this.#notify('mapProgressCount', value, old);
    }
    
    setMapProgressTotal(value) {
        const old = this.#state.mapProgressTotal;
        this.#state.mapProgressTotal = value;
        this.#notify('mapProgressTotal', value, old);
    }
    
    setCurrentStepQuestions(value) {
        const old = this.#state.currentStepQuestions;
        this.#state.currentStepQuestions = value;
        this.#notify('currentStepQuestions', value, old);
    }
    
    setCurrentQuestionIndex(value) {
        const old = this.#state.currentQuestionIndex;
        this.#state.currentQuestionIndex = value;
        this.#notify('currentQuestionIndex', value, old);
    }
    
    setQuizAnswers(value) {
        const old = this.#state.quizAnswers;
        this.#state.quizAnswers = value;
        this.#notify('quizAnswers', value, old);
    }
    
    setToastTimer(value) {
        const old = this.#state.toastTimer;
        this.#state.toastTimer = value;
        this.#notify('toastTimer', value, old);
    }
    
    // ----- ОПЕРАЦИИ НАД MAP (placedJks) -----
    addPlacedJk(id, data) {
        this.#state.placedJks.set(id, data);
        this.#notify('placedJks', this.#state.placedJks, null);
    }
    
    removePlacedJk(id) {
        this.#state.placedJks.delete(id);
        this.#notify('placedJks', this.#state.placedJks, null);
    }
    
    clearPlacedJks() {
        this.#state.placedJks.clear();
        this.#notify('placedJks', this.#state.placedJks, null);
    }
    
    hasPlacedJk(id) {
        return this.#state.placedJks.has(id);
    }
    
    getPlacedJk(id) {
        return this.#state.placedJks.get(id);
    }
    
    getPlacedJksSize() {
        return this.#state.placedJks.size;
    }
    
    // ----- ОПЕРАЦИИ НАД МАССИВАМИ -----
    addToCurrentMarkers(marker) {
        this.#state.currentMarkers.push(marker);
        this.#notify('currentMarkers', this.#state.currentMarkers, null);
    }
    
    removeFromCurrentMarkers(marker) {
        const index = this.#state.currentMarkers.indexOf(marker);
        if (index > -1) {
            this.#state.currentMarkers.splice(index, 1);
            this.#notify('currentMarkers', this.#state.currentMarkers, null);
        }
    }
    
    clearCurrentMarkers() {
        this.#state.currentMarkers = [];
        this.#notify('currentMarkers', this.#state.currentMarkers, null);
    }
    
    addToStepStats(stat) {
        this.#state.stepStats.push(stat);
        this.#notify('stepStats', this.#state.stepStats, null);
    }
    
    addToQuizAnswers(answer) {
        this.#state.quizAnswers.push(answer);
        this.#notify('quizAnswers', this.#state.quizAnswers, null);
    }
    
    clearQuizAnswers() {
        this.#state.quizAnswers = [];
        this.#notify('quizAnswers', this.#state.quizAnswers, null);
    }
    
    // ----- ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ -----
    resetScenarioState() {
        this.#state.currentStepIndex = 0;
        this.#state.stepStats = [];
        this.#state.scenarioStartTime = null;
        this.#state.selectedJkId = null;
        this.#state.placedJks.clear();
        this.#state.currentMarkers = [];
        this.#state.currentStepJks = [];
        this.#state.currentStepQuestions = [];
        this.#state.currentQuestionIndex = 0;
        this.#state.quizAnswers = [];
        
        this.#notify('currentStepIndex', this.#state.currentStepIndex, null);
        this.#notify('stepStats', this.#state.stepStats, null);
        this.#notify('placedJks', this.#state.placedJks, null);
        this.#notify('currentMarkers', this.#state.currentMarkers, null);
        this.#notify('quizAnswers', this.#state.quizAnswers, null);
    }
    
    resetMapState() {
        this.#state.selectedJkId = null;
        this.#state.placedJks.clear();
        this.#state.currentMarkers = [];
        this.#state.currentStepJks = [];
        
        this.#notify('selectedJkId', this.#state.selectedJkId, null);
        this.#notify('placedJks', this.#state.placedJks, null);
        this.#notify('currentMarkers', this.#state.currentMarkers, null);
        this.#notify('currentStepJks', this.#state.currentStepJks, null);
    }
}

// Инициализация глобального экземпляра
const StoreInstance = new Store();


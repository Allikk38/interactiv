// ===== ЦЕНТРАЛИЗОВАННОЕ ЛОГИРОВАНИЕ =====

// Уровни логирования
const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    NONE: 4
};

// Текущий уровень (по умолчанию INFO)
// В production можно установить NONE или WARN
let currentLevel = LOG_LEVELS.INFO;

// Хранилище последних логов (для отладки)
const logHistory = [];
const MAX_HISTORY = 100;

// Определяем, production ли это (по отсутствию localhost или по параметру)
const isProduction = window.location.hostname !== 'localhost' && 
                     !window.location.hostname.includes('127.0.0.1') &&
                     !window.location.hostname.includes('192.168');

// В production отключаем DEBUG и INFO
if (isProduction) {
    currentLevel = LOG_LEVELS.WARN;
}

/**
 * Установить уровень логирования
 * @param {number} level - уровень из LOG_LEVELS
 */
function setLogLevel(level) {
    currentLevel = level;
}

/**
 * Внутренняя функция для сохранения истории и вывода в консоль
 */
function _log(level, levelName, args) {
    if (level < currentLevel) return;
    
    // Сохраняем в историю
    const logEntry = {
        timestamp: new Date().toISOString(),
        level: levelName,
        message: Array.from(args).join(' ')
    };
    logHistory.unshift(logEntry);
    if (logHistory.length > MAX_HISTORY) logHistory.pop();
    
    // Выводим в консоль
    const consoleMethod = levelName.toLowerCase();
    if (console[consoleMethod]) {
        console[consoleMethod](`[${levelName}]`, ...args);
    } else {
        console.log(`[${levelName}]`, ...args);
    }
}

/**
 * Логирование DEBUG (только для разработки)
 */
function logDebug(...args) {
    _log(LOG_LEVELS.DEBUG, 'DEBUG', args);
}

/**
 * Логирование INFO (общая информация)
 */
function logInfo(...args) {
    _log(LOG_LEVELS.INFO, 'INFO', args);
}

/**
 * Логирование WARN (предупреждения)
 */
function logWarn(...args) {
    _log(LOG_LEVELS.WARN, 'WARN', args);
}

/**
 * Логирование ERROR (ошибки)
 */
function logError(...args) {
    _log(LOG_LEVELS.ERROR, 'ERROR', args);
}

/**
 * Получить историю логов
 */
function getLogHistory() {
    return [...logHistory];
}

/**
 * Очистить историю логов
 */
function clearLogHistory() {
    logHistory.length = 0;
}

// Экспортируем в глобальную область
window.Logger = {
    LEVELS: LOG_LEVELS,
    setLevel: setLogLevel,
    debug: logDebug,
    info: logInfo,
    warn: logWarn,
    error: logError,
    getHistory: getLogHistory,
    clearHistory: clearLogHistory
};

// Для удобства создаём короткие алиасы
window.logDebug = logDebug;
window.logInfo = logInfo;
window.logWarn = logWarn;
window.logError = logError;

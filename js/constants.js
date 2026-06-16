// ===== КОНСТАНТЫ ПРОЕКТА =====
// Централизованное хранение всех числовых значений и конфигураций

// ===== ТАЙМЕРЫ И ЗАДЕРЖКИ =====
const TIMERS = {
    // Общие таймеры
    TOAST_DURATION_MS: 3000,           // Длительность показа toast-уведомлений
    AUTO_SAVE_INTERVAL_MS: 30000,      // Интервал автосохранения прогресса
    TYPING_SPEED_MS: 20,               // Скорость печати текста (мс на символ)
    
    // Интро и видео
    INTRO_COUNTDOWN_SEC: 5,             // Обратный отсчёт перед видео
    INTRO_TRANSITION_DELAY_MS: 500,     // Задержка перед запуском видео
    
    // Диалоги и ответы
    ANSWER_FEEDBACK_DELAY_MS: 1500,     // Задержка перед показом обратной связи
    NEXT_STEP_DELAY_MS: 1000,           // Задержка перед переходом к следующему шагу
    ANSWER_ANIMATION_MS: 150,           // Длительность анимации нажатия на ответ
    
    // Карта
    MAP_ZOOM_DURATION_MS: 300,          // Длительность анимации приближения карты
    MAP_CLICK_TIMEOUT_MS: 300,          // Таймаут между кликами по карте
    WRONG_MARKER_DISPLAY_MS: 3000,      // Время показа маркера ошибки
    
    // Викторина
    QUIZ_TRANSITION_MS: 2000,           // Задержка перед завершением викторины
    
    // Геология (игра Девелопер)
    GEOLOGY_BASIC_TIME_SEC: 5,          // Время базового геологического исследования
    GEOLOGY_DETAILED_TIME_SEC: 10,      // Время детального исследования
    GEOLOGY_PREMIUM_TIME_SEC: 15,       // Время максимального исследования
    
    // Строительство (игра Девелопер)
    BUILDING_ECONOM_TIME_SEC: 15,       // Время стройки эконом-класса
    BUILDING_STANDARD_TIME_SEC: 20,     // Время стройки стандарт-класса
    BUILDING_COMFORT_TIME_SEC: 25,      // Время стройки комфорт-класса
    BUILDING_BUSINESS_TIME_SEC: 30,     // Время стройки бизнес-класса
    ACCELERATE_COST: 50,                // Стоимость ускорения стройки в монетках
    ACCELERATE_TIME_REDUCTION_SEC: 5,   // На сколько секунд ускоряется стройка
    
    // PWA обновления
    UPDATE_CHECK_INTERVAL_MS: 3600000,  // Проверка обновлений (1 час)
    UPDATE_DELAY_MS: 1500,              // Задержка перед перезагрузкой при обновлении
    INSTALL_PROMPT_DELAY_MS: 10000,     // Задержка перед показом установки PWA
    INSTALL_BTN_DISPLAY_MS: 15000,      // Время показа кнопки установки
};

// ===== XP И УРОВНИ =====
const XP_CONFIG = {
    LEVEL_MULTIPLIER: 100,              // XP для перехода на следующий уровень
    CORRECT_ANSWER_BASE_XP: 10,         // XP за правильный ответ
    PERFECT_SCENARIO_BONUS_XP: 50,      // Бонус за идеальное прохождение
    SPEED_BONUS_XP_FAST: 25,            // Бонус за быстрый ответ (< 30 сек на вопрос)
    SPEED_BONUS_XP_NORMAL: 10,          // Бонус за средний ответ (30-60 сек)
    MAX_XP_PER_SCENARIO: 500,           // Максимум XP за один сценарий
};

// ===== НАСТРОЙКИ ВИКТОРИНЫ =====
const QUIZ_CONFIG = {
    // Таймер-квиз (гонка с таймером)
    TIMER_QUIZ_BASE_TIME_SEC: 15,       // Базовое время на вопрос
    TIMER_QUIZ_CORRECT_BONUS_SEC: 2,    // Бонусные секунды за правильный ответ
    TIMER_QUIZ_CORRECT_POINTS: 5,       // Очки за правильный ответ
    TIMER_QUIZ_WRONG_PENALTY: -3,       // Штраф за неправильный ответ
    TIMER_QUIZ_TIME_PENALTY: 0,         // Штраф при истечении времени (не используется)
    
    // Тройная экспертиза
    TRIPLE_MATCH_POINTS_PER_CORRECT: 10, // Очки за правильную характеристику
    TRIPLE_MATCH_POINTS_PER_WRONG: -5,   // Штраф за неправильную характеристику
    TRIPLE_MATCH_ATTRIBUTES_PER_JK: 3,   // Количество характеристик на один ЖК
};

// ===== НАСТРОЙКИ КАРТЫ =====
const MAP_CONFIG = {
    CENTER: [55.018, 82.92],            // Центр карты (Новосибирск)
    ZOOM: 12,                           // Начальный зум карты
    MARKER_ZOOM_LEVEL: 17,              // Зум при клике на маркер
    
    // Радиусы проверки для разных застройщиков (в метрах)
    RADIUS: {
        DEFAULT: 500,
        BRUSNIKA: 400,
        VIRA: 450,
        KPD_GAZSTROY: 600,
        COUNTRY_DEVELOPMENT: 400,
        ONECOMPANY: 350,
    },
    
    // Ограничения
    MAX_MARKERS_CACHE: 100,             // Максимум маркеров в кеше
    MAP_LOAD_TIMEOUT_MS: 10000,         // Таймаут загрузки Яндекс.Карт
};

// ===== НАСТРОЙКИ ИГРЫ "ДЕВЕЛОПЕР" =====
const DEVELOPER_CONFIG = {
    // Ресурсы для старта
    START_CAPITAL: 1000,                // Начальный капитал в монетках (💰)
    START_COINS: 0,                     // Начальные монетки (🪙)
    
    // Пороги для старта нового проекта
    MIN_CAPITAL_TO_START: 500,          // Минимальный капитал для старта
    MIN_COINS_TO_START: 400,            // Минимальные монетки для старта
    
    // Награды и штрафы
    PROJECT_COMPLETE_PROFIT_MIN: 500,   // Минимальная прибыль от проекта
    PROJECT_COMPLETE_PROFIT_MAX: 1000,  // Максимальная прибыль от проекта
    
    // Качество материалов и классов
    QUALITY_THRESHOLDS: {
        BUSINESS: 85,                   // Порог для бизнес-класса
        COMFORT: 70,                    // Порог для комфорт-класса
        STANDARD: 50,                   // Порог для стандарт-класса
    },
    
    // Цены геологических исследований
    GEOLOGY_PRICES: {
        BASIC: 0,                       // Бесплатно
        DETAILED: 100,                  // 100 монеток
        PREMIUM: 250,                   // 250 монеток
    },
    
    // Точность геологических исследований
    GEOLOGY_ACCURACY: {
        BASIC: 60,                      // 60%
        DETAILED: 85,                   // 85%
        PREMIUM: 98,                    // 98%
    },
    
    // Максимальная этажность
    GEOLOGY_MAX_FLOORS: {
        BASIC: 8,
        DETAILED: 12,
        PREMIUM: 16,
    },
    
    // Цены материалов
    MATERIALS_PRICES: {
        CHEAP_FOUNDATION: 0,
        MEDIUM_FOUNDATION: 150,
        PREMIUM_FOUNDATION: 300,
        CHEAP_WALLS: 0,
        MEDIUM_WALLS: 200,
        PREMIUM_WALLS: 400,
        CHEAP_FACADE: 0,
        MEDIUM_FACADE: 180,
        PREMIUM_FACADE: 350,
        CHEAP_ROOF: 0,
        MEDIUM_ROOF: 120,
        PREMIUM_ROOF: 280,
    },
    
    // Базовые цены на квартиры (₽ за м²)
    BASE_PRICE_PER_SQM: {
        ECONOM: 80000,
        STANDARD: 100000,
        COMFORT: 130000,
        BUSINESS: 180000,
    },
    
    // Аукцион
    AUCTION_MIN_BID_INCREMENT: 50,      // Минимальный шаг ставки
    AUCTION_BOT_RESPONSE_DELAY_MS: 800, // Задержка ответа бота
    AUCTION_BOT_START_DELAY_MS: 1000,   // Начальная задержка ботов
};

// ===== НАСТРОЙКИ ОФЛАЙН-ОЧЕРЕДИ =====
const OFFLINE_QUEUE_CONFIG = {
    STORAGE_KEY: 'offline_request_queue', // Ключ в localStorage
    MAX_RETRY_COUNT: 3,                  // Максимальное количество попыток
    RETRY_DELAY_MS: 5000,                // Задержка между попытками
    MAX_QUEUE_SIZE: 100,                 // Максимальный размер очереди
};

// ===== НАСТРОЙКИ АНАЛИТИКИ =====
const ANALYTICS_CONFIG = {
    // Таймауты и задержки
    SEND_TIMEOUT_MS: 5000,               // Таймаут отправки аналитики
    BATCH_INTERVAL_MS: 30000,            // Интервал пакетной отправки
    MAX_BATCH_SIZE: 20,                  // Максимум событий в одном пакете
    
    // В production отключаем детальное логирование
    DISABLE_IN_PRODUCTION: true,         // Отключаем в проде
};

// ===== НАСТРОЙКИ АВТОСОХРАНЕНИЯ =====
const AUTOSAVE_CONFIG = {
    ENABLED: true,                       // Включено ли автосохранение
    INTERVAL_MS: 30000,                  // Интервал автосохранения
    SAVE_ON_BEFORE_UNLOAD: true,         // Сохранять при закрытии страницы
    SAVE_ON_VISIBILITY_CHANGE: true,     // Сохранять при скрытии вкладки
};

// ===== НАСТРОЙКИ DRAG-AND-DROP =====
const DRAG_DROP_CONFIG = {
    MOBILE_LONG_PRESS_DELAY_MS: 100,     // Задержка для определения перетаскивания на мобильных
    CLONE_OPACITY: 0.8,                  // Прозрачность клона
    CLONE_ROTATION_DEG: 3,               // Поворот клона в градусах
};

// ===== НАСТРОЙКИ ПОИСКА (радиусы в метрах) =====
const SEARCH_CONFIG = {
    DEFAULT_RADIUS: 500,                 // Радиус поиска по умолчанию
    MAX_RESULTS: 50,                     // Максимум результатов поиска
};

// ===== НАСТРОЙКИ БЕЙДЖЕЙ =====
const BADGE_CONFIG = {
    TOAST_DURATION_MS: 4000,             // Длительность показа уведомления о бейдже
    TOAST_ANIMATION_MS: 500,             // Длительность анимации бейджа
};

// ===== НАСТРОЙКИ МОДАЛЬНЫХ ОКОН =====
const MODAL_CONFIG = {
    ANIMATION_DURATION_MS: 300,          // Длительность анимации
    BACKGROUND_OPACITY: 0.7,             // Прозрачность фона
};

// Экспорт в глобальную область
window.TIMERS = TIMERS;
window.XP_CONFIG = XP_CONFIG;
window.QUIZ_CONFIG = QUIZ_CONFIG;
window.MAP_CONFIG = MAP_CONFIG;
window.DEVELOPER_CONFIG = DEVELOPER_CONFIG;
window.OFFLINE_QUEUE_CONFIG = OFFLINE_QUEUE_CONFIG;
window.ANALYTICS_CONFIG = ANALYTICS_CONFIG;
window.AUTOSAVE_CONFIG = AUTOSAVE_CONFIG;
window.DRAG_DROP_CONFIG = DRAG_DROP_CONFIG;
window.SEARCH_CONFIG = SEARCH_CONFIG;
window.BADGE_CONFIG = BADGE_CONFIG;
window.MODAL_CONFIG = MODAL_CONFIG;
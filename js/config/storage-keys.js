// ============================================================
// ЦЕНТРАЛИЗОВАННЫЕ КЛЮЧИ ДЛЯ LOCALSTORAGE
// Версия: 1.1.0 — ДОБАВЛЕН ADMIN_KEY
// 
// Все ключи для localStorage хранятся в одном месте.
// Это позволяет легко изменять ключи и избегать дублирования.
// ============================================================

(function() {
    'use strict';

    /**
     * Ключи для хранения данных пользователя
     */
    const USER_KEYS = {
        /** Основные данные пользователя (имя, id и т.д.) */
        USER_DATA: 'realty_trainer_user',
        /** Текущее количество XP пользователя */
        XP: 'realty_trainer_xp',
        /** Данные о серии (стрике) */
        STREAK: 'realty_trainer_streak',
        /** Флаг завершения онбординга */
        ONBOARDING_COMPLETED: 'onboarding_tutorial_completed',
        /** Флаг пропуска онбординга */
        ONBOARDING_SKIPPED: 'onboarding_skipped',
        /** Ключ для режима администратора */
        ADMIN_KEY: 'realty_admin_key',
    };

    /**
     * Ключи для хранения прогресса по сценариям
     */
    const PROGRESS_KEYS = {
        /**
         * Базовый ключ для прогресса сценария
         * @param {string} scenarioId - ID сценария
         * @returns {string} ключ для localStorage
         */
        scenario: function(scenarioId) {
            return `scenario_progress_${scenarioId}`;
        },
        /**
         * Ключ для ответов на вопросы в сценарии
         * @param {string} scenarioId - ID сценария
         * @returns {string} ключ для localStorage
         */
        scenarioAnswers: function(scenarioId) {
            return `scenario_answers_${scenarioId}`;
        },
        /**
         * Ключ для прогресса на карте в сценарии
         * @param {string} scenarioId - ID сценария
         * @param {number} stepIndex - индекс шага
         * @returns {string} ключ для localStorage
         */
        scenarioMap: function(scenarioId, stepIndex) {
            return `scenario_map_${scenarioId}_step_${stepIndex}`;
        },
    };

    /**
     * Ключи для хранения данных согласия
     */
    const CONSENT_KEYS = {
        /** Флаг, дано ли согласие */
        GIVEN: 'user_consent_given',
        /** Время получения согласия */
        TIMESTAMP: 'consent_timestamp',
        /** Категории согласия */
        CATEGORIES: 'user_consent_categories',
        /** Отключение аналитики */
        ANALYTICS_ENABLED: 'analytics_enabled',
    };

    /**
     * Ключи для хранения данных аналитики
     */
    const ANALYTICS_KEYS = {
        /** ID сессии аналитики */
        SESSION_ID: 'analytics_session_id',
        /** Время начала сессии */
        SESSION_TIME: 'analytics_session_time',
        /** Очередь офлайн-запросов */
        OFFLINE_QUEUE: 'offline_request_queue',
    };

    /**
     * Ключи для хранения данных игры "Девелопер"
     */
    const DEVELOPER_KEYS = {
        /**
         * Состояние игры для пользователя
         * @param {string} playerName - имя игрока
         * @returns {string} ключ для localStorage
         */
        gameState: function(playerName) {
            return `developer_game_state_${playerName}`;
        },
        /** Флаг показа подсказки о старте */
        START_TIP_SHOWN: 'dev_start_tip_shown',
        /** Режим администратора */
        ADMIN_MODE: 'developer_admin_mode',
    };

    /**
     * Ключи для хранения данных бейджей
     */
    const BADGE_KEYS = {
        /** Список полученных бейджей */
        BADGES: 'realty_trainer_badges',
    };

    /**
     * Ключи для хранения данных PWA
     */
    const PWA_KEYS = {
        /** Флаг, что PWA установлен */
        INSTALLED: 'pwa-installed',
        /** Флаг, что установка была отклонена */
        DISMISSED: 'pwa-install-dismissed',
    };

    /**
     * Ключи для хранения рекордов игр
     */
    const GAME_KEYS = {
        /**
         * Рекорд в гонке с таймером
         * @param {string} title - название игры
         * @returns {string} ключ для localStorage
         */
        timerQuizRecord: function(title) {
            return `timer_quiz_record_${title.replace(/\s/g, '_')}`;
        },
    };

    /**
     * Устаревшие ключи (для очистки)
     */
    const DEPRECATED_KEYS = [
        // Ключи, которые больше не используются
        // Можно добавить сюда для очистки при инициализации
    ];

    // ===== ЭКСПОРТ =====

    window.STORAGE_KEYS = {
        USER: USER_KEYS,
        PROGRESS: PROGRESS_KEYS,
        CONSENT: CONSENT_KEYS,
        ANALYTICS: ANALYTICS_KEYS,
        DEVELOPER: DEVELOPER_KEYS,
        BADGE: BADGE_KEYS,
        PWA: PWA_KEYS,
        GAME: GAME_KEYS,
        DEPRECATED: DEPRECATED_KEYS,
    };

    console.log('[StorageKeys] Модуль загружен, версия: 1.1.0');

})();
/**
 * ============================================================
 * ЕДИНЫЙ ЗАГРУЗЧИК МОДУЛЕЙ
 * Версия: 1.0.3
 * 
 * Отвечает за:
 * - Загрузку общих зависимостей
 * - Управление порядком подключения
 * - Предотвращение дублирования
 * - Логирование процесса загрузки
 * ============================================================
 */

(function() {
    'use strict';

    // ===== КОНФИГУРАЦИЯ =====
    const CONFIG = {
        // Общие модули, которые нужны на всех страницах
        commonModules: [
            { src: 'js/utils/escape.js', required: true },
            { src: 'js/utils/toast.js', required: true },
            { src: 'js/utils/logger.js', required: true },
            { src: 'js/utils/ip-helper.js', required: true },
            { src: 'js/privacy/privacy-manager.js', required: true },
            { src: 'js/privacy/consent.js', required: true },
            { src: 'js/privacy/consent-banner.js', required: true }
        ],
        // Задержка между загрузкой модулей (мс)
        delayBetweenModules: 50,
        // Таймаут загрузки одного модуля (мс)
        moduleTimeout: 10000,
        // Включить детальное логирование
        debug: false
    };

    // ===== СОСТОЯНИЕ =====
    let isLoaded = false;
    let loadPromise = null;

    // ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====

    /**
     * Проверяет, загружен ли скрипт на странице
     * @param {string} src - путь к скрипту
     * @returns {boolean}
     */
    function isScriptLoaded(src) {
        const scripts = document.querySelectorAll('script');
        for (const script of scripts) {
            if (script.src && script.src.includes(src)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Загружает один скрипт с таймаутом
     * @param {string} src - путь к скрипту
     * @param {number} timeout - таймаут в мс
     * @returns {Promise}
     */
    function loadScript(src, timeout = CONFIG.moduleTimeout) {
        return new Promise((resolve, reject) => {
            // Проверяем, не загружен ли уже
            if (isScriptLoaded(src)) {
                if (CONFIG.debug) {
                    console.log('[AppLoader] Скрипт уже загружен: ' + src);
                }
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.async = false;
            script.defer = false;

            const timer = setTimeout(function() {
                script.onload = null;
                script.onerror = null;
                reject(new Error('Таймаут загрузки: ' + src));
            }, timeout);

            script.onload = function() {
                clearTimeout(timer);
                if (CONFIG.debug) {
                    console.log('[AppLoader] Загружен: ' + src);
                }
                resolve();
            };

            script.onerror = function() {
                clearTimeout(timer);
                reject(new Error('Ошибка загрузки: ' + src));
            };

            document.head.appendChild(script);
        });
    }

    /**
     * Загружает модули последовательно
     * @param {Array} modules - массив объектов {src, required}
     * @returns {Promise}
     */
    async function loadModules(modules) {
        const results = [];

        for (const module of modules) {
            try {
                await loadScript(module.src);
                results.push({ src: module.src, success: true });
            } catch (error) {
                if (module.required) {
                    // Критический модуль не загрузился — пробрасываем ошибку
                    throw new Error('Критический модуль не загружен: ' + module.src);
                } else {
                    // Опциональный модуль — просто логируем
                    console.warn('[AppLoader] Опциональный модуль не загружен: ' + module.src, error);
                    results.push({ src: module.src, success: false, error: error.message });
                }
            }

            // Небольшая задержка между загрузками для стабильности
            if (modules.indexOf(module) < modules.length - 1) {
                await new Promise(function(resolve) {
                    setTimeout(resolve, CONFIG.delayBetweenModules);
                });
            }
        }

        return results;
    }

    // ===== ПУБЛИЧНЫЙ API =====

    /**
     * Загружает все общие модули
     * @param {Object} options - опции загрузки
     * @param {boolean} options.debug - включить отладку
     * @param {Function} options.onProgress - колбэк прогресса (загружено, всего)
     * @param {Function} options.onComplete - колбэк завершения
     * @param {Function} options.onError - колбэк ошибки
     * @returns {Promise}
     */
    function loadCommonModules(options) {
        // Если уже загружено — возвращаем готовый промис
        if (isLoaded) {
            return Promise.resolve({ alreadyLoaded: true });
        }

        // Если уже идёт загрузка — возвращаем существующий промис
        if (loadPromise) {
            return loadPromise;
        }

        // Применяем опции
        if (options && options.debug !== undefined) {
            CONFIG.debug = options.debug;
        }

        var total = CONFIG.commonModules.length;
        var loaded = 0;

        // Создаём промис загрузки
        loadPromise = loadModules(CONFIG.commonModules)
            .then(function(results) {
                isLoaded = true;
                
                if (options && options.onComplete) {
                    options.onComplete(results);
                }

                var successCount = 0;
                for (var i = 0; i < results.length; i++) {
                    if (results[i].success) successCount++;
                }
                console.log('[AppLoader] Загружено ' + successCount + '/' + total + ' модулей');
                
                return {
                    success: true,
                    results: results,
                    loadedCount: successCount,
                    totalCount: total
                };
            })
            .catch(function(error) {
                // Сбрасываем состояние, чтобы можно было повторить попытку
                loadPromise = null;
                isLoaded = false;

                if (options && options.onError) {
                    options.onError(error);
                }

                console.error('[AppLoader] Ошибка загрузки:', error);
                throw error;
            });

        return loadPromise;
    }

    /**
     * Проверяет, загружены ли общие модули
     * @returns {boolean}
     */
    function isReady() {
        return isLoaded;
    }

    /**
     * Сбрасывает состояние загрузчика (для тестирования)
     */
    function reset() {
        isLoaded = false;
        loadPromise = null;
    }

    // ===== ЭКСПОРТ =====
    window.AppLoader = {
        load: loadCommonModules,
        isReady: isReady,
        reset: reset,
        version: '1.0.3'
    };

    // ===== АВТОЗАГРУЗКА =====
    // Если страница уже загружена — запускаем сразу
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        // Небольшая задержка, чтобы дать возможность странице инициализироваться
        setTimeout(function() {
            loadCommonModules({ debug: false }).catch(function() {
                // Ошибка уже обработана внутри
            });
        }, 100);
    }

    console.log('[AppLoader] Модуль загружен, версия 1.0.3');

})();
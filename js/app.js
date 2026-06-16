// ============================================================
// ГЛАВНЫЙ ФАЙЛ ПРИЛОЖЕНИЯ — ТОЧКА ВХОДА
// Версия: 3.0 (рефакторинг)
// ============================================================

(function() {
    'use strict';

    // Запускаем приложение после загрузки DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            if (typeof bootApp === 'function') {
                bootApp();
            }
        });
    } else {
        if (typeof bootApp === 'function') {
            bootApp();
        }
    }

    console.log('[App] Модуль загружен, версия: 3.0');

})();
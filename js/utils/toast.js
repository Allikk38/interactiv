// ===== ЕДИНАЯ ФУНКЦИЯ ДЛЯ ПОКАЗА УВЕДОМЛЕНИЙ =====
// ===== С ПОДДЕРЖКОЙ HAPTIC FEEDBACK (ВИБРАЦИЯ) =====
// Версия: 2.0.0 — ВЫНЕСЕНА ЛОГИКА ВИБРАЦИИ В ОТДЕЛЬНЫЙ СЕРВИС

let toastTimer = null;

// ===== ВИБРАЦИЯ (ВЫНЕСЕНО В ОТДЕЛЬНЫЙ СЕРВИС) =====

/**
 * Сервис для управления вибрацией на устройстве
 * @namespace VibrateService
 */
const VibrateService = {
    /**
     * Проверяет, поддерживается ли вибрация на устройстве
     * @returns {boolean}
     */
    isSupported: function() {
        return !!(window.navigator && window.navigator.vibrate);
    },

    /**
     * Вызывает вибрацию устройства (если поддерживается)
     * @param {string} type - тип вибрации: 'success', 'error', 'warning', 'light'
     * @returns {boolean} - была ли вибрация вызвана
     */
    vibrate: function(type) {
        // Проверяем поддержку
        if (!this.isSupported()) {
            return false;
        }
        
        // Проверяем, есть ли взаимодействие с пользователем
        // Если нет — браузер заблокирует, но мы всё равно пытаемся
        try {
            switch (type) {
                case 'success':
                    // Короткая двойная вибрация (успех)
                    window.navigator.vibrate([50, 30, 50]);
                    break;
                case 'error':
                    // Длинная прерывистая вибрация (ошибка)
                    window.navigator.vibrate([100, 50, 100, 50, 100]);
                    break;
                case 'warning':
                    // Двойная, чуть длиннее
                    window.navigator.vibrate([70, 40, 70]);
                    break;
                case 'light':
                default:
                    // Короткая одиночная вибрация
                    window.navigator.vibrate(30);
                    break;
            }
            return true;
        } catch (e) {
            // Игнорируем ошибки (например, если вибрация заблокирована)
            return false;
        }
    },

    /**
     * Вызывает вибрацию с типом, соответствующим типу уведомления
     * @param {string} toastType - тип уведомления: 'success', 'error', 'warning'
     * @returns {boolean}
     */
    vibrateForToast: function(toastType) {
        const typeMap = {
            'success': 'success',
            'error': 'error',
            'warning': 'warning'
        };
        const vibrationType = typeMap[toastType] || 'light';
        return this.vibrate(vibrationType);
    }
};

// Для обратной совместимости оставляем старую функцию
function vibrate(type) {
    return VibrateService.vibrate(type);
}

// ===== ПОКАЗ УВЕДОМЛЕНИЙ =====

/**
 * Показывает всплывающее уведомление с опциональной вибрацией
 * @param {string} icon - иконка (эмодзи)
 * @param {string} message - текст сообщения
 * @param {string} type - тип: 'success', 'error', 'warning'
 * @param {boolean} vibrateOnShow - вызывать ли вибрацию (по умолчанию true)
 */
function showToast(icon, message, type, vibrateOnShow = true) {
    const toast = document.getElementById('toast');
    const toastIcon = document.getElementById('toast-icon');
    const toastMessage = document.getElementById('toast-message');
    
    if (!toast) return;
    
    if (toastTimer) clearTimeout(toastTimer);
    
    // Вибрация (если включена)
    if (vibrateOnShow) {
        VibrateService.vibrateForToast(type || 'info');
    }
    
    toastIcon.textContent = icon;
    toastMessage.textContent = message;
    toast.className = `toast toast--${type} toast--show`;
    
    toastTimer = setTimeout(() => {
        toast.classList.remove('toast--show');
    }, 3000);
}

// Экспортируем функции в глобальную область
window.showToast = showToast;
window.vibrate = vibrate;
window.VibrateService = VibrateService;

console.log('[Toast] Модуль загружен, версия: 2.0.0');
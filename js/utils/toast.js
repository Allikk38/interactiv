// ===== ЕДИНАЯ ФУНКЦИЯ ДЛЯ ПОКАЗА УВЕДОМЛЕНИЙ =====
// ===== С ПОДДЕРЖКОЙ HAPTIC FEEDBACK (ВИБРАЦИЯ) =====

let toastTimer = null;

/**
 * Вызывает вибрацию устройства (если поддерживается)
 * @param {string} type - тип вибрации: 'success', 'error', 'warning', 'light'
 */
function vibrate(type = 'light') {
    // Проверяем поддержку вибрации и что это не десктоп (опционально)
    if (!window.navigator || !window.navigator.vibrate) return;
    
    // Дополнительная проверка: отключаем вибрацию на десктопах с сенсорными экранами?
    // Оставляем как есть — если устройство поддерживает, вибрирует.
    
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
}

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
    
    // Вибрация (если включена и тип соответствует)
    if (vibrateOnShow) {
        if (type === 'success') {
            vibrate('success');
        } else if (type === 'error') {
            vibrate('error');
        } else if (type === 'warning') {
            vibrate('warning');
        } else {
            vibrate('light');
        }
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
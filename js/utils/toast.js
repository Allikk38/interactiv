// ===== ЕДИНАЯ ФУНКЦИЯ ДЛЯ ПОКАЗА УВЕДОМЛЕНИЙ =====

let toastTimer = null;

/**
 * Показывает всплывающее уведомление
 * @param {string} icon - иконка (эмодзи)
 * @param {string} message - текст сообщения
 * @param {string} type - тип: 'success', 'error', 'warning'
 */
function showToast(icon, message, type) {
    const toast = document.getElementById('toast');
    const toastIcon = document.getElementById('toast-icon');
    const toastMessage = document.getElementById('toast-message');
    
    if (!toast) return;
    
    if (toastTimer) clearTimeout(toastTimer);
    
    toastIcon.textContent = icon;
    toastMessage.textContent = message;
    toast.className = `toast toast--${type} toast--show`;
    
    toastTimer = setTimeout(() => {
        toast.classList.remove('toast--show');
    }, 3000);
}

// window.showToast = showToast;  // УДАЛЕНО — функция и так глобальна

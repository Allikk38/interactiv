// ===== СИСТЕМА БЕЙДЖЕЙ (НАГРАД) =====
const Badges = {
    // ИСПРАВЛЕНО: используем централизованный ключ из STORAGE_KEYS
    STORAGE_KEY: (window.STORAGE_KEYS && STORAGE_KEYS.BADGE && STORAGE_KEYS.BADGE.BADGES) 
        ? STORAGE_KEYS.BADGE.BADGES 
        : 'realty_trainer_badges',

    // Загрузить все полученные бейджи
    getAll() {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || [];
        } catch {
            return [];
        }
    },

    // Проверить, есть ли бейдж
    has(badgeName) {
        return this.getAll().includes(badgeName);
    },

    // Выдать бейдж (если ещё нет)
    award(badgeName) {
        const badges = this.getAll();
        if (!badges.includes(badgeName)) {
            badges.push(badgeName);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(badges));
            return true; // новый бейдж
        }
        return false; // уже был
    },

    // Показать уведомление о новом бейдже
    showBadgeToast(badgeName) {
        const toast = document.createElement('div');
        toast.className = 'badge-toast';
        toast.innerHTML = `
            <span class="badge-toast__icon">🏅</span>
            <div class="badge-toast__content">
                <div class="badge-toast__title">Новый бейдж!</div>
                <div class="badge-toast__name">${badgeName}</div>
            </div>
        `;
        document.body.appendChild(toast);

        // Анимация появления
        requestAnimationFrame(() => toast.classList.add('badge-toast--show'));

        // Удаляем через 4 секунды
        setTimeout(() => {
            toast.classList.remove('badge-toast--show');
            setTimeout(() => toast.remove(), 500);
        }, 4000);
    },

    // Отрисовать бейджи на финишном экране
    renderOnFinish(containerSelector) {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        const badges = this.getAll();
        if (badges.length === 0) return;

        let html = '<div class="badges-collection"><h3>🏅 Ваши бейджи</h3><div class="badges-collection__list">';
        badges.forEach(badge => {
            html += `<span class="badges-collection__badge">${badge}</span>`;
        });
        html += '</div></div>';

        container.insertAdjacentHTML('beforeend', html);
    }
};
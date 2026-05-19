// ===== УПРАВЛЕНИЕ ВЫЕЗЖАЮЩЕЙ ПАНЕЛЬЮ =====
const Drawer = {
    drawer: null,
    overlay: null,
    isOpen: false,
    touchStartY: 0,
    isMobile: window.innerWidth <= 768,

    init() {
        this.drawer = document.getElementById('jk-drawer');
        this.overlay = document.getElementById('drawer-overlay');
        
        if (!this.drawer) return;
        
        this.bindEvents();
        this.checkDevice();
        
        // Слушаем изменение размера окна
        window.addEventListener('resize', () => {
            this.isMobile = window.innerWidth <= 768;
            this.checkDevice();
            
            // Закрываем панель при смене ориентации
            if (this.isOpen) {
                this.close();
            }
        });
    },

    bindEvents() {
        // Кнопка открытия
        const openBtn = document.getElementById('floating-list-btn');
        if (openBtn) {
            openBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggle();
            });
        }
        
        // Кнопка закрытия
        const closeBtn = document.getElementById('drawer-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }
        
        // Затемнение фона
        if (this.overlay) {
            this.overlay.addEventListener('click', () => this.close());
        }
        
        // Свайп для закрытия на мобильных
        if (this.isMobile) {
            this.initSwipeToClose();
        }
        
        // Escape для закрытия
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    },

    checkDevice() {
        if (!this.drawer) return;
        
        if (!this.isMobile) {
            // На десктопе панель может быть открыта по умолчанию
            // или сохранять состояние
            const savedState = localStorage.getItem('drawer_state');
            if (savedState === 'open' && !this.isOpen) {
                setTimeout(() => this.open(), 100);
            }
        }
    },

    toggle() {
        this.isOpen ? this.close() : this.open();
    },

    open() {
        this.drawer.classList.add('jk-drawer--open');
        if (this.overlay) {
            this.overlay.classList.add('drawer-overlay--visible');
        }
        this.isOpen = true;
        
        // Сохраняем состояние на десктопе
        if (!this.isMobile) {
            localStorage.setItem('drawer_state', 'open');
        }
        
        // Блокируем скролл body на мобильных
        if (this.isMobile) {
            document.body.style.overflow = 'hidden';
        }
        
        // Триггерим событие для других компонентов
        document.dispatchEvent(new CustomEvent('drawer:open'));
    },

    close() {
        this.drawer.classList.remove('jk-drawer--open');
        if (this.overlay) {
            this.overlay.classList.remove('drawer-overlay--visible');
        }
        this.isOpen = false;
        
        // Сохраняем состояние на десктопе
        if (!this.isMobile) {
            localStorage.setItem('drawer_state', 'closed');
        }
        
        // Возвращаем скролл body
        document.body.style.overflow = '';
        
        // Триггерим событие
        document.dispatchEvent(new CustomEvent('drawer:close'));
    },

    initSwipeToClose() {
        let startY = 0;
        let currentY = 0;
        
        this.drawer.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
        });
        
        this.drawer.addEventListener('touchmove', (e) => {
            if (!this.isOpen) return;
            
            currentY = e.touches[0].clientY;
            const deltaY = currentY - startY;
            
            // Только свайп вниз
            if (deltaY > 0) {
                const translateY = Math.min(deltaY, 200);
                const percent = (translateY / 200) * 100;
                this.drawer.style.transform = `translateY(${percent}%)`;
                e.preventDefault();
            }
        });
        
        this.drawer.addEventListener('touchend', (e) => {
            const deltaY = currentY - startY;
            
            // Возвращаем трансформацию
            this.drawer.style.transform = '';
            
            // Если свайп больше 100px — закрываем
            if (deltaY > 100) {
                this.close();
            }
        });
    }
};

// Инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    Drawer.init();
});
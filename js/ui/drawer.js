// ===== УПРАВЛЕНИЕ ПАНЕЛЬЮ (ДЕСКТОП: СТАТИЧНАЯ, МОБИЛЬНЫЕ: ВЫЕЗЖАЮЩАЯ) =====
const Drawer = {
    drawer: null,
    overlay: null,
    isOpen: false,
    isMobile: window.innerWidth <= 768,

    init() {
        this.drawer = document.getElementById('jk-drawer');
        this.overlay = document.getElementById('drawer-overlay');
        
        if (!this.drawer) return;
        
        this.bindEvents();
        this.checkDevice();
        
        window.addEventListener('resize', () => {
            const wasMobile = this.isMobile;
            this.isMobile = window.innerWidth <= 768;
            
            if (wasMobile !== this.isMobile) {
                // При смене устройства перезагружаем состояние
                if (!this.isMobile) {
                    // На десктопе панель всегда открыта
                    this.drawer.classList.add('jk-drawer--open');
                    this.isOpen = true;
                } else {
                    // На мобильных закрываем
                    this.close();
                }
            }
        });
    },

    bindEvents() {
        const openBtn = document.getElementById('floating-list-btn');
        if (openBtn) {
            openBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggle();
            });
        }
        
        const closeBtn = document.getElementById('drawer-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }
        
        if (this.overlay) {
            this.overlay.addEventListener('click', () => this.close());
        }
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen && this.isMobile) {
                this.close();
            }
        });
        
        // Свайп для закрытия на мобильных
        if (this.isMobile) {
            this.initSwipeToClose();
        }
    },

    checkDevice() {
        if (!this.isMobile) {
            // На десктопе панель всегда открыта
            this.drawer.classList.add('jk-drawer--open');
            this.isOpen = true;
        }
    },

    toggle() {
        if (!this.isMobile) return; // На десктопе не закрывается
        this.isOpen ? this.close() : this.open();
    },

    open() {
        if (!this.isMobile) return;
        this.drawer.classList.add('jk-drawer--open');
        if (this.overlay) {
            this.overlay.classList.add('drawer-overlay--visible');
        }
        this.isOpen = true;
        document.body.style.overflow = 'hidden';
    },

    close() {
        if (!this.isMobile) return;
        this.drawer.classList.remove('jk-drawer--open');
        if (this.overlay) {
            this.overlay.classList.remove('drawer-overlay--visible');
        }
        this.isOpen = false;
        document.body.style.overflow = '';
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
            
            if (deltaY > 0) {
                const translateY = Math.min(deltaY, 200);
                const percent = (translateY / 200) * 100;
                this.drawer.style.transform = `translateY(${percent}%)`;
                e.preventDefault();
            }
        });
        
        this.drawer.addEventListener('touchend', () => {
            const deltaY = currentY - startY;
            this.drawer.style.transform = '';
            
            if (deltaY > 100) {
                this.close();
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Drawer.init();
});

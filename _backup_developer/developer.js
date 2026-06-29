// ===== ИГРОВОЙ МОДУЛЬ "ДЕВЕЛОПЕР" (ФАСАД) =====

const DeveloperGame = {
    core: null,
    ui: null,
    stages: null,
    admin: null,
    
    containerId: 'developer-game-root',

    async init(containerId = 'developer-game-root') {
        console.log('[DeveloperGame] Инициализация...');
        this.containerId = containerId;
        
        // Получаем данные пользователя
        const user = User.get();
        if (!user || !user.name) {
            console.log('[DeveloperGame] Пользователь не авторизован, ждём...');
            setTimeout(() => this.init(containerId), 1000);
            return;
        }
        
        // Инициализируем ядро
        this.core = DeveloperCore;
        this.core.init(user.name);
        
        // Загружаем данные с сервера
        const result = await this.core.loadPlayerDataFromServer();
        console.log('[DeveloperGame] Данные с сервера:', result);
        
        // Инициализируем UI
        this.ui = DeveloperUI;
        this.ui.init(containerId, this.core, {
            onStartNewProject: () => this.startNewProject(),
            onContinueProject: () => this.continueProject()
        });
        
        // Инициализируем обработчики этапов
        this.stages = DeveloperStages;
        this.stages.init(this.core, this.ui, containerId);
        
        // Инициализируем админ-панель
        this.admin = DeveloperAdmin;
        this.admin.init(this.core, this.ui, this.stages);
        
        // Рендерим интерфейс
        this.ui.render();
        
        // Показываем приветствие
        this.ui.showWelcomeMessage(user.name, this.core.getCoins(), this.core.getCapital());
        
        // Автоматически показываем админ-панель если включен режим
        if (localStorage.getItem('developer_admin_mode') === 'true') {
            setTimeout(() => this.admin.showPanel(), 500);
        }
        
        // Проверяем, нужно ли показать подсказку о монетках
        this.checkAndShowCoinsTip();
    },
    
    checkAndShowCoinsTip() {
        // Если монеток достаточно для старта, но пользователь ещё не начинал
        if (this.core.getCoins() >= 400 && !this.core.hasActiveProject()) {
            const completedCount = this.core.getCompletedProjects().length;
            if (completedCount === 0) {
                // Не показываем подсказку, если она уже была показана
                if (!localStorage.getItem('dev_start_tip_shown')) {
                    localStorage.setItem('dev_start_tip_shown', 'true');
                    setTimeout(() => {
                        showToast('🚀', 'У вас достаточно монеток! Нажмите "НОВЫЙ ПРОЕКТ" чтобы начать строительство!', 'success');
                    }, 2000);
                }
            }
        }
    },
    
    // Публичные методы
    startNewProject() {
        this.stages.startNewProject();
    },
    
    continueProject() {
        this.stages.continueProject();
    },
    
    toggleAdminMode() {
        this.admin.toggleMode();
    },
    
    // Для обратной совместимости со старыми вызовами
    render() {
        this.ui.render();
    },
    
    updateResourcesDisplay() {
        this.ui.updateResourcesDisplay();
    },
    
    saveData() {
        this.core.saveData();
    },
    
    syncWithServer() {
        return this.core.syncWithServer();
    }
};

// Глобальный экспорт
window.DeveloperGame = DeveloperGame;

// Функция для включения админ-панели из консоли
window.toggleDeveloperAdmin = () => {
    if (window.DeveloperGame && window.DeveloperGame.toggleAdminMode) {
        window.DeveloperGame.toggleAdminMode();
    }
};

// Горячая клавиша Ctrl+Shift+A для вызова админ-панели
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        if (window.DeveloperGame && window.DeveloperGame.toggleAdminMode) {
            window.DeveloperGame.toggleAdminMode();
        }
    }
});
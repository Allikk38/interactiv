// ===== ЯДРО ИГРЫ "ДЕВЕЛОПЕР" (СОСТОЯНИЕ И ХРАНЕНИЕ) =====

const DeveloperCore = {
    state: {
        currentProject: null,
        completedProjects: [],
        capital: 1000,
        coins: 0,
        tutorialShown: false,
        playerName: null,
        totalXP: 0
    },

    // Инициализация
    init(playerName) {
        this.state.playerName = playerName;
        this.loadData();
        return this.state;
    },

    // Загрузка из localStorage
    loadData() {
        const key = `developer_game_state_${this.state.playerName}`;
        const saved = localStorage.getItem(key);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this.state = { ...this.state, ...parsed };
                console.log('[DeveloperCore] Локальные данные загружены');
            } catch(e) { 
                console.error('Ошибка загрузки игры', e);
            }
        }
    },

    // Сохранение в localStorage
    saveData() {
        const key = `developer_game_state_${this.state.playerName}`;
        localStorage.setItem(key, JSON.stringify(this.state));
    },

    // Синхронизация с сервером
    async syncWithServer(xpFromLessons = null) {
        try {
            const xp = xpFromLessons !== null ? xpFromLessons : this.getXPFromUser();
            
            const response = await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'sync_player_resources',
                    user_name: this.state.playerName,
                    xp: xp,
                    capital: this.state.capital,
                    project_completed: false
                })
            });
            
            const data = await response.json();
            if (data.success) {
                if (data.coins > this.state.coins) {
                    return { coinsEarned: data.coins - this.state.coins };
                }
                this.state.coins = data.coins;
                this.state.capital = data.capital;
                this.saveData();
            }
            return { success: true };
        } catch (error) {
            console.error('[DeveloperCore] Ошибка синхронизации:', error);
            return { success: false, error };
        }
    },

    getXPFromUser() {
        if (window.User) {
            const xpProgress = User.getXPProgress();
            return xpProgress.currentXP || 0;
        }
        return 0;
    },

    async loadPlayerDataFromServer() {
        try {
            const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getPlayerData&user_name=${encodeURIComponent(this.state.playerName)}`);
            const data = await response.json();
            
            if (data.success) {
                this.state.coins = data.coins || 0;
                this.state.capital = data.capital || 1000;
                this.state.totalXP = data.totalXP || 0;
                this.saveData();
                console.log('[DeveloperCore] Данные с сервера:', data);
                return { success: true, data };
            }
        } catch (error) {
            console.error('[DeveloperCore] Ошибка загрузки данных с сервера:', error);
        }
        return { success: false };
    },

    // Генерация названия проекта
    generateProjectName() {
        const prefixes = ['Солнечный', 'Лесной', 'Речной', 'Парковый', 'Центральный', 'Тихий', 'Зелёный', 'Светлый'];
        const suffixes = ['Квартал', 'Парк', 'Дом', 'Бульвар', 'Сады', 'Посёлок', 'Резиденция'];
        return `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
    },

    // Получение прогресса этапа
    getStageProgress(project) {
        const stages = ['auction', 'geology', 'shape', 'materials', 'building', 'selling'];
        const currentIndex = stages.indexOf(project.stage);
        return ((currentIndex + 1) / stages.length) * 100;
    },

    // Получение названия этапа
    getStageName(stage) {
        const names = {
            'auction': 'торгов',
            'geology': 'геологии',
            'shape': 'проектирования',
            'materials': 'выбора материалов',
            'building': 'строительства',
            'selling': 'продаж'
        };
        return names[stage] || stage;
    },

    // Завершение этапа
    completeStage(nextStage, onComplete) {
        if (!this.state.currentProject) return;
        
        if (nextStage === null) {
            this.finishProject(onComplete);
        } else {
            this.state.currentProject.stage = nextStage;
            this.saveData();
            if (onComplete) onComplete();
        }
    },

    // Завершение проекта
    finishProject(onComplete) {
        if (!this.state.currentProject) return;
        
        const profit = 500 + Math.floor(Math.random() * 500);
        this.state.capital += profit;
        this.state.currentProject.profit = profit;
        this.state.currentProject.class = profit >= 800 ? 'Бизнес' : (profit >= 600 ? 'Комфорт' : 'Стандарт');
        this.state.currentProject.completedAt = Date.now();
        
        this.state.completedProjects.unshift(this.state.currentProject);
        this.state.currentProject = null;
        
        this.saveData();
        this.syncWithServer();
        
        if (onComplete) onComplete(profit);
    },

    // Создание нового проекта после победы в торгах
    createProject(plot, plotPrice) {
        this.state.currentProject = {
            id: Date.now(),
            name: this.generateProjectName(),
            stage: 'geology',
            plot: plot,
            plotPrice: plotPrice,
            startTime: Date.now()
        };
        this.saveData();
        return this.state.currentProject;
    },

    // Обновление ресурсов
    addCoins(amount) {
        this.state.coins += amount;
        this.saveData();
    },

    addCapital(amount) {
        this.state.capital += amount;
        this.saveData();
    },

    spendCoins(amount) {
        if (this.state.coins >= amount) {
            this.state.coins -= amount;
            this.saveData();
            return true;
        }
        return false;
    },

    getCoins() {
        return this.state.coins;
    },

    getCapital() {
        return this.state.capital;
    },

    getCurrentProject() {
        return this.state.currentProject;
    },

    getCompletedProjects() {
        return [...this.state.completedProjects];
    },

    hasActiveProject() {
        return this.state.currentProject !== null;
    },

    canStartNewProject() {
        return this.state.capital >= 500 && this.state.coins >= 400 && !this.state.currentProject;
    },

    // Сброс прогресса
    resetProgress() {
        this.state.currentProject = null;
        this.state.completedProjects = [];
        this.state.capital = 1000;
        this.state.coins = 0;
        this.state.tutorialShown = false;
        this.saveData();
        this.syncWithServer();
    }
};

window.DeveloperCore = DeveloperCore;
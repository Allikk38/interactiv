// ===== ИГРОВОЙ МОДУЛЬ "ДЕВЕЛОПЕР" =====

const DeveloperGame = {
    state: {
        currentProject: null,
        completedProjects: [],
        capital: 1000,
        coins: 0,
        tutorialShown: false,
        playerName: null,
        totalXP: 0
    },

    containerId: 'developer-game-root',

    async init(containerId = 'developer-game-root') {
        console.log('[DeveloperGame] Инициализация...');
        this.containerId = containerId;
        
        // Получаем данные пользователя
        const user = User.get();
        if (user && user.name) {
            this.state.playerName = user.name;
            await this.loadPlayerDataFromServer();
        } else {
            console.log('[DeveloperGame] Пользователь не авторизован, ждём...');
            setTimeout(() => this.init(containerId), 1000);
            return;
        }
        
        this.loadData();
        this.render();
        this.attachEvents();
        
        if (!window.AuctionModule) {
            console.error('[DeveloperGame] AuctionModule не загружен!');
        }
        
        this.showWelcomeMessage();
        
        // Автоматически показываем админ-панель если включен режим
        if (localStorage.getItem('developer_admin_mode') === 'true') {
            setTimeout(() => this.showAdminPanel(), 500);
        }
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
                console.log('[DeveloperGame] Данные с сервера:', data);
            }
        } catch (error) {
            console.error('[DeveloperGame] Ошибка загрузки данных с сервера:', error);
        }
    },
    
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
                    this.showCoinsEarnedTip(data.coins - this.state.coins);
                }
                this.state.coins = data.coins;
                this.state.capital = data.capital;
                this.saveData();
                this.updateResourcesDisplay();
            }
        } catch (error) {
            console.error('[DeveloperGame] Ошибка синхронизации:', error);
        }
    },
    
    getXPFromUser() {
        if (window.User) {
            const xpProgress = User.getXPProgress();
            return xpProgress.currentXP || 0;
        }
        return 0;
    },

    loadData() {
        const key = `developer_game_state_${this.state.playerName}`;
        const saved = localStorage.getItem(key);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this.state = { ...this.state, ...parsed };
                console.log('[DeveloperGame] Локальные данные загружены');
            } catch(e) { 
                console.error('Ошибка загрузки игры', e);
            }
        }
    },

    saveData() {
        const key = `developer_game_state_${this.state.playerName}`;
        localStorage.setItem(key, JSON.stringify(this.state));
    },

    async syncCoins(coinsFromXP) {
        await this.syncWithServer(coinsFromXP);
        this.updateResourcesDisplay();
    },
    
    showCoinsEarnedTip(coinsEarned) {
        showToast('🪙', `Вы получили ${coinsEarned} монеток за прохождение уроков! Теперь можно начать проект!`, 'success');
        
        const startBtn = document.getElementById('start-new-project');
        if (startBtn) {
            startBtn.classList.add('btn-pulse');
            startBtn.disabled = false;
            setTimeout(() => startBtn.classList.remove('btn-pulse'), 5000);
        }
    },

    updateResourcesDisplay() {
        const coinsEl = document.getElementById('dev-coins');
        const capitalEl = document.getElementById('dev-capital');
        if (coinsEl) coinsEl.textContent = this.state.coins;
        if (capitalEl) capitalEl.textContent = this.state.capital;
    },

    showWelcomeMessage() {
        setTimeout(() => {
            const hasCoins = this.state.coins >= 400;
            const hasCapital = this.state.capital >= 500;
            
            let message = '';
            
            if (!hasCoins && !hasCapital) {
                message = `👋 ${this.state.playerName}, добро пожаловать!\n\n🪙 Монетки: ${this.state.coins} (нужно 400)\n💰 Капитал: ${this.state.capital} (нужно 500)\n\n📚 Пройдите уроки на главной странице, чтобы получить монетки!`;
            } else if (!hasCoins) {
                message = `🪙 ${this.state.playerName}, у вас ${this.state.coins} монеток (нужно 400).\n\n📚 Пройдите уроки на главной странице, чтобы получить монетки!`;
            } else if (!hasCapital) {
                message = `💰 ${this.state.playerName}, у вас ${this.state.capital} капитала (нужно 500).\n\n🏗️ Завершите текущий проект, чтобы получить капитал!`;
            } else {
                message = `🎉 ${this.state.playerName}, у вас есть всё для старта!\n\n🪙 Монеток: ${this.state.coins}\n💰 Капитала: ${this.state.capital}\n\n🏗️ Нажмите "НОВЫЙ ПРОЕКТ"!`;
            }
            
            if (!this.state.tutorialShown) {
                this.state.tutorialShown = true;
                this.saveData();
                showToast('🏗️', message, 'info');
            }
        }, 1000);
    },

    render() {
        const container = document.getElementById(this.containerId);
        if (!container) return;
        
        const hasCapital = this.state.capital >= 500;
        const hasCoins = this.state.coins >= 400;
        const canStart = hasCapital && hasCoins && !this.state.currentProject;
        
        let mainHintText = '';
        let mainHintIcon = '';
        
        if (this.state.currentProject) {
            mainHintIcon = '🏗️';
            mainHintText = `У вас есть активный проект! Нажмите "Продолжить строительство" чтобы продолжить с этапа ${this.getStageName(this.state.currentProject.stage)}`;
        } else if (!hasCoins) {
            mainHintIcon = '🪙';
            mainHintText = `Нужны монетки для покупки участка! Пройдите уроки на главной странице (10 XP = 1 🪙). Сейчас у вас: ${this.state.coins} 🪙, нужно 400 🪙`;
        } else if (!hasCapital) {
            mainHintIcon = '💰';
            mainHintText = `Не хватает капитала! Нужно 500 💰. Завершите текущий проект или продайте квартиры. Сейчас у вас: ${this.state.capital} 💰`;
        } else {
            mainHintIcon = '🚀';
            mainHintText = `Всё готово! Нажмите "НОВЫЙ ПРОЕКТ" чтобы начать строительство! 🏗️`;
        }
        
        container.innerHTML = `
            <div class="developer-game">
                <div class="main-hint main-hint--${!canStart && !this.state.currentProject ? 'warning' : 'info'}">
                    <div class="main-hint__icon">${mainHintIcon}</div>
                    <div class="main-hint__text">${mainHintText}</div>
                </div>
                
                <div class="developer-header">
                    <h2><i class="fas fa-hard-hat"></i> ${this.escapeHtml(this.state.playerName || 'Игрок')}</h2>
                    <div class="developer-resources">
                        <div class="resource-item resource-item--coins">
                            <i class="fas fa-coins"></i> 
                            <span id="dev-coins">${this.state.coins}</span> 
                            <span class="resource-label">монетки</span>
                            <div class="resource-hint">(нужно 400)</div>
                        </div>
                        <div class="resource-item resource-item--capital">
                            <i class="fas fa-chart-line"></i> 
                            <span id="dev-capital">${this.state.capital}</span> 
                            <span class="resource-label">капитал</span>
                            <div class="resource-hint">(нужно 500)</div>
                        </div>
                    </div>
                </div>
                
                <div class="developer-projects">
                    ${this.renderProjectsList()}
                </div>

                <div class="developer-actions">
                    <button id="start-new-project" class="btn btn--primary btn--large" ${!canStart ? 'disabled' : ''}>
                        <i class="fas fa-plus-circle"></i> 🚀 НОВЫЙ ПРОЕКТ
                    </button>
                    ${!canStart && !this.state.currentProject ? `
                        <div class="action-hint action-hint--detailed">
                            <strong>❓ Что делать?</strong><br>
                            ${!hasCoins ? '🪙 <strong>Нет монеток:</strong> Перейдите на главную страницу → пройдите уроки → получите монетки (10 XP = 1 🪙)' : ''}
                            ${!hasCapital && hasCoins ? '💰 <strong>Нет капитала:</strong> Завершите текущий проект через кнопку "Продолжить строительство"' : ''}
                            ${hasCoins && hasCapital ? '✅ <strong>Всё готово!</strong> Нажмите кнопку выше, чтобы начать!' : ''}
                        </div>
                    ` : ''}
                </div>
                
                <div class="developer-info">
                    <details open>
                        <summary><i class="fas fa-question-circle"></i> 📖 Как играть?</summary>
                        <div class="info-content">
                            <div class="step-list">
                                <div class="step-item">
                                    <span class="step-num">1</span>
                                    <div class="step-desc">
                                        <strong>Накопите монетки 🪙</strong>
                                        <span>Пройдите уроки на главной странице. 10 XP = 1 🪙. Нужно 400 🪙</span>
                                    </div>
                                </div>
                                <div class="step-item">
                                    <span class="step-num">2</span>
                                    <div class="step-desc">
                                        <strong>Начните проект 🚀</strong>
                                        <span>Нажмите "НОВЫЙ ПРОЕКТ"</span>
                                    </div>
                                </div>
                                <div class="step-item">
                                    <span class="step-num">3</span>
                                    <div class="step-desc">
                                        <strong>Выиграйте торги 🏢</strong>
                                        <span>Выберите участок и боритесь с ботами</span>
                                    </div>
                                </div>
                                <div class="step-item">
                                    <span class="step-num">4</span>
                                    <div class="step-desc">
                                        <strong>Стройте и продавайте 🏗️</strong>
                                        <span>Проектируйте, выбирайте материалы, продавайте квартиры</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </details>
                </div>
            </div>
        `;
        
        this.attachEvents();
    },
    
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

    renderProjectsList() {
        let html = '<div class="projects-grid">';
        
        if (this.state.currentProject) {
            const project = this.state.currentProject;
            const stageNames = {
                'auction': 'Торги за участок',
                'geology': 'Геология',
                'shape': 'Проектирование формы',
                'materials': 'Выбор материалов',
                'building': 'Строительство',
                'selling': 'Продажа квартир'
            };
            html += `
                <div class="project-card project-card--active">
                    <div class="project-card__status">🏗️ АКТИВНЫЙ ПРОЕКТ</div>
                    <h3>${this.escapeHtml(project.name)}</h3>
                    <div class="project-card__stage">
                        <i class="fas fa-chart-simple"></i> 
                        <span>${stageNames[project.stage] || project.stage}</span>
                    </div>
                    <div class="project-card__progress">
                        <div class="progress-bar-mini">
                            <div class="progress-bar-mini__fill" style="width: ${this.getStageProgress(project)}%"></div>
                        </div>
                    </div>
                    <button class="btn btn--primary continue-project-btn">
                        <i class="fas fa-play"></i> Продолжить →
                    </button>
                </div>
            `;
        }
        
        if (this.state.completedProjects.length > 0) {
            html += '<div class="projects-history"><h4><i class="fas fa-trophy"></i> Завершённые проекты</h4>';
            this.state.completedProjects.slice(-3).forEach(project => {
                html += `
                    <div class="project-card project-card--completed">
                        <h3>${this.escapeHtml(project.name)}</h3>
                        <div class="project-stats">
                            <span>💰 +${project.profit || 0}</span>
                            <span>🏆 ${project.class || '—'}</span>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        }
        
        html += '</div>';
        return html;
    },

    escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    },

    getStageProgress(project) {
        const stages = ['auction', 'geology', 'shape', 'materials', 'building', 'selling'];
        const currentIndex = stages.indexOf(project.stage);
        return ((currentIndex + 1) / stages.length) * 100;
    },

    attachEvents() {
        const startBtn = document.getElementById('start-new-project');
        if (startBtn) {
            const newStartBtn = startBtn.cloneNode(true);
            startBtn.parentNode.replaceChild(newStartBtn, startBtn);
            newStartBtn.onclick = (e) => {
                e.preventDefault();
                this.startNewProject();
            };
        }
        
        const container = document.getElementById(this.containerId);
        if (container) {
            container.addEventListener('click', (e) => {
                const continueBtn = e.target.closest('.continue-project-btn');
                if (continueBtn) {
                    e.preventDefault();
                    this.continueProject();
                }
            });
        }
    },

    startNewProject() {
        if (this.state.currentProject) {
            showToast('⚠️', 'У вас уже есть активный проект!', 'warning');
            return;
        }
        
        if (this.state.capital < 500) {
            showToast('💰', `Не хватает капитала! Нужно 500 💰. Сейчас: ${this.state.capital} 💰`, 'error');
            return;
        }
        
        if (this.state.coins < 400) {
            showToast('🪙', `Не хватает монеток! Нужно 400 🪙. Сейчас: ${this.state.coins} 🪙\n\nПройдите уроки на главной странице!`, 'warning');
            if (confirm('Перейти на главную страницу?')) {
                window.location.href = './';
            }
            return;
        }
        
        this.startAuctionStage();
    },
    
    generateProjectName() {
        const prefixes = ['Солнечный', 'Лесной', 'Речной', 'Парковый', 'Центральный'];
        const suffixes = ['Квартал', 'Парк', 'Дом', 'Бульвар', 'Сады'];
        return `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
    },
    
    continueProject() {
        if (!this.state.currentProject) {
            showToast('❓', 'Нет активного проекта. Нажмите "НОВЫЙ ПРОЕКТ"', 'info');
            return;
        }
        
        const stage = this.state.currentProject.stage;
        switch(stage) {
            case 'auction': this.startAuctionStage(); break;
            case 'geology': this.startGeologyStage(); break;
            case 'shape': this.startShapeStage(); break;
            case 'materials': this.startMaterialsStage(); break;
            case 'building': this.startBuildingStage(); break;
            case 'selling': this.startSellingStage(); break;
            default: this.startAuctionStage();
        }
    },
    
    startAuctionStage() {
        if (!window.AuctionModule) {
            showToast('❌', 'Ошибка загрузки игры. Обновите страницу.', 'error');
            return;
        }
        
        window.AuctionModule.start(
            null,
            this.state.coins,
            {
                containerId: this.containerId,
                onAuctionComplete: (result) => this.handleAuctionResult(result)
            }
        );
    },
    
    handleAuctionResult(result) {
        if (result.success) {
            this.state.coins -= result.price;
            
            this.state.currentProject = {
                id: Date.now(),
                name: this.generateProjectName(),
                stage: 'geology',
                plot: result.plot,
                plotPrice: result.price,
                startTime: Date.now()
            };
            
            this.saveData();
            this.syncWithServer();
            
            showToast('🎉', `Вы выиграли участок "${result.plot.name}" за ${result.price} 🪙!`, 'success');
            
            setTimeout(() => {
                this.render();
                this.startGeologyStage();
            }, 2000);
        } else {
            showToast('😞', 'Вы проиграли торги. Попробуйте снова!', 'error');
            this.render();
        }
    },
    
    startGeologyStage() { 
        showToast('🔬', 'Этап 2: Геология (в разработке)', 'info');
        this.completeStage('shape');
    },
    startShapeStage() { 
        showToast('✏️', 'Этап 3: Проектирование формы (в разработке)', 'info');
        this.completeStage('materials');
    },
    startMaterialsStage() { 
        showToast('🏗️', 'Этап 4: Выбор материалов (в разработке)', 'info');
        this.completeStage('building');
    },
    startBuildingStage() { 
        showToast('🚧', 'Этап 5: Строительство (в разработке)', 'info');
        this.completeStage('selling');
    },
    startSellingStage() { 
        showToast('💰', 'Этап 6: Продажа квартир (в разработке)', 'info');
        this.completeStage(null);
    },
    
    completeStage(nextStage) {
        if (!this.state.currentProject) return;
        
        if (nextStage === null) {
            this.finishProject();
        } else {
            this.state.currentProject.stage = nextStage;
            this.saveData();
            this.render();
        }
    },
    
    finishProject() {
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
        this.render();
        
        showToast('🎉', `Проект завершён! +${profit} 💰 капитала!`, 'success');
    },

    // ===== СКРЫТАЯ АДМИН-ПАНЕЛЬ ДЛЯ ТЕСТИРОВАНИЯ =====
    
    showAdminPanel() {
        // Проверяем, включён ли режим администратора
        const isAdmin = localStorage.getItem('developer_admin_mode') === 'true';
        if (!isAdmin) return;
        
        // Удаляем старую панель если есть
        const oldPanel = document.querySelector('.admin-panel');
        if (oldPanel) oldPanel.remove();
        
        const panel = document.createElement('div');
        panel.className = 'admin-panel';
        panel.innerHTML = `
            <div class="admin-panel__header">
                <strong>🛠️ АДМИН-ПАНЕЛЬ (тестирование)</strong>
                <button class="admin-panel__close">&times;</button>
            </div>
            <div class="admin-panel__content">
                <div class="admin-field">
                    <label>🪙 Монетки:</label>
                    <input type="number" id="admin-coins" value="${this.state.coins}" step="100">
                    <button id="admin-set-coins" class="btn btn--small">Установить</button>
                </div>
                <div class="admin-field">
                    <label>💰 Капитал:</label>
                    <input type="number" id="admin-capital" value="${this.state.capital}" step="500">
                    <button id="admin-set-capital" class="btn btn--small">Установить</button>
                </div>
                <div class="admin-field">
                    <label>🎯 Добавить 500 🪙</label>
                    <button id="admin-add-coins" class="btn btn--small btn--success">+500 🪙</button>
                </div>
                <div class="admin-field">
                    <label>💪 Добавить 1000 💰</label>
                    <button id="admin-add-capital" class="btn btn--small btn--success">+1000 💰</button>
                </div>
                <div class="admin-field">
                    <label>⚡ Добавить 10000 XP</label>
                    <button id="admin-add-xp" class="btn btn--small">+10000 XP</button>
                </div>
                <div class="admin-field">
                    <label>🗑️ Сбросить прогресс</label>
                    <button id="admin-reset" class="btn btn--small btn--danger">Сбросить всё</button>
                </div>
                <div class="admin-field">
                    <label>🚀 Завершить текущий этап</label>
                    <button id="admin-skip-stage" class="btn btn--small">Пропустить этап</button>
                </div>
                <div class="admin-field">
                    <label>🔄 Принудительная синхронизация</label>
                    <button id="admin-sync" class="btn btn--small">Синхронизировать</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(panel);
        
        // Обработчики
        document.getElementById('admin-set-coins')?.addEventListener('click', () => {
            const val = parseInt(document.getElementById('admin-coins').value);
            if (!isNaN(val)) {
                this.state.coins = val;
                this.saveData();
                this.syncWithServer();
                this.updateResourcesDisplay();
                showToast('🪙', `Монетки установлены: ${val}`, 'success');
                this.render();
            }
        });
        
        document.getElementById('admin-set-capital')?.addEventListener('click', () => {
            const val = parseInt(document.getElementById('admin-capital').value);
            if (!isNaN(val)) {
                this.state.capital = val;
                this.saveData();
                this.syncWithServer();
                this.updateResourcesDisplay();
                showToast('💰', `Капитал установлен: ${val}`, 'success');
                this.render();
            }
        });
        
        document.getElementById('admin-add-coins')?.addEventListener('click', () => {
            this.state.coins += 500;
            this.saveData();
            this.syncWithServer();
            this.updateResourcesDisplay();
            const input = document.getElementById('admin-coins');
            if (input) input.value = this.state.coins;
            showToast('🪙', `+500 монеток! Теперь: ${this.state.coins}`, 'success');
            this.render();
        });
        
        document.getElementById('admin-add-capital')?.addEventListener('click', () => {
            this.state.capital += 1000;
            this.saveData();
            this.syncWithServer();
            this.updateResourcesDisplay();
            const input = document.getElementById('admin-capital');
            if (input) input.value = this.state.capital;
            showToast('💰', `+1000 капитала! Теперь: ${this.state.capital}`, 'success');
            this.render();
        });
        
        document.getElementById('admin-add-xp')?.addEventListener('click', () => {
            if (window.User) {
                const currentXP = User.getXP() || 0;
                User.setXP(currentXP + 10000);
                this.syncWithServer(currentXP + 10000);
                showToast('⚡', `+10000 XP! Монетки обновятся после синхронизации`, 'success');
                setTimeout(() => {
                    this.syncWithServer();
                    this.render();
                }, 1000);
            } else {
                showToast('❌', 'User модуль не найден', 'error');
            }
        });
        
        document.getElementById('admin-reset')?.addEventListener('click', () => {
            if (confirm('ВНИМАНИЕ! Это удалит все ваши проекты и сбросит прогресс. Продолжить?')) {
                this.state.currentProject = null;
                this.state.completedProjects = [];
                this.state.capital = 1000;
                this.state.coins = 0;
                this.saveData();
                this.syncWithServer();
                this.render();
                showToast('🗑️', 'Прогресс сброшен!', 'warning');
            }
        });
        
        document.getElementById('admin-skip-stage')?.addEventListener('click', () => {
            if (this.state.currentProject) {
                const stages = ['auction', 'geology', 'shape', 'materials', 'building', 'selling'];
                const currentIndex = stages.indexOf(this.state.currentProject.stage);
                if (currentIndex < stages.length - 1) {
                    this.state.currentProject.stage = stages[currentIndex + 1];
                    this.saveData();
                    this.render();
                    showToast('⏩', `Переход на этап: ${stages[currentIndex + 1]}`, 'success');
                } else {
                    this.finishProject();
                }
            } else {
                showToast('❌', 'Нет активного проекта', 'error');
            }
        });
        
        document.getElementById('admin-sync')?.addEventListener('click', async () => {
            await this.syncWithServer();
            showToast('🔄', 'Синхронизация выполнена', 'success');
            this.render();
        });
        
        panel.querySelector('.admin-panel__close')?.addEventListener('click', () => {
            panel.remove();
        });
    },
    
    toggleAdminMode() {
        const isAdmin = localStorage.getItem('developer_admin_mode') === 'true';
        if (isAdmin) {
            localStorage.removeItem('developer_admin_mode');
            showToast('🔒', 'Режим администратора выключен', 'warning');
            document.querySelector('.admin-panel')?.remove();
        } else {
            localStorage.setItem('developer_admin_mode', 'true');
            showToast('🔓', 'Режим администратора включён. Панель откроется автоматически', 'success');
            setTimeout(() => this.showAdminPanel(), 500);
        }
    }
};

window.DeveloperGame = DeveloperGame;

// Добавляем глобальную функцию для включения админ-панели
window.toggleDeveloperAdmin = () => {
    if (window.DeveloperGame) {
        window.DeveloperGame.toggleAdminMode();
    }
};

// Добавляем горячую клавишу Ctrl+Shift+A для вызова админ-панели
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        if (window.DeveloperGame) {
            window.DeveloperGame.toggleAdminMode();
        }
    }
});
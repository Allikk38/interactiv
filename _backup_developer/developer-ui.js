// ===== UI КОМПОНЕНТЫ ИГРЫ "ДЕВЕЛОПЕР" =====

const DeveloperUI = {
    containerId: 'developer-game-root',
    core: null,
    onStartNewProject: null,
    onContinueProject: null,

    init(containerId, core, callbacks) {
        this.containerId = containerId;
        this.core = core;
        this.onStartNewProject = callbacks.onStartNewProject;
        this.onContinueProject = callbacks.onContinueProject;
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

    render() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        const state = this.core.state;
        const hasCapital = state.capital >= 500;
        const hasCoins = state.coins >= 400;
        const canStart = hasCapital && hasCoins && !state.currentProject;

        let mainHintText = '';
        let mainHintIcon = '';
        let mainHintType = 'info';

        if (state.currentProject) {
            mainHintIcon = '🏗️';
            mainHintText = `У вас есть активный проект! Нажмите "Продолжить строительство" чтобы продолжить с этапа ${this.core.getStageName(state.currentProject.stage)}`;
            mainHintType = 'info';
        } else if (!hasCoins) {
            mainHintIcon = '🪙';
            mainHintText = `Нужны монетки для покупки участка! Пройдите уроки на главной странице (10 XP = 1 🪙). Сейчас у вас: ${state.coins} 🪙, нужно 400 🪙`;
            mainHintType = 'warning';
        } else if (!hasCapital) {
            mainHintIcon = '💰';
            mainHintText = `Не хватает капитала! Нужно 500 💰. Завершите текущий проект или продайте квартиры. Сейчас у вас: ${state.capital} 💰`;
            mainHintType = 'warning';
        } else {
            mainHintIcon = '🚀';
            mainHintText = `Всё готово! Нажмите "НОВЫЙ ПРОЕКТ" чтобы начать строительство! 🏗️`;
            mainHintType = 'info';
        }

        container.innerHTML = `
            <div class="developer-game">
                <div class="main-hint main-hint--${mainHintType}">
                    <div class="main-hint__icon">${mainHintIcon}</div>
                    <div class="main-hint__text">${mainHintText}</div>
                </div>
                
                <div class="developer-header">
                    <h2><i class="fas fa-hard-hat"></i> ${this.escapeHtml(state.playerName || 'Игрок')}</h2>
                    <div class="developer-resources">
                        <div class="resource-item resource-item--coins">
                            <i class="fas fa-coins"></i> 
                            <span id="dev-coins">${state.coins}</span> 
                            <span class="resource-label">монетки</span>
                            <div class="resource-hint">(нужно 400)</div>
                        </div>
                        <div class="resource-item resource-item--capital">
                            <i class="fas fa-chart-line"></i> 
                            <span id="dev-capital">${state.capital}</span> 
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
                    ${!canStart && !state.currentProject ? `
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

    renderProjectsList() {
        const state = this.core.state;
        let html = '<div class="projects-grid">';
        
        if (state.currentProject) {
            const project = state.currentProject;
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
                            <div class="progress-bar-mini__fill" style="width: ${this.core.getStageProgress(project)}%"></div>
                        </div>
                    </div>
                    <button class="btn btn--primary continue-project-btn">
                        <i class="fas fa-play"></i> Продолжить →
                    </button>
                </div>
            `;
        }
        
        if (state.completedProjects.length > 0) {
            html += '<div class="projects-history"><h4><i class="fas fa-trophy"></i> Завершённые проекты</h4>';
            state.completedProjects.slice(-3).forEach(project => {
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

    updateResourcesDisplay() {
        const state = this.core.state;
        const coinsEl = document.getElementById('dev-coins');
        const capitalEl = document.getElementById('dev-capital');
        if (coinsEl) coinsEl.textContent = state.coins;
        if (capitalEl) capitalEl.textContent = state.capital;
    },

    attachEvents() {
        const startBtn = document.getElementById('start-new-project');
        if (startBtn) {
            const newStartBtn = startBtn.cloneNode(true);
            startBtn.parentNode.replaceChild(newStartBtn, startBtn);
            newStartBtn.onclick = (e) => {
                e.preventDefault();
                if (this.onStartNewProject) this.onStartNewProject();
            };
        }
        
        const container = document.getElementById(this.containerId);
        if (container) {
            container.addEventListener('click', (e) => {
                const continueBtn = e.target.closest('.continue-project-btn');
                if (continueBtn) {
                    e.preventDefault();
                    if (this.onContinueProject) this.onContinueProject();
                }
            });
        }
    },

    showWelcomeMessage(playerName, coins, capital) {
        setTimeout(() => {
            const hasCoins = coins >= 400;
            const hasCapital = capital >= 500;
            
            let message = '';
            
            if (!hasCoins && !hasCapital) {
                message = `👋 ${playerName}, добро пожаловать!\n\n🪙 Монетки: ${coins} (нужно 400)\n💰 Капитал: ${capital} (нужно 500)\n\n📚 Пройдите уроки на главной странице, чтобы получить монетки!`;
            } else if (!hasCoins) {
                message = `🪙 ${playerName}, у вас ${coins} монеток (нужно 400).\n\n📚 Пройдите уроки на главной странице, чтобы получить монетки!`;
            } else if (!hasCapital) {
                message = `💰 ${playerName}, у вас ${capital} капитала (нужно 500).\n\n🏗️ Завершите текущий проект, чтобы получить капитал!`;
            } else {
                message = `🎉 ${playerName}, у вас есть всё для старта!\n\n🪙 Монеток: ${coins}\n💰 Капитала: ${capital}\n\n🏗️ Нажмите "НОВЫЙ ПРОЕКТ"!`;
            }
            
            if (!this.core.state.tutorialShown) {
                this.core.state.tutorialShown = true;
                this.core.saveData();
                showToast('🏗️', message, 'info');
            }
        }, 1000);
    },

    showCoinsEarnedTip(coinsEarned) {
        showToast('🪙', `Вы получили ${coinsEarned} монеток за прохождение уроков! Теперь можно начать проект!`, 'success');
        
        const startBtn = document.getElementById('start-new-project');
        if (startBtn) {
            startBtn.classList.add('btn-pulse');
            startBtn.disabled = false;
            setTimeout(() => startBtn.classList.remove('btn-pulse'), 5000);
        }
    }
};

window.DeveloperUI = DeveloperUI;
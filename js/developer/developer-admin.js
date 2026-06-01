// ===== АДМИН-ПАНЕЛЬ ДЛЯ ТЕСТИРОВАНИЯ =====

const DeveloperAdmin = {
    core: null,
    ui: null,
    stages: null,

    init(core, ui, stages) {
        this.core = core;
        this.ui = ui;
        this.stages = stages;
    },

    showPanel() {
        const isAdmin = localStorage.getItem('developer_admin_mode') === 'true';
        if (!isAdmin) return;
        
        const oldPanel = document.querySelector('.admin-panel');
        if (oldPanel) oldPanel.remove();
        
        const state = this.core.state;
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
                    <input type="number" id="admin-coins" value="${state.coins}" step="100">
                    <button id="admin-set-coins" class="btn btn--small">Установить</button>
                </div>
                <div class="admin-field">
                    <label>💰 Капитал:</label>
                    <input type="number" id="admin-capital" value="${state.capital}" step="500">
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
        
        document.getElementById('admin-set-coins')?.addEventListener('click', () => {
            const val = parseInt(document.getElementById('admin-coins').value);
            if (!isNaN(val)) {
                this.core.state.coins = val;
                this.core.saveData();
                this.core.syncWithServer();
                this.ui.updateResourcesDisplay();
                showToast('🪙', `Монетки установлены: ${val}`, 'success');
                this.ui.render();
            }
        });
        
        document.getElementById('admin-set-capital')?.addEventListener('click', () => {
            const val = parseInt(document.getElementById('admin-capital').value);
            if (!isNaN(val)) {
                this.core.state.capital = val;
                this.core.saveData();
                this.core.syncWithServer();
                this.ui.updateResourcesDisplay();
                showToast('💰', `Капитал установлен: ${val}`, 'success');
                this.ui.render();
            }
        });
        
        document.getElementById('admin-add-coins')?.addEventListener('click', () => {
            this.core.state.coins += 500;
            this.core.saveData();
            this.core.syncWithServer();
            this.ui.updateResourcesDisplay();
            const input = document.getElementById('admin-coins');
            if (input) input.value = this.core.state.coins;
            showToast('🪙', `+500 монеток! Теперь: ${this.core.state.coins}`, 'success');
            this.ui.render();
        });
        
        document.getElementById('admin-add-capital')?.addEventListener('click', () => {
            this.core.state.capital += 1000;
            this.core.saveData();
            this.core.syncWithServer();
            this.ui.updateResourcesDisplay();
            const input = document.getElementById('admin-capital');
            if (input) input.value = this.core.state.capital;
            showToast('💰', `+1000 капитала! Теперь: ${this.core.state.capital}`, 'success');
            this.ui.render();
        });
        
        document.getElementById('admin-add-xp')?.addEventListener('click', () => {
            if (window.User) {
                const currentXP = User.getXP() || 0;
                User.setXP(currentXP + 10000);
                this.core.syncWithServer(currentXP + 10000);
                showToast('⚡', `+10000 XP! Монетки обновятся после синхронизации`, 'success');
                setTimeout(() => {
                    this.core.syncWithServer();
                    this.ui.render();
                }, 1000);
            } else {
                showToast('❌', 'User модуль не найден', 'error');
            }
        });
        
        document.getElementById('admin-reset')?.addEventListener('click', () => {
            if (confirm('ВНИМАНИЕ! Это удалит все ваши проекты и сбросит прогресс. Продолжить?')) {
                this.core.resetProgress();
                this.ui.render();
                showToast('🗑️', 'Прогресс сброшен!', 'warning');
            }
        });
        
        document.getElementById('admin-skip-stage')?.addEventListener('click', () => {
            if (this.core.state.currentProject) {
                const stages = ['auction', 'geology', 'shape', 'materials', 'building', 'selling'];
                const currentIndex = stages.indexOf(this.core.state.currentProject.stage);
                if (currentIndex < stages.length - 1) {
                    this.core.state.currentProject.stage = stages[currentIndex + 1];
                    this.core.saveData();
                    this.ui.render();
                    showToast('⏩', `Переход на этап: ${stages[currentIndex + 1]}`, 'success');
                } else {
                    this.core.finishProject((profit) => {
                        this.ui.render();
                        showToast('🎉', `Проект завершён! +${profit} 💰`, 'success');
                    });
                }
            } else {
                showToast('❌', 'Нет активного проекта', 'error');
            }
        });
        
        document.getElementById('admin-sync')?.addEventListener('click', async () => {
            await this.core.syncWithServer();
            showToast('🔄', 'Синхронизация выполнена', 'success');
            this.ui.render();
        });
        
        panel.querySelector('.admin-panel__close')?.addEventListener('click', () => {
            panel.remove();
        });
    },

    toggleMode() {
        const isAdmin = localStorage.getItem('developer_admin_mode') === 'true';
        if (isAdmin) {
            localStorage.removeItem('developer_admin_mode');
            showToast('🔒', 'Режим администратора выключен', 'warning');
            document.querySelector('.admin-panel')?.remove();
        } else {
            localStorage.setItem('developer_admin_mode', 'true');
            showToast('🔓', 'Режим администратора включён. Панель откроется автоматически', 'success');
            setTimeout(() => this.showPanel(), 500);
        }
    }
};

window.DeveloperAdmin = DeveloperAdmin;
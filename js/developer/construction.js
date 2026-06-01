// js/developer/construction.js
// Модуль строительства с таймером

const ConstructionModule = {
    // Конфигурация времени строительства (в секундах) для разных типов домов
    buildTimes: {
        'Эконом': 15,
        'Стандарт': 20,
        'Комфорт': 25,
        'Бизнес': 30
    },
    
    // Состояние
    timer: null,
    timeLeft: 0,
    totalTime: 0,
    isActive: false,
    isPaused: false,
    onComplete: null,
    container: null,
    
    init(containerId, buildingClass, onCompleteCallback) {
        this.container = document.getElementById(containerId);
        this.onComplete = onCompleteCallback;
        this.totalTime = this.buildTimes[buildingClass] || 20;
        this.timeLeft = this.totalTime;
        this.isActive = false;
        this.isPaused = false;
        
        this.render();
        this.attachEvents();
    },
    
    render() {
        if (!this.container) return;
        
        const progressPercent = ((this.totalTime - this.timeLeft) / this.totalTime) * 100;
        
        this.container.innerHTML = `
            <div class="construction-container">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h2><i class="fas fa-hard-hat"></i> Строительство</h2>
                    <p>Идёт возведение дома</p>
                </div>
                
                <div class="construction-visual" style="
                    background: linear-gradient(135deg, #2c3e50, #1a252f);
                    border-radius: var(--radius);
                    padding: 40px;
                    text-align: center;
                    margin-bottom: 30px;
                ">
                    <div class="construction-crane" style="font-size: 4rem; margin-bottom: 20px;">
                        🏗️ 🚧 🏢
                    </div>
                    <div class="construction-progress" style="margin: 20px 0;">
                        <div style="background: var(--color-border); border-radius: 12px; height: 20px; overflow: hidden;">
                            <div id="construction-progress-fill" style="
                                width: ${progressPercent}%;
                                height: 100%;
                                background: linear-gradient(90deg, var(--color-primary), var(--color-success));
                                transition: width 0.3s ease;
                                border-radius: 12px;
                            "></div>
                        </div>
                    </div>
                    <div class="construction-timer" style="font-size: 2rem; font-weight: 700; color: var(--color-warning);">
                        <span id="construction-time">${this.formatTime(this.timeLeft)}</span>
                    </div>
                    <div class="construction-status" style="margin-top: 10px; color: var(--color-text-light);">
                        ${this.isActive ? '🏗️ Строительство идёт...' : (this.isPaused ? '⏸️ Пауза' : '⚡ Готов к запуску')}
                    </div>
                </div>
                
                <div class="construction-controls" style="display: flex; gap: 16px; justify-content: center; margin-bottom: 30px;">
                    <button id="construction-start-btn" class="btn btn--primary" ${this.isActive ? 'disabled' : ''}>
                        <i class="fas fa-play"></i> ${this.isPaused ? 'Продолжить' : 'Начать стройку'}
                    </button>
                    <button id="construction-pause-btn" class="btn btn--secondary" ${!this.isActive ? 'disabled' : ''}>
                        <i class="fas fa-pause"></i> Пауза
                    </button>
                    <button id="construction-accelerate-btn" class="btn btn--warning" ${!this.isActive ? 'disabled' : ''}>
                        <i class="fas fa-bolt"></i> Ускорить (-50 🪙)
                    </button>
                </div>
                
                <div class="construction-info" style="
                    background: var(--color-bg);
                    border-radius: var(--radius-sm);
                    padding: 16px;
                    font-size: 0.85rem;
                    color: var(--color-text-light);
                ">
                    <p><i class="fas fa-info-circle"></i> <strong>Как это работает:</strong></p>
                    <ul style="margin-left: 20px; margin-top: 8px;">
                        <li>Строительство занимает ${this.totalTime} секунд</li>
                        <li>Кнопка "Ускорить" сокращает время на 5 секунд за 50 🪙</li>
                        <li>Можно поставить на паузу и продолжить позже</li>
                    </ul>
                </div>
                
                <div class="construction-actions" style="margin-top: 20px; text-align: center;">
                    <button class="btn btn--secondary" id="construction-cancel-btn">
                        <i class="fas fa-times"></i> Отменить стройку
                    </button>
                </div>
            </div>
        `;
    },
    
    attachEvents() {
        const startBtn = document.getElementById('construction-start-btn');
        const pauseBtn = document.getElementById('construction-pause-btn');
        const accelerateBtn = document.getElementById('construction-accelerate-btn');
        const cancelBtn = document.getElementById('construction-cancel-btn');
        
        if (startBtn) {
            startBtn.onclick = () => this.start();
        }
        
        if (pauseBtn) {
            pauseBtn.onclick = () => this.pause();
        }
        
        if (accelerateBtn) {
            accelerateBtn.onclick = () => this.accelerate();
        }
        
        if (cancelBtn) {
            cancelBtn.onclick = () => {
                if (confirm('Отменить строительство? Прогресс будет потерян.')) {
                    this.stop();
                    if (this.onComplete) {
                        this.onComplete({ cancelled: true });
                    }
                }
            };
        }
    },
    
    start() {
        if (this.isActive) return;
        
        this.isActive = true;
        this.isPaused = false;
        
        this.updateStatusDisplay('🏗️ Строительство идёт...');
        this.updateButtonsState();
        
        this.timer = setInterval(() => {
            if (!this.isActive || this.isPaused) return;
            
            this.timeLeft--;
            this.updateProgress();
            
            if (this.timeLeft <= 0) {
                this.finish();
            }
        }, 1000);
    },
    
    pause() {
        if (!this.isActive || this.isPaused) return;
        
        this.isPaused = true;
        this.updateStatusDisplay('⏸️ На паузе');
        this.updateButtonsState();
    },
    
    accelerate(coinsAvailable = 0) {
        if (!this.isActive || this.isPaused) return;
        
        const accelerateTime = 5;
        const accelerateCost = 50;
        
        if (coinsAvailable < accelerateCost) {
            showToast('🪙', `Не хватает монеток! Нужно ${accelerateCost} 🪙`, 'error');
            return;
        }
        
        this.timeLeft = Math.max(0, this.timeLeft - accelerateTime);
        this.updateProgress();
        
        showToast('⚡', `Строительство ускорено на ${accelerateTime} сек! -${accelerateCost} 🪙`, 'success');
        
        if (this.timeLeft <= 0) {
            this.finish();
        }
        
        // Возвращаем стоимость ускорения, чтобы списать монетки
        if (this.onAccelerate) {
            this.onAccelerate(accelerateCost);
        }
    },
    
    finish() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        
        this.isActive = false;
        
        showToast('✅', 'Строительство завершено!', 'success');
        
        if (this.onComplete) {
            this.onComplete({ 
                success: true, 
                totalTime: this.totalTime,
                timeSpent: this.totalTime - this.timeLeft
            });
        }
    },
    
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.isActive = false;
        this.isPaused = false;
    },
    
    updateProgress() {
        const progressPercent = ((this.totalTime - this.timeLeft) / this.totalTime) * 100;
        const fillEl = document.getElementById('construction-progress-fill');
        const timeEl = document.getElementById('construction-time');
        
        if (fillEl) fillEl.style.width = `${progressPercent}%`;
        if (timeEl) timeEl.textContent = this.formatTime(this.timeLeft);
    },
    
    updateStatusDisplay(message) {
        const statusEl = document.querySelector('.construction-status');
        if (statusEl) statusEl.textContent = message;
    },
    
    updateButtonsState() {
        const startBtn = document.getElementById('construction-start-btn');
        const pauseBtn = document.getElementById('construction-pause-btn');
        const accelerateBtn = document.getElementById('construction-accelerate-btn');
        
        if (startBtn) startBtn.disabled = this.isActive && !this.isPaused;
        if (pauseBtn) pauseBtn.disabled = !this.isActive || this.isPaused;
        if (accelerateBtn) accelerateBtn.disabled = !this.isActive || this.isPaused;
    },
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (mins > 0) {
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        }
        return `${secs} сек`;
    }
};

window.ConstructionModule = ConstructionModule;
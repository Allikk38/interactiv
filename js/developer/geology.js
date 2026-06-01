// ===== МОДУЛЬ ГЕОЛОГИИ =====

const GeologyModule = {
    researchTypes: {
        basic: {
            name: 'Базовое исследование',
            price: 0,
            time: 5,
            accuracy: 60,
            maxFloors: 8,
            description: 'Стандартное исследование грунта'
        },
        detailed: {
            name: 'Детальное исследование',
            price: 100,
            time: 10,
            accuracy: 85,
            maxFloors: 12,
            description: 'Бурение скважин, анализ проб'
        },
        premium: {
            name: 'Максимальное исследование',
            price: 250,
            time: 15,
            accuracy: 98,
            maxFloors: 16,
            description: 'Полный комплекс геологических изысканий'
        }
    },

    selectedType: null,
    onCompleteCallback: null,

    init(containerId, callback) {
        this.onCompleteCallback = callback;
        this.selectedType = null;
        this.render(containerId);
    },

    render(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        let typesHtml = '';
        for (const [key, type] of Object.entries(this.researchTypes)) {
            const isSelected = this.selectedType?.key === key;
            typesHtml += `
                <div class="geology-option" data-type="${key}" style="
                    background: ${isSelected ? 'var(--color-primary)' : 'var(--color-surface)'};
                    color: ${isSelected ? 'white' : 'var(--color-text)'};
                    border: 2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'};
                    border-radius: var(--radius);
                    padding: 20px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    flex: 1;
                    min-width: 200px;
                ">
                    <div style="font-size: 1.2rem; font-weight: 700; margin-bottom: 8px;">${type.name}</div>
                    <div style="font-size: 0.8rem; margin-bottom: 12px;">${type.description}</div>
                    <div style="font-size: 0.75rem;">
                        <div>💰 Стоимость: ${type.price === 0 ? 'Бесплатно' : type.price + ' 🪙'}</div>
                        <div>⏱️ Время: ${type.time} сек</div>
                        <div>📊 Точность: ${type.accuracy}%</div>
                        <div>🏗️ Макс. этажей: ${type.maxFloors}</div>
                    </div>
                </div>
            `;
        }

        container.innerHTML = `
            <div class="geology-container" style="padding: 20px;">
                <div style="margin-bottom: 20px; text-align: center;">
                    <h2><i class="fas fa-globe"></i> Геологические исследования</h2>
                    <p>Выберите тип исследования участка</p>
                </div>
                
                <div style="display: flex; gap: 20px; flex-wrap: wrap; justify-content: center; margin-bottom: 30px;">
                    ${typesHtml}
                </div>
                
                <div class="geology-actions" style="display: flex; gap: 16px; justify-content: center;">
                    <button id="geology-confirm-btn" class="btn btn--primary" ${!this.selectedType ? 'disabled' : ''}>
                        <i class="fas fa-check"></i> Начать исследование
                    </button>
                </div>
            </div>
        `;

        this.attachEvents();
    },

    attachEvents() {
        document.querySelectorAll('.geology-option').forEach(opt => {
            opt.onclick = () => {
                const typeKey = opt.dataset.type;
                this.selectedType = {
                    key: typeKey,
                    ...this.researchTypes[typeKey]
                };
                
                document.querySelectorAll('.geology-option').forEach(o => {
                    o.style.background = 'var(--color-surface)';
                    o.style.color = 'var(--color-text)';
                    o.style.borderColor = 'var(--color-border)';
                });
                opt.style.background = 'var(--color-primary)';
                opt.style.color = 'white';
                opt.style.borderColor = 'var(--color-primary)';
                
                const confirmBtn = document.getElementById('geology-confirm-btn');
                if (confirmBtn) confirmBtn.disabled = false;
            };
        });

        const confirmBtn = document.getElementById('geology-confirm-btn');
        if (confirmBtn) {
            confirmBtn.onclick = () => this.startResearch();
        }
    },

    startResearch() {
        if (!this.selectedType) return;

        // Показываем процесс исследования
        const container = document.getElementById('geology-root');
        if (!container) return;

        let timeLeft = this.selectedType.time;
        
        container.innerHTML = `
            <div class="geology-research" style="padding: 20px; text-align: center;">
                <h2><i class="fas fa-microscope"></i> Проводится исследование...</h2>
                <p>Тип: <strong>${this.selectedType.name}</strong></p>
                <div style="margin: 30px 0;">
                    <div style="background: var(--color-border); border-radius: 12px; height: 20px; overflow: hidden; max-width: 400px; margin: 0 auto;">
                        <div id="geology-progress" style="width: 0%; height: 100%; background: linear-gradient(90deg, var(--color-primary), var(--color-success)); transition: width 0.3s ease;"></div>
                    </div>
                    <div style="margin-top: 10px;">
                        <span id="geology-timer">${timeLeft}</span> секунд осталось
                    </div>
                </div>
                <div class="geology-result" id="geology-result" style="display: none;"></div>
            </div>
        `;

        const progressEl = document.getElementById('geology-progress');
        const timerEl = document.getElementById('geology-timer');
        
        const interval = setInterval(() => {
            timeLeft--;
            if (timerEl) timerEl.textContent = timeLeft;
            if (progressEl) progressEl.style.width = `${((this.selectedType.time - timeLeft) / this.selectedType.time) * 100}%`;
            
            if (timeLeft <= 0) {
                clearInterval(interval);
                this.finishResearch(container);
            }
        }, 1000);
    },

    finishResearch(container) {
        // Генерируем случайный результат на основе точности
        const randomFactor = Math.random() * (100 - this.selectedType.accuracy);
        const finalAccuracy = Math.max(50, Math.min(100, this.selectedType.accuracy + (Math.random() * 20 - 10)));
        
        const result = {
            success: true,
            accuracy: Math.round(finalAccuracy),
            maxFloors: this.selectedType.maxFloors,
            soilType: this.getSoilType(),
            recommendations: this.getRecommendations(finalAccuracy)
        };
        
        const resultDiv = document.getElementById('geology-result');
        if (resultDiv) {
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = `
                <div style="background: ${result.accuracy >= 80 ? 'var(--color-success)' : (result.accuracy >= 60 ? 'var(--color-warning)' : 'var(--color-danger)')}; 
                            color: white; 
                            border-radius: var(--radius); 
                            padding: 20px; 
                            margin-top: 20px;">
                    <h3>✅ Исследование завершено!</h3>
                    <p>Точность: ${result.accuracy}%</p>
                    <p>Тип грунта: ${result.soilType}</p>
                    <p>Максимальная этажность: ${result.maxFloors}</p>
                    <p>${result.recommendations}</p>
                </div>
                <button id="geology-next-btn" class="btn btn--primary" style="margin-top: 20px;">
                    <i class="fas fa-arrow-right"></i> Продолжить
                </button>
            `;
            
            const nextBtn = document.getElementById('geology-next-btn');
            if (nextBtn) {
                nextBtn.onclick = () => {
                    if (this.onCompleteCallback) {
                        this.onCompleteCallback(result);
                    }
                };
            }
        }
    },

    getSoilType() {
        const types = ['Песчаный', 'Глинистый', 'Скальный', 'Суглинистый', 'Торфяной'];
        return types[Math.floor(Math.random() * types.length)];
    },

    getRecommendations(accuracy) {
        if (accuracy >= 80) {
            return '✅ Грунт надёжный. Можно строить без ограничений.';
        } else if (accuracy >= 60) {
            return '⚠️ Требуется дополнительное укрепление фундамента.';
        } else {
            return '❌ Рекомендуется провести повторное исследование или выбрать другой участок.';
        }
    }
};

window.GeologyModule = GeologyModule;
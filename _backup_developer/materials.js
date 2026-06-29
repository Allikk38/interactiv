// ===== МОДУЛЬ ВЫБОРА МАТЕРИАЛОВ =====

const MaterialsSelection = {
    categories: {
        foundation: {
            name: 'Фундамент',
            icon: '🏗️',
            options: [
                { id: 'cheap', name: 'Ленточный', price: 0, quality: 40 },
                { id: 'medium', name: 'Плитный', price: 150, quality: 70 },
                { id: 'premium', name: 'Свайный', price: 300, quality: 95 }
            ]
        },
        walls: {
            name: 'Стены',
            icon: '🧱',
            options: [
                { id: 'cheap', name: 'Панель', price: 0, quality: 35 },
                { id: 'medium', name: 'Кирпич', price: 200, quality: 75 },
                { id: 'premium', name: 'Монолит', price: 400, quality: 95 }
            ]
        },
        facade: {
            name: 'Фасад',
            icon: '🏢',
            options: [
                { id: 'cheap', name: 'Штукатурка', price: 0, quality: 30 },
                { id: 'medium', name: 'Вентфасад', price: 180, quality: 70 },
                { id: 'premium', name: 'Кирпич', price: 350, quality: 90 }
            ]
        },
        roof: {
            name: 'Кровля',
            icon: '🏠',
            options: [
                { id: 'cheap', name: 'Шифер', price: 0, quality: 35 },
                { id: 'medium', name: 'Металлочерепица', price: 120, quality: 70 },
                { id: 'premium', name: 'Мягкая кровля', price: 280, quality: 90 }
            ]
        }
    },

    selectedOptions: {
        foundation: null,
        walls: null,
        facade: null,
        roof: null
    },

    onCompleteCallback: null,

    init(containerId, callback) {
        this.onCompleteCallback = callback;
        this.selectedOptions = {
            foundation: null,
            walls: null,
            facade: null,
            roof: null
        };
        this.render(containerId);
    },

    render(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        let html = `
            <div class="materials-container" style="padding: 20px;">
                <div style="margin-bottom: 20px; text-align: center;">
                    <h3>🏗️ Выберите материалы для строительства</h3>
                    <p>Качество материалов влияет на итоговый класс жилья</p>
                </div>
        `;

        for (const [key, category] of Object.entries(this.categories)) {
            const selectedId = this.selectedOptions[key]?.id;
            
            html += `
                <div class="material-category" style="
                    background: var(--color-surface);
                    border-radius: var(--radius);
                    padding: 16px;
                    margin-bottom: 20px;
                    border: 1px solid var(--color-border);
                ">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                        <span style="font-size: 1.5rem;">${category.icon}</span>
                        <h3 style="margin: 0;">${category.name}</h3>
                    </div>
                    <div style="display: flex; gap: 12px; flex-wrap: wrap;">
            `;
            
            for (const opt of category.options) {
                const isSelected = selectedId === opt.id;
                const priceText = opt.price === 0 ? 'Бесплатно' : `-${opt.price} 🪙`;
                
                html += `
                    <div class="material-option" data-category="${key}" data-opt-id="${opt.id}" data-price="${opt.price}" data-quality="${opt.quality}" style="
                        background: ${isSelected ? 'var(--color-primary)' : 'var(--color-bg)'};
                        color: ${isSelected ? 'white' : 'var(--color-text)'};
                        border: 2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'};
                        border-radius: var(--radius-sm);
                        padding: 12px 16px;
                        cursor: pointer;
                        flex: 1;
                        min-width: 120px;
                        text-align: center;
                        transition: all 0.2s ease;
                    ">
                        <div style="font-weight: 600;">${opt.name}</div>
                        <div style="font-size: 0.75rem; margin-top: 5px;">${priceText}</div>
                        <div style="font-size: 0.7rem; margin-top: 3px;">⭐ Качество: +${opt.quality}%</div>
                    </div>
                `;
            }
            
            html += `
                    </div>
                </div>
            `;
        }

        const totalPrice = this.calculateTotalPrice();
        const avgQuality = this.calculateAvgQuality();
        const allSelected = this.isAllSelected();

        html += `
                <div class="materials-summary" style="
                    background: var(--color-bg);
                    border-radius: var(--radius);
                    padding: 16px;
                    margin: 20px 0;
                    text-align: center;
                ">
                    <div><strong>💰 Стоимость материалов:</strong> <span id="materials-total-price" style="color: var(--color-warning); font-size: 1.2rem;">${totalPrice}</span> 🪙</div>
                    <div style="margin-top: 8px;"><strong>⭐ Среднее качество:</strong> <span id="materials-avg-quality">${avgQuality}</span>%</div>
                </div>
                
                <div class="materials-actions" style="display: flex; gap: 16px; justify-content: center;">
                    <button id="materials-reset-btn" class="btn btn--secondary">
                        <i class="fas fa-undo"></i> Сбросить
                    </button>
                    <button id="materials-confirm-btn" class="btn btn--primary" ${!allSelected ? 'disabled' : ''}>
                        <i class="fas fa-check"></i> Подтвердить выбор
                    </button>
                </div>
            </div>
        `;

        container.innerHTML = html;
        this.attachEvents();
    },

    attachEvents() {
        document.querySelectorAll('.material-option').forEach(opt => {
            opt.removeEventListener('click', this._handleOptionClick);
            this._handleOptionClick = (e) => {
                const category = opt.dataset.category;
                const optId = opt.dataset.optId;
                const price = parseInt(opt.dataset.price);
                const quality = parseInt(opt.dataset.quality);
                
                const selectedOption = this.categories[category].options.find(o => o.id === optId);
                this.selectedOptions[category] = selectedOption;
                
                // Обновляем рендер
                const container = opt.closest('#materials-root');
                if (container) {
                    this.render(container.id);
                }
            };
            opt.addEventListener('click', this._handleOptionClick);
        });
        
        const resetBtn = document.getElementById('materials-reset-btn');
        if (resetBtn) {
            resetBtn.onclick = () => {
                this.selectedOptions = {
                    foundation: null,
                    walls: null,
                    facade: null,
                    roof: null
                };
                const container = document.getElementById('materials-root');
                if (container) this.render('materials-root');
            };
        }
        
        const confirmBtn = document.getElementById('materials-confirm-btn');
        if (confirmBtn) {
            confirmBtn.onclick = () => {
                if (this.isAllSelected() && this.onCompleteCallback) {
                    const result = this.calculateResult();
                    this.onCompleteCallback(result);
                }
            };
        }
    },

    calculateTotalPrice() {
        let total = 0;
        for (const [key, option] of Object.entries(this.selectedOptions)) {
            if (option && option.price) total += option.price;
        }
        return total;
    },

    calculateAvgQuality() {
        let totalQuality = 0;
        let count = 0;
        for (const [key, option] of Object.entries(this.selectedOptions)) {
            if (option && option.quality) {
                totalQuality += option.quality;
                count++;
            }
        }
        return count > 0 ? Math.round(totalQuality / count) : 0;
    },

    calculateResult() {
        const totalPrice = this.calculateTotalPrice();
        const avgQuality = this.calculateAvgQuality();
        
        let classType = 'Стандарт';
        if (avgQuality >= 85) classType = 'Бизнес';
        else if (avgQuality >= 70) classType = 'Комфорт';
        else if (avgQuality >= 50) classType = 'Стандарт';
        else classType = 'Эконом';
        
        return {
            totalPrice: totalPrice,
            avgQuality: avgQuality,
            classType: classType,
            selectedOptions: this.selectedOptions
        };
    },

    isAllSelected() {
        return this.selectedOptions.foundation !== null &&
               this.selectedOptions.walls !== null &&
               this.selectedOptions.facade !== null &&
               this.selectedOptions.roof !== null;
    }
};

window.MaterialsSelection = MaterialsSelection;
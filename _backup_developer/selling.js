// ===== МОДУЛЬ ПРОДАЖИ КВАРТИР =====

const SellingModule = {
    apartments: [],
    totalApartments: 0,
    soldApartments: 0,
    totalRevenue: 0,
    selectedPrice: null,
    onCompleteCallback: null,

    init(containerId, buildingClass, totalUnits, callback) {
        this.onCompleteCallback = callback;
        this.totalApartments = totalUnits;
        this.soldApartments = 0;
        this.totalRevenue = 0;
        this.apartments = this.generateApartments(buildingClass, totalUnits);
        this.render(containerId, buildingClass);
    },

    generateApartments(buildingClass, count) {
        const basePrice = this.getBasePrice(buildingClass);
        const apartments = [];
        
        for (let i = 1; i <= count; i++) {
            // Генерируем квартиры с разными параметрами
            const floor = Math.floor(Math.random() * 10) + 1;
            const area = Math.floor(Math.random() * 60) + 30; // 30-90 м²
            const priceMultiplier = 0.8 + (Math.random() * 0.8); // 0.8 - 1.6
            const recommendedPrice = Math.round(basePrice * area * priceMultiplier);
            
            apartments.push({
                id: i,
                number: i,
                floor: floor,
                area: area,
                recommendedPrice: recommendedPrice,
                status: 'available', // available, sold
                soldPrice: null
            });
        }
        
        return apartments;
    },

    getBasePrice(buildingClass) {
        const prices = {
            'Эконом': 80000,
            'Стандарт': 100000,
            'Комфорт': 130000,
            'Бизнес': 180000
        };
        return prices[buildingClass] || 100000;
    },

    render(containerId, buildingClass) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const soldCount = this.apartments.filter(a => a.status === 'sold').length;
        const progressPercent = (soldCount / this.totalApartments) * 100;
        const availableCount = this.totalApartments - soldCount;

        let apartmentsHtml = '';
        for (const apt of this.apartments) {
            const isSold = apt.status === 'sold';
            apartmentsHtml += `
                <div class="selling-apartment" data-id="${apt.id}" style="
                    background: ${isSold ? 'var(--color-success)' : 'var(--color-surface)'};
                    border: 2px solid ${isSold ? 'var(--color-success)' : 'var(--color-border)'};
                    border-radius: var(--radius-sm);
                    padding: 12px;
                    cursor: ${isSold ? 'default' : 'pointer'};
                    opacity: ${isSold ? 0.7 : 1};
                    transition: all 0.2s ease;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>Кв. ${apt.number}</strong>
                            <div style="font-size: 0.75rem; color: var(--color-text-light);">
                                ${apt.floor} этаж · ${apt.area} м²
                            </div>
                        </div>
                        <div style="text-align: right;">
                            ${isSold 
                                ? `<span style="color: white;">✅ Продана<br>${apt.soldPrice.toLocaleString()} ₽</span>`
                                : `<span style="color: var(--color-primary); font-weight: 700;">${apt.recommendedPrice.toLocaleString()} ₽</span>`
                            }
                        </div>
                    </div>
                </div>
            `;
        }

        container.innerHTML = `
            <div class="selling-container" style="padding: 20px;">
                <div style="margin-bottom: 20px; text-align: center;">
                    <h2><i class="fas fa-chart-line"></i> Продажа квартир</h2>
                    <p>Класс жилья: <strong>${buildingClass}</strong> · Всего квартир: ${this.totalApartments}</p>
                </div>
                
                <div class="selling-progress" style="
                    background: var(--color-border);
                    border-radius: 12px;
                    height: 20px;
                    margin-bottom: 20px;
                    overflow: hidden;
                ">
                    <div class="selling-progress-fill" style="
                        width: ${progressPercent}%;
                        height: 100%;
                        background: linear-gradient(90deg, var(--color-primary), var(--color-success));
                        transition: width 0.3s ease;
                    "></div>
                </div>
                
                <div class="selling-stats" style="
                    display: flex;
                    justify-content: space-between;
                    gap: 16px;
                    margin-bottom: 24px;
                    flex-wrap: wrap;
                ">
                    <div class="selling-stat" style="
                        background: var(--color-surface);
                        border-radius: var(--radius);
                        padding: 12px 20px;
                        flex: 1;
                        text-align: center;
                    ">
                        <div style="font-size: 0.7rem; color: var(--color-text-light);">ПРОДАНО</div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-success);">${soldCount}/${this.totalApartments}</div>
                    </div>
                    <div class="selling-stat" style="
                        background: var(--color-surface);
                        border-radius: var(--radius);
                        padding: 12px 20px;
                        flex: 1;
                        text-align: center;
                    ">
                        <div style="font-size: 0.7rem; color: var(--color-text-light);">ВЫРУЧКА</div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-warning);">${this.totalRevenue.toLocaleString()} ₽</div>
                    </div>
                    <div class="selling-stat" style="
                        background: var(--color-surface);
                        border-radius: var(--radius);
                        padding: 12px 20px;
                        flex: 1;
                        text-align: center;
                    ">
                        <div style="font-size: 0.7rem; color: var(--color-text-light);">ОСТАЛОСЬ</div>
                        <div style="font-size: 1.5rem; font-weight: 700;">${availableCount}</div>
                    </div>
                </div>
                
                <div class="selling-apartments-grid" style="
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 12px;
                    margin-bottom: 24px;
                    max-height: 400px;
                    overflow-y: auto;
                    padding: 4px;
                ">
                    ${apartmentsHtml}
                </div>
                
                <div class="selling-actions" style="display: flex; gap: 16px; justify-content: center;">
                    <button id="selling-finish-btn" class="btn btn--primary" ${soldCount < this.totalApartments ? 'disabled' : ''}>
                        <i class="fas fa-flag-checkered"></i> Завершить проект
                    </button>
                </div>
            </div>
        `;

        this.attachEvents();
    },

    attachEvents() {
        document.querySelectorAll('.selling-apartment[data-id]').forEach(el => {
            const aptId = parseInt(el.dataset.id);
            const apt = this.apartments.find(a => a.id === aptId);
            
            if (apt && apt.status === 'available') {
                el.onclick = () => this.showPriceDialog(apt);
            }
        });

        const finishBtn = document.getElementById('selling-finish-btn');
        if (finishBtn) {
            finishBtn.onclick = () => {
                if (this.onCompleteCallback) {
                    this.onCompleteCallback({
                        success: true,
                        totalRevenue: this.totalRevenue,
                        soldCount: this.soldApartments,
                        totalApartments: this.totalApartments
                    });
                }
            };
        }
    },

    showPriceDialog(apartment) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;
        
        const recommendedFormatted = apartment.recommendedPrice.toLocaleString();
        
        modal.innerHTML = `
            <div style="
                background: var(--color-surface);
                border-radius: var(--radius);
                padding: 24px;
                max-width: 400px;
                width: 90%;
            ">
                <h3 style="margin-bottom: 16px;">💰 Продажа квартиры №${apartment.number}</h3>
                <p style="margin-bottom: 12px;">Площадь: ${apartment.area} м² · ${apartment.floor} этаж</p>
                <p style="margin-bottom: 12px;">Рекомендованная цена: <strong>${recommendedFormatted} ₽</strong></p>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px;">Ваша цена (₽):</label>
                    <input type="number" id="price-input" value="${apartment.recommendedPrice}" style="
                        width: 100%;
                        padding: 10px;
                        border: 2px solid var(--color-border);
                        border-radius: var(--radius-sm);
                        font-size: 1rem;
                    ">
                </div>
                
                <div style="display: flex; gap: 12px;">
                    <button id="cancel-sale" class="btn btn--secondary" style="flex: 1;">Отмена</button>
                    <button id="confirm-sale" class="btn btn--primary" style="flex: 1;">Продать</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const priceInput = modal.querySelector('#price-input');
        const confirmBtn = modal.querySelector('#confirm-sale');
        const cancelBtn = modal.querySelector('#cancel-sale');
        
        const closeModal = () => modal.remove();
        
        confirmBtn.onclick = () => {
            const price = parseInt(priceInput.value);
            if (isNaN(price) || price <= 0) {
                showToast('❌', 'Введите корректную цену', 'error');
                return;
            }
            
            // Продажа
            apartment.status = 'sold';
            apartment.soldPrice = price;
            this.soldApartments++;
            this.totalRevenue += price;
            
            closeModal();
            this.render('selling-root', this.getBuildingClass());
            
            showToast('✅', `Квартира №${apartment.number} продана за ${price.toLocaleString()} ₽!`, 'success');
        };
        
        cancelBtn.onclick = closeModal;
        modal.onclick = (e) => { if (e.target === modal) closeModal(); };
    },

    getBuildingClass() {
        // Этот метод будет переопределён из stages
        return this.buildingClass || 'Стандарт';
    },

    setBuildingClass(className) {
        this.buildingClass = className;
    }
};

window.SellingModule = SellingModule;
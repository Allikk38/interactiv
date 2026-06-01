// ===== ОБРАБОТЧИКИ ЭТАПОВ ИГРЫ "ДЕВЕЛОПЕР" =====

const DeveloperStages = {
    core: null,
    ui: null,
    containerId: 'developer-game-root',

    init(core, ui, containerId) {
        this.core = core;
        this.ui = ui;
        this.containerId = containerId;
        
        // ПРИВЯЗКА МЕТОДОВ
        this.startAuctionStage = this.startAuctionStage.bind(this);
        this.handleAuctionResult = this.handleAuctionResult.bind(this);
        this.startGeologyStage = this.startGeologyStage.bind(this);
        this.startShapeStage = this.startShapeStage.bind(this);
        this.startMaterialsStage = this.startMaterialsStage.bind(this);
        this.startBuildingStage = this.startBuildingStage.bind(this);
        this.startSellingStage = this.startSellingStage.bind(this);
        this.completeCurrentStage = this.completeCurrentStage.bind(this);
        this.startNewProject = this.startNewProject.bind(this);
        this.continueProject = this.continueProject.bind(this);
    },

    // Торги
    startAuctionStage() {
        if (!window.AuctionModule) {
            showToast('❌', 'Ошибка загрузки игры. Обновите страницу.', 'error');
            return;
        }
        
        window.AuctionModule.start(
            null,
            this.core.getCoins(),
            {
                containerId: this.containerId,
                onAuctionComplete: (result) => this.handleAuctionResult(result)
            }
        );
    },

    handleAuctionResult(result) {
        if (result.success) {
            this.core.spendCoins(result.price);
            
            const project = this.core.createProject(result.plot, result.price);
            this.core.syncWithServer();
            
            showToast('🎉', `Вы выиграли участок "${result.plot.name}" за ${result.price} 🪙!`, 'success');
            
            setTimeout(() => {
                this.ui.render();
                this.startGeologyStage();
            }, 2000);
        } else {
            showToast('😞', 'Вы проиграли торги. Попробуйте снова!', 'error');
            this.ui.render();
        }
    },

    // Геология
    startGeologyStage() {
        const container = document.getElementById(this.containerId);
        if (!container) return;
        
        const project = this.core.getCurrentProject();
        if (!project) {
            showToast('❌', 'Нет активного проекта', 'error');
            return;
        }
        
        container.innerHTML = `
            <div class="developer-game">
                <div class="developer-header">
                    <h2><i class="fas fa-globe"></i> Геология</h2>
                    <div class="developer-resources">
                        <div class="resource-item">
                            <i class="fas fa-coins"></i> ${this.core.getCoins()} 🪙
                        </div>
                        <div class="resource-item">
                            <i class="fas fa-chart-line"></i> ${this.core.getCapital()} 💰
                        </div>
                    </div>
                </div>
                <div id="geology-root"></div>
            </div>
        `;
        
        if (window.GeologyModule) {
            window.GeologyModule.init('geology-root', (result) => {
                const selectedType = window.GeologyModule.selectedType;
                if (selectedType && selectedType.price > 0) {
                    if (!this.core.spendCoins(selectedType.price)) {
                        showToast('❌', `Не хватает монеток для исследования`, 'error');
                        return;
                    }
                    showToast('🪙', `Списано ${selectedType.price} 🪙 за геологию`, 'info');
                }
                
                project.geologyData = result;
                this.core.saveData();
                
                showToast('✅', `Геология завершена! Макс. этажей: ${result.maxFloors}`, 'success');
                
                setTimeout(() => {
                    this.completeCurrentStage('shape');
                }, 1500);
            });
        } else {
            console.error('GeologyModule не загружен');
            container.innerHTML += `<div class="error-message">Ошибка: модуль геологии не загружен</div>`;
        }
    },

    // Проектирование формы
    startShapeStage() {
        const container = document.getElementById(this.containerId);
        if (!container) return;
        
        const project = this.core.getCurrentProject();
        if (!project) {
            showToast('❌', 'Нет активного проекта', 'error');
            return;
        }
        
        container.innerHTML = `
            <div class="developer-game">
                <div class="developer-header">
                    <h2><i class="fas fa-draw-polygon"></i> Проектирование формы</h2>
                    <div class="developer-resources">
                        <div class="resource-item">
                            <i class="fas fa-coins"></i> ${this.core.getCoins()} 🪙
                        </div>
                        <div class="resource-item">
                            <i class="fas fa-chart-line"></i> ${this.core.getCapital()} 💰
                        </div>
                    </div>
                </div>
                <div id="shape-drawing-root"></div>
                <div class="developer-actions" style="margin-top: 20px;">
                    <button class="btn btn--secondary" id="shape-cancel-btn">
                        <i class="fas fa-times"></i> Отменить
                    </button>
                </div>
            </div>
        `;
        
        if (window.ShapeDrawing) {
            window.ShapeDrawing.init('shape-drawing-root', (shapeData) => {
                project.shapeData = shapeData;
                this.core.saveData();
                
                showToast('✅', `Форма сохранена! Тип: ${shapeData.shapeType}`, 'success');
                
                setTimeout(() => {
                    this.completeCurrentStage('materials');
                }, 1500);
            });
        } else {
            console.error('ShapeDrawing не загружен');
            container.innerHTML += `<div class="error-message">Ошибка: модуль рисования не загружен</div>`;
        }
        
        const cancelBtn = document.getElementById('shape-cancel-btn');
        if (cancelBtn) {
            cancelBtn.onclick = () => {
                if (confirm('Вернуться на главную?')) {
                    this.ui.render();
                }
            };
        }
    },

    // Выбор материалов
    startMaterialsStage() {
        const container = document.getElementById(this.containerId);
        if (!container) return;
        
        const project = this.core.getCurrentProject();
        if (!project) {
            showToast('❌', 'Нет активного проекта', 'error');
            return;
        }
        
        container.innerHTML = `
            <div class="developer-game">
                <div class="developer-header">
                    <h2><i class="fas fa-boxes"></i> Выбор материалов</h2>
                    <div class="developer-resources">
                        <div class="resource-item">
                            <i class="fas fa-coins"></i> ${this.core.getCoins()} 🪙
                        </div>
                        <div class="resource-item">
                            <i class="fas fa-chart-line"></i> ${this.core.getCapital()} 💰
                        </div>
                    </div>
                </div>
                <div id="materials-root"></div>
            </div>
        `;
        
        if (window.MaterialsSelection) {
            window.MaterialsSelection.init('materials-root', (result) => {
                if (result.totalPrice > 0) {
                    if (!this.core.spendCoins(result.totalPrice)) {
                        showToast('❌', `Не хватает монеток для материалов`, 'error');
                        return;
                    }
                    showToast('🪙', `Списано ${result.totalPrice} 🪙 за материалы`, 'info');
                }
                
                project.materialsData = result;
                this.core.saveData();
                this.core.syncWithServer();
                this.ui.updateResourcesDisplay();
                
                showToast('✅', `Материалы выбраны! Класс: ${result.classType}`, 'success');
                
                setTimeout(() => {
                    this.completeCurrentStage('building');
                }, 1500);
            });
        } else {
            console.error('MaterialsSelection не загружен');
            container.innerHTML += `<div class="error-message">Ошибка: модуль материалов не загружен</div>`;
        }
    },

    // Строительство
    startBuildingStage() {
        const container = document.getElementById(this.containerId);
        if (!container) return;
        
        const project = this.core.getCurrentProject();
        if (!project) {
            showToast('❌', 'Нет активного проекта', 'error');
            return;
        }
        
        let buildingClass = 'Стандарт';
        
        if (project.shapeData && project.materialsData) {
            const shapeQuality = project.shapeData.fillPercentage || 50;
            const materialsQuality = project.materialsData.avgQuality || 50;
            const avgQuality = (shapeQuality + materialsQuality) / 2;
            
            if (avgQuality >= 85) buildingClass = 'Бизнес';
            else if (avgQuality >= 70) buildingClass = 'Комфорт';
            else if (avgQuality >= 50) buildingClass = 'Стандарт';
            else buildingClass = 'Эконом';
        } else if (project.materialsData) {
            buildingClass = project.materialsData.classType || 'Стандарт';
        }
        
        project.buildingClass = buildingClass;
        this.core.saveData();
        
        container.innerHTML = `
            <div class="developer-game">
                <div class="developer-header">
                    <h2><i class="fas fa-hard-hat"></i> Строительство</h2>
                    <div class="developer-resources">
                        <div class="resource-item">
                            <i class="fas fa-coins"></i> ${this.core.getCoins()} 🪙
                        </div>
                        <div class="resource-item">
                            <i class="fas fa-chart-line"></i> ${this.core.getCapital()} 💰
                        </div>
                    </div>
                </div>
                <div id="construction-root"></div>
            </div>
        `;
        
        if (window.ConstructionModule) {
            window.ConstructionModule.onAccelerate = (cost) => {
                if (this.core.spendCoins(cost)) {
                    this.core.syncWithServer();
                    this.ui.updateResourcesDisplay();
                    return true;
                }
                return false;
            };
            
            window.ConstructionModule.init('construction-root', buildingClass, (result) => {
                if (result.cancelled) {
                    showToast('❌', 'Строительство отменено', 'warning');
                    this.ui.render();
                } else if (result.success) {
                    showToast('✅', `Строительство завершено!`, 'success');
                    
                    setTimeout(() => {
                        this.completeCurrentStage('selling');
                    }, 1500);
                }
            });
        } else {
            console.error('ConstructionModule не загружен');
            container.innerHTML += `<div class="error-message">Ошибка: модуль строительства не загружен</div>`;
        }
    },

    // Продажа квартир
    startSellingStage() {
        const container = document.getElementById(this.containerId);
        if (!container) return;
        
        const project = this.core.getCurrentProject();
        if (!project) {
            showToast('❌', 'Нет активного проекта', 'error');
            return;
        }
        
        const buildingClass = project.buildingClass || 'Стандарт';
        let totalUnits = 20;
        if (project.shapeData) {
            totalUnits = Math.max(10, Math.min(50, project.shapeData.totalCells * 2));
        }
        
        container.innerHTML = `
            <div class="developer-game">
                <div class="developer-header">
                    <h2><i class="fas fa-chart-line"></i> Продажа квартир</h2>
                    <div class="developer-resources">
                        <div class="resource-item">
                            <i class="fas fa-coins"></i> ${this.core.getCoins()} 🪙
                        </div>
                        <div class="resource-item">
                            <i class="fas fa-chart-line"></i> ${this.core.getCapital()} 💰
                        </div>
                    </div>
                </div>
                <div id="selling-root"></div>
            </div>
        `;
        
        if (window.SellingModule) {
            window.SellingModule.setBuildingClass(buildingClass);
            window.SellingModule.init('selling-root', buildingClass, totalUnits, (result) => {
                if (result.success) {
                    const revenueInCoins = Math.floor(result.totalRevenue / 10000);
                    this.core.addCapital(revenueInCoins);
                    this.core.syncWithServer();
                    this.ui.updateResourcesDisplay();
                    
                    showToast('💰', `Все квартиры проданы! +${revenueInCoins} 💰`, 'success');
                    
                    setTimeout(() => {
                        this.completeCurrentStage(null);
                    }, 1500);
                }
            });
        } else {
            console.error('SellingModule не загружен');
            container.innerHTML += `<div class="error-message">Ошибка: модуль продаж не загружен</div>`;
        }
    },

    // Завершение этапа
    completeCurrentStage(nextStage) {
        this.core.completeStage(nextStage, (profit) => {
            if (profit) {
                this.ui.render();
                showToast('🎉', `Проект завершён! +${profit} 💰 капитала!`, 'success');
            } else {
                this.ui.render();
            }
        });
    },

    // Новая игра
    startNewProject() {
        if (this.core.hasActiveProject()) {
            showToast('⚠️', 'У вас уже есть активный проект!', 'warning');
            return;
        }
        
        if (this.core.getCapital() < 500) {
            showToast('💰', `Не хватает капитала! Нужно 500 💰`, 'error');
            return;
        }
        
        if (this.core.getCoins() < 400) {
            showToast('🪙', `Не хватает монеток! Нужно 400 🪙`, 'warning');
            if (confirm('Перейти на главную страницу?')) {
                window.location.href = './';
            }
            return;
        }
        
        this.startAuctionStage();
    },

    // Продолжить проект
    continueProject() {
        const project = this.core.getCurrentProject();
        if (!project) {
            showToast('❓', 'Нет активного проекта', 'info');
            return;
        }
        
        const stage = project.stage;
        console.log('[Stages] continueProject, stage:', stage);
        
        switch(stage) {
            case 'auction': this.startAuctionStage(); break;
            case 'geology': this.startGeologyStage(); break;
            case 'shape': this.startShapeStage(); break;
            case 'materials': this.startMaterialsStage(); break;
            case 'building': this.startBuildingStage(); break;
            case 'selling': this.startSellingStage(); break;
            default: this.startAuctionStage();
        }
    }
};

window.DeveloperStages = DeveloperStages;
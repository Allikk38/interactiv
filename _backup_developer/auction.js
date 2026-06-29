// ===== МОДУЛЬ ТОРГОВ ЗА УЧАСТОК =====
console.log('[AuctionModule] Загрузка модуля...');

const AuctionModule = {
    // Доступные участки (будут загружены из JSON)
    plots: [],
    
    // Боты-конкуренты
    bots: [
        { name: 'Брусника', budget: 1200, aggressiveness: 0.9, icon: '🏗️' },
        { name: 'Расцветай', budget: 900, aggressiveness: 0.7, icon: '🏢' },
        { name: 'Союз', budget: 700, aggressiveness: 0.5, icon: '🏘️' }
    ],
    
    currentBid: 0,
    currentWinner: null,
    activeBots: [],
    auctionActive: false,
    selectedPlot: null,
    playerBid: 0,
    callback: null,
    
    // Загрузка локаций из JSON
    async loadLocations() {
        try {
            const response = await fetch('data/locations.json');
            const locations = await response.json();
            this.plots = locations;
            console.log('[AuctionModule] Загружено локаций:', this.plots.length);
            return true;
        } catch (error) {
            console.error('[AuctionModule] Ошибка загрузки локаций:', error);
            // Фоллбек на дефолтные локации
            this.plots = [
                {
                    id: 'central',
                    name: 'Центральный',
                    district: 'Центральный район',
                    icon: '🏙️',
                    price: 1300,
                    characteristics: { traffic: 98, ecology: 60, infrastructure: 99, prestige: 97, development: 85 },
                    bonuses: { priceMultiplier: 1.5, demandMultiplier: 1.4, constructionSpeed: 0.8, materialCost: 1.3 },
                    description: 'Сердце Новосибирска',
                    advantages: ['🚇 Метро рядом', '🏛️ Театры и музеи'],
                    disadvantages: ['🚗 Пробки', '💰 Дорого']
                }
            ];
            return false;
        }
    },
    
    // Запуск торгов
    async start(plots, playerCapital, onComplete) {
        console.log('[AuctionModule] start() вызван, playerCapital:', playerCapital);
        
        // Загружаем локации, если передан пустой массив или undefined
        if (!plots || plots.length === 0) {
            await this.loadLocations();
        } else {
            this.plots = plots;
        }
        
        this.callback = onComplete;
        this.activeBots = this.bots.map(bot => ({ ...bot, currentBid: 0, active: true }));
        this.auctionActive = true;
        this.currentBid = 0;
        this.currentWinner = null;
        this.playerBid = 0;
        this.selectedPlot = null;
        
        console.log('[AuctionModule] Вызов renderPlotSelection');
        this.renderPlotSelection(playerCapital);
    },
    
    // Вспомогательная функция для визуализации звёзд
    renderStars(value) {
        const starCount = Math.floor(value / 20);
        return '⭐'.repeat(starCount) + '☆'.repeat(5 - starCount);
    },
    
    // Выбор участка
    renderPlotSelection(playerCapital) {
        console.log('[AuctionModule] renderPlotSelection, playerCapital:', playerCapital);
        
        const containerId = this.callback?.containerId || 'developer-game-root';
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('[AuctionModule] Контейнер не найден:', containerId);
            return;
        }
        
        let plotsHtml = '';
        for (const plot of this.plots) {
            const canAfford = plot.price <= playerCapital;
            
            // Визуализация ключевых характеристик
            const trafficStars = this.renderStars(plot.characteristics?.traffic || 50);
            const ecologyStars = this.renderStars(plot.characteristics?.ecology || 50);
            const prestigeStars = this.renderStars(plot.characteristics?.prestige || 50);
            
            // Преимущества (первые 2)
            const advantagesHtml = (plot.advantages || []).slice(0, 2).map(a => `<span style="font-size:0.7rem;">✅ ${this.escapeHtml(a)}</span>`).join(' ');
            
            // Недостатки (первые 2)
            const disadvantagesHtml = (plot.disadvantages || []).slice(0, 2).map(d => `<span style="font-size:0.7rem; color:#e74c3c;">❌ ${this.escapeHtml(d)}</span>`).join(' ');
            
            plotsHtml += `
                <div class="auction-plot-card" data-plot-id="${plot.id}" style="
                    background: var(--color-surface);
                    border: 2px solid ${canAfford ? 'var(--color-border)' : '#e74c3c'};
                    border-radius: var(--radius);
                    padding: 20px;
                    cursor: ${canAfford ? 'pointer' : 'not-allowed'};
                    opacity: ${canAfford ? 1 : 0.6};
                    transition: all 0.2s ease;
                    margin-bottom: 20px;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <div style="font-size: 2.5rem;">${plot.icon || '🏠'}</div>
                        <div style="font-size: 1.3rem; font-weight: 700; color: var(--color-warning);">
                            ${plot.price} 🪙
                        </div>
                    </div>
                    
                    <h3 style="margin: 0 0 4px 0;">${this.escapeHtml(plot.name)}</h3>
                    <div style="color: var(--color-text-light); font-size: 0.8rem; margin-bottom: 12px;">
                        ${this.escapeHtml(plot.district)}
                    </div>
                    
                    <div style="display: flex; gap: 12px; margin: 12px 0; padding: 8px; background: var(--color-bg); border-radius: var(--radius-sm); font-size: 0.7rem; flex-wrap: wrap;">
                        <span title="Транспорт">🚇 ${trafficStars}</span>
                        <span title="Экология">🌿 ${ecologyStars}</span>
                        <span title="Престиж">👑 ${prestigeStars}</span>
                    </div>
                    
                    <p style="font-size: 0.8rem; color: var(--color-text); margin: 8px 0;">${this.escapeHtml(plot.description)}</p>
                    
                    <div style="display: flex; flex-wrap: wrap; gap: 8px; margin: 8px 0;">
                        ${advantagesHtml}
                        ${disadvantagesHtml}
                    </div>
                    
                    <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid var(--color-border); font-size: 0.7rem; color: var(--color-text-light);">
                        <span>📈 Множитель цены: ${plot.bonuses?.priceMultiplier || 1.0}x</span>
                        <span style="margin-left: 12px;">⚡ Скорость стройки: ${Math.round((plot.bonuses?.constructionSpeed || 1.0) * 100)}%</span>
                    </div>
                </div>
            `;
        }
        
        container.innerHTML = `
            <div class="auction-container">
                <div class="auction-header">
                    <h2><i class="fas fa-gavel"></i> Торги за участок</h2>
                    <div class="player-capital">💰 Ваш капитал: ${playerCapital} 🪙</div>
                </div>
                <div class="auction-plots" style="max-height: 60vh; overflow-y: auto; padding-right: 8px;">
                    ${plotsHtml}
                </div>
                <div class="auction-hint">
                    <i class="fas fa-info-circle"></i> Выберите участок для участия в торгах. 
                    Характеристики участка повлияют на весь проект!
                </div>
                <button class="btn btn--secondary" id="auction-back-btn" style="margin-top: 20px;">
                    <i class="fas fa-arrow-left"></i> Назад
                </button>
            </div>
        `;
        
        // Добавляем обработчики кликов по участкам
        document.querySelectorAll('.auction-plot-card').forEach(card => {
            const plotId = card.dataset.plotId;
            const plot = this.plots.find(p => p.id === plotId);
            if (plot && plot.price <= playerCapital) {
                card.addEventListener('click', () => {
                    console.log('[AuctionModule] Выбран участок:', plot.name);
                    this.selectedPlot = plot;
                    this.startAuctionForPlot(playerCapital);
                });
            }
        });
        
        // Кнопка "Назад"
        const backBtn = document.getElementById('auction-back-btn');
        if (backBtn && this.callback?.onBack) {
            backBtn.onclick = () => this.callback.onBack();
        } else if (backBtn) {
            backBtn.onclick = () => {
                if (this.callback?.onAuctionComplete) {
                    this.callback.onAuctionComplete({ success: false, cancelled: true });
                }
            };
        }
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
    
    // Запуск торгов для выбранного участка
    startAuctionForPlot(playerCapital) {
        console.log('[AuctionModule] startAuctionForPlot, участок:', this.selectedPlot.name);
        
        if (!this.selectedPlot) return;
        
        this.currentBid = this.selectedPlot.price;
        this.playerBid = this.selectedPlot.price;
        this.currentWinner = 'player';
        
        // Сбрасываем ставки ботов
        this.activeBots.forEach(bot => {
            bot.currentBid = 0;
            bot.active = true;
        });
        
        this.renderAuctionInterface(playerCapital);
        this.startBotBidding(playerCapital);
    },
    
    // Интерфейс торгов
    renderAuctionInterface(playerCapital) {
        console.log('[AuctionModule] renderAuctionInterface');
        
        const containerId = this.callback?.containerId || 'developer-game-root';
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const maxBid = playerCapital;
        const canRaise = this.playerBid + 50 <= maxBid && this.auctionActive;
        
        // Список ботов и их ставок
        let botsHtml = '';
        for (const bot of this.activeBots) {
            botsHtml += `
                <div class="auction-bot">
                    <span class="auction-bot__icon">${bot.icon}</span>
                    <span class="auction-bot__name">${bot.name}</span>
                    <span class="auction-bot__bid">${bot.currentBid > 0 ? bot.currentBid + ' 🪙' : '—'}</span>
                </div>
            `;
        }
        
        container.innerHTML = `
            <div class="auction-container">
                <div class="auction-header">
                    <h2><i class="fas fa-gavel"></i> Торги: ${this.selectedPlot.name}</h2>
                    <div class="player-capital">💰 Доступно: ${playerCapital} 🪙</div>
                </div>
                
                <div class="auction-current">
                    <div class="auction-current__bid">
                        <div class="auction-current__label">ТЕКУЩАЯ СТАВКА</div>
                        <div class="auction-current__value">${this.currentBid} 🪙</div>
                    </div>
                    <div class="auction-current__leader">
                        <div class="auction-current__label">ЛИДИРУЕТ</div>
                        <div class="auction-current__value">
                            ${this.currentWinner === 'player' ? '👤 ВЫ' : (this.currentWinner?.name || '—')}
                        </div>
                    </div>
                </div>
                
                <div class="auction-bots">
                    <div class="auction-bots__title">Конкуренты:</div>
                    <div class="auction-bots__list">
                        ${botsHtml}
                    </div>
                </div>
                
                <div class="auction-actions">
                    <button class="btn btn--primary" id="auction-raise-btn" ${!canRaise ? 'disabled' : ''}>
                        <i class="fas fa-arrow-up"></i> Поднять ставку (+50 🪙)
                    </button>
                    <button class="btn btn--secondary" id="auction-pass-btn">
                        <i class="fas fa-flag-checkered"></i> Сдаюсь
                    </button>
                </div>
                
                <div class="auction-log" id="auction-log">
                    <div class="auction-log__entry">🏁 Торги начались! Стартовая цена: ${this.selectedPlot.price} 🪙</div>
                </div>
                
                <div class="auction-hint">
                    <i class="fas fa-lightbulb"></i> ${this.selectedPlot.bonuses?.demandMultiplier ? 'Спрос на квартиры в этом районе: +' + Math.round((this.selectedPlot.bonuses.demandMultiplier - 1) * 100) + '%' : 'Чем выше спрос на участок, тем дороже будут квартиры'}
                </div>
                
                <button class="btn btn--small btn--secondary" id="auction-cancel-btn" style="margin-top: 16px;">
                    <i class="fas fa-times"></i> Отменить торги
                </button>
            </div>
        `;
        
        // Обработчики кнопок
        const raiseBtn = document.getElementById('auction-raise-btn');
        const passBtn = document.getElementById('auction-pass-btn');
        const cancelBtn = document.getElementById('auction-cancel-btn');
        
        if (raiseBtn) {
            raiseBtn.onclick = () => this.playerRaiseBid(playerCapital);
        }
        if (passBtn) {
            passBtn.onclick = () => this.playerPass();
        }
        if (cancelBtn) {
            cancelBtn.onclick = () => {
                this.auctionActive = false;
                if (this.callback?.onAuctionComplete) {
                    this.callback.onAuctionComplete({ success: false, cancelled: true });
                }
            };
        }
    },
    
    // Игрок поднимает ставку
    playerRaiseBid(playerCapital) {
        console.log('[AuctionModule] playerRaiseBid');
        
        if (!this.auctionActive) return;
        
        const newBid = this.playerBid + 50;
        if (newBid > playerCapital) {
            this.addLogEntry('⚠️ Недостаточно капитала для повышения ставки!', 'warning');
            return;
        }
        
        this.playerBid = newBid;
        this.currentBid = newBid;
        this.currentWinner = 'player';
        
        this.addLogEntry(`👤 Вы подняли ставку до ${newBid} 🪙`, 'success');
        this.updateBidDisplay();
        
        // Запускаем ответ ботов с задержкой
        setTimeout(() => this.botTurn(playerCapital), 800);
    },
    
    // Ход ботов
    botTurn(playerCapital) {
        console.log('[AuctionModule] botTurn');
        
        if (!this.auctionActive) return;
        
        let anyBotRaised = false;
        
        for (const bot of this.activeBots) {
            if (!bot.active) continue;
            
            const canRaise = bot.currentBid < this.currentBid;
            const shouldRaise = Math.random() < bot.aggressiveness;
            const botCanAfford = bot.currentBid + 50 <= bot.budget;
            
            if (canRaise && shouldRaise && botCanAfford) {
                bot.currentBid = this.currentBid + 50;
                this.currentBid = bot.currentBid;
                this.currentWinner = bot;
                anyBotRaised = true;
                
                this.addLogEntry(`${bot.icon} ${bot.name} поднял ставку до ${bot.currentBid} 🪙`, 'info');
                this.updateBidDisplay();
                break;
            }
        }
        
        if (anyBotRaised) {
            this.renderAuctionInterface(playerCapital);
        } else {
            this.endAuction(playerCapital);
        }
    },
    
    // Игрок сдаётся
    playerPass() {
        console.log('[AuctionModule] playerPass');
        
        if (!this.auctionActive) return;
        this.addLogEntry(`👤 Вы сдались. Победитель: ${this.currentWinner === 'player' ? 'вы' : this.currentWinner?.name}`, 'warning');
        this.endAuction(null, true);
    },
    
    // Завершение торгов
    endAuction(playerCapital, isPass = false) {
        console.log('[AuctionModule] endAuction, isPass:', isPass);
        
        this.auctionActive = false;
        
        const isPlayerWin = this.currentWinner === 'player';
        const finalPrice = this.currentBid;
        
        if (isPlayerWin && !isPass) {
            this.addLogEntry(`🎉 ПОБЕДА! Вы выиграли участок за ${finalPrice} 🪙`, 'success');
            
            if (this.callback?.onAuctionComplete) {
                this.callback.onAuctionComplete({
                    success: true,
                    plot: this.selectedPlot,
                    price: finalPrice,
                    capitalChange: -finalPrice
                });
            }
        } else {
            this.addLogEntry(`😞 Вы проиграли торги. ${this.currentWinner?.name || 'Бот'} забрал участок.`, 'error');
            
            setTimeout(() => {
                if (this.callback?.onAuctionComplete) {
                    this.callback.onAuctionComplete({
                        success: false,
                        plot: null,
                        price: 0,
                        capitalChange: 0
                    });
                }
            }, 2000);
        }
    },
    
    // Добавление записи в лог
    addLogEntry(message, type = 'info') {
        const logContainer = document.getElementById('auction-log');
        if (!logContainer) return;
        
        const entry = document.createElement('div');
        entry.className = `auction-log__entry auction-log__entry--${type}`;
        entry.innerHTML = message;
        logContainer.appendChild(entry);
        logContainer.scrollTop = logContainer.scrollHeight;
    },
    
    // Обновление отображения ставки
    updateBidDisplay() {
        const bidValues = document.querySelectorAll('.auction-current__value');
        if (bidValues[0]) bidValues[0].textContent = `${this.currentBid} 🪙`;
        if (bidValues[1]) {
            bidValues[1].textContent = this.currentWinner === 'player' ? '👤 ВЫ' : (this.currentWinner?.name || '—');
        }
    },
    
    // Запуск автоматических торгов ботов
    startBotBidding(playerCapital) {
        console.log('[AuctionModule] startBotBidding');
        
        let delay = 1000;
        for (const bot of this.activeBots) {
            setTimeout(() => {
                if (this.auctionActive && bot.currentBid === 0 && this.currentBid === this.selectedPlot.price) {
                    const shouldBid = Math.random() < bot.aggressiveness;
                    if (shouldBid && bot.budget >= this.currentBid + 50) {
                        bot.currentBid = this.currentBid + 50;
                        this.currentBid = bot.currentBid;
                        this.currentWinner = bot;
                        this.addLogEntry(`${bot.icon} ${bot.name} делает стартовую ставку ${bot.currentBid} 🪙`, 'info');
                        this.updateBidDisplay();
                        this.renderAuctionInterface(playerCapital);
                    }
                }
            }, delay);
            delay += 1500;
        }
    }
};

window.AuctionModule = AuctionModule;
console.log('[AuctionModule] Модуль загружен');
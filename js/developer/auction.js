// ===== МОДУЛЬ ТОРГОВ ЗА УЧАСТОК =====
console.log('[AuctionModule] Загрузка модуля...');

const AuctionModule = {
    // Доступные участки
    plots: [
        {
            id: 'center',
            name: 'Центральный',
            location: 'Центр, ул. Ленина',
            price: 800,
            demand: 95,
            size: 10,
            image: '🏙️',
            description: 'Высокий спрос, отличная транспортная доступность',
            bonus: '+20% к стоимости квартир'
        },
        {
            id: 'akadem',
            name: 'Академгородок',
            location: 'Академгородок, пр. Лаврентьева',
            price: 650,
            demand: 85,
            size: 12,
            image: '🌲',
            description: 'Зелёный район, рядом парки и институты',
            bonus: '+10% к скорости продаж'
        },
        {
            id: 'zaton',
            name: 'Затулинка',
            location: 'Затулинский жилмассив',
            price: 450,
            demand: 70,
            size: 15,
            image: '🏘️',
            description: 'Бюджетный район, высокая конкуренция',
            bonus: '-10% к стоимости материалов'
        }
    ],
    
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
    
    // Запуск торгов
    start(plots, playerCapital, onComplete) {
        console.log('[AuctionModule] start() вызван, playerCapital:', playerCapital);
        console.log('[AuctionModule] onComplete:', onComplete);
        
        this.plots = plots || this.plots;
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
    
    // Выбор участка
    renderPlotSelection(playerCapital) {
        console.log('[AuctionModule] renderPlotSelection, playerCapital:', playerCapital);
        
        const containerId = this.callback?.containerId || 'developer-game-root';
        console.log('[AuctionModule] containerId:', containerId);
        
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('[AuctionModule] Контейнер не найден:', containerId);
            return;
        }
        
        console.log('[AuctionModule] Контейнер найден, рендерим участки');
        
        let plotsHtml = '';
        for (const plot of this.plots) {
            const canAfford = plot.price <= playerCapital;
            plotsHtml += `
                <div class="auction-plot-card" data-plot-id="${plot.id}" style="
                    background: var(--color-surface);
                    border: 2px solid var(--color-border);
                    border-radius: var(--radius);
                    padding: 20px;
                    cursor: ${canAfford ? 'pointer' : 'not-allowed'};
                    opacity: ${canAfford ? 1 : 0.5};
                    transition: all 0.2s ease;
                ">
                    <div class="auction-plot__icon" style="font-size: 3rem; text-align: center;">${plot.image}</div>
                    <h3 style="margin: 12px 0 4px;">${this.escapeHtml(plot.name)}</h3>
                    <p style="color: var(--color-text-light); font-size: 0.85rem;">${this.escapeHtml(plot.location)}</p>
                    <div style="margin: 12px 0; padding: 8px; background: var(--color-bg); border-radius: var(--radius-sm);">
                        <div>💰 Стартовая цена: ${plot.price} 🪙</div>
                        <div>📏 Площадь: ${plot.size} соток</div>
                        <div>📈 Спрос: ${plot.demand}%</div>
                        <div style="font-size: 0.8rem; color: var(--color-success);">${plot.bonus}</div>
                    </div>
                    <p style="font-size: 0.8rem; color: var(--color-text-light);">${this.escapeHtml(plot.description)}</p>
                </div>
            `;
        }
        
        container.innerHTML = `
            <div class="auction-container">
                <div class="auction-header">
                    <h2><i class="fas fa-gavel"></i> Торги за участок</h2>
                    <div class="player-capital">💰 Ваш капитал: ${playerCapital} 🪙</div>
                </div>
                <div class="auction-plots">
                    ${plotsHtml}
                </div>
                <div class="auction-hint">
                    <i class="fas fa-info-circle"></i> Выберите участок для участия в торгах
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
                    <i class="fas fa-lightbulb"></i> Чем выше спрос на участок, тем дороже будут квартиры
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
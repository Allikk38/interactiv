// ===== ОНБОРДИНГ (КНОПКА "ОБУЧЕНИЕ") =====

const Onboarding = {
    isOpen: false,
    modal: null,
    overlay: null,
    
    init() {
        // Создаём кнопку
        this.createButton();
        
        // Создаём модальное окно (скрытое)
        this.createModal();
        
        // Добавляем обработчики
        this.bindEvents();
    },
    
    createButton() {
        const btn = document.createElement('button');
        btn.id = 'onboarding-btn';
        btn.className = 'onboarding-btn';
        btn.innerHTML = '<i class="fas fa-graduation-cap"></i>';
        btn.title = 'Как пользоваться тренажёром';
        document.body.appendChild(btn);
    },
    
    createModal() {
        // Создаём оверлей
        const overlay = document.createElement('div');
        overlay.id = 'onboarding-overlay';
        overlay.className = 'onboarding-overlay';
        
        // Создаём модальное окно
        overlay.innerHTML = `
            <div class="onboarding-modal">
                <div class="onboarding-modal__header">
                    <div class="onboarding-modal__title">
                        <i class="fas fa-graduation-cap"></i>
                        Как пользоваться тренажёром
                    </div>
                    <button class="onboarding-modal__close" id="onboarding-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="onboarding-modal__content">
                    <div class="onboarding-step">
                        <div class="onboarding-step__number">1</div>
                        <div class="onboarding-step__content">
                            <h3><i class="fas fa-user-plus"></i> Введите своё имя</h3>
                            <p>При первом входе укажите имя — оно сохранится на вашем устройстве. Все результаты будут привязаны к вам в рейтинге.</p>
                            <span class="onboarding-badge">Сохраняется локально</span>
                        </div>
                    </div>
                    
                    <div class="onboarding-step">
                        <div class="onboarding-step__number">2</div>
                        <div class="onboarding-step__content">
                            <h3><i class="fas fa-th-large"></i> Выберите сценарий</h3>
                            <p>На главном экране выберите категорию и нажмите на карточку сценария. Каждый сценарий содержит несколько шагов.</p>
                            <span class="onboarding-badge">Картография • Обучение • Практика • Игры</span>
                        </div>
                    </div>
                    
                    <div class="onboarding-step">
                        <div class="onboarding-step__number">3</div>
                        <div class="onboarding-step__content">
                            <h3><i class="fas fa-map-marker-alt"></i> Расставляйте ЖК на карте</h3>
                            <p>Выберите ЖК из списка или карусели, затем нажмите на карту в нужном месте. Система проверит правильность.</p>
                            <span class="onboarding-badge">Подсказки помогут найти объект</span>
                        </div>
                    </div>
                    
                    <div class="onboarding-step">
                        <div class="onboarding-step__number">4</div>
                        <div class="onboarding-step__content">
                            <h3><i class="fas fa-question-circle"></i> Отвечайте на вопросы</h3>
                            <p>В тестах выбирайте правильные ответы. За каждый правильный ответ вы получаете XP (опыт).</p>
                            <span class="onboarding-badge">+10 XP за правильный ответ</span>
                        </div>
                    </div>
                    
                    <div class="onboarding-step">
                        <div class="onboarding-step__number">5</div>
                        <div class="onboarding-step__content">
                            <h3><i class="fas fa-arrows-alt"></i> Drag-and-Drop задания</h3>
                            <p>В интерактивных шагах перетаскивайте карточки в нужные зоны. Работает и мышью, и пальцем на телефоне.</p>
                            <span class="onboarding-badge">Поддерживается на телефонах</span>
                        </div>
                    </div>
                    
                    <div class="onboarding-step">
                        <div class="onboarding-step__number">6</div>
                        <div class="onboarding-step__content">
                            <h3><i class="fas fa-trophy"></i> Получайте бейджи и XP</h3>
                            <p>За прохождение сценариев вы получаете бейджи и опыт (XP). Чем выше уровень — тем больше ваш статус.</p>
                            <span class="onboarding-badge">Идеальное прохождение даёт бонус</span>
                        </div>
                    </div>
                    
                    <div class="onboarding-step">
                        <div class="onboarding-step__number">💾</div>
                        <div class="onboarding-step__content">
                            <h3><i class="fas fa-save"></i> Автосохранение</h3>
                            <p>Тренажёр автоматически сохраняет ваш прогресс. Можно закрыть страницу и вернуться позже — продолжите с того же места.</p>
                            <span class="onboarding-badge">Прогресс хранится на устройстве</span>
                        </div>
                    </div>
                </div>
                <div class="onboarding-modal__footer">
                    <span class="onboarding-modal__footer-text">
                        <i class="fas fa-mobile-alt"></i> Работает на телефонах, планшетах, ноутбуках
                    </span>
                    <button class="onboarding-modal__btn onboarding-modal__btn--primary" id="onboarding-start-btn">
                        Начать обучение →
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        this.overlay = overlay;
        this.modal = overlay.querySelector('.onboarding-modal');
    },
    
    bindEvents() {
        const btn = document.getElementById('onboarding-btn');
        const closeBtn = document.getElementById('onboarding-close');
        const startBtn = document.getElementById('onboarding-start-btn');
        const overlay = this.overlay;
        
        if (btn) {
            btn.addEventListener('click', () => this.open());
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }
        
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.close();
                // Опционально: скролл к сценариям
                const scenariosGrid = document.getElementById('scenarios-grid');
                if (scenariosGrid) {
                    scenariosGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        }
        
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.close();
                }
            });
        }
        
        // Закрытие по Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    },
    
    open() {
        if (this.overlay) {
            this.overlay.classList.add('onboarding-overlay--visible');
            this.isOpen = true;
            document.body.style.overflow = 'hidden';
        }
    },
    
    close() {
        if (this.overlay) {
            this.overlay.classList.remove('onboarding-overlay--visible');
            this.isOpen = false;
            document.body.style.overflow = '';
        }
    }
};

// Инициализируем при загрузке DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Onboarding.init());
} else {
    Onboarding.init();
}
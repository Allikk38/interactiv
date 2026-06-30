// ===== ОНБОРДИНГ (ПОШАГОВЫЙ ТУР) =====

const Onboarding = {
    STORAGE_KEY: (window.STORAGE_KEYS && STORAGE_KEYS.USER && STORAGE_KEYS.USER.ONBOARDING_COMPLETED) 
        ? STORAGE_KEYS.USER.ONBOARDING_COMPLETED 
        : 'onboarding_tutorial_completed',
    SKIP_KEY: (window.STORAGE_KEYS && STORAGE_KEYS.USER && STORAGE_KEYS.USER.ONBOARDING_SKIPPED) 
        ? STORAGE_KEYS.USER.ONBOARDING_SKIPPED 
        : 'onboarding_skipped',
    isOpen: false,
    modal: null,
    overlay: null,
    currentStep: 0,
    _initCalled: false,
    _autoStartAttempts: 0,
    _maxAutoStartAttempts: 30,
    _isFinishing: false,

    // Данные шагов
    steps: [
        {
            title: '👋 Добро пожаловать в тренажёр!',
            text: 'Здесь вы будете проходить сценарии и отрабатывать навыки агента недвижимости. Каждый сценарий — это набор заданий, которые приближены к реальной работе.',
            modalPosition: 'center',
        },
        {
            title: '🧭 Выберите сценарий',
            text: 'Начните обучение с выбора сценария. Каждый сценарий развивает отдельный навык агента:\n\n• Картография — расстановка ЖК на карте\n• Обучение — теория и тесты\n• Практика — работа с клиентами\n• Быстрые игры — проверка реакции',
            highlightSelector: '.scenarios-grid, .premium-grid',
            modalPosition: 'top-center',
        },
        {
            title: '📊 Отслеживайте прогресс',
            text: 'Здесь отображаются ваши достижения. Получайте XP за правильные ответы, повышайте уровень и открывайте бейджи!',
            highlightSelector: '.xp-card, .agent-dashboard, .premium-banner',
            modalPosition: 'bottom-left',
        },
        {
            title: '🚀 Вводное обучение',
            text: 'Сейчас запустится короткий вводный сценарий. Он покажет, как работают задания в тренажёре.\n\nВнутри вас ждут:\n\n• 🗺️ Расстановка объектов на карте\n• 📝 Вопросы с выбором ответа\n• 🎯 Интерактивные задания\n\nПросто следуйте инструкциям на экране!',
            modalPosition: 'center',
            isLast: true,
        },
    ],

    init() {
        if (this._initCalled) {
            console.log('[Onboarding] Уже инициализирован');
            return;
        }
        this._initCalled = true;
        console.log('[Onboarding] Инициализация...');

        this.createButton();
        this.createModal();
        this.bindEvents();

        console.log('[Onboarding] Ожидание создания пользователя для автозапуска...');
    },

    checkAndAutoStart() {
        this._autoStartAttempts++;

        console.log('[Onboarding] checkAndAutoStart() вызван (попытка ' + this._autoStartAttempts + ')');

        if (this.hasCompleted()) {
            console.log('[Onboarding] Онбординг уже завершён, пропускаем');
            return;
        }

        try {
            const skipped = localStorage.getItem(this.SKIP_KEY);
            if (skipped === 'true') {
                console.log('[Onboarding] Онбординг был пропущен');
                return;
            }
        } catch (_) {}

        if (typeof User === 'undefined' || !User) {
            console.log('[Onboarding] User не определён, повторная попытка...');
            if (this._autoStartAttempts < this._maxAutoStartAttempts) {
                setTimeout(() => {
                    this.checkAndAutoStart();
                }, 300);
            } else {
                console.log('[Onboarding] Превышено количество попыток, онбординг не будет запущен');
            }
            return;
        }

        var user = User.get();
        console.log('[Onboarding] Пользователь:', user);

        if (!user) {
            console.log('[Onboarding] Пользователь не найден, автозапуск отложен');
            if (this._autoStartAttempts < this._maxAutoStartAttempts) {
                setTimeout(() => {
                    this.checkAndAutoStart();
                }, 500);
            } else {
                console.log('[Onboarding] Превышено количество попыток, онбординг не будет запущен');
            }
            return;
        }

        var scenarios = window.allScenarios || [];
        if (scenarios.length === 0) {
            console.log('[Onboarding] Сценарии ещё не загружены, автозапуск отложен');
            if (this._autoStartAttempts < this._maxAutoStartAttempts) {
                setTimeout(() => {
                    this.checkAndAutoStart();
                }, 500);
            } else {
                console.log('[Onboarding] Превышено количество попыток, онбординг не будет запущен');
            }
            return;
        }

        console.log('[Onboarding] Автоматический запуск для пользователя:', user.name);

        setTimeout(() => {
            this.currentStep = 0;
            this.renderStep();
            this.open();
        }, 300);
    },

    hasCompleted() {
        try {
            // Проверяем новый ключ
            if (localStorage.getItem(this.STORAGE_KEY) === 'true') {
                return true;
            }
            // Для обратной совместимости проверяем старые ключи
            if (localStorage.getItem('onboarding_tutorial_completed') === 'true') {
                return true;
            }
            if (localStorage.getItem('onboarding_completed') === 'true') {
                return true;
            }
            return false;
        } catch {
            return false;
        }
    },

    createButton() {
        if (document.getElementById('onboarding-btn')) return;

        const btn = document.createElement('button');
        btn.id = 'onboarding-btn';
        btn.className = 'onboarding-btn';
        btn.innerHTML = '<i class="fas fa-graduation-cap"></i>';
        btn.title = 'Как пользоваться тренажёром';
        document.body.appendChild(btn);
    },

    createModal() {
        const oldOverlay = document.getElementById('onboarding-overlay');
        if (oldOverlay) oldOverlay.remove();

        const overlay = document.createElement('div');
        overlay.id = 'onboarding-overlay';
        overlay.className = 'onboarding-overlay';
        // Оверлей должен быть под модальным окном
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 9998;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s ease, visibility 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        `;

        overlay.innerHTML = `
            <div class="onboarding-modal" style="
                position: relative;
                z-index: 10001;
                background: var(--color-surface, #ffffff);
                border-radius: var(--radius, 16px);
                max-width: 90vw;
                width: 400px;
                max-height: 55vh;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                box-shadow: 0 24px 48px rgba(0, 0, 0, 0.3);
                pointer-events: auto;
            ">
                <div class="onboarding-modal__header" style="
                    padding: 14px 18px 10px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid var(--color-border, #dfe6e9);
                    flex-shrink: 0;
                ">
                    <div class="onboarding-modal__progress" id="onboarding-progress" style="
                        display: flex;
                        gap: 8px;
                        align-items: center;
                    "></div>
                    <button class="onboarding-modal__close" id="onboarding-close" style="
                        background: none;
                        border: none;
                        font-size: 1.3rem;
                        cursor: pointer;
                        color: var(--color-text-light, #636e72);
                        padding: 4px 8px;
                        border-radius: 50%;
                        transition: background 0.2s;
                        line-height: 1;
                    ">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="onboarding-modal__content" id="onboarding-content" style="
                    flex: 1;
                    overflow-y: auto;
                    padding: 16px 20px 12px;
                ">
                    <!-- Динамический контент -->
                </div>
                <div class="onboarding-modal__footer" id="onboarding-footer" style="
                    padding: 10px 18px 14px;
                    border-top: 1px solid var(--color-border, #dfe6e9);
                    display: flex;
                    justify-content: flex-end;
                    align-items: center;
                    gap: 8px;
                    flex-wrap: wrap;
                    flex-shrink: 0;
                ">
                    <!-- Динамические кнопки -->
                </div>
            </div>
        `;

        // Добавляем в конец body, чтобы быть поверх всех элементов
        document.body.appendChild(overlay);
        this.overlay = overlay;
        this.modal = overlay.querySelector('.onboarding-modal');
    },

    renderStep() {
        const content = document.getElementById('onboarding-content');
        const footer = document.getElementById('onboarding-footer');
        const progress = document.getElementById('onboarding-progress');
        const step = this.steps[this.currentStep];
        const totalSteps = this.steps.length;
        const stepNumber = this.currentStep + 1;
        const modal = document.querySelector('.onboarding-modal');
        const overlay = this.overlay;

        if (!content || !footer) return;

        // ===== ОЧИЩАЕМ ПОДСВЕТКУ =====
        this.clearHighlights();

        // ===== ПРИМЕНЯЕМ ПОДСВЕТКУ (если есть) =====
        if (step.highlightSelector && !step.isLast) {
            setTimeout(() => {
                this.highlightElement(step.highlightSelector);
            }, 50);
        }

        // ===== УСТАНАВЛИВАЕМ ПОЗИЦИЮ МОДАЛЬНОГО ОКНА =====
        if (overlay) {
            // Сбрасываем стили позиционирования
            overlay.style.alignItems = 'center';
            overlay.style.justifyContent = 'center';
            
            // В зависимости от шага меняем позицию
            if (step.modalPosition === 'top-center') {
                overlay.style.alignItems = 'flex-start';
                overlay.style.justifyContent = 'center';
                overlay.style.paddingTop = '40px';
            } else if (step.modalPosition === 'bottom-left') {
                overlay.style.alignItems = 'flex-end';
                overlay.style.justifyContent = 'flex-start';
                overlay.style.padding = '20px';
            } else if (step.modalPosition === 'center') {
                overlay.style.alignItems = 'center';
                overlay.style.justifyContent = 'center';
                overlay.style.padding = '20px';
            }
        }

        if (modal) {
            // Убираем лишние классы, оставляем только базовый
            modal.className = 'onboarding-modal';
            
            // В зависимости от шага меняем размер и стиль окна
            if (step.modalPosition === 'top-center') {
                modal.style.maxWidth = '480px';
                modal.style.width = '90%';
                modal.style.marginTop = '40px';
            } else if (step.modalPosition === 'bottom-left') {
                modal.style.maxWidth = '380px';
                modal.style.width = '90%';
                modal.style.marginBottom = '20px';
                modal.style.marginLeft = '20px';
            } else if (step.modalPosition === 'center') {
                modal.style.maxWidth = '480px';
                modal.style.width = '90%';
                modal.style.margin = '0';
            }
        }

        // Контент
        let textHtml = step.text;
        if (textHtml) {
            textHtml = textHtml.replace(/\n/g, '<br>');
        }

        content.innerHTML = `
            <div class="onboarding-step" style="
                display: flex;
                gap: 14px;
                align-items: flex-start;
            ">
                <div class="onboarding-step__number" style="
                    width: 32px;
                    height: 32px;
                    background: linear-gradient(135deg, var(--color-primary, #2e86de), #1b6dc1);
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 0.9rem;
                    flex-shrink: 0;
                    margin-top: 2px;
                ">${stepNumber}</div>
                <div class="onboarding-step__content" style="flex: 1;">
                    <h2 style="
                        font-size: 1.1rem;
                        font-weight: 700;
                        margin: 0 0 4px 0;
                        color: var(--color-text, #2d3436);
                        line-height: 1.3;
                    ">${step.title}</h2>
                    <p style="
                        font-size: 0.9rem;
                        line-height: 1.6;
                        color: var(--color-text-light, #636e72);
                        margin: 0;
                    ">${textHtml}</p>
                </div>
            </div>
        `;

        // Прогресс
        let progressHTML = '';
        for (let i = 0; i < totalSteps; i++) {
            const isActive = i === this.currentStep;
            const isDone = i < this.currentStep;
            progressHTML += `<span class="onboarding-progress__dot ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}" style="
                width: 10px;
                height: 10px;
                border-radius: 50%;
                background: ${isActive ? 'var(--color-primary, #2e86de)' : (isDone ? 'var(--color-success, #27ae60)' : 'var(--color-border, #dfe6e9)')};
                transition: all 0.3s ease;
                flex-shrink: 0;
                ${isActive ? 'transform: scale(1.2); box-shadow: 0 0 0 3px rgba(46, 134, 222, 0.2);' : ''}
            "></span>`;
        }
        progress.innerHTML = progressHTML;

        // Кнопки (футер)
        const isFirst = this.currentStep === 0;
        const isLast = step.isLast || false;

        let buttonsHTML = '';

        buttonsHTML += `<button class="onboarding-modal__btn onboarding-modal__btn--skip" id="onboarding-skip" style="
            background: transparent;
            color: var(--color-text-light, #636e72);
            margin-right: auto;
            padding: 8px 16px;
            border: none;
            border-radius: var(--radius-sm, 8px);
            font-size: 0.85rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            min-height: 38px;
            min-width: 70px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
        ">Пропустить</button>`;

        if (!isFirst) {
            buttonsHTML += `<button class="onboarding-modal__btn onboarding-modal__btn--secondary" id="onboarding-prev" style="
                background: var(--color-bg, #f5f6fa);
                color: var(--color-text, #2d3436);
                border: 1px solid var(--color-border, #dfe6e9);
                padding: 8px 16px;
                border-radius: var(--radius-sm, 8px);
                font-size: 0.85rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                min-height: 38px;
                min-width: 70px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
            ">Назад</button>`;
        }

        if (isLast) {
            buttonsHTML += `<button class="onboarding-modal__btn onboarding-modal__btn--primary" id="onboarding-finish" style="
                background: var(--color-primary, #2e86de);
                color: white;
                padding: 12px 28px;
                border: none;
                border-radius: var(--radius-sm, 8px);
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                min-height: 44px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
            ">🚀 Начать вводное обучение</button>`;
        } else {
            buttonsHTML += `<button class="onboarding-modal__btn onboarding-modal__btn--primary" id="onboarding-next" style="
                background: var(--color-primary, #2e86de);
                color: white;
                padding: 8px 16px;
                border: none;
                border-radius: var(--radius-sm, 8px);
                font-size: 0.85rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                min-height: 38px;
                min-width: 70px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
            ">Далее →</button>`;
        }

        footer.innerHTML = buttonsHTML;
        this.bindModalEvents();
    },

    highlightElement(selector) {
        const elements = document.querySelectorAll(selector);
        if (elements.length === 0) {
            console.warn('[Onboarding] Элемент для подсветки не найден:', selector);
            return;
        }

        elements.forEach(el => {
            if (!el.dataset.originalOutline) {
                el.dataset.originalOutline = el.style.outline || '';
                el.dataset.originalBoxShadow = el.style.boxShadow || '';
                el.dataset.originalTransform = el.style.transform || '';
                el.dataset.originalZIndex = el.style.zIndex || '';
            }

            el.style.outline = '3px solid #f39c12';
            el.style.outlineOffset = '4px';
            el.style.boxShadow = '0 0 30px rgba(243, 156, 18, 0.5)';
            el.style.transform = 'scale(1.02)';
            el.style.zIndex = '9999';
            el.style.transition = 'all 0.3s ease';

            el.classList.add('onboarding-highlight');
            el.classList.add('pulse');
        });
    },

    clearHighlights() {
        document.querySelectorAll('.onboarding-highlight').forEach(el => {
            el.style.outline = el.dataset.originalOutline || '';
            el.style.outlineOffset = '';
            el.style.boxShadow = el.dataset.originalBoxShadow || '';
            el.style.transform = el.dataset.originalTransform || '';
            el.style.zIndex = el.dataset.originalZIndex || '';
            el.style.transition = '';

            el.classList.remove('onboarding-highlight');
            el.classList.remove('pulse');

            delete el.dataset.originalOutline;
            delete el.dataset.originalBoxShadow;
            delete el.dataset.originalTransform;
            delete el.dataset.originalZIndex;
        });

        document.querySelectorAll('[style*="outline: 3px solid rgb(243, 156, 18)"]').forEach(el => {
            el.style.outline = '';
            el.style.outlineOffset = '';
            el.style.boxShadow = '';
            el.style.transform = '';
            el.style.zIndex = '';
        });
    },

    bindModalEvents() {
        const nextBtn = document.getElementById('onboarding-next');
        const prevBtn = document.getElementById('onboarding-prev');
        const skipBtn = document.getElementById('onboarding-skip');
        const finishBtn = document.getElementById('onboarding-finish');
        const closeBtn = document.getElementById('onboarding-close');

        if (nextBtn) {
            nextBtn.onclick = () => {
                if (this.currentStep < this.steps.length - 1) {
                    this.currentStep++;
                    this.renderStep();
                }
            };
        }

        if (prevBtn) {
            prevBtn.onclick = () => {
                if (this.currentStep > 0) {
                    this.currentStep--;
                    this.renderStep();
                }
            };
        }

        if (skipBtn) {
            skipBtn.onclick = () => this.skipOnboarding();
        }

        if (finishBtn) {
            finishBtn.onclick = () => {
                this.startOnboardingScenario();
            };
        }

        if (closeBtn) {
            closeBtn.onclick = () => this.skipOnboarding();
        }
    },

    startOnboardingScenario() {
        if (this._isFinishing) return;
        this._isFinishing = true;

        this.close();

        const scenarios = window.allScenarios || [];
        const onboardingScenario = scenarios.find(s => s.id === 'onboarding-tutorial');

        if (!onboardingScenario) {
            console.error('[Onboarding] Сценарий онбординга не найден!');
            if (typeof showToast === 'function') {
                showToast('❌', 'Не удалось найти вводный сценарий', 'error');
            }
            this._isFinishing = false;
            return;
        }

        console.log('[Onboarding] Запуск вводного сценария:', onboardingScenario.name);

        if (typeof startScenario === 'function') {
            window._isOnboardingScenario = true;
            startScenario(onboardingScenario);
        } else {
            console.error('[Onboarding] startScenario не определена');
            if (typeof showToast === 'function') {
                showToast('❌', 'Не удалось запустить сценарий', 'error');
            }
            this._isFinishing = false;
        }
    },

    completeOnboarding() {
        localStorage.setItem(this.STORAGE_KEY, 'true');
        // Для обратной совместимости сохраняем и старые ключи
        localStorage.setItem('onboarding_tutorial_completed', 'true');
        localStorage.setItem('onboarding_completed', 'true');
        this.clearHighlights();
        console.log('[Onboarding] Онбординг завершён');
    },

    skipOnboarding() {
        this.completeOnboarding();
        this.close();
        try {
            localStorage.setItem(this.SKIP_KEY, 'true');
        } catch (_) {}
        console.log('[Onboarding] Онбординг пропущен');
    },

    open() {
        if (this.overlay) {
            this.overlay.classList.add('onboarding-overlay--visible');
            this.overlay.style.opacity = '1';
            this.overlay.style.visibility = 'visible';
            this.isOpen = true;
            document.body.style.overflow = 'hidden';
            console.log('[Onboarding] Онбординг открыт');
        }
    },

    close() {
        if (this.overlay) {
            this.overlay.classList.remove('onboarding-overlay--visible');
            this.overlay.style.opacity = '0';
            this.overlay.style.visibility = 'hidden';
            this.isOpen = false;
            document.body.style.overflow = '';
            this.clearHighlights();
            console.log('[Onboarding] Онбординг закрыт');
        }
    },

    bindEvents() {
        const btn = document.getElementById('onboarding-btn');
        const overlay = this.overlay;

        if (btn) {
            btn.addEventListener('click', () => {
                if (!this.isOpen) {
                    this.currentStep = 0;
                    this.renderStep();
                    this.open();
                } else {
                    this.close();
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

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    },

    finishOnboardingScenario() {
        this.completeOnboarding();
        window._isOnboardingScenario = false;
        console.log('[Onboarding] Вводный сценарий завершён, онбординг отмечен как пройденный');

        setTimeout(() => {
            if (typeof showToast === 'function') {
                showToast('🎉', 'Вводный сценарий пройден! Теперь вы готовы к обучению.', 'success');
            }
        }, 500);
    }
};

// Инициализация при загрузке DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Onboarding.init());
} else {
    Onboarding.init();
}
// ===== ОСНОВНАЯ ЛОГИКА ПРИЛОЖЕНИЯ =====

async function loadData() {
    // Инициализируем офлайн-индикатор
    initOfflineIndicator();
    
    try {
        const [jksRes, questionsRes, scenariosRes] = await Promise.all([
            fetch('data/jks.json'),
            fetch('data/questions.json'),
            fetch('data/scenarios.json'),
        ]);

        if (!jksRes.ok || !scenariosRes.ok) throw new Error('Ошибка загрузки данных');

        AppState.allJks = await jksRes.json();
        AppState.scenarios = await scenariosRes.json();

        if (questionsRes.ok) {
            AppState.allQuestions = await questionsRes.json();
        }

        try {
            const marketingRes = await fetch('data/marketing-steps.json');
            if (marketingRes.ok) {
                AppState.marketingData = await marketingRes.json();
            }
        } catch (e) {
            logInfo('marketing-steps.json не загружен — интерактивные шаги недоступны');
        }

        if (!User.get()) {
            User.showNamePrompt(() => {
                renderScenarios();
                addUserChangeButton();
                updateHeaderXP();
                updateHeaderUser();
            });
        } else {
            renderScenarios();
            addUserChangeButton();
            updateHeaderXP();
            updateHeaderUser();
            const user = User.get();
            showToast('👋', `С возвращением, ${user.name}!`, 'success');
            
            // Проверяем, есть ли сохранённый прогресс текущего сценария
            checkForSavedProgress();
        }

        AppState.mapProgress = document.getElementById('map-progress');
        AppState.mapProgressCount = document.getElementById('map-progress-count');
        AppState.mapProgressTotal = document.getElementById('map-progress-total');
        
        if (typeof Drawer !== 'undefined') {
            Drawer.init();
        }

        // Настройка автосохранения перед закрытием страницы
        setupAutoSave();
        
        // Инициализация аналитики
        initAnalytics();
        
        // Инициализация обработки PWA обновлений
        initPWAUpdates();

    } catch (error) {
        logError('Ошибка загрузки:', error);
        showToast('❌', 'Не удалось загрузить данные. Обновите страницу.', 'error');
    }
}

// ===== PWA ОБНОВЛЕНИЯ =====
function initPWAUpdates() {
    if (!('serviceWorker' in navigator)) return;
    
    let refreshing = false;
    let updateAvailable = false;
    let updateToast = null;
    
    // Получаем текущую версию SW
    navigator.serviceWorker.ready.then(registration => {
        registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // Новая версия установлена, но ещё не активирована
                        updateAvailable = true;
                        showUpdateNotification();
                    }
                });
            }
        });
    });
    
    // Слушаем сообщения от Service Worker
    navigator.serviceWorker.addEventListener('message', (event) => {
        const { data } = event;
        
        if (!data) return;
        
        // Новая версия доступна
        if (data.type === 'UPDATE_AVAILABLE') {
            updateAvailable = true;
            showUpdateNotification(data.version);
        }
        
        // Service Worker активирован
        if (data.type === 'SW_ACTIVATED') {
            console.log('[App] Service Worker активирован, версия:', data.version);
        }
        
        // Статус соединения
        if (data.type === 'CONNECTION_STATUS') {
            updateOfflineIndicatorUI(!data.isOnline);
        }
        
        // Версия Service Worker
        if (data.type === 'SW_VERSION') {
            console.log('[App] Текущая версия SW:', data.version);
        }
    });
    
    // Отслеживаем изменения контроллера (при обновлении SW)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        
        showToast('🔄', 'Приложение обновлено! Страница будет перезагружена.', 'success');
        
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    });
    
    // Показываем уведомление о доступном обновлении
    function showUpdateNotification(version) {
        // Не показываем, если уведомление уже показано
        if (updateToast) return;
        
        // Создаём кастомное уведомление
        const notification = document.createElement('div');
        notification.className = 'update-notification';
        notification.innerHTML = `
            <div class="update-notification__content">
                <div class="update-notification__icon">🔄</div>
                <div class="update-notification__text">
                    <strong>Доступна новая версия!</strong>
                    <span>Обновите приложение для новых функций</span>
                </div>
                <button class="update-notification__btn" id="update-now-btn">Обновить</button>
                <button class="update-notification__close" id="update-close-btn">×</button>
            </div>
        `;
        
        // Стили для уведомления
        const style = document.createElement('style');
        style.textContent = `
            .update-notification {
                position: fixed;
                bottom: 20px;
                left: 20px;
                right: 20px;
                z-index: 10000;
                animation: slideUp 0.3s ease;
                max-width: 400px;
                margin: 0 auto;
            }
            .update-notification__content {
                background: var(--color-surface);
                border-radius: var(--radius);
                padding: 16px 20px;
                display: flex;
                align-items: center;
                gap: 14px;
                box-shadow: 0 8px 24px rgba(0,0,0,0.2);
                border-left: 4px solid var(--color-primary);
            }
            .update-notification__icon {
                font-size: 1.8rem;
            }
            .update-notification__text {
                flex: 1;
                display: flex;
                flex-direction: column;
            }
            .update-notification__text strong {
                font-size: 0.9rem;
            }
            .update-notification__text span {
                font-size: 0.7rem;
                color: var(--color-text-light);
            }
            .update-notification__btn {
                background: var(--color-primary);
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 32px;
                font-size: 0.8rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            .update-notification__btn:active {
                transform: scale(0.96);
            }
            .update-notification__close {
                background: none;
                border: none;
                font-size: 1.2rem;
                cursor: pointer;
                color: var(--color-text-light);
                width: 28px;
                height: 28px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .update-notification__close:active {
                background: var(--color-border);
            }
            @keyframes slideUp {
                from {
                    transform: translateY(100px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
        `;
        
        if (!document.getElementById('update-notification-styles')) {
            style.id = 'update-notification-styles';
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        updateToast = notification;
        
        // Обработчики
        const updateBtn = document.getElementById('update-now-btn');
        const closeBtn = document.getElementById('update-close-btn');
        
        if (updateBtn) {
            updateBtn.onclick = () => {
                notification.remove();
                updateToast = null;
                // Сообщаем Service Worker о необходимости обновления
                if (navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage('skipWaiting');
                }
                showToast('🔄', 'Обновление...', 'success');
            };
        }
        
        if (closeBtn) {
            closeBtn.onclick = () => {
                notification.remove();
                updateToast = null;
            };
        }
        
        // Автоматически скрываем через 15 секунд
        setTimeout(() => {
            if (updateToast && updateToast === notification) {
                notification.remove();
                updateToast = null;
            }
        }, 15000);
    }
    
    // Периодическая проверка обновлений
    const updateCheckInterval = (typeof TIMERS !== 'undefined' && TIMERS.UPDATE_CHECK_INTERVAL_MS) 
        ? TIMERS.UPDATE_CHECK_INTERVAL_MS : 3600000;
    
    setInterval(() => {
        if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage('checkUpdate');
        }
    }, updateCheckInterval);
    
    // При возвращении на вкладку — проверяем обновления
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage('checkUpdate');
        }
    });
}

// ===== АВТОСОХРАНЕНИЕ =====
let autoSaveTimer = null;
let lastSaveState = null;

function setupAutoSave() {
    const autoSaveInterval = (typeof AUTOSAVE_CONFIG !== 'undefined' && AUTOSAVE_CONFIG.INTERVAL_MS) 
        ? AUTOSAVE_CONFIG.INTERVAL_MS : 30000;
    const saveOnBeforeUnload = (typeof AUTOSAVE_CONFIG !== 'undefined') 
        ? AUTOSAVE_CONFIG.SAVE_ON_BEFORE_UNLOAD : true;
    const saveOnVisibilityChange = (typeof AUTOSAVE_CONFIG !== 'undefined') 
        ? AUTOSAVE_CONFIG.SAVE_ON_VISIBILITY_CHANGE : true;
    
    // Сохранение перед закрытием страницы
    if (saveOnBeforeUnload) {
        window.addEventListener('beforeunload', () => {
            if (AppState.currentScenario) {
                saveCurrentProgress();
            }
        });
    }
    
    // Сохранение при скрытии страницы (мобильные)
    if (saveOnVisibilityChange) {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && AppState.currentScenario) {
                saveCurrentProgress();
            }
        });
    }
    
    // Периодическое автосохранение
    setInterval(() => {
        if (AppState.currentScenario) {
            saveCurrentProgress();
        }
    }, autoSaveInterval);
}

function saveCurrentProgress() {
    if (!AppState.currentScenario) return;
    
    const currentState = {
        scenarioId: AppState.currentScenario.id,
        stepIndex: AppState.currentStepIndex,
        stepStats: AppState.stepStats,
        quizAnswers: AppState.quizAnswers || [],
        mapPlacedJks: AppState.placedJks ? Array.from(AppState.placedJks.entries()) : []
    };
    
    // Проверяем, изменилось ли состояние
    const stateKey = JSON.stringify(currentState);
    if (lastSaveState === stateKey) return;
    
    lastSaveState = stateKey;
    
    User.saveDetailedScenarioProgress(
        AppState.currentScenario.id,
        AppState.currentStepIndex,
        AppState.stepStats,
        AppState.quizAnswers || [],
        AppState.placedJks ? Array.from(AppState.placedJks.entries()) : []
    );
    
    logInfo('Автосохранение:', AppState.currentScenario.name, 'шаг', AppState.currentStepIndex + 1);
}

function checkForSavedProgress() {
    if (!AppState.scenarios) return;
    
    // Ищем любой незавершённый сценарий
    for (const scenario of AppState.scenarios) {
        const saved = User.getDetailedScenarioProgress(scenario.id);
        if (saved && saved.stepIndex < scenario.steps.length - 1) {
            const lastStep = scenario.steps[saved.stepIndex];
            if (lastStep.type !== 'finish') {
                showToast('💾', `Найден сохранённый прогресс: "${scenario.name}"`, 'success');
                break;
            }
        }
    }
}

function startScenario(scenario) {
    // Проверяем, есть ли сохранённый прогресс для этого сценария
    const savedProgress = User.getDetailedScenarioProgress(scenario.id);
    
    if (savedProgress && savedProgress.stepIndex > 0 && savedProgress.stepIndex < scenario.steps.length - 1) {
        showContinueModal(scenario, savedProgress);
        return;
    }
    
    startScenarioFresh(scenario);
}

function startScenarioFresh(scenario) {
    AppState.currentScenario = scenario;
    AppState.currentStepIndex = 0;
    AppState.stepStats = [];
    AppState.quizAnswers = [];
    AppState.placedJks = new Map();
    AppState.scenarioStartTime = Date.now();

    if (typeof sendScenarioStart === 'function') {
        sendScenarioStart(scenario.id, scenario.name, scenario.steps.length);
    }
    
    if (typeof startStepTimer === 'function') {
        startStepTimer();
    }

    document.getElementById('scenario-screen').classList.add('hidden');
    document.getElementById('header-info').innerHTML = `${scenario.icon ? '<i class="fas ' + scenario.icon + '"></i>' : ''} ${scenario.name}`;

    ProgressBar.init();
    ProgressBar.update(0, scenario.steps.length - 1, scenario.steps);

    runStep();
}

function showContinueModal(scenario, savedProgress) {
    const overlay = document.createElement('div');
    overlay.className = 'continue-modal-overlay';
    overlay.innerHTML = `
        <div class="continue-modal">
            <div class="continue-modal__icon">💾</div>
            <h3 class="continue-modal__title">Найден сохранённый прогресс</h3>
            <p class="continue-modal__text">
                Сценарий <strong>${escapeHtml(scenario.name)}</strong> уже был начат ранее.
            </p>
            <div class="continue-modal__progress">
                <div class="continue-modal__progress-bar">
                    <div class="continue-modal__progress-fill" style="width: ${Math.round((savedProgress.stepIndex / scenario.steps.length) * 100)}%"></div>
                </div>
                <div class="continue-modal__progress-text">
                    Пройдено шагов: ${savedProgress.stepIndex + 1} из ${scenario.steps.length}
                </div>
            </div>
            <div class="continue-modal__actions">
                <button class="btn btn--primary" id="continue-modal-resume">Продолжить</button>
                <button class="btn btn--secondary" id="continue-modal-restart">Начать заново</button>
            </div>
            <button class="continue-modal__close" id="continue-modal-close">✕</button>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    if (!document.getElementById('continue-modal-styles')) {
        const style = document.createElement('style');
        style.id = 'continue-modal-styles';
        style.textContent = `
            .continue-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 3000;
                animation: fadeIn 0.3s ease;
            }
            .continue-modal {
                background: var(--color-surface);
                border-radius: var(--radius);
                max-width: 400px;
                width: 90%;
                padding: 32px 28px;
                text-align: center;
                position: relative;
                box-shadow: 0 24px 48px rgba(0, 0, 0, 0.3);
                animation: slideUp 0.4s ease;
            }
            .continue-modal__icon { font-size: 3rem; margin-bottom: 16px; }
            .continue-modal__title { font-size: 1.3rem; font-weight: 700; margin-bottom: 12px; }
            .continue-modal__text { font-size: 0.95rem; color: var(--color-text-light); margin-bottom: 20px; }
            .continue-modal__progress { margin: 20px 0; padding: 16px; background: var(--color-bg); border-radius: var(--radius-sm); }
            .continue-modal__progress-bar { height: 8px; background: var(--color-border); border-radius: 4px; overflow: hidden; margin-bottom: 8px; }
            .continue-modal__progress-fill { height: 100%; background: linear-gradient(90deg, var(--color-primary), var(--color-success)); border-radius: 4px; }
            .continue-modal__progress-text { font-size: 0.8rem; color: var(--color-text-light); }
            .continue-modal__actions { display: flex; gap: 12px; justify-content: center; margin-top: 20px; }
            .continue-modal__close { position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 1.2rem; cursor: pointer; color: var(--color-text-light); width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
            .continue-modal__close:hover { background: var(--color-border); }
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        `;
        document.head.appendChild(style);
    }
    
    const resumeBtn = document.getElementById('continue-modal-resume');
    const restartBtn = document.getElementById('continue-modal-restart');
    const closeBtn = document.getElementById('continue-modal-close');
    
    const closeModal = () => overlay.remove();
    
    resumeBtn?.addEventListener('click', () => {
        closeModal();
        
        AppState.currentScenario = scenario;
        AppState.currentStepIndex = savedProgress.stepIndex;
        AppState.stepStats = savedProgress.stepStats || [];
        AppState.quizAnswers = savedProgress.quizAnswers || [];
        
        if (savedProgress.mapPlacedJks && savedProgress.mapPlacedJks.length > 0) {
            AppState.placedJks = new Map(savedProgress.mapPlacedJks);
        }
        
        AppState.scenarioStartTime = Date.now();
        
        if (typeof startStepTimer === 'function') {
            startStepTimer();
        }
        
        document.getElementById('scenario-screen').classList.add('hidden');
        document.getElementById('header-info').innerHTML = `${scenario.icon ? '<i class="fas ' + scenario.icon + '"></i>' : ''} ${scenario.name}`;
        
        ProgressBar.init();
        ProgressBar.update(savedProgress.stepIndex, scenario.steps.length - 1, scenario.steps);
        
        runStep();
    });
    
    restartBtn?.addEventListener('click', () => {
        closeModal();
        User.clearScenarioProgress(scenario.id);
        startScenarioFresh(scenario);
    });
    
    closeBtn?.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });
}

function runStep() {
    if (AppState.currentStepIndex >= AppState.currentScenario.steps.length) {
        showFinish();
        return;
    }

    const step = AppState.currentScenario.steps[AppState.currentStepIndex];

    document.getElementById('map-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.add('hidden');
    document.getElementById('client-journey-screen').classList.add('hidden');
    document.getElementById('finish-screen').classList.add('hidden');

    if (step.type !== 'finish') {
        ProgressBar.show();
        ProgressBar.update(AppState.currentStepIndex, AppState.currentScenario.steps.length - 1, AppState.currentScenario.steps);
    }

    if (step.type === 'finish') {
        showFinish();
        return;
    }

    if (typeof startStepTimer === 'function') {
        startStepTimer();
    }

    const handled = StepRegistry.run(step, AppState);
    
    if (!handled) {
        logWarn(`Неизвестный тип шага: ${step.type}, пропускаем`);
        AppState.currentStepIndex++;
        runStep();
    }
}

function updateHeaderAfterXP(xpResult) {
    if (xpResult && xpResult.leveledUp) {
        showToast('🎉', `Поздравляем! Вы достигли ${xpResult.newLevel} уровня!`, 'success');
    }
    if (typeof updateHeaderXP === 'function') {
        updateHeaderXP();
    }
    if (typeof updateContinueLearning === 'function') {
        updateContinueLearning();
    }
    if (typeof refreshMainScreen === 'function') {
        refreshMainScreen();
    }
}

function showFinish() {
    document.getElementById('map-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.add('hidden');
    document.getElementById('client-journey-screen').classList.add('hidden');
    document.getElementById('finish-screen').classList.remove('hidden');
    document.getElementById('header-info').innerHTML = AppState.currentScenario?.name || '';
    ProgressBar.hide();

    const totalCorrect = AppState.stepStats.reduce((sum, s) => {
        if (s.type === 'map') return sum + s.placed;
        return sum + (s.correct || 0);
    }, 0);

    const totalItems = AppState.stepStats.reduce((sum, s) => {
        if (s.type === 'map') return sum + s.total;
        return sum + (s.total || 0);
    }, 0);

    const isPerfect = totalCorrect === totalItems && totalItems > 0;
    const durationSec = AppState.scenarioStartTime
        ? Math.round((Date.now() - AppState.scenarioStartTime) / 1000)
        : 0;

    document.getElementById('finish-text').textContent = `Вы успешно завершили сценарий «${AppState.currentScenario?.name}»!`;
    document.getElementById('finish-stats').textContent = `Правильно: ${totalCorrect} из ${totalItems}`;

    if (typeof sendScenarioComplete === 'function' && AppState.currentScenario) {
        sendScenarioComplete(
            AppState.currentScenario.id,
            AppState.currentScenario.name,
            AppState.currentStepIndex + 1,
            AppState.currentScenario.steps.length,
            totalCorrect,
            isPerfect
        );
    }

    const xpResult = User.sendResult(
        AppState.currentScenario?.name || '',
        AppState.stepStats,
        totalCorrect,
        totalItems,
        durationSec
    );
    
    if (xpResult) {
        updateHeaderAfterXP(xpResult);
    }
    
    if (AppState.currentScenario?.id) {
        User.clearScenarioProgress(AppState.currentScenario.id);
    }

    if (AppState.currentScenario?.badge) {
        const isNew = Badges.award(AppState.currentScenario.badge);
        if (isNew) {
            Badges.showBadgeToast(AppState.currentScenario.badge);
        }
        Badges.renderOnFinish('.finish-content');
    }

    if (isPerfect && totalItems > 5) {
        const perfectBadge = 'Идеальное прохождение';
        const isNewPerfect = Badges.award(perfectBadge);
        if (isNewPerfect) {
            setTimeout(() => Badges.showBadgeToast(perfectBadge), 2000);
        }
    }
    
    if (typeof refreshMainScreen === 'function') {
        setTimeout(() => refreshMainScreen(), 500);
    }
}

function exitToScenarios() {
    if (AppState.currentScenario && typeof sendScenarioDropOff === 'function') {
        sendScenarioDropOff(
            AppState.currentScenario.id,
            AppState.currentScenario.name,
            AppState.currentStepIndex,
            AppState.currentScenario.steps.length,
            AppState.currentScenario.steps[AppState.currentStepIndex]?.type
        );
    }
    
    saveCurrentProgress();
    AppState.currentScenario = null;
    AppState.placedJks = new Map();
    document.getElementById('map-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.add('hidden');
    document.getElementById('client-journey-screen').classList.add('hidden');
    document.getElementById('finish-screen').classList.add('hidden');
    document.getElementById('scenario-screen').classList.remove('hidden');
    document.getElementById('header-info').innerHTML = '';
    ProgressBar.hide();
    if (typeof renderScenarios === 'function') {
        renderScenarios();
    }
}

function initAnalytics() {
    window.addEventListener('beforeunload', () => {
        if (AppState.currentScenario && typeof sendScenarioDropOff === 'function') {
            sendScenarioDropOff(
                AppState.currentScenario.id,
                AppState.currentScenario.name,
                AppState.currentStepIndex,
                AppState.currentScenario.steps.length,
                AppState.currentScenario.steps[AppState.currentStepIndex]?.type
            );
        }
    });
    
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && AppState.currentScenario && typeof sendScenarioDropOff === 'function') {
            sendScenarioDropOff(
                AppState.currentScenario.id,
                AppState.currentScenario.name,
                AppState.currentStepIndex,
                AppState.currentScenario.steps.length,
                AppState.currentScenario.steps[AppState.currentStepIndex]?.type
            );
        }
    });
}

// Обработчики кнопок
document.getElementById('journey-back-btn')?.addEventListener('click', exitToScenarios);
document.getElementById('back-to-scenarios-btn')?.addEventListener('click', exitToScenarios);
document.getElementById('quiz-back-btn')?.addEventListener('click', exitToScenarios);
document.getElementById('finish-scenarios-btn')?.addEventListener('click', exitToScenarios);

document.getElementById('finish-restart-btn')?.addEventListener('click', () => {
    if (AppState.currentScenario) {
        User.clearScenarioProgress(AppState.currentScenario.id);
        AppState.currentStepIndex = 0;
        AppState.stepStats = [];
        AppState.quizAnswers = [];
        AppState.placedJks = new Map();
        AppState.scenarioStartTime = Date.now();
        document.getElementById('finish-screen').classList.add('hidden');
        runStep();
    }
});

const hintBtn = document.getElementById('hint-btn');
if (hintBtn) {
    hintBtn.addEventListener('click', () => {
        if (AppState.selectedJkId === null) return;
        const jk = AppState.allJks.find(j => j.id === AppState.selectedJkId);
        if (jk) {
            showToast('💡', jk.hint, 'error');
            if (typeof sendHintUsed === 'function') {
                sendHintUsed('map', 'Расстановка ЖК', 'location_hint');
            }
        }
    });
}

const resetBtn = document.getElementById('reset-step-btn');
if (resetBtn) {
    resetBtn.addEventListener('click', resetMapStep);
}

// ===== PWA INSTALL =====
function setupPWAInstall() {
    let deferredPrompt;
    
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        const installDelay = (typeof TIMERS !== 'undefined' && TIMERS.INSTALL_PROMPT_DELAY_MS) 
            ? TIMERS.INSTALL_PROMPT_DELAY_MS : 10000;
        
        setTimeout(() => {
            if (deferredPrompt && !localStorage.getItem('pwa-install-dismissed')) {
                showInstallButton(deferredPrompt);
            }
        }, installDelay);
    });
    
    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        localStorage.setItem('pwa-installed', 'true');
        showToast('✅', 'Приложение установлено на ваш телефон!', 'success');
    });
}

function showInstallButton(promptEvent) {
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (localStorage.getItem('pwa-installed')) return;
    
    const btnDisplayTime = (typeof TIMERS !== 'undefined' && TIMERS.INSTALL_BTN_DISPLAY_MS) 
        ? TIMERS.INSTALL_BTN_DISPLAY_MS : 15000;
    
    const btn = document.createElement('button');
    btn.innerHTML = '<i class="fas fa-download"></i> Установить приложение';
    btn.className = 'btn btn--primary';
    btn.style.position = 'fixed';
    btn.style.bottom = '80px';
    btn.style.left = '50%';
    btn.style.transform = 'translateX(-50%)';
    btn.style.zIndex = '1000';
    btn.style.padding = '12px 24px';
    btn.style.borderRadius = '32px';
    btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    btn.style.animation = 'pulse 1.5s infinite';
    
    btn.addEventListener('click', async () => {
        btn.remove();
        localStorage.setItem('pwa-install-dismissed', 'true');
        promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        if (outcome === 'accepted') {
            showToast('✅', 'Спасибо за установку!', 'success');
        }
        promptEvent = null;
    });
    
    document.body.appendChild(btn);
    
    setTimeout(() => {
        if (document.body.contains(btn)) btn.remove();
    }, btnDisplayTime);
}

// Pulse стиль для кнопки установки
if (!document.getElementById('pulse-style')) {
    const pulseStyle = document.createElement('style');
    pulseStyle.id = 'pulse-style';
    pulseStyle.textContent = `
        @keyframes pulse {
            0%, 100% { transform: translateX(-50%) scale(1); opacity: 1; }
            50% { transform: translateX(-50%) scale(1.05); opacity: 0.9; }
        }
    `;
    document.head.appendChild(pulseStyle);
}

if ('serviceWorker' in navigator) {
    setupPWAInstall();
    
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                logInfo('Service Worker зарегистрирован:', registration.scope);
                
                const updateInterval = (typeof TIMERS !== 'undefined' && TIMERS.UPDATE_CHECK_INTERVAL_MS) 
                    ? TIMERS.UPDATE_CHECK_INTERVAL_MS : 3600000;
                
                setInterval(() => {
                    registration.update();
                }, updateInterval);
                
                document.addEventListener('visibilitychange', () => {
                    if (!document.hidden) {
                        registration.update();
                    }
                });
            })
            .catch(error => {
                logError('Ошибка регистрации Service Worker:', error);
            });
    });
}

document.addEventListener('DOMContentLoaded', loadData);

// ===== ОФЛАЙН-ИНДИКАТОР =====
function initOfflineIndicator() {
    const indicator = document.getElementById('offline-indicator');
    if (!indicator) return;
    
    function updateOfflineIndicatorUI(isOffline) {
        if (!indicator) return;
        if (isOffline) {
            indicator.classList.add('offline-indicator--visible');
        } else {
            indicator.classList.remove('offline-indicator--visible');
        }
    }
    
    function updateOfflineIndicator(isOnline) {
        if (!indicator) return;
        if (!isOnline) {
            indicator.classList.add('offline-indicator--visible');
            showToast('📡', 'Нет соединения с интернетом. Данные сохраняются локально.', 'error', false);
        } else {
            indicator.classList.remove('offline-indicator--visible');
            // Проверяем, есть ли неотправленные запросы в очереди
            if (typeof OfflineQueue !== 'undefined' && OfflineQueue.hasPendingRequests && OfflineQueue.hasPendingRequests()) {
                showToast('📤', 'Соединение восстановлено. Отправка накопленных данных...', 'success');
                OfflineQueue.processQueue();
            }
        }
    }
    
    updateOfflineIndicatorUI(!navigator.onLine);
    
    window.addEventListener('online', () => {
        updateOfflineIndicator(true);
        if (window.User && window.User.sendPendingResults) {
            window.User.sendPendingResults();
        }
    });
    
    window.addEventListener('offline', () => {
        updateOfflineIndicator(false);
    });
    
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'CONNECTION_STATUS') {
                updateOfflineIndicator(event.data.isOnline);
                updateOfflineIndicatorUI(!event.data.isOnline);
            }
        });
        
        navigator.serviceWorker.controller.postMessage('getConnectionStatus');
    }
}
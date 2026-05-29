// ===== ОСНОВНАЯ ЛОГИКА ПРИЛОЖЕНИЯ =====

async function loadData() {
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

    } catch (error) {
        logError('Ошибка загрузки:', error);
        showToast('❌', 'Не удалось загрузить данные. Обновите страницу.', 'error');
    }
}

// ===== АВТОСОХРАНЕНИЕ =====
let autoSaveTimer = null;
let lastSaveState = null;

function setupAutoSave() {
    // Сохранение перед закрытием страницы
    window.addEventListener('beforeunload', () => {
        if (AppState.currentScenario) {
            saveCurrentProgress();
        }
    });
    
    // Сохранение при скрытии страницы (мобильные)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && AppState.currentScenario) {
            saveCurrentProgress();
        }
    });
    
    // Периодическое автосохранение (каждые 30 секунд)
    setInterval(() => {
        if (AppState.currentScenario) {
            saveCurrentProgress();
        }
    }, 30000);
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
                // Не запускаем автоматически, просто показываем уведомление
                // Пользователь сам решит продолжить через герой-блок
                break;
            }
        }
    }
}

function startScenario(scenario) {
    // Проверяем, есть ли сохранённый прогресс для этого сценария
    const savedProgress = User.getDetailedScenarioProgress(scenario.id);
    
    if (savedProgress && savedProgress.stepIndex > 0 && savedProgress.stepIndex < scenario.steps.length - 1) {
        // Спрашиваем, продолжить или начать заново
        if (confirm(`У вас есть сохранённый прогресс сценария "${scenario.name}" (шаг ${savedProgress.stepIndex + 1} из ${scenario.steps.length}).\n\nПродолжить с сохранённого места?`)) {
            AppState.currentScenario = scenario;
            AppState.currentStepIndex = savedProgress.stepIndex;
            AppState.stepStats = savedProgress.stepStats || [];
            AppState.quizAnswers = savedProgress.quizAnswers || [];
            
            // Восстанавливаем прогресс карты, если есть
            if (savedProgress.mapPlacedJks && savedProgress.mapPlacedJks.length > 0) {
                AppState.placedJks = new Map(savedProgress.mapPlacedJks);
            }
            
            AppState.scenarioStartTime = Date.now();
            
            document.getElementById('scenario-screen').classList.add('hidden');
            document.getElementById('header-info').innerHTML = `${scenario.icon ? '<i class="fas ' + scenario.icon + '"></i>' : ''} ${scenario.name}`;
            
            ProgressBar.init();
            ProgressBar.update(savedProgress.stepIndex, scenario.steps.length - 1, scenario.steps);
            
            runStep();
            return;
        } else {
            // Начинаем заново — очищаем сохранённый прогресс
            User.clearScenarioProgress(scenario.id);
        }
    }
    
    // Новый запуск
    AppState.currentScenario = scenario;
    AppState.currentStepIndex = 0;
    AppState.stepStats = [];
    AppState.quizAnswers = [];
    AppState.placedJks = new Map();
    AppState.scenarioStartTime = Date.now();

    document.getElementById('scenario-screen').classList.add('hidden');
    document.getElementById('header-info').innerHTML = `${scenario.icon ? '<i class="fas ' + scenario.icon + '"></i>' : ''} ${scenario.name}`;

    ProgressBar.init();
    ProgressBar.update(0, scenario.steps.length - 1, scenario.steps);

    runStep();
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
    
    // Обновляем главный экран после завершения
    if (typeof refreshMainScreen === 'function') {
        setTimeout(() => refreshMainScreen(), 500);
    }
}

// ===== НАВИГАЦИЯ =====
function exitToScenarios() {
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

// Обработчики кнопок
document.getElementById('journey-back-btn')?.addEventListener('click', exitToScenarios);
document.getElementById('back-to-scenarios-btn')?.addEventListener('click', exitToScenarios);
document.getElementById('quiz-back-btn')?.addEventListener('click', exitToScenarios);
document.getElementById('finish-scenarios-btn')?.addEventListener('click', exitToScenarios);

document.getElementById('finish-restart-btn')?.addEventListener('click', () => {
    if (AppState.currentScenario) {
        // Очищаем сохранённый прогресс перед перезапуском
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
        if (jk) showToast('💡', jk.hint, 'error');
    });
}

const resetBtn = document.getElementById('reset-step-btn');
if (resetBtn) {
    resetBtn.addEventListener('click', resetMapStep);
}

// ===== PWA =====
function setupPWAUpdates() {
  if (!('serviceWorker' in navigator)) return;
  
  let refreshing = false;
  
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    
    showToast('🔄', 'Доступна новая версия! Обновляем...', 'success');
    
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  });
  
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage('checkUpdate');
    }
  });
}

function setupPWAInstall() {
  let deferredPrompt;
  
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    setTimeout(() => {
      if (deferredPrompt && !localStorage.getItem('pwa-install-dismissed')) {
        showInstallButton(deferredPrompt);
      }
    }, 10000);
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
  }, 15000);
}

const pulseStyle = document.createElement('style');
pulseStyle.textContent = `
  @keyframes pulse {
    0%, 100% { transform: translateX(-50%) scale(1); opacity: 1; }
    50% { transform: translateX(-50%) scale(1.05); opacity: 0.9; }
  }
`;
document.head.appendChild(pulseStyle);

if ('serviceWorker' in navigator) {
  setupPWAUpdates();
  setupPWAInstall();
  
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        logInfo('Service Worker зарегистрирован:', registration.scope);
        
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
        
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
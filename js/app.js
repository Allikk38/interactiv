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
            console.log('marketing-steps.json не загружен — интерактивные шаги недоступны');
        }

        if (!User.get()) {
            User.showNamePrompt(() => {
                renderScenarios();
                addUserChangeButton();
            });
        } else {
            renderScenarios();
            addUserChangeButton();
            const user = User.get();
            showToast('👋', `С возвращением, ${user.name}!`, 'success');
        }

        AppState.mapProgress = document.getElementById('map-progress');
        AppState.mapProgressCount = document.getElementById('map-progress-count');
        AppState.mapProgressTotal = document.getElementById('map-progress-total');
        
        if (typeof Drawer !== 'undefined') {
            Drawer.init();
        }

    } catch (error) {
        console.error('Ошибка загрузки:', error);
        showToast('❌', 'Не удалось загрузить данные. Обновите страницу.', 'error');
    }
}

function startScenario(scenario) {
    AppState.currentScenario = scenario;
    AppState.currentStepIndex = 0;
    AppState.stepStats = [];
    AppState.scenarioStartTime = Date.now();

    document.getElementById('scenario-screen').classList.add('hidden');
    document.getElementById('header-info').textContent = `${scenario.icon ? '<i class="fas ' + scenario.icon + '"></i>' : ''} ${scenario.name}`;

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

    switch (step.type) {
        case 'brief': runBriefStep(step); break;
        case 'matching': runMatchingStep(step); break;
        case 'pipeline': runPipelineStep(step); break;
        case 'dialogue': runDialogueStep(step); break;
        case 'map': runMapStep(step); break;
        case 'quiz': runQuizStep(step); break;
        case 'platforms': runPlatformsStep(step); break;
        case 'rule3t': runRule3tStep(step); break;
        case 'profile': runProfileStep(step); break;
        case 'content-plan': runContentPlanStep(step); break;
        case 'funnel': runFunnelStep(step); break;
        case 'ai-tools': runAiToolsStep(step); break;
        case 'analytics': runAnalyticsStep(step); break;
        case 'client-journey': runClientJourneyStep(step); break;
        case 'finish': showFinish(); break;
        default: AppState.currentStepIndex++; runStep();
    }
}

function showFinish() {
    document.getElementById('map-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.add('hidden');
    document.getElementById('client-journey-screen').classList.add('hidden');
    document.getElementById('finish-screen').classList.remove('hidden');
    document.getElementById('header-info').textContent = AppState.currentScenario?.name || '';
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

    User.sendResult(
        AppState.currentScenario?.name || '',
        AppState.stepStats,
        totalCorrect,
        totalItems,
        durationSec
    );

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
}

// Обработчики для кнопки возврата на клиентском пути
document.getElementById('journey-back-btn')?.addEventListener('click', () => {
    AppState.currentScenario = null;
    document.getElementById('client-journey-screen').classList.add('hidden');
    document.getElementById('scenario-screen').classList.remove('hidden');
    document.getElementById('header-info').textContent = '';
    ProgressBar.hide();
});

// Остальные обработчики
document.getElementById('back-to-scenarios-btn').addEventListener('click', () => {
    AppState.currentScenario = null;
    document.getElementById('map-screen').classList.add('hidden');
    document.getElementById('scenario-screen').classList.remove('hidden');
    document.getElementById('header-info').textContent = '';
    ProgressBar.hide();
});

document.getElementById('quiz-back-btn').addEventListener('click', () => {
    AppState.currentScenario = null;
    document.getElementById('quiz-screen').classList.add('hidden');
    document.getElementById('scenario-screen').classList.remove('hidden');
    document.getElementById('header-info').textContent = '';
    ProgressBar.hide();
});

document.getElementById('finish-restart-btn').addEventListener('click', () => {
    if (AppState.currentScenario) {
        AppState.currentStepIndex = 0;
        AppState.stepStats = [];
        AppState.scenarioStartTime = Date.now();
        document.getElementById('finish-screen').classList.add('hidden');
        runStep();
    }
});

document.getElementById('finish-scenarios-btn').addEventListener('click', () => {
    AppState.currentScenario = null;
    document.getElementById('finish-screen').classList.add('hidden');
    document.getElementById('scenario-screen').classList.remove('hidden');
    document.getElementById('header-info').textContent = '';
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

// ===== PWA: ОБРАБОТКА ОБНОВЛЕНИЙ =====
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
  
  let swRegistration;
  
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        swRegistration = registration;
        console.log('Service Worker зарегистрирован:', registration.scope);
        
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
        console.error('Ошибка регистрации Service Worker:', error);
      });
  });
}

document.addEventListener('DOMContentLoaded', loadData);

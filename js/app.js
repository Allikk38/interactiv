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
    document.getElementById('header-info').textContent = `${scenario.icon || '📋'} ${scenario.name}`;

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
        case 'finish': showFinish(); break;
        default: AppState.currentStepIndex++; runStep();
    }
}

function showFinish() {
    document.getElementById('map-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.add('hidden');
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
        const perfectBadge = '🎯 Идеальное прохождение';
        const isNewPerfect = Badges.award(perfectBadge);
        if (isNewPerfect) {
            setTimeout(() => Badges.showBadgeToast(perfectBadge), 2000);
        }
    }
}

// ===== ОБРАБОТЧИКИ СОБЫТИЙ =====
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

// ===== СТАРТ =====
document.addEventListener('DOMContentLoaded', loadData);
// ===== ПРОДОЛЖИТЬ ОБУЧЕНИЕ =====

function updateContinueLearning() {
    const container = document.getElementById('continue-learning');
    if (!container) return;
    
    const user = User.get();
    if (!user) {
        container.style.display = 'none';
        container.classList.remove('continue-learning--visible');
        return;
    }
    
    let lastScenario = null;
    let lastProgress = null;
    
    const sortedScenarios = sortScenarios(allScenarios);
    
    for (const scenario of sortedScenarios) {
        const progress = User.getScenarioProgress(scenario.id);
        if (progress && progress.stepIndex < scenario.steps.length - 1) {
            const lastStep = scenario.steps[progress.stepIndex];
            if (lastStep.type !== 'finish') {
                lastScenario = scenario;
                lastProgress = progress;
                break;
            }
        }
    }
    
    if (!lastScenario || !lastProgress) {
        container.style.display = 'none';
        container.classList.remove('continue-learning--visible');
        return;
    }
    
    container.style.display = 'block';
    container.classList.add('continue-learning--visible');
    
    const greetingEl = document.getElementById('continue-greeting');
    const subEl = document.getElementById('continue-sub');
    const titleEl = document.getElementById('continue-title');
    const descEl = document.getElementById('continue-desc');
    const progressFill = document.getElementById('continue-progress-fill');
    const progressText = document.getElementById('continue-progress-text');
    const continueBtn = document.getElementById('continue-btn');
    
    if (greetingEl) greetingEl.textContent = `👋 С возвращением, ${user.name.split(' ')[0]}!`;
    if (subEl) subEl.textContent = 'Продолжите с того места, где остановились';
    if (titleEl) titleEl.textContent = lastScenario.name;
    if (descEl) descEl.textContent = lastScenario.description;
    
    const totalSteps = lastScenario.steps.length;
    const currentStep = lastProgress.stepIndex;
    const percent = Math.round((currentStep / totalSteps) * 100);
    
    if (progressFill) progressFill.style.width = `${percent}%`;
    if (progressText) progressText.textContent = `${percent}% завершено (шаг ${currentStep + 1} из ${totalSteps})`;
    
    if (continueBtn) {
        continueBtn.onclick = () => {
            AppState.currentScenario = lastScenario;
            AppState.currentStepIndex = lastProgress.stepIndex;
            AppState.stepStats = lastProgress.stepStats || [];
            AppState.scenarioStartTime = Date.now();
            
            document.getElementById('scenario-screen').classList.add('hidden');
            document.getElementById('header-info').innerHTML = `${lastScenario.icon ? '<i class="fas ' + lastScenario.icon + '"></i>' : ''} ${lastScenario.name}`;
            
            ProgressBar.init();
            ProgressBar.update(lastProgress.stepIndex, lastScenario.steps.length - 1, lastScenario.steps);
            ProgressBar.show();
            
            if (typeof runStep === 'function') runStep();
        };
    }
}
// ===== ШПАРГАЛКИ ПЕРЕД ШАГОМ =====
function runBriefStep(step) {
    const scenario = AppState.currentScenario;
    if (!scenario.briefs || !scenario.briefs[step.briefKey]) {
        AppState.currentStepIndex++;
        runStep();
        return;
    }

    const brief = scenario.briefs[step.briefKey];
    const quizScreen = document.getElementById('quiz-screen');
    const quizStepTitle = document.getElementById('quiz-step-title');
    const quizStepCounter = document.getElementById('quiz-step-counter');
    const quizContainer = document.getElementById('quiz-container');

    quizScreen.classList.remove('hidden');
    quizStepTitle.textContent = brief.title;
    quizStepCounter.textContent = `Шаг ${AppState.currentStepIndex + 1} из ${AppState.currentScenario.steps.length}`;

    quizContainer.innerHTML = `
        <div class="brief-card">
            <div class="brief-card__icon">📖</div>
            <h2 class="brief-card__title">${brief.title}</h2>
            <div class="brief-card__text">${brief.text}</div>
            <div class="brief-card__hint">Прочитайте внимательно — дальше будут вопросы по этой теме!</div>
            <button class="btn btn--primary" id="brief-continue-btn">Понятно, дальше →</button>
        </div>
    `;

    document.getElementById('brief-continue-btn').addEventListener('click', () => {
        AppState.currentStepIndex++;
        runStep();
    });
}

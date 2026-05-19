// ===== ШПАРГАЛКИ ПЕРЕД ШАГОМ =====
function runBriefStep(step) {
    const scenario = currentScenario;
    if (!scenario.briefs || !scenario.briefs[step.briefKey]) {
        // Если шпаргалки нет — пропускаем
        currentStepIndex++;
        runStep();
        return;
    }

    const brief = scenario.briefs[step.briefKey];

    quizScreen.classList.remove('hidden');
    quizStepTitle.textContent = brief.title;
    quizStepCounter.textContent = `Шаг ${currentStepIndex + 1} из ${currentScenario.steps.length}`;

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
        currentStepIndex++;
        runStep();
    });
}

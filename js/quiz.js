// ===== ЛОГИКА ВИКТОРИН =====

function runQuizStep(step) {
    const quizScreen = document.getElementById('quiz-screen');
    const quizStepTitle = document.getElementById('quiz-step-title');
    const quizStepCounter = document.getElementById('quiz-step-counter');
    
    quizScreen.classList.remove('hidden');
    
    const questionIds = step.question_ids || [];
    const filteredQuestions = questionIds.length > 0
        ? AppState.allQuestions.filter(q => questionIds.includes(q.id))
        : AppState.allQuestions;
    
    quizStepTitle.textContent = step.title;
    quizStepCounter.textContent = `Шаг ${AppState.currentStepIndex + 1} из ${AppState.currentScenario.steps.length}`;
    
    AppState.currentStepQuestions = filteredQuestions;
    AppState.currentQuestionIndex = 0;
    AppState.quizAnswers = [];
    
    renderQuestion(0);
}

function renderQuestion(index) {
    const questions = AppState.currentStepQuestions;
    const quizContainer = document.getElementById('quiz-container');
    const quizNextBtn = document.getElementById('quiz-next-btn');
    
    if (index >= questions.length) {
        finishQuizStep();
        return;
    }
    
    AppState.currentQuestionIndex = index;
    const q = questions[index];
    quizNextBtn.disabled = true;
    quizNextBtn.textContent = 'Проверить';
    
    const isCheckbox = q.type === 'multiple';
    
    // Используем шаблон для генерации HTML
    quizContainer.innerHTML = renderQuizQuestion(q, index, isCheckbox);
    
    const options = quizContainer.querySelectorAll('.quiz-option');
    const hintEl = document.getElementById('quiz-hint');
    let checked = false;

    options.forEach(opt => {
        opt.addEventListener('click', () => {
            if (checked) return;
            const input = opt.querySelector('input');
            if (isCheckbox) {
                input.checked = !input.checked;
                if (input.checked) {
                    opt.classList.add('quiz-option--selected');
                } else {
                    opt.classList.remove('quiz-option--selected');
                }
            } else {
                options.forEach(o => o.classList.remove('quiz-option--selected'));
                input.checked = true;
                opt.classList.add('quiz-option--selected');
            }
            const anyChecked = quizContainer.querySelectorAll('input:checked').length > 0;
            quizNextBtn.disabled = !anyChecked;
        });
    });

    quizNextBtn.onclick = () => {
        if (!checked) {
            const selectedInputs = quizContainer.querySelectorAll('input:checked');
            const userAnswers = Array.from(selectedInputs).map(inp => inp.value);
            const isCorrect = checkQuizAnswer(q, userAnswers);
            AppState.quizAnswers.push({ questionId: q.id, userAnswers, isCorrect });

            options.forEach(opt => {
                opt.style.pointerEvents = 'none';
                const inp = opt.querySelector('input');
                const value = inp.value;
                if (q.type === 'single') {
                    if (value === q.correct) opt.classList.add('quiz-option--correct');
                    if (value === userAnswers[0] && value !== q.correct) opt.classList.add('quiz-option--wrong');
                } else {
                    if (q.correct.includes(value)) opt.classList.add('quiz-option--correct');
                    if (userAnswers.includes(value) && !q.correct.includes(value)) opt.classList.add('quiz-option--wrong');
                }
            });

            if (!isCorrect) {
                hintEl.innerHTML = renderQuizHint(q.hint);
                hintEl.classList.remove('hidden');
            }

            checked = true;
            quizNextBtn.textContent = index < questions.length - 1 ? 'Далее' : 'Завершить';
        } else {
            renderQuestion(index + 1);
        }
    };
}

function checkQuizAnswer(question, userAnswers) {
    if (question.type === 'single') return userAnswers[0] === question.correct;
    if (question.type === 'multiple') {
        const sortedCorrect = [...question.correct].sort();
        const sortedUser = [...userAnswers].sort();
        return sortedCorrect.join(',') === sortedUser.join(',');
    }
    return false;
}

function finishQuizStep() {
    const correctCount = AppState.quizAnswers.filter(a => a.isCorrect).length;
    const totalCount = AppState.quizAnswers.length;
    
    AppState.stepStats.push({
        step: AppState.currentStepIndex + 1,
        type: 'quiz',
        title: AppState.currentScenario.steps[AppState.currentStepIndex].title,
        correct: correctCount,
        total: totalCount,
    });
    
    showToast('🎉', `Викторина пройдена! ${correctCount}/${totalCount} правильно.`, 'success');
    
    setTimeout(() => {
        AppState.currentStepIndex++;
        runStep();
    }, 2000);
}

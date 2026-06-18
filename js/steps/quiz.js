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
    
    // Загружаем сохранённые ответы для этого сценария
    loadSavedQuizAnswers();
    
    renderQuestion(0);
}

// Загрузка сохранённых ответов
function loadSavedQuizAnswers() {
    const scenarioId = AppState.currentScenario?.id;
    if (!scenarioId) return;
    
    const savedAnswers = User.getQuizAnswers(scenarioId);
    if (Object.keys(savedAnswers).length === 0) return;
    
    AppState.savedQuizAnswers = savedAnswers;
    logInfo(`Загружено ${Object.keys(savedAnswers).length} сохранённых ответов`);
}

// Сохранение ответа на вопрос
function saveQuizAnswer(questionId, userAnswer, isCorrect) {
    const scenarioId = AppState.currentScenario?.id;
    if (!scenarioId) return;
    
    User.saveQuizAnswer(scenarioId, questionId, userAnswer, isCorrect);
    
    // Автосохранение прогресса сценария
    if (typeof saveCurrentProgress === 'function') {
        saveCurrentProgress();
    }
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
    
    quizContainer.innerHTML = renderQuizQuestion(q, index, isCheckbox);
    
    const options = quizContainer.querySelectorAll('.quiz-option');
    const hintEl = document.getElementById('quiz-hint');
    let checked = false;
    let questionStartTime = Date.now(); // Засекаем время на вопрос
    
    // Восстанавливаем сохранённый ответ, если есть
    const savedAnswer = getSavedAnswerForQuestion(q.id);
    if (savedAnswer) {
        restoreSavedAnswer(savedAnswer, options, isCheckbox);
    }

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
            
            // Рассчитываем время на вопрос
            const timeSpentOnQuestion = (Date.now() - questionStartTime) / 1000;
            
            // Отправляем детальную аналитику ответа
            if (typeof sendQuizAnswer === 'function') {
                sendQuizAnswer(
                    q.id,
                    q.text,
                    userAnswers,
                    isCorrect,
                    Math.round(timeSpentOnQuestion),
                    false // hint_used — можно расширить позже
                );
            }
            
            // Сохраняем ответ
            saveQuizAnswer(q.id, userAnswers, isCorrect);
            
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

// Получение сохранённого ответа для вопроса
function getSavedAnswerForQuestion(questionId) {
    if (!AppState.savedQuizAnswers) return null;
    const saved = AppState.savedQuizAnswers[questionId];
    if (saved && saved.answer) {
        return saved.answer;
    }
    return null;
}

// Восстановление сохранённого ответа
function restoreSavedAnswer(savedAnswer, options, isCheckbox) {
    if (!savedAnswer) return;
    
    const savedAnswersArray = Array.isArray(savedAnswer) ? savedAnswer : [savedAnswer];
    
    options.forEach(opt => {
        const input = opt.querySelector('input');
        const value = input.value;
        
        if (savedAnswersArray.includes(value)) {
            input.checked = true;
            opt.classList.add('quiz-option--selected');
        }
    });
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
    
    // Отправляем аналитику результата шага
    if (typeof sendStepResult === 'function') {
        sendStepResult(
            AppState.currentStepIndex,
            'quiz',
            AppState.currentScenario.steps[AppState.currentStepIndex].title,
            correctCount,
            totalCount
        );
    }
    
    // Фиксируем время окончания шага
    if (typeof endStepTimer === 'function') {
        endStepTimer(true, { correct: correctCount, total: totalCount });
    }
    
    AppState.stepStats.push({
        step: AppState.currentStepIndex + 1,
        type: 'quiz',
        title: AppState.currentScenario.steps[AppState.currentStepIndex].title,
        correct: correctCount,
        total: totalCount,
    });
    
    if (typeof saveCurrentProgress === 'function') {
        saveCurrentProgress();
    }
    
    if (typeof updateHeaderXP === 'function') {
        updateHeaderXP();
    }
    
    showToast('🎉', `Викторина пройдена! ${correctCount}/${totalCount} правильно.`, 'success');
    
    // Очищаем сохранённые ответы после успешного завершения
    const scenarioId = AppState.currentScenario?.id;
    if (scenarioId) {
        User.clearQuizAnswers(scenarioId);
    }
    
    setTimeout(() => {
        AppState.currentStepIndex++;
        runStep();
    }, 2000);
}
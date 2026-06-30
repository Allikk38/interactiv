// ===== ГОНКА С ТАЙМЕРОМ (TIMER QUIZ) =====
// Версия: 1.1.0 — ИСПОЛЬЗУЕТ ЦЕНТРАЛИЗОВАННЫЙ КЛЮЧ STORAGE_KEYS

/**
 * Запускает шаг "Гонка с таймером"
 * @param {Object} step - объект шага из сценария
 */
async function runTimerQuizStep(step) {
    const quizScreen = document.getElementById('quiz-screen');
    const quizStepTitle = document.getElementById('quiz-step-title');
    const quizStepCounter = document.getElementById('quiz-step-counter');
    const quizContainer = document.getElementById('quiz-container');
    
    // Дожидаемся загрузки вопросов, если ещё не загружены
    if (!AppState.allQuestions || AppState.allQuestions.length === 0) {
        logInfo('Timer Quiz: ожидание загрузки вопросов...');
        await waitForQuestions();
    }
    
    const questionIds = step.question_ids || [];
    let questions = [];
    
    if (questionIds.length > 0) {
        questions = AppState.allQuestions.filter(q => questionIds.includes(q.id));
    } else {
        questions = AppState.allQuestions.slice(0, 5);
    }
    
    // Проверка: если вопросов всё равно нет
    if (questions.length === 0) {
        logError('Timer Quiz: нет вопросов для отображения. Доступные ID:', AppState.allQuestions.map(q => q.id));
        quizContainer.innerHTML = `
            <div class="error-message" style="text-align:center; padding:40px;">
                <i class="fas fa-exclamation-triangle" style="font-size:3rem; color:#e74c3c;"></i>
                <p>Ошибка: вопросы не загружены (ID: ${questionIds.join(', ')})</p>
                <button class="btn btn--primary" onclick="location.reload()">Обновить страницу</button>
            </div>
        `;
        quizScreen.classList.remove('hidden');
        quizStepTitle.textContent = step.title;
        quizStepCounter.textContent = `Шаг ${AppState.currentStepIndex + 1} из ${AppState.currentScenario.steps.length}`;
        return;
    }
    
    // Показываем экран
    quizScreen.classList.remove('hidden');
    quizStepTitle.textContent = step.title;
    quizStepCounter.textContent = `Шаг ${AppState.currentStepIndex + 1} из ${AppState.currentScenario.steps.length}`;
    
    // Состояние игры
    const gameState = {
        questions: questions,
        currentIndex: 0,
        score: 0,
        timeLeft: 15,
        timerInterval: null,
        gameActive: true,
        answered: false,
        correctAnswers: 0,
        stepStartTime: Date.now(),  // Засекаем время начала шага
        questionStartTime: null      // Время начала текущего вопроса
    };
    
    // ИСПРАВЛЕНО: используем централизованный ключ для рекорда
    function _getRecordKey(title) {
        if (window.STORAGE_KEYS && STORAGE_KEYS.GAME && STORAGE_KEYS.GAME.timerQuizRecord) {
            return STORAGE_KEYS.GAME.timerQuizRecord(title);
        }
        return 'timer_quiz_record_' + title.replace(/\s/g, '_');
    }
    
    // Получаем рекорд
    const recordKey = _getRecordKey(step.title || 'default');
    let highScore = parseInt(localStorage.getItem(recordKey)) || 0;
    
    // Рендерим первый вопрос
    renderTimerQuestion(gameState, highScore);
    
    // Запускаем таймер
    startTimer(gameState, highScore, recordKey);
    
    // Обработчик ответа
    function onAnswerClick(e) {
        const option = e.target.closest('.timer-option');
        if (!option) return;
        if (!gameState.gameActive) return;
        if (gameState.answered) return;
        
        const selectedValue = option.dataset.value;
        const currentQuestion = gameState.questions[gameState.currentIndex];
        const isCorrect = checkQuizAnswer(currentQuestion, [selectedValue]);
        
        // Рассчитываем время на вопрос
        let timeSpentOnQuestion = 0;
        if (gameState.questionStartTime) {
            timeSpentOnQuestion = Math.round((Date.now() - gameState.questionStartTime) / 1000);
        }
        
        // Отправляем аналитику ответа
        if (typeof sendQuizAnswer === 'function') {
            sendQuizAnswer(
                currentQuestion.id,
                currentQuestion.text,
                [selectedValue],
                isCorrect,
                timeSpentOnQuestion,
                false
            );
        }
        
        gameState.answered = true;
        
        if (gameState.timerInterval) {
            clearInterval(gameState.timerInterval);
            gameState.timerInterval = null;
        }
        
        // Подсвечиваем ответы
        highlightAnswers(currentQuestion, selectedValue);
        
        if (isCorrect) {
            const pointsEarned = 5;
            const timeBonus = 2;
            gameState.score += pointsEarned;
            gameState.timeLeft += timeBonus;
            gameState.correctAnswers++;
            showToast('✅', `+${pointsEarned} баллов! +${timeBonus} сек`, 'success');
        } else {
            gameState.score -= 3;
            showToast('❌', `-3 балла. Правильно: ${getCorrectAnswerText(currentQuestion)}`, 'error');
        }
        
        updateScoreDisplay(gameState.score);
        
        setTimeout(() => {
            gameState.currentIndex++;
            gameState.answered = false;
            
            if (gameState.currentIndex < gameState.questions.length && gameState.gameActive) {
                renderTimerQuestion(gameState, highScore);
                startTimer(gameState, highScore, recordKey);
            } else {
                finishTimerGame(gameState, highScore, recordKey);
            }
        }, 1500);
    }
    
    // Навешиваем обработчик
    quizContainer.addEventListener('click', onAnswerClick);
    
    // Вспомогательные функции
    
    function renderTimerQuestion(state, hs) {
        const q = state.questions[state.currentIndex];
        const progress = `${state.currentIndex + 1} / ${state.questions.length}`;
        
        quizContainer.innerHTML = renderTimerQuizGame(state.score, state.timeLeft, hs, q, progress, state.currentIndex);
        
        // Засекаем время начала текущего вопроса
        state.questionStartTime = Date.now();
        
        // Обновляем отображение счёта после рендера
        setTimeout(() => {
            updateScoreDisplay(state.score);
        }, 10);
    }
    
    function startTimer(state, hs, recordKey) {
        if (state.timerInterval) clearInterval(state.timerInterval);
        
        state.timerInterval = setInterval(() => {
            if (!state.gameActive) {
                if (state.timerInterval) clearInterval(state.timerInterval);
                return;
            }
            if (state.answered) return;
            
            state.timeLeft--;
            updateTimerDisplay(state.timeLeft);
            
            if (state.timeLeft <= 0) {
                clearInterval(state.timerInterval);
                state.timerInterval = null;
                state.gameActive = false;
                state.answered = true;
                
                const currentQuestion = state.questions[state.currentIndex];
                
                // Рассчитываем время на вопрос при истечении времени
                let timeSpentOnQuestion = 0;
                if (state.questionStartTime) {
                    timeSpentOnQuestion = Math.round((Date.now() - state.questionStartTime) / 1000);
                }
                
                // Отправляем аналитику неотвеченного вопроса
                if (typeof sendQuizAnswer === 'function') {
                    sendQuizAnswer(
                        currentQuestion.id,
                        currentQuestion.text,
                        [],
                        false,
                        timeSpentOnQuestion,
                        false
                    );
                }
                
                highlightAnswers(currentQuestion, null);
                showToast('⏰', 'Время вышло!', 'error');
                state.score -= 3;
                updateScoreDisplay(state.score);
                
                setTimeout(() => {
                    finishTimerGame(state, hs, recordKey);
                }, 1500);
            }
        }, 1000);
    }
    
    function updateTimerDisplay(timeLeft) {
        const timerEl = document.getElementById('timer-value');
        if (timerEl) {
            timerEl.textContent = timeLeft;
            if (timeLeft <= 5) {
                timerEl.style.color = '#e74c3c';
                timerEl.style.fontWeight = 'bold';
            } else {
                timerEl.style.color = '#2e86de';
            }
        }
    }
    
    function updateScoreDisplay(score) {
        const scoreEl = document.getElementById('timer-score');
        if (scoreEl) {
            scoreEl.textContent = score;
            if (score < 0) {
                scoreEl.style.color = '#e74c3c';
            } else {
                scoreEl.style.color = '#27ae60';
            }
        }
    }
    
    function highlightAnswers(question, selectedValue) {
        const options = document.querySelectorAll('.timer-option');
        options.forEach(opt => {
            opt.style.pointerEvents = 'none';
            const value = opt.dataset.value;
            
            if (question.type === 'single') {
                if (value === question.correct) {
                    opt.classList.add('timer-option--correct');
                }
                if (selectedValue && value === selectedValue && value !== question.correct) {
                    opt.classList.add('timer-option--wrong');
                }
            }
        });
    }
    
    function getCorrectAnswerText(question) {
        if (question.type === 'single') {
            return question.correct;
        }
        return question.correct.join(', ');
    }
    
    function finishTimerGame(state, hs, recordKey) {
        state.gameActive = false;
        if (state.timerInterval) {
            clearInterval(state.timerInterval);
            state.timerInterval = null;
        }
        
        const isNewRecord = state.score > hs;
        if (isNewRecord) {
            localStorage.setItem(recordKey, state.score.toString());
            hs = state.score;
        }
        
        const totalQuestions = state.questions.length;
        
        // Отправляем аналитику результата шага
        if (typeof sendStepResult === 'function') {
            sendStepResult(
                AppState.currentStepIndex,
                'timer-quiz',
                step.title,
                state.correctAnswers,
                totalQuestions,
                { score: state.score, is_new_record: isNewRecord }
            );
        }
        
        // Фиксируем время окончания шага
        if (typeof endStepTimer === 'function') {
            endStepTimer(true, { 
                score: state.score, 
                correct: state.correctAnswers, 
                total: totalQuestions,
                is_new_record: isNewRecord 
            });
        }
        
        AppState.stepStats.push({
            step: AppState.currentStepIndex + 1,
            type: 'timer-quiz',
            title: AppState.currentScenario.steps[AppState.currentStepIndex].title,
            score: state.score,
            correct: state.correctAnswers,
            total: totalQuestions,
            isNewRecord: isNewRecord
        });
        
        if (typeof saveCurrentProgress === 'function') {
            saveCurrentProgress();
        }
        
        if (typeof updateHeaderXP === 'function') {
            updateHeaderXP();
        }
        
        quizContainer.innerHTML = renderTimerQuizResult(state.score, hs, state.correctAnswers, totalQuestions, isNewRecord);
        
        const nextBtn = document.getElementById('timer-next-btn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                AppState.currentStepIndex++;
                runStep();
            });
        }
    }
}

/**
 * Проверяет правильность ответа на вопрос
 */
function checkQuizAnswer(question, userAnswers) {
    if (!userAnswers || userAnswers.length === 0) return false;
    
    if (question.type === 'single') {
        return userAnswers[0] === question.correct;
    }
    if (question.type === 'multiple') {
        const sortedCorrect = [...question.correct].sort();
        const sortedUser = [...userAnswers].sort();
        return sortedCorrect.join(',') === sortedUser.join(',');
    }
    return false;
}

/**
 * Ожидание загрузки вопросов
 */
function waitForQuestions(maxWaitMs = 5000) {
    return new Promise((resolve) => {
        if (AppState.allQuestions && AppState.allQuestions.length > 0) {
            resolve();
            return;
        }
        
        const startTime = Date.now();
        const interval = setInterval(() => {
            if (AppState.allQuestions && AppState.allQuestions.length > 0) {
                clearInterval(interval);
                resolve();
            } else if (Date.now() - startTime > maxWaitMs) {
                clearInterval(interval);
                logError('Timer Quiz: таймаут ожидания вопросов');
                resolve();
            }
        }, 100);
    });
}

// Экспортируем функцию в глобальную область
window.runTimerQuizStep = runTimerQuizStep;
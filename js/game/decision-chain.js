// ===== ЦЕПОЧКА РЕШЕНИЙ (DECISION CHAIN) =====
// Интерактивный сценарий: серия выборов, где каждый ответ влияет на следующую реплику клиента

/**
 * Запускает шаг "Цепочка решений"
 * @param {Object} step - объект шага из сценария
 */
async function runDecisionChainStep(step) {
    const quizScreen = document.getElementById('quiz-screen');
    const quizStepTitle = document.getElementById('quiz-step-title');
    const quizStepCounter = document.getElementById('quiz-step-counter');
    const quizContainer = document.getElementById('quiz-container');
    
    // Получаем данные цепочки
    const chains = step.chains || [];
    const startTrust = step.startTrust !== undefined ? step.startTrust : 50;
    const successMessage = step.successMessage || "Клиент подписал договор! 🎉";
    const failMessage = step.failMessage || "Клиент ушёл к конкуренту 😞";
    
    if (chains.length === 0) {
        logError('Decision Chain: нет шагов в цепочке');
        showToast('❌', 'Ошибка: цепочка решений не настроена', 'error');
        AppState.currentStepIndex++;
        runStep();
        return;
    }
    
    // Показываем экран
    quizScreen.classList.remove('hidden');
    quizStepTitle.textContent = step.title;
    quizStepCounter.textContent = `Шаг ${AppState.currentStepIndex + 1} из ${AppState.currentScenario.steps.length}`;
    
    // Состояние игры
    const gameState = {
        chains: chains,
        currentNodeId: 0,
        trust: startTrust,
        gameActive: true,
        history: [],
        stepHistory: [],
        pendingDocumentSelection: false,
        selectedDocuments: [],
        stepStartTime: Date.now()  // Засекаем время начала шага
    };
    
    // Рендерим первый шаг
    renderDecisionStep(gameState);
    
    // Обработчик ответа (с поддержкой разных типов шагов)
    function onQuizContainerClick(e) {
        const option = e.target.closest('.decision-option');
        const checkItem = e.target.closest('.document-check-item');
        const compareCard = e.target.closest('.plan-compare-card');
        const checkBtn = e.target.closest('#document-check-btn');
        const compareBtn = e.target.closest('#plan-compare-btn');
        
        // Обработка выбора документов (чекбоксы)
        if (checkItem) {
            const value = checkItem.dataset.value;
            const isCorrect = checkItem.dataset.correct === 'true';
            const checkbox = checkItem.querySelector('input[type="checkbox"]');
            
            if (checkbox) {
                checkbox.checked = !checkbox.checked;
                if (checkbox.checked) {
                    gameState.selectedDocuments.push({ value, isCorrect });
                    checkItem.style.background = '#eafaf1';
                    checkItem.style.borderColor = '#27ae60';
                } else {
                    gameState.selectedDocuments = gameState.selectedDocuments.filter(d => d.value !== value);
                    checkItem.style.background = '';
                    checkItem.style.borderColor = '';
                }
            }
            return;
        }
        
        // Обработка сравнения планировок
        if (compareCard) {
            document.querySelectorAll('.plan-compare-card').forEach(card => {
                card.classList.remove('plan-selected');
                card.style.borderColor = 'var(--color-border)';
            });
            compareCard.classList.add('plan-selected');
            compareCard.style.borderColor = '#2e86de';
            gameState.selectedPlanId = compareCard.dataset.planId;
            return;
        }
        
        // Обработка кнопки проверки документов
        if (checkBtn) {
            processDocumentSelection(gameState);
            return;
        }
        
        // Обработка кнопки сравнения планировок
        if (compareBtn) {
            processPlanComparison(gameState);
            return;
        }
        
        // Обычная опция (диалог)
        if (!option) return;
        if (!gameState.gameActive) return;
        
        const optIndex = parseInt(option.dataset.optIndex);
        const currentChain = gameState.chains[gameState.currentNodeId];
        
        // Если текущий шаг специального типа, не обрабатываем как обычный диалог
        if (currentChain.type === 'document-select' || currentChain.type === 'compare-plans') {
            return;
        }
        
        const selectedOption = currentChain.options[optIndex];
        if (!selectedOption) return;
        
        processNormalChoice(selectedOption, gameState);
    }
    
    function processNormalChoice(selectedOption, state) {
        state.gameActive = false;
        
        const currentChain = state.chains[state.currentNodeId];
        let nextNodeId = state.currentNodeId + 1;
        if (selectedOption.nextChainIndex !== undefined) {
            nextNodeId = selectedOption.nextChainIndex;
        }
        
        state.history.push({
            stepId: state.currentNodeId,
            clientMessage: currentChain.clientMessage,
            selectedText: selectedOption.text,
            trustDelta: selectedOption.trustDelta,
            trustBefore: state.trust,
            nextNodeId: nextNodeId
        });
        
        state.stepHistory.push(state.currentNodeId);
        state.trust += selectedOption.trustDelta;
        state.trust = Math.max(0, Math.min(100, state.trust));
        
        highlightSelectedOption(selectedOption.trustDelta);
        showFeedback(selectedOption.feedback || getDefaultFeedback(selectedOption.trustDelta), selectedOption.trustDelta);
        updateTrustBar(state.trust);
        
        const isSuccess = state.trust >= 100;
        const isFail = state.trust <= 0;
        
        if (isSuccess || isFail) {
            setTimeout(() => finishDecisionGame(state, isSuccess, false, successMessage, failMessage), 2000);
            return;
        }
        
        if (nextNodeId >= state.chains.length) {
            const finalSuccess = state.trust >= 70;
            setTimeout(() => finishDecisionGame(state, finalSuccess, true, successMessage, failMessage), 2000);
            return;
        }
        
        setTimeout(() => {
            state.currentNodeId = nextNodeId;
            state.gameActive = true;
            renderDecisionStep(state);
        }, 2000);
    }
    
    function processDocumentSelection(state) {
        const currentChain = state.chains[state.currentNodeId];
        const totalCorrect = currentChain.options.filter(opt => opt.isCorrect === true).length;
        const selectedCorrect = state.selectedDocuments.filter(d => d.isCorrect === true).length;
        const selectedWrong = state.selectedDocuments.filter(d => d.isCorrect === false).length;
        
        let trustDelta = 0;
        let feedback = '';
        
        if (selectedCorrect === totalCorrect && selectedWrong === 0) {
            trustDelta = 20;
            feedback = '✅ Отлично! Вы выбрали все нужные документы. Клиент impressed!';
        } else if (selectedCorrect >= totalCorrect - 1 && selectedWrong <= 1) {
            trustDelta = 10;
            feedback = '👍 Хорошо, но пару ошибок. Клиент доволен, но могло быть лучше.';
        } else {
            trustDelta = -10;
            feedback = '❌ Клиент разочарован — вы плохо знаете документы для ИП.';
        }
        
        state.trust += trustDelta;
        state.trust = Math.max(0, Math.min(100, state.trust));
        
        state.history.push({
            stepId: state.currentNodeId,
            clientMessage: currentChain.clientMessage,
            selectedText: `Выбрано документов: ${state.selectedDocuments.length}`,
            trustDelta: trustDelta,
            trustBefore: state.trust - trustDelta
        });
        
        state.stepHistory.push(state.currentNodeId);
        
        updateTrustBar(state.trust);
        
        const nextNodeId = currentChain.options.find(opt => opt.finalChoice === true)?.nextChainIndex || state.currentNodeId + 1;
        
        showFeedback(feedback, trustDelta);
        
        // Блокируем кнопки после выбора
        const checkBtn = document.getElementById('document-check-btn');
        if (checkBtn) checkBtn.disabled = true;
        document.querySelectorAll('.document-check-item').forEach(item => {
            item.style.pointerEvents = 'none';
        });
        
        const isSuccess = state.trust >= 100;
        const isFail = state.trust <= 0;
        
        if (isSuccess || isFail) {
            setTimeout(() => finishDecisionGame(state, isSuccess, false, successMessage, failMessage), 2000);
            return;
        }
        
        setTimeout(() => {
            state.currentNodeId = nextNodeId;
            state.gameActive = true;
            state.selectedDocuments = [];
            renderDecisionStep(state);
        }, 2000);
    }
    
    function processPlanComparison(state) {
        if (!state.selectedPlanId) {
            showFeedback('Пожалуйста, выберите один из вариантов', 0);
            return;
        }
        
        const currentChain = state.chains[state.currentNodeId];
        const selectedIndex = parseInt(state.selectedPlanId);
        const selectedOption = currentChain.options[selectedIndex];
        
        if (!selectedOption) {
            logError('Plan comparison: опция не найдена, index=', selectedIndex);
            showFeedback('Ошибка: вариант не найден', 0);
            return;
        }
        
        logInfo('Plan comparison - выбран вариант:', selectedOption);
        logInfo('nextChainIndex из опции:', selectedOption.nextChainIndex);
        
        state.gameActive = false;
        
        const trustDelta = selectedOption.trustDelta;
        let nextNodeId = selectedOption.nextChainIndex;
        
        // Если nextChainIndex не указан, переходим к следующему по порядку
        if (nextNodeId === undefined || nextNodeId === null) {
            nextNodeId = state.currentNodeId + 1;
        }
        
        logInfo('Итоговый nextNodeId:', nextNodeId);
        
        state.trust += trustDelta;
        state.trust = Math.max(0, Math.min(100, state.trust));
        
        state.history.push({
            stepId: state.currentNodeId,
            clientMessage: currentChain.clientMessage,
            selectedText: selectedOption.text,
            trustDelta: trustDelta,
            trustBefore: state.trust - trustDelta
        });
        
        state.stepHistory.push(state.currentNodeId);
        
        updateTrustBar(state.trust);
        showFeedback(selectedOption.feedback || getDefaultFeedback(trustDelta), trustDelta);
        
        const compareBtn = document.getElementById('plan-compare-btn');
        if (compareBtn) compareBtn.disabled = true;
        document.querySelectorAll('.plan-compare-card').forEach(card => {
            card.style.pointerEvents = 'none';
        });
        
        // Проверяем победу/поражение по доверию
        const isSuccess = state.trust >= 100;
        const isFail = state.trust <= 0;
        
        if (isSuccess || isFail) {
            setTimeout(() => finishDecisionGame(state, isSuccess, false, successMessage, failMessage), 2000);
            return;
        }
        
        // Проверяем, есть ли следующий шаг
        if (nextNodeId >= state.chains.length) {
            const finalSuccess = state.trust >= 70;
            setTimeout(() => finishDecisionGame(state, finalSuccess, true, successMessage, failMessage), 2000);
            return;
        }
        
        // Переход к следующему шагу
        setTimeout(() => {
            state.currentNodeId = nextNodeId;
            state.gameActive = true;
            state.selectedPlanId = null;
            renderDecisionStep(state);
        }, 2000);
    }
    
    function renderDecisionStep(state) {
        const currentChain = state.chains[state.currentNodeId];
        const stepNumber = state.stepHistory.length + 1;
        const totalSteps = state.chains.filter(c => !c.type || c.type === 'final-success' || c.type === 'final-fail').length;
        
        if (currentChain.type === 'document-select') {
            quizContainer.innerHTML = renderDocumentSelectStep(
                state.trust,
                currentChain.clientMessage,
                currentChain.options,
                stepNumber,
                totalSteps,
                state.history
            );
        } else if (currentChain.type === 'compare-plans') {
            quizContainer.innerHTML = renderComparePlansStep(
                state.trust,
                currentChain.clientMessage,
                currentChain.options,
                currentChain.taskDescription || 'Сравните варианты и выберите лучший:',
                stepNumber,
                totalSteps,
                state.history
            );
        } else if (currentChain.type === 'final-success') {
            quizContainer.innerHTML = renderDecisionChainResult(state.trust, true, successMessage, state.history, totalSteps);
            const nextBtn = document.getElementById('decision-next-btn');
            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    AppState.currentStepIndex++;
                    runStep();
                });
            }
        } else if (currentChain.type === 'final-fail') {
            quizContainer.innerHTML = renderDecisionChainResult(state.trust, false, failMessage, state.history, totalSteps);
            const nextBtn = document.getElementById('decision-next-btn');
            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    AppState.currentStepIndex++;
                    runStep();
                });
            }
        } else {
            quizContainer.innerHTML = renderDecisionChainGame(
                state.trust,
                currentChain.clientMessage,
                currentChain.options,
                stepNumber,
                totalSteps,
                state.history,
                true
            );
        }
    }
    
    function highlightSelectedOption(delta) {
        // Находим все опции и блокируем
        document.querySelectorAll('.decision-option').forEach(opt => {
            opt.style.pointerEvents = 'none';
            opt.style.opacity = '0.6';
        });
    }
    
    function showFeedback(feedback, delta) {
        const feedbackEl = document.getElementById('decision-feedback');
        if (feedbackEl) {
            const deltaText = delta > 0 ? `+${delta}` : (delta < 0 ? `${delta}` : '0');
            feedbackEl.innerHTML = `<strong>${delta > 0 ? '✅' : (delta < 0 ? '❌' : 'ℹ️')}</strong> ${feedback} <span style="font-weight:700; ${delta > 0 ? 'color:#27ae60' : (delta < 0 ? 'color:#e74c3c' : 'color:#f39c12')}">(${deltaText})</span>`;
            feedbackEl.classList.remove('hidden');
        }
    }
    
    function updateTrustBar(trust) {
        const fillEl = document.getElementById('decision-trust-fill');
        const valueEl = document.getElementById('decision-trust-value');
        
        let barColor = '#f39c12';
        if (trust >= 70) barColor = '#27ae60';
        if (trust <= 30) barColor = '#e74c3c';
        
        if (fillEl) {
            fillEl.style.width = `${trust}%`;
            fillEl.style.background = barColor;
        }
        if (valueEl) {
            valueEl.textContent = trust;
            valueEl.style.color = barColor;
        }
    }
    
    function getDefaultFeedback(delta) {
        if (delta > 0) return '✅ Клиент доволен ответом!';
        if (delta < 0) return '❌ Клиент разочарован.';
        return '🤔 Клиент задумался...';
    }
    
    function finishDecisionGame(state, isWin, isNaturalEnd, successMsg, failMsg) {
        state.gameActive = false;
        
        const finalTrust = state.trust;
        const totalSteps = state.chains.length;
        const completedSteps = state.stepHistory.length + 1;
        
        // Отправляем аналитику результата шага
        if (typeof sendStepResult === 'function') {
            sendStepResult(
                AppState.currentStepIndex,
                'decision-chain',
                step.title,
                isWin ? 1 : 0,
                1,
                { final_trust: finalTrust, steps_completed: completedSteps, is_win: isWin }
            );
        }
        
        // Фиксируем время окончания шага
        if (typeof endStepTimer === 'function') {
            endStepTimer(true, { is_win: isWin, final_trust: finalTrust });
        }
        
        AppState.stepStats.push({
            step: AppState.currentStepIndex + 1,
            type: 'decision-chain',
            title: AppState.currentScenario.steps[AppState.currentStepIndex].title,
            finalTrust: finalTrust,
            isWin: isWin,
            stepsCompleted: completedSteps,
            totalSteps: totalSteps,
            history: state.history
        });
        
        quizContainer.innerHTML = renderDecisionChainResult(
            finalTrust,
            isWin,
            isWin ? successMsg : failMsg,
            state.history,
            totalSteps
        );
        
        const nextBtn = document.getElementById('decision-next-btn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                AppState.currentStepIndex++;
                runStep();
            });
        }
    }
    
    quizContainer.addEventListener('click', onQuizContainerClick);
}
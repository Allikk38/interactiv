// ===== УПРАВЛЕНИЕ ДИАЛОГОМ =====

const ConsultationDialog = {
    isWaitingForNext: false,
    pendingNextCallback: null,
    
    // Обработка выбора ответа
    async onAnswerSelected(selectedOption, selectedBtn, onNextComplete) {
        if (ConsultationCore.state.isAnswered) return;
        if (this.isWaitingForNext) return;
        
        // Проверяем ответ
        const result = ConsultationCore.checkAnswer(selectedOption);
        if (!result) return;
        
        // Отмечаем, что ответ дан
        ConsultationCore.state.isAnswered = true;
        
        // Показываем обратную связь (подсветка кнопки)
        ConsultationUI.showAgentFeedback(result.isCorrect, result.feedback, selectedBtn);
        
        if (result.isCorrect) {
            // Показываем в облаке агента его ответ (выбранную фразу)
            ConsultationUI.showAgentResponse(selectedOption.text);
            
            // Обновляем панели (заметки и портрет) если есть новые данные
            if (result.autoNote || result.autoPortrait) {
                ConsultationUI.updatePanels(ConsultationCore);
            }
            
            // Ждём 1.5 секунды и переходим к следующему шагу
            this.isWaitingForNext = true;
            
            setTimeout(async () => {
                // Показываем кнопку "Далее"
                ConsultationUI.showNextButton(async () => {
                    // Скрываем облако агента
                    const agentBubble = document.querySelector('#agent-bubble');
                    if (agentBubble) {
                        agentBubble.classList.remove('speech-bubble--visible');
                    }
                    
                    // Переход к следующему шагу
                    const nextResult = ConsultationCore.nextStep();
                    
                    if (nextResult.hasNext) {
                        // Перерисовываем UI с новым шагом
                        ConsultationUI.render(ConsultationCore);
                        this.isWaitingForNext = false;
                        if (onNextComplete) onNextComplete();
                    } else if (nextResult.isComplete) {
                        ConsultationUI.render(ConsultationCore);
                        this.isWaitingForNext = false;
                    }
                });
            }, 1000);
        } else {
            // Неправильный ответ — не переходим дальше, даём возможность выбрать другой вариант
            // Разблокируем остальные кнопки, но помечаем эту как неправильную
            setTimeout(() => {
                ConsultationCore.state.isAnswered = false;
                this.isWaitingForNext = false;
                
                // Разблокируем остальные кнопки (кроме неправильной)
                document.querySelectorAll('.answer-btn').forEach(btn => {
                    if (btn !== selectedBtn) {
                        btn.style.pointerEvents = 'auto';
                    }
                });
                
                // Очищаем обратную связь?
                // Нет, пусть остаётся для информации
            }, 1500);
        }
    },
    
    reset() {
        this.isWaitingForNext = false;
        this.pendingNextCallback = null;
    }
};

window.ConsultationDialog = ConsultationDialog;
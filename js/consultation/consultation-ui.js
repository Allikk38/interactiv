// ===== UI КОМПОНЕНТЫ КОНСУЛЬТАЦИИ =====

const ConsultationUI = {
    container: null,
    onAnswerSelected: null,

    init(containerId, onAnswerCallback) {
        this.container = document.getElementById(containerId);
        this.onAnswerSelected = onAnswerCallback;
    },

    // Главный рендер всей страницы
    render(coreState) {
        if (!this.container) return;
        
        const progressPercent = coreState.getProgressPercent();
        const currentStep = coreState.getCurrentStep();
        const currentIndex = coreState.getCurrentIndex();
        const totalSteps = coreState.getTotalSteps();
        const isComplete = coreState.state.isComplete;
        
        // Обновляем записную книжку и портрет
        this.renderNotebook(coreState);
        this.renderPortrait(coreState);
        
        if (isComplete) {
            this.renderCompletion();
            return;
        }
        
        // Обновляем прогресс в существующем DOM (если элементы есть)
        const progressCurrent = document.getElementById('progress-current');
        const progressTotal = document.getElementById('progress-total');
        const progressPercentEl = document.getElementById('progress-percent');
        const progressFill = document.getElementById('progress-fill');
        
        if (progressCurrent) progressCurrent.textContent = currentIndex + 1;
        if (progressTotal) progressTotal.textContent = totalSteps;
        if (progressPercentEl) progressPercentEl.textContent = `${Math.round(progressPercent)}%`;
        if (progressFill) progressFill.style.width = `${progressPercent}%`;
        
        // Рендерим кнопки ответов
        this.renderOptions(currentStep.options);
        
        // Показываем реплику клиента
        this.showClientPhrase(currentStep.clientPhrase);
        
        // Очищаем облако агента
        this.clearAgentSpeech();
        
        // Обновляем персонажей (видимость)
        this.updateCharactersVisibility();
    },
    
    // Рендер записной книжки (левая панель)
    renderNotebook(coreState) {
        const notebookContent = document.getElementById('notebook-content');
        const notesCount = document.getElementById('notes-count');
        const notes = coreState.getNotes();
        
        if (!notebookContent) return;
        
        // Обновляем счётчик
        if (notesCount) {
            notesCount.textContent = notes.length;
        }
        
        if (notes.length === 0) {
            notebookContent.innerHTML = `
                <div class="notebook__empty">
                    <i class="fas fa-lightbulb"></i>
                    <p>Здесь появятся ключевые моменты из диалога</p>
                    <p style="font-size: 0.65rem; margin-top: 6px;">✓ Выбирайте правильные ответы</p>
                </div>
            `;
            return;
        }
        
        // Отображаем заметки (новые сверху)
        let notesHtml = '';
        [...notes].reverse().forEach(note => {
            notesHtml += `
                <div class="note-item" data-note-id="${note.id}">
                    <span class="note-item__icon">${note.icon}</span>
                    <span class="note-item__text">${this.escapeHtml(note.text)}</span>
                    <span class="note-item__step">Шаг ${note.stepNumber}</span>
                </div>
            `;
        });
        
        notebookContent.innerHTML = notesHtml;
    },
    
    // Рендер портрета клиента (правая панель)
    renderPortrait(coreState) {
        const portraitContent = document.getElementById('portrait-content');
        const portraitCount = document.getElementById('portrait-count');
        const portrait = coreState.getPortrait();
        const totalCount = coreState.getPortraitCount();
        
        if (!portraitContent) return;
        
        // Обновляем счётчик
        if (portraitCount) {
            portraitCount.textContent = totalCount;
        }
        
        if (totalCount === 0) {
            portraitContent.innerHTML = `
                <div class="notebook__empty">
                    <i class="fas fa-users"></i>
                    <p>Здесь появится информация о клиенте</p>
                    <p style="font-size: 0.65rem; margin-top: 6px;">Семья • Работа • Образ жизни</p>
                </div>
            `;
            return;
        }
        
        // Категории портрета с иконками
        const categories = [
            { key: 'work', name: 'Работа', icon: '💼', color: '#3498db' },
            { key: 'family', name: 'Семья', icon: '👨‍👩‍👧', color: '#e74c3c' },
            { key: 'lifestyle', name: 'Образ жизни', icon: '🌟', color: '#f39c12' },
            { key: 'needs', name: 'Потребности', icon: '🎯', color: '#27ae60' },
            { key: 'pains', name: 'Боли и страхи', icon: '😟', color: '#e67e22' },
            { key: 'connections', name: 'Связь с роднёй', icon: '❤️', color: '#9b59b6' }
        ];
        
        let portraitHtml = '';
        
        for (const cat of categories) {
            const items = portrait[cat.key];
            if (items && items.length > 0) {
                portraitHtml += `
                    <div class="portrait-category">
                        <div class="portrait-category__header">
                            <span class="portrait-category__icon">${cat.icon}</span>
                            <span class="portrait-category__name" style="color: ${cat.color}">${cat.name}</span>
                        </div>
                        <div class="portrait-category__items">
                `;
                
                items.forEach(item => {
                    portraitHtml += `
                        <div class="portrait-item">
                            <span class="portrait-item__icon">${item.icon}</span>
                            <span class="portrait-item__text">${this.escapeHtml(item.text)}</span>
                        </div>
                    `;
                });
                
                portraitHtml += `
                        </div>
                    </div>
                `;
            }
        }
        
        portraitContent.innerHTML = portraitHtml;
    },
    
    renderOptions(options) {
        const grid = document.getElementById('answers-grid');
        if (!grid) return;
        
        let html = '';
        options.forEach((opt, idx) => {
            html += `
                <button class="answer-btn" data-opt-index="${idx}" data-correct="${opt.correct}">
                    ${this.escapeHtml(opt.text)}
                </button>
            `;
        });
        grid.innerHTML = html;
        
        // Навешиваем обработчики
        document.querySelectorAll('.answer-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(btn.dataset.optIndex);
                const optionsList = ConsultationCore.getCurrentStep().options;
                const selectedOption = optionsList[index];
                
                if (this.onAnswerSelected) {
                    this.onAnswerSelected(selectedOption, btn);
                }
            });
        });
    },
    
    // Показать реплику клиента с эффектом печати
    showClientPhrase(phrase, onComplete) {
        const clientTextEl = document.getElementById('client-text');
        const clientBubble = document.querySelector('#client-bubble');
        
        if (!clientTextEl) return;
        
        // Показываем облако
        clientBubble.classList.add('speech-bubble--visible');
        
        // Эффект печати
        let i = 0;
        clientTextEl.textContent = '';
        
        function typeNext() {
            if (i < phrase.length) {
                clientTextEl.textContent += phrase[i];
                i++;
                setTimeout(typeNext, 20);
            } else {
                if (onComplete) onComplete();
            }
        }
        
        typeNext();
    },
    
    // Очистить облако агента
    clearAgentSpeech() {
        const agentTextEl = document.getElementById('agent-text');
        if (agentTextEl) {
            agentTextEl.textContent = '';
        }
    },
    
    // Показать ответ агента (подсветка кнопки + обратная связь)
    showAgentFeedback(isCorrect, feedback, selectedBtn) {
        // Подсвечиваем нажатую кнопку
        if (isCorrect) {
            selectedBtn.classList.add('answer-btn--correct');
        } else {
            selectedBtn.classList.add('answer-btn--wrong');
        }
        
        // Блокируем все кнопки
        document.querySelectorAll('.answer-btn').forEach(btn => {
            btn.style.pointerEvents = 'none';
        });
        
        // Показываем обратную связь
        const feedbackEl = document.getElementById('feedback-area');
        if (feedbackEl) {
            feedbackEl.textContent = feedback;
            feedbackEl.className = `feedback-area feedback-area--${isCorrect ? 'success' : 'error'}`;
        }
        
        // Анимация нажатия
        selectedBtn.style.transform = 'scale(0.96)';
        setTimeout(() => {
            selectedBtn.style.transform = '';
        }, 150);
    },
    
    // Показать ответ агента в облаке
    showAgentResponse(text) {
        const agentTextEl = document.getElementById('agent-text');
        const agentBubble = document.querySelector('#agent-bubble');
        
        if (!agentTextEl) return;
        
        agentBubble.classList.add('speech-bubble--visible');
        agentTextEl.textContent = text;
    },
    
    // Обновить персонажей (показать)
    updateCharactersVisibility() {
        const agentChar = document.getElementById('character-agent');
        const clientChar = document.getElementById('character-client');
        
        if (agentChar) agentChar.classList.add('character--visible');
        if (clientChar) clientChar.classList.add('character--visible');
    },
    
    // Показать кнопку "Далее" под ответами
    showNextButton(onClick) {
        const panel = document.querySelector('.answers-panel');
        if (!panel) return;
        
        // Удаляем старую кнопку
        const oldBtn = document.getElementById('consultation-next-btn');
        if (oldBtn) oldBtn.remove();
        
        const nextBtn = document.createElement('button');
        nextBtn.id = 'consultation-next-btn';
        nextBtn.className = 'next-btn';
        nextBtn.innerHTML = '<i class="fas fa-arrow-right"></i> Далее';
        nextBtn.onclick = () => {
            onClick();
            nextBtn.remove();
        };
        
        panel.appendChild(nextBtn);
    },
    
    // Обновить UI после добавления заметки/портрета
    updatePanels(coreState) {
        this.renderNotebook(coreState);
        this.renderPortrait(coreState);
    },
    
    // Экран завершения
    renderCompletion() {
        if (!this.container) return;
        
        const notes = ConsultationCore.getNotes();
        const portrait = ConsultationCore.getPortrait();
        const totalPortrait = ConsultationCore.getPortraitCount();
        
        const notesSummary = notes.length > 0 ? `
            <div class="completion-notes-summary">
                <div class="completion-notes-summary__title">
                    <i class="fas fa-book-open"></i> Заметки агента (${notes.length})
                </div>
                <div class="completion-notes-summary__list">
                    ${notes.map(note => `
                        <div class="completion-note-item">
                            <span>${note.icon}</span>
                            <span>${this.escapeHtml(note.text)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : '';
        
        const portraitSummary = totalPortrait > 0 ? `
            <div class="completion-portrait-summary">
                <div class="completion-portrait-summary__title">
                    <i class="fas fa-user-circle"></i> Портрет клиента (${totalPortrait} фактов)
                </div>
                <div class="completion-portrait-summary__content">
                    ${this.renderPortraitSummary(portrait)}
                </div>
            </div>
        ` : '';
        
        this.container.innerHTML = `
            <div class="completion-screen">
                <div class="completion-screen__icon">🏆</div>
                <h2 class="completion-screen__title">Консультация завершена!</h2>
                <p class="completion-screen__text">Вы успешно отработали диалог с клиентом.</p>
                ${notesSummary}
                ${portraitSummary}
                <div class="completion-screen__buttons">
                    <button class="btn btn--primary" id="restart-consultation-btn">
                        <i class="fas fa-redo"></i> Пройти заново
                    </button>
                    <button class="btn btn--secondary" id="back-to-home-btn">
                        <i class="fas fa-home"></i> На главную
                    </button>
                </div>
            </div>
        `;
        
        const restartBtn = document.getElementById('restart-consultation-btn');
        if (restartBtn) {
            restartBtn.onclick = () => {
                ConsultationCore.reset();
                this.render(ConsultationCore);
                if (window.ConsultationDialog) {
                    window.ConsultationDialog.reset();
                }
            };
        }
        
        const homeBtn = document.getElementById('back-to-home-btn');
        if (homeBtn) {
            homeBtn.onclick = () => {
                window.location.href = './';
            };
        }
    },
    
    // Вспомогательная функция для рендера портрета на финише
    renderPortraitSummary(portrait) {
        const categories = [
            { key: 'work', name: 'Работа', icon: '💼' },
            { key: 'family', name: 'Семья', icon: '👨‍👩‍👧' },
            { key: 'lifestyle', name: 'Образ жизни', icon: '🌟' },
            { key: 'needs', name: 'Потребности', icon: '🎯' },
            { key: 'pains', name: 'Боли и страхи', icon: '😟' },
            { key: 'connections', name: 'Связь с роднёй', icon: '❤️' }
        ];
        
        let html = '<div class="portrait-summary-grid">';
        
        for (const cat of categories) {
            const items = portrait[cat.key];
            if (items && items.length > 0) {
                html += `
                    <div class="portrait-summary-category">
                        <div class="portrait-summary-category__header">
                            <span>${cat.icon}</span>
                            <span>${cat.name}</span>
                        </div>
                        <ul class="portrait-summary-category__list">
                            ${items.map(item => `<li>${this.escapeHtml(item.text)}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }
        }
        
        html += '</div>';
        return html;
    },
    
    escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }
};

window.ConsultationUI = ConsultationUI;
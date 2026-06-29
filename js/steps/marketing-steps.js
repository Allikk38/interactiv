// ===== НОВЫЕ ШАГИ ДЛЯ УРОКА "ЛИЧНЫЙ БРЕНД" =====

/**
 * Шаг: Выбор каналов для продвижения
 */
function runChooseChannelsStep(step) {
    const quizScreen = document.getElementById('quiz-screen');
    const quizStepTitle = document.getElementById('quiz-step-title');
    const quizStepCounter = document.getElementById('quiz-step-counter');
    const quizContainer = document.getElementById('quiz-container');
    
    quizScreen.classList.remove('hidden');
    quizStepTitle.textContent = step.title;
    quizStepCounter.textContent = `Шаг ${AppState.currentStepIndex + 1} из ${AppState.currentScenario.steps.length}`;
    
    const channels = [
        { id: 'telegram', name: 'Telegram-канал', correct: true, desc: 'Основной канал для экспертного контента' },
        { id: 'vk_profile', name: 'VK (личный профиль)', correct: true, desc: 'Для общения и личного бренда' },
        { id: 'vk_video', name: 'VK Видео', correct: true, desc: 'Для обзоров ЖК' },
        { id: 'youtube', name: 'YouTube', correct: false, desc: 'Требует много времени, начните с VK Видео' },
        { id: 'instagram', name: 'Instagram', correct: false, desc: 'Не работает в России без VPN' },
        { id: 'dzen', name: 'Дзен', correct: false, desc: 'Хорош для статей, но не для агента-новичка' }
    ];
    
    let html = `
        <div class="interactive-step">
            <p class="interactive-step__instruction">Выберите каналы для продвижения</p>
            <p class="interactive-step__sub">Вы агент в Новосибирске. Ваша цель: привлечь 5 клиентов в месяц</p>
            <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px;">
    `;
    
    channels.forEach(ch => {
        html += `
            <div class="channel-option" data-id="${ch.id}" style="
                background: var(--color-surface);
                border: 2px solid var(--color-border);
                border-radius: var(--radius-sm);
                padding: 14px 18px;
                cursor: pointer;
                transition: all var(--transition);
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <div>
                    <strong>${ch.name}</strong>
                    <div style="font-size: 0.8rem; color: var(--color-text-light);">${ch.desc}</div>
                </div>
                <span class="channel-check" style="font-size: 1.2rem; color: var(--color-border);">☐</span>
            </div>
        `;
    });
    
    html += `
            </div>
            <div class="quiz-hint hidden" id="interactive-hint"></div>
            <button class="btn btn--primary" id="interactive-check-btn">Проверить</button>
        </div>
    `;
    
    quizContainer.innerHTML = html;
    
    let selected = new Set();
    let checked = false;
    
    document.querySelectorAll('.channel-option').forEach(el => {
        el.addEventListener('click', () => {
            if (checked) return;
            const id = el.dataset.id;
            if (selected.has(id)) {
                selected.delete(id);
                el.style.borderColor = 'var(--color-border)';
                el.querySelector('.channel-check').textContent = '☐';
            } else {
                selected.add(id);
                el.style.borderColor = 'var(--color-primary)';
                el.querySelector('.channel-check').textContent = '✓';
            }
        });
    });
    
    const checkBtn = document.getElementById('interactive-check-btn');
    const hintEl = document.getElementById('interactive-hint');
    
    checkBtn.addEventListener('click', () => {
        if (checked) {
            AppState.currentStepIndex++;
            runStep();
            return;
        }
        
        const correctIds = ['telegram', 'vk_profile', 'vk_video'];
        const wrongIds = ['youtube', 'instagram', 'dzen'];
        
        let correctCount = 0;
        let totalCorrect = correctIds.length;
        
        document.querySelectorAll('.channel-option').forEach(el => {
            const id = el.dataset.id;
            const isSelected = selected.has(id);
            const shouldBeSelected = correctIds.includes(id);
            
            if (isSelected && shouldBeSelected) {
                el.style.borderColor = 'var(--color-success)';
                correctCount++;
            } else if (isSelected && !shouldBeSelected) {
                el.style.borderColor = 'var(--color-danger)';
            } else if (!isSelected && shouldBeSelected) {
                el.style.borderColor = 'var(--color-warning)';
                el.style.background = '#fef9e7';
            }
            
            el.style.cursor = 'default';
        });
        
        const isCorrect = correctCount === totalCorrect;
        
        if (isCorrect) {
            hintEl.textContent = '✅ Отлично! Telegram — ваш главный канал. VK и VK Видео — для широкой аудитории.';
            hintEl.className = 'quiz-hint';
            hintEl.style.background = '#eafaf1';
            hintEl.style.borderLeft = '4px solid var(--color-success)';
            hintEl.style.color = '#1e7e34';
            hintEl.classList.remove('hidden');
        } else {
            hintEl.textContent = '💡 Telegram, VK и VK Видео — это основные каналы для агента в 2026 году. YouTube требует много времени, Instagram не работает в России, а Дзен лучше для статей.';
            hintEl.className = 'quiz-hint';
            hintEl.style.background = '#fef9e7';
            hintEl.style.borderLeft = '4px solid var(--color-warning)';
            hintEl.style.color = '#7d6608';
            hintEl.classList.remove('hidden');
        }
        
        checked = true;
        checkBtn.textContent = 'Далее';
    });
}

/**
 * Шаг: Оформление профиля
 */
function runProfileSetupStep(step) {
    const quizScreen = document.getElementById('quiz-screen');
    const quizStepTitle = document.getElementById('quiz-step-title');
    const quizStepCounter = document.getElementById('quiz-step-counter');
    const quizContainer = document.getElementById('quiz-container');
    
    quizScreen.classList.remove('hidden');
    quizStepTitle.textContent = step.title;
    quizStepCounter.textContent = `Шаг ${AppState.currentStepIndex + 1} из ${AppState.currentScenario.steps.length}`;
    
    const options = [
        {
            id: 'bad',
            text: 'Анна Смирнова | Риелтор',
            correct: false,
            feedback: '❌ "Риелтор" — слишком общее. Клиент не понимает, чем вы отличаетесь.'
        },
        {
            id: 'good',
            text: 'Анна Смирнова — новостройки Новосибирска\nПомогу купить квартиру в новостройке с выгодой до 1 млн ₽\nСвязаться: @anna_realty',
            correct: true,
            feedback: '✅ Чёткая специализация, ценность для клиента, призыв к действию. Идеально!'
        },
        {
            id: 'emoji',
            text: '🏠 Новостройки Новосибирска\n🏆 50+ сделок\n💰 Экономим до 1 млн ₽\n👇 Ссылка на подборку',
            correct: false,
            feedback: '❌ Только эмодзи — нет личности. Кто вы? Как с вами связаться?'
        },
        {
            id: 'vague',
            text: 'Живу недвижимостью ❤️\nСпросите меня о квартирах',
            correct: false,
            feedback: '❌ Слишком размыто. Нет специализации, нет ценности, нет контактов.'
        }
    ];
    
    let html = `
        <div class="interactive-step">
            <p class="interactive-step__instruction">Оформите профиль агента</p>
            <p class="interactive-step__sub">Выберите лучший вариант описания (bio) для вашего профиля</p>
            <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px;">
    `;
    
    options.forEach(opt => {
        const text = opt.text.replace(/\n/g, '<br>');
        html += `
            <div class="profile-option" data-id="${opt.id}" data-correct="${opt.correct}" style="
                background: var(--color-surface);
                border: 2px solid var(--color-border);
                border-radius: var(--radius-sm);
                padding: 14px 18px;
                cursor: pointer;
                transition: all var(--transition);
            ">
                <div style="font-size: 0.9rem; line-height: 1.5;">${text}</div>
            </div>
        `;
    });
    
    html += `
            </div>
            <div class="quiz-hint hidden" id="interactive-hint"></div>
            <button class="btn btn--primary" id="interactive-check-btn" disabled>Проверить</button>
        </div>
    `;
    
    quizContainer.innerHTML = html;
    
    let selected = null;
    let checked = false;
    
    document.querySelectorAll('.profile-option').forEach(el => {
        el.addEventListener('click', () => {
            if (checked) return;
            document.querySelectorAll('.profile-option').forEach(e => {
                e.style.borderColor = 'var(--color-border)';
                e.style.background = 'var(--color-surface)';
            });
            el.style.borderColor = 'var(--color-primary)';
            el.style.background = '#eaf2fd';
            selected = el.dataset.id;
            document.getElementById('interactive-check-btn').disabled = false;
        });
    });
    
    const checkBtn = document.getElementById('interactive-check-btn');
    const hintEl = document.getElementById('interactive-hint');
    
    checkBtn.addEventListener('click', () => {
        if (checked) {
            AppState.currentStepIndex++;
            runStep();
            return;
        }
        
        let isCorrect = false;
        document.querySelectorAll('.profile-option').forEach(el => {
            const correct = el.dataset.correct === 'true';
            const isSelected = el.dataset.id === selected;
            
            if (isSelected && correct) {
                el.style.borderColor = 'var(--color-success)';
                el.style.background = '#eafaf1';
                isCorrect = true;
            } else if (isSelected && !correct) {
                el.style.borderColor = 'var(--color-danger)';
                el.style.background = '#fdedec';
            } else if (!isSelected && correct) {
                el.style.borderColor = 'var(--color-warning)';
                el.style.background = '#fef9e7';
            }
            
            el.style.cursor = 'default';
        });
        
        const selectedOption = options.find(o => o.id === selected);
        
        hintEl.textContent = selectedOption.feedback;
        hintEl.className = 'quiz-hint';
        hintEl.style.background = isCorrect ? '#eafaf1' : '#fdedec';
        hintEl.style.borderLeft = isCorrect ? '4px solid var(--color-success)' : '4px solid var(--color-danger)';
        hintEl.style.color = isCorrect ? '#1e7e34' : '#c0392b';
        hintEl.classList.remove('hidden');
        
        checked = true;
        checkBtn.textContent = 'Далее';
    });
}

// Регистрируем новые шаги
StepRegistry.register('choose-channels', runChooseChannelsStep);
StepRegistry.register('profile-setup', runProfileSetupStep);
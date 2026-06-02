// ===== ТОЧКА ВХОДА С ИНТРО И ВИДЕО =====

document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Consultation] Инициализация...');
    
    // Элементы
    const introOverlay = document.getElementById('intro-overlay');
    const bgVideo = document.getElementById('bg-video');
    const dialogueUi = document.getElementById('dialogue-ui');
    const introCountdown = document.getElementById('intro-countdown');
    const introTimerFill = document.getElementById('intro-timer-fill');
    
    // Элементы верхней панели
    const exitBtn = document.getElementById('exit-lesson-btn');
    const helpBtn = document.getElementById('help-btn');
    const exitModal = document.getElementById('exit-modal');
    const helpModal = document.getElementById('help-modal');
    const exitModalCancel = document.getElementById('exit-modal-cancel');
    const exitModalConfirm = document.getElementById('exit-modal-confirm');
    const helpModalClose = document.getElementById('help-modal-close');
    const helpModalGotit = document.getElementById('help-modal-gotit');
    
    // Элементы прогресса
    const topProgressCurrent = document.getElementById('top-progress-current');
    const topProgressTotal = document.getElementById('top-progress-total');
    
    let countdown = 5;
    let countdownInterval;
    let videoEnded = false;
    let dialogueStarted = false;
    
    // ===== ФУНКЦИИ МОДАЛЬНЫХ ОКОН =====
    function closeExitModal() {
        if (exitModal) exitModal.style.display = 'none';
    }
    
    function showExitModal() {
        if (exitModal) exitModal.style.display = 'flex';
    }
    
    function closeHelpModal() {
        if (helpModal) helpModal.style.display = 'none';
    }
    
    function showHelpModal() {
        if (helpModal) helpModal.style.display = 'flex';
    }
    
    // Выход из урока
    function exitLesson() {
        // Очищаем прогресс сценария
        ConsultationCore.reset();
        
        // Показываем тост о выходе
        if (typeof showToast === 'function') {
            showToast('👋', 'Вы вышли из урока. Прогресс не сохранён.', 'warning');
        }
        
        // Возвращаемся на главную
        setTimeout(() => {
            window.location.href = './';
        }, 500);
    }
    
    // Обновление прогресса в верхней панели
    function updateTopProgress() {
        if (topProgressCurrent && topProgressTotal) {
            const currentIndex = ConsultationCore.getCurrentIndex();
            const totalSteps = ConsultationCore.getTotalSteps();
            topProgressCurrent.textContent = currentIndex + 1;
            topProgressTotal.textContent = totalSteps;
        }
    }
    
    // ===== ОБРАБОТЧИКИ СОБЫТИЙ =====
    if (exitBtn) {
        exitBtn.addEventListener('click', showExitModal);
    }
    
    if (helpBtn) {
        helpBtn.addEventListener('click', showHelpModal);
    }
    
    if (exitModalCancel) {
        exitModalCancel.addEventListener('click', closeExitModal);
    }
    
    if (exitModalConfirm) {
        exitModalConfirm.addEventListener('click', exitLesson);
    }
    
    if (helpModalClose) {
        helpModalClose.addEventListener('click', closeHelpModal);
    }
    
    if (helpModalGotit) {
        helpModalGotit.addEventListener('click', closeHelpModal);
    }
    
    // Закрытие модальных окон по клику на оверлей
    if (exitModal) {
        exitModal.addEventListener('click', (e) => {
            if (e.target === exitModal) closeExitModal();
        });
    }
    
    if (helpModal) {
        helpModal.addEventListener('click', (e) => {
            if (e.target === helpModal) closeHelpModal();
        });
    }
    
    // Закрытие по Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (exitModal && exitModal.style.display === 'flex') {
                closeExitModal();
            }
            if (helpModal && helpModal.style.display === 'flex') {
                closeHelpModal();
            }
        }
    });
    
    // ===== ФУНКЦИИ ВИДЕО И ДИАЛОГА =====
    function freezeVideoOnLastFrame() {
        if (!bgVideo) return;
        bgVideo.currentTime = bgVideo.duration || 0;
        bgVideo.pause();
        console.log('[Consultation] Видео заморожено на последнем кадре');
    }
    
    async function startDialogue() {
        if (dialogueStarted) return;
        dialogueStarted = true;
        
        console.log('[Consultation] Запуск диалога поверх застывшего видео');
        
        // Инициализируем UI
        ConsultationUI.init('dialogue-ui', (selectedOption, selectedBtn) => {
            ConsultationDialog.onAnswerSelected(selectedOption, selectedBtn, () => {
                updateTopProgress();
            });
        });
        
        // Загружаем диалоги
        const loaded = await ConsultationCore.loadDialogs();
        
        if (!loaded) {
            dialogueUi.innerHTML = `
                <div style="text-align: center; padding: 60px; color: #e74c3c; background: rgba(255,255,255,0.9); border-radius: 24px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem;"></i>
                    <p>Ошибка загрузки диалогов. Проверьте файл data/consultation-dialogs.json</p>
                    <button class="btn btn--primary" onclick="location.reload()">Обновить</button>
                </div>
            `;
            dialogueUi.classList.add('dialogue-ui--visible');
            return;
        }
        
        // Обновляем прогресс в верхней панели
        updateTopProgress();
        
        // Показываем интерфейс диалога с анимацией
        dialogueUi.classList.add('dialogue-ui--visible');
        
        // Показываем персонажей с небольшой задержкой
        setTimeout(() => {
            const agentChar = document.getElementById('character-agent');
            const clientChar = document.getElementById('character-client');
            if (agentChar) agentChar.classList.add('character--visible');
            if (clientChar) clientChar.classList.add('character--visible');
        }, 200);
        
        // Рендерим первый шаг
        ConsultationUI.render(ConsultationCore);
        
        console.log('[Consultation] Диалог запущен!');
    }
    
    function startVideoScene() {
        introOverlay.classList.add('intro-overlay--hidden');
        bgVideo.play().catch(e => {
            console.log('[Consultation] Автовоспроизведение заблокировано:', e);
            showPlayButton();
        });
        console.log('[Consultation] Видео запущено');
    }
    
    function showPlayButton() {
        const playBtn = document.createElement('button');
        playBtn.className = 'play-overlay-btn';
        playBtn.innerHTML = '<i class="fas fa-play"></i> Нажмите для начала';
        playBtn.addEventListener('click', () => {
            playBtn.remove();
            bgVideo.play();
        });
        document.body.appendChild(playBtn);
    }
    
    function onVideoEnded() {
        if (videoEnded) return;
        videoEnded = true;
        console.log('[Consultation] Видео закончилось, замораживаем кадр');
        freezeVideoOnLastFrame();
        setTimeout(() => {
            startDialogue();
        }, 300);
    }
    
    if (bgVideo) {
        bgVideo.addEventListener('ended', onVideoEnded);
        bgVideo.addEventListener('loadedmetadata', () => {
            console.log('[Consultation] Видео загружено, длительность:', bgVideo.duration);
        });
    }
    
    function startCountdown() {
        countdownInterval = setInterval(() => {
            countdown--;
            if (introCountdown) introCountdown.textContent = countdown;
            const percent = ((5 - countdown) / 5) * 100;
            if (introTimerFill) introTimerFill.style.width = `${percent}%`;
            if (countdown <= 0) {
                clearInterval(countdownInterval);
                startVideoScene();
            }
        }, 1000);
    }
    
    setTimeout(() => {
        startCountdown();
    }, 500);
    
    if (bgVideo && bgVideo.readyState >= 2 && bgVideo.currentTime >= bgVideo.duration) {
        onVideoEnded();
    }
});
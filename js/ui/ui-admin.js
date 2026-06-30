// ===== АДМИН-ФУНКЦИИ (ПРОПУСК ШАГА) =====

function isAdmin() {
    const user = User.get();
    if (!user) return false;
    
    const adminNames = ['admin', 'тренер', 'Админ', 'Admin', 'Тренер'];
    if (adminNames.includes(user.name.toLowerCase())) return true;
    
    // Используем централизованный ключ
    const adminKey = window.STORAGE_KEYS && STORAGE_KEYS.USER && STORAGE_KEYS.USER.ADMIN_KEY 
        ? STORAGE_KEYS.USER.ADMIN_KEY 
        : 'realty_admin_key';
    
    if (localStorage.getItem(adminKey) === 'true') return true;
    
    const xpProgress = User.getXPProgress();
    if (xpProgress.level >= 10) return true;
    
    return false;
}

function enableAdminMode() {
    const adminKey = window.STORAGE_KEYS && STORAGE_KEYS.USER && STORAGE_KEYS.USER.ADMIN_KEY 
        ? STORAGE_KEYS.USER.ADMIN_KEY 
        : 'realty_admin_key';
    
    localStorage.setItem(adminKey, 'true');
    showToast('🔑', 'Режим администратора включён. Доступен пропуск шагов.', 'success');
    if (typeof renderScenarios === 'function') renderScenarios();
    addSkipStepButton();
}

function disableAdminMode() {
    const adminKey = window.STORAGE_KEYS && STORAGE_KEYS.USER && STORAGE_KEYS.USER.ADMIN_KEY 
        ? STORAGE_KEYS.USER.ADMIN_KEY 
        : 'realty_admin_key';
    
    localStorage.removeItem(adminKey);
    showToast('🔒', 'Режим администратора выключен.', 'warning');
    removeSkipStepButton();
}

let skipButtonAdded = false;

function addSkipStepButton() {
    if (!isAdmin()) return;
    if (skipButtonAdded) return;
    if (!AppState.currentScenario) return;
    
    const stepHeader = document.querySelector('.step-header');
    if (!stepHeader) return;
    if (document.getElementById('skip-step-btn')) return;
    
    const skipBtn = document.createElement('button');
    skipBtn.id = 'skip-step-btn';
    skipBtn.className = 'btn btn--warning btn--small';
    skipBtn.innerHTML = '<i class="fas fa-forward"></i> Пропустить шаг';
    skipBtn.style.marginLeft = 'auto';
    skipBtn.style.backgroundColor = '#f39c12';
    skipBtn.style.color = '#fff';
    skipBtn.style.border = 'none';
    skipBtn.style.cursor = 'pointer';
    
    skipBtn.addEventListener('click', () => {
        if (confirm('Вы уверены, что хотите пропустить текущий шаг? Прогресс этого шага будет потерян.')) {
            skipCurrentStep();
        }
    });
    
    stepHeader.appendChild(skipBtn);
    skipButtonAdded = true;
}

function removeSkipStepButton() {
    const skipBtn = document.getElementById('skip-step-btn');
    if (skipBtn) skipBtn.remove();
    skipButtonAdded = false;
}

function skipCurrentStep() {
    if (!AppState.currentScenario) return;
    
    const currentStep = AppState.currentScenario.steps[AppState.currentStepIndex];
    
    AppState.stepStats.push({
        step: AppState.currentStepIndex + 1,
        type: currentStep.type,
        title: currentStep.title,
        skipped: true,
        correct: 0,
        total: 0
    });
    
    if (typeof saveCurrentProgress === 'function') saveCurrentProgress();
    
    AppState.currentStepIndex++;
    
    showToast('⏭️', `Шаг "${currentStep.title}" пропущен`, 'warning');
    
    ProgressBar.update(
        AppState.currentStepIndex, 
        AppState.currentScenario.steps.length - 1, 
        AppState.currentScenario.steps
    );
    
    if (typeof runStep === 'function') runStep();
}

function updateSkipButtonVisibility() {
    if (isAdmin() && AppState.currentScenario) {
        addSkipStepButton();
    } else {
        removeSkipStepButton();
    }
}

// Перехватываем runStep для обновления кнопки
const originalRunStep = window.runStep;
if (originalRunStep) {
    window.runStep = function() {
        removeSkipStepButton();
        originalRunStep();
        setTimeout(() => updateSkipButtonVisibility(), 100);
    };
}
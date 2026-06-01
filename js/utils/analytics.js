// ===== АНАЛИТИКА И МЕТРИКИ =====

let analyticsSessionId = null;

function getAnalyticsSessionId() {
    if (analyticsSessionId) return analyticsSessionId;
    
    let sessionId = localStorage.getItem('analytics_session_id');
    if (!sessionId) {
        sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('analytics_session_id', sessionId);
    }
    analyticsSessionId = sessionId;
    return sessionId;
}

function getDeviceType() {
    if (/Mobile|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        return 'mobile';
    }
    return 'desktop';
}

function sendAnalytics(eventType, data) {
    const user = User.get();
    if (!user) return;
    
    const payload = {
        action: 'analytics',
        user_name: user.name,
        session_id: getAnalyticsSessionId(),
        event_type: eventType,
        device_type: getDeviceType(),
        screen_width: window.innerWidth,
        timestamp: new Date().toISOString(),
        ...data
    };
    
    // Отправляем без ожидания ответа (fire-and-forget)
    fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).catch(err => logError('Ошибка отправки аналитики:', err));
}

// ===== ОТСЛЕЖИВАНИЕ ВРЕМЕНИ НА ШАГ =====
let stepStartTime = null;
let currentStepType = null;
let currentStepTitle = null;
let currentStepIndex = null;

function startStepTimer(stepType = null, stepTitle = null, stepIndex = null) {
    stepStartTime = Date.now();
    currentStepType = stepType;
    currentStepTitle = stepTitle;
    currentStepIndex = stepIndex;
}

function endStepTimer(isCompleted = true, extraData = {}) {
    if (!stepStartTime) return 0;
    const durationSec = Math.round((Date.now() - stepStartTime) / 1000);
    stepStartTime = null;
    
    if (currentStepType) {
        sendAnalytics('step_complete', {
            step_type: currentStepType,
            step_title: currentStepTitle,
            step_index: currentStepIndex,
            duration_sec: durationSec,
            completed: isCompleted,
            ...extraData
        });
    }
    
    return durationSec;
}

// ===== ОТПРАВКА РЕЗУЛЬТАТОВ ШАГОВ =====
function sendStepResult(stepIndex, stepType, stepTitle, correct, total, details = {}) {
    sendAnalytics('step_result', {
        step_index: stepIndex,
        step_type: stepType,
        step_title: stepTitle,
        correct: correct,
        total: total,
        percent: total > 0 ? Math.round((correct / total) * 100) : 0,
        ...details
    });
}

// ===== ДЕТАЛЬНЫЙ ОТВЕТ НА ВОПРОС (QUIZ) =====
function sendQuizAnswer(questionId, questionText, userAnswer, isCorrect, timeSpentSec, hintUsed = false) {
    sendAnalytics('quiz_answer', {
        question_id: questionId,
        question_text: questionText,
        user_answer: Array.isArray(userAnswer) ? userAnswer.join(', ') : userAnswer,
        is_correct: isCorrect,
        time_spent_sec: timeSpentSec,
        hint_used: hintUsed
    });
}

// ===== КЛИК ПО КАРТЕ =====
function sendMapClick(jkId, jkName, clickLat, clickLng, actualLat, actualLng, distanceM, isCorrect, timeToPlaceSec) {
    sendAnalytics('map_click', {
        jk_id: jkId,
        jk_name: jkName,
        click_lat: clickLat,
        click_lng: clickLng,
        actual_lat: actualLat,
        actual_lng: actualLng,
        distance_m: Math.round(distanceM),
        is_correct: isCorrect,
        time_to_place_sec: timeToPlaceSec
    });
}

// ===== СЦЕНАРИЙ: СТАРТ =====
function sendScenarioStart(scenarioId, scenarioName, totalSteps) {
    sendAnalytics('scenario_start', {
        scenario_id: scenarioId,
        scenario_name: scenarioName,
        total_steps: totalSteps
    });
}

// ===== СЦЕНАРИЙ: ЗАВЕРШЕНИЕ =====
function sendScenarioComplete(scenarioId, scenarioName, completedSteps, totalSteps, totalScore, isPerfect) {
    sendAnalytics('scenario_complete', {
        scenario_id: scenarioId,
        scenario_name: scenarioName,
        completed_steps: completedSteps,
        total_steps: totalSteps,
        total_score: totalScore,
        is_perfect: isPerfect
    });
}

// ===== СЦЕНАРИЙ: ПРЕРЫВАНИЕ (DROP-OFF) =====
function sendScenarioDropOff(scenarioId, scenarioName, completedSteps, totalSteps, lastStepType) {
    sendAnalytics('scenario_drop_off', {
        scenario_id: scenarioId,
        scenario_name: scenarioName,
        completed_steps: completedSteps,
        total_steps: totalSteps,
        last_step_type: lastStepType
    });
}

// ===== ИСПОЛЬЗОВАНИЕ ПОДСКАЗКИ =====
function sendHintUsed(stepType, stepTitle, hintType = 'general') {
    sendAnalytics('hint_used', {
        step_type: stepType,
        step_title: stepTitle,
        hint_type: hintType
    });
}

// ===== ОШИБКИ =====
function sendError(errorCode, errorMessage, context = {}) {
    sendAnalytics('error', {
        error_code: errorCode,
        error_message: errorMessage,
        context: JSON.stringify(context)
    });
}

// ===== DRAG-AND-DROP ДЕЙСТВИЯ =====
function sendDragDropAction(stepType, action, fromZone, toZone, itemId, isCorrect) {
    sendAnalytics('drag_drop', {
        step_type: stepType,
        action: action, // 'drag_start', 'drop', 'reposition'
        from_zone: fromZone,
        to_zone: toZone,
        item_id: itemId,
        is_correct: isCorrect
    });
}

// Экспортируем функции в глобальную область
window.sendAnalytics = sendAnalytics;
window.startStepTimer = startStepTimer;
window.endStepTimer = endStepTimer;
window.sendStepResult = sendStepResult;
window.sendQuizAnswer = sendQuizAnswer;
window.sendMapClick = sendMapClick;
window.sendScenarioStart = sendScenarioStart;
window.sendScenarioComplete = sendScenarioComplete;
window.sendScenarioDropOff = sendScenarioDropOff;
window.sendHintUsed = sendHintUsed;
window.sendError = sendError;
window.sendDragDropAction = sendDragDropAction;
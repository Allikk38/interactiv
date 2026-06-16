// ===== MAP UTILS: ОТПРАВКА ДАННЫХ В GOOGLE SHEETS =====

function sendToGoogle(jkName, isCorrect, distance) {
    if (!GOOGLE_SCRIPT_URL) return;

    const user = User.get();
    if (!user) return;
    
    const payload = {
        action: 'map_click',
        agent_name: user.name || 'Аноним',
        jk_name: jkName,
        is_correct: isCorrect,
        distance_m: Math.round(distance),
        timestamp: new Date().toISOString(),
    };
    
    // Используем очередь офлайн-запросов, если доступна
    if (typeof OfflineQueue !== 'undefined' && OfflineQueue.add) {
        OfflineQueue.add(payload, GOOGLE_SCRIPT_URL, 'POST');
    } else {
        // Fallback на обычный fetch с no-cors
        fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        }).catch(err => logError('[MapUtils] Ошибка отправки:', err));
    }
}

// Функция для массовой отправки нескольких кликов (если нужно)
function sendMultipleMapClicks(clicksArray) {
    if (!GOOGLE_SCRIPT_URL) return;
    if (!clicksArray || clicksArray.length === 0) return;
    
    const user = User.get();
    if (!user) return;
    
    const payload = {
        action: 'multiple_map_clicks',
        agent_name: user.name || 'Аноним',
        clicks: clicksArray,
        timestamp: new Date().toISOString(),
    };
    
    if (typeof OfflineQueue !== 'undefined' && OfflineQueue.add) {
        OfflineQueue.add(payload, GOOGLE_SCRIPT_URL, 'POST');
    } else {
        fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        }).catch(err => logError('[MapUtils] Ошибка массовой отправки:', err));
    }
}

// Функция для отправки с повтором (если не используем очередь)
async function sendToGoogleWithRetry(jkName, isCorrect, distance, maxRetries = 3) {
    if (!GOOGLE_SCRIPT_URL) return false;
    
    const user = User.get();
    if (!user) return false;
    
    const payload = {
        action: 'map_click',
        agent_name: user.name || 'Аноним',
        jk_name: jkName,
        is_correct: isCorrect,
        distance_m: Math.round(distance),
        timestamp: new Date().toISOString(),
    };
    
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            const response = await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            // При mode: 'no-cors' ответ всегда пустой, считаем успехом
            return true;
            
        } catch (error) {
            lastError = error;
            logWarn(`[MapUtils] Попытка ${attempt}/${maxRetries} не удалась:`, error);
            
            if (attempt < maxRetries) {
                // Ждём перед следующей попыткой (экспоненциальная задержка)
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    logError('[MapUtils] Отправка не удалась после', maxRetries, 'попыток:', lastError);
    return false;
}
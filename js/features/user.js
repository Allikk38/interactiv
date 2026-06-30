// ===== ПОЛЬЗОВАТЕЛЬ И ОТПРАВКА РЕЗУЛЬТАТОВ =====
const User = {
    STORAGE_KEY: 'realty_trainer_user',
    XP_KEY: 'realty_trainer_xp',
    STREAK_KEY: 'realty_trainer_streak',
    ONBOARDING_KEY: 'onboarding_tutorial_completed',

    // ===== ГАРАНТИРОВАННОЕ ПОЛУЧЕНИЕ ИМЕНИ =====
    getUserName() {
        // Сначала пробуем получить из User
        var user = this.get();
        if (user && user.name) {
            return user.name;
        }
        
        // Если User.get() не дал результат — читаем напрямую из localStorage
        try {
            var data = localStorage.getItem(this.STORAGE_KEY);
            if (data) {
                var parsed = JSON.parse(data);
                if (parsed && parsed.name) {
                    return parsed.name;
                }
            }
        } catch (_) {}
        
        return 'Аноним';
    },

    get() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (!data) return null;
            const user = JSON.parse(data);
            if (user && typeof user === 'object' && user.name) {
                return user;
            }
            return null;
        } catch (e) {
            console.warn('[User] Ошибка чтения пользователя:', e);
            return null;
        }
    },

    save(name) {
        return this.syncWithServer(name).then((serverData) => {
            const user = {
                name: name,
                savedAt: new Date().toISOString(),
                id: serverData.id,
                token: serverData.token,
                isNew: serverData.isNew
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
            
            if (this.getXP() === null) {
                this.setXP(0);
            }
            
            if (this.getStreak() === null) {
                this.updateStreak();
            }
            
            if (typeof Onboarding !== 'undefined' && Onboarding.checkAndAutoStart) {
                setTimeout(function() {
                    console.log('[User] Вызов Onboarding.checkAndAutoStart() после сохранения пользователя');
                    Onboarding.checkAndAutoStart();
                }, 300);
            }
            
            return user;
        });
    },

    // ===== СИНХРОНИЗАЦИЯ С СЕРВЕРОМ (GET + POST для надёжности) =====
    syncWithServer(name) {
        return new Promise((resolve) => {
            // ===== ГАРАНТИРУЕМ ИМЯ =====
            var userName = name || this.getUserName();
            
            var url = typeof GOOGLE_SCRIPT_URL !== 'undefined' ? GOOGLE_SCRIPT_URL : 
                        'https://script.google.com/macros/s/AKfycbzvFwEopjXdZb6QIjmM1RfLzJXtlFnzJPU2bamtdtY2TnzvcUH0oedwPfteLvxOckGt/exec';

            var now = new Date();
            var formattedDate = now.toLocaleString('ru-RU', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });

            var payload = {
                action: 'save_user',
                user_name: userName,
                timestamp: now.toISOString(),
                formatted_date: formattedDate,
                user_agent: navigator.userAgent || 'unknown',
                screen_width: window.screen ? window.screen.width : 'unknown',
                screen_height: window.screen ? window.screen.height : 'unknown',
                language: navigator.language || 'unknown',
                platform: navigator.platform || 'unknown',
                cookie_enabled: navigator.cookieEnabled || false,
                do_not_track: navigator.doNotTrack || 'unknown'
            };

            console.log('[User] syncWithServer: отправка данных пользователя:', userName);

            // GET-запрос с параметрами (для Google Apps Script)
            var getUrl = url + '?action=save_user' +
                         '&user_name=' + encodeURIComponent(userName) +
                         '&timestamp=' + encodeURIComponent(now.toISOString()) +
                         '&formatted_date=' + encodeURIComponent(formattedDate);

            fetch(getUrl, {
                method: 'GET',
                mode: 'no-cors'
            }).catch(function() {});

            // POST-запрос для полных данных
            fetch(url, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            }).catch(function(err) {
                console.warn('[User] syncWithServer ошибка:', err);
                if (typeof OfflineQueue !== 'undefined' && OfflineQueue.add) {
                    OfflineQueue.add(payload, url, 'POST');
                    console.log('[User] Данные пользователя добавлены в офлайн-очередь');
                }
            });

            // Всегда разрешаем локально, так как no-cors не даёт прочитать ответ
            resolve({
                id: Date.now(),
                token: 'local_' + Date.now(),
                isNew: true,
                name: userName
            });
        });
    },

    clear() {
        localStorage.removeItem(this.STORAGE_KEY);
        localStorage.removeItem(this.XP_KEY);
        localStorage.removeItem(this.STREAK_KEY);
        localStorage.removeItem(this.ONBOARDING_KEY);
        try {
            localStorage.removeItem('onboarding_completed');
            localStorage.removeItem('onboarding_skipped');
        } catch (_) {}
    },

    getXP() {
        const xp = localStorage.getItem(this.XP_KEY);
        return xp !== null ? parseInt(xp, 10) : null;
    },

    setXP(xp) {
        localStorage.setItem(this.XP_KEY, Math.max(0, xp));
        return this.getXP();
    },

    addXP(amount) {
        const currentXP = this.getXP() || 0;
        const newXP = currentXP + amount;
        this.setXP(newXP);
        
        const levelMultiplier = (typeof XP_CONFIG !== 'undefined') ? XP_CONFIG.LEVEL_MULTIPLIER : 100;
        const oldLevel = this.getLevel(currentXP, levelMultiplier);
        const newLevel = this.getLevel(newXP, levelMultiplier);
        
        this.updateStreak();
        
        return {
            xp: newXP,
            leveledUp: newLevel > oldLevel,
            oldLevel: oldLevel,
            newLevel: newLevel
        };
    },

    getLevel(xp = null, levelMultiplier = null) {
        const multiplier = levelMultiplier || (typeof XP_CONFIG !== 'undefined' ? XP_CONFIG.LEVEL_MULTIPLIER : 100);
        const currentXP = xp !== null ? xp : (this.getXP() || 0);
        return Math.floor(currentXP / multiplier) + 1;
    },

    getXPProgress() {
        const currentXP = this.getXP() || 0;
        const levelMultiplier = (typeof XP_CONFIG !== 'undefined') ? XP_CONFIG.LEVEL_MULTIPLIER : 100;
        const level = this.getLevel(currentXP, levelMultiplier);
        const xpInLevel = currentXP % levelMultiplier;
        const percentToNext = (xpInLevel / levelMultiplier) * 100;
        
        return {
            currentXP,
            level,
            xpInLevel,
            xpNeededForNext: levelMultiplier - xpInLevel,
            percentToNext: Math.min(100, Math.max(0, percentToNext))
        };
    },

    getStreak() {
        try {
            return JSON.parse(localStorage.getItem(this.STREAK_KEY));
        } catch {
            return null;
        }
    },

    updateStreak() {
        const today = new Date().toDateString();
        let streak = this.getStreak();
        
        if (!streak) {
            streak = {
                count: 1,
                lastActivityDate: today,
                bestCount: 1
            };
        } else if (streak.lastActivityDate === today) {
            return streak;
        } else {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayString = yesterday.toDateString();
            
            if (streak.lastActivityDate === yesterdayString) {
                streak.count++;
                if (streak.count > streak.bestCount) {
                    streak.bestCount = streak.count;
                }
            } else {
                streak.count = 1;
            }
            streak.lastActivityDate = today;
        }
        
        localStorage.setItem(this.STREAK_KEY, JSON.stringify(streak));
        return streak;
    },

    resetStreak() {
        const streak = {
            count: 0,
            lastActivityDate: null,
            bestCount: 0
        };
        localStorage.setItem(this.STREAK_KEY, JSON.stringify(streak));
        return streak;
    },

    hasCompletedOnboarding() {
        try {
            return localStorage.getItem(this.ONBOARDING_KEY) === 'true' ||
                   localStorage.getItem('onboarding_completed') === 'true';
        } catch {
            return false;
        }
    },

    completeOnboarding() {
        try {
            localStorage.setItem(this.ONBOARDING_KEY, 'true');
            localStorage.setItem('onboarding_completed', 'true');
            return true;
        } catch {
            return false;
        }
    },

    skipOnboarding() {
        try {
            localStorage.setItem('onboarding_skipped', 'true');
            return this.completeOnboarding();
        } catch {
            return false;
        }
    },

    resetOnboarding() {
        try {
            localStorage.removeItem(this.ONBOARDING_KEY);
            localStorage.removeItem('onboarding_completed');
            localStorage.removeItem('onboarding_skipped');
            return true;
        } catch {
            return false;
        }
    },

    saveScenarioProgress(scenarioId, stepIndex, stepStats) {
        const key = `scenario_progress_${scenarioId}`;
        const progress = {
            scenarioId,
            stepIndex,
            stepStats: stepStats || [],
            lastUpdated: Date.now()
        };
        localStorage.setItem(key, JSON.stringify(progress));
        this.updateStreak();
    },

    getScenarioProgress(scenarioId) {
        const key = `scenario_progress_${scenarioId}`;
        try {
            return JSON.parse(localStorage.getItem(key));
        } catch {
            return null;
        }
    },

    clearScenarioProgress(scenarioId) {
        const key = `scenario_progress_${scenarioId}`;
        localStorage.removeItem(key);
        this.clearQuizAnswers(scenarioId);
        this.clearMapProgress(scenarioId);
    },

    saveDetailedScenarioProgress(scenarioId, stepIndex, stepStats, quizAnswers, mapPlacedJks) {
        const key = `scenario_progress_${scenarioId}`;
        const progress = {
            scenarioId,
            stepIndex,
            stepStats: stepStats || [],
            quizAnswers: quizAnswers || [],
            mapPlacedJks: mapPlacedJks || [],
            lastUpdated: Date.now(),
            version: 2
        };
        localStorage.setItem(key, JSON.stringify(progress));
        this.updateStreak();
        return progress;
    },

    getDetailedScenarioProgress(scenarioId) {
        const key = `scenario_progress_${scenarioId}`;
        try {
            const data = JSON.parse(localStorage.getItem(key));
            if (data && data.version === 2) {
                return data;
            }
            if (data && !data.version) {
                return {
                    ...data,
                    quizAnswers: [],
                    mapPlacedJks: [],
                    version: 2
                };
            }
            return null;
        } catch {
            return null;
        }
    },

    saveQuizAnswer(scenarioId, questionId, userAnswer, isCorrect) {
        const key = `scenario_answers_${scenarioId}`;
        let answers = {};
        try {
            answers = JSON.parse(localStorage.getItem(key)) || {};
        } catch {
            answers = {};
        }
        answers[questionId] = {
            answer: userAnswer,
            isCorrect: isCorrect,
            timestamp: Date.now()
        };
        localStorage.setItem(key, JSON.stringify(answers));
    },

    getQuizAnswers(scenarioId) {
        const key = `scenario_answers_${scenarioId}`;
        try {
            return JSON.parse(localStorage.getItem(key)) || {};
        } catch {
            return {};
        }
    },

    clearQuizAnswers(scenarioId) {
        const key = `scenario_answers_${scenarioId}`;
        localStorage.removeItem(key);
    },

    saveMapProgress(scenarioId, stepIndex, placedJks) {
        const key = `scenario_map_${scenarioId}_step_${stepIndex}`;
        const data = {
            placedJks: Array.from(placedJks.entries()),
            timestamp: Date.now()
        };
        localStorage.setItem(key, JSON.stringify(data));
    },

    getMapProgress(scenarioId, stepIndex) {
        const key = `scenario_map_${scenarioId}_step_${stepIndex}`;
        try {
            const data = JSON.parse(localStorage.getItem(key));
            if (data) {
                return new Map(data.placedJks);
            }
            return null;
        } catch {
            return null;
        }
    },

    clearMapProgress(scenarioId) {
        const keys = Object.keys(localStorage);
        for (const key of keys) {
            if (key.startsWith(`scenario_map_${scenarioId}`)) {
                localStorage.removeItem(key);
            }
        }
    },

    calculateScenarioXP(totalCorrect, totalItems, durationSec) {
        const baseXP = (typeof XP_CONFIG !== 'undefined') ? XP_CONFIG.CORRECT_ANSWER_BASE_XP : 10;
        const perfectBonus = (typeof XP_CONFIG !== 'undefined') ? XP_CONFIG.PERFECT_SCENARIO_BONUS_XP : 50;
        const speedBonusFast = (typeof XP_CONFIG !== 'undefined') ? XP_CONFIG.SPEED_BONUS_XP_FAST : 25;
        const speedBonusNormal = (typeof XP_CONFIG !== 'undefined') ? XP_CONFIG.SPEED_BONUS_XP_NORMAL : 10;
        const maxXP = (typeof XP_CONFIG !== 'undefined') ? XP_CONFIG.MAX_XP_PER_SCENARIO : 500;
        const avgTimeThresholdFast = (typeof TIMERS !== 'undefined') ? 30 : 30;
        const avgTimeThresholdNormal = (typeof TIMERS !== 'undefined') ? 60 : 60;
        
        let xp = totalCorrect * baseXP;
        
        if (totalCorrect === totalItems && totalItems > 0) {
            xp += perfectBonus;
        }
        
        if (durationSec && totalItems > 0) {
            const avgTimePerQuestion = durationSec / totalItems;
            if (avgTimePerQuestion < avgTimeThresholdFast) {
                xp += speedBonusFast;
            } else if (avgTimePerQuestion < avgTimeThresholdNormal) {
                xp += speedBonusNormal;
            }
        }
        
        return Math.min(xp, maxXP);
    },

    // ===== ОТПРАВКА РЕЗУЛЬТАТА (ИСПРАВЛЕННАЯ) =====
    sendResult: function(scenarioName, stepStats, totalCorrect, totalItems, durationSec) {
        // ===== ГАРАНТИРУЕМ ПОЛУЧЕНИЕ ИМЕНИ =====
        var userName = this.getUserName(); // ВСЕГДА возвращает строку!
        
        console.log('[User] sendResult: пользователь:', userName, 'сценарий:', scenarioName);
        console.log('[User] sendResult: totalCorrect:', totalCorrect, 'totalItems:', totalItems);
        
        // Если пользователя нет в localStorage — создаём
        var user = this.get();
        if (!user) {
            this.save(userName);
            user = this.get();
        }
        
        // Если user всё ещё null — используем userName как fallback
        var finalUserName = user ? user.name : userName;
        
        var xpEarned = this.calculateScenarioXP(totalCorrect, totalItems, durationSec);
        var xpResult = this.addXP(xpEarned);
        
        var scenarioId = AppState?.currentScenario?.id;
        if (scenarioId) {
            this.clearScenarioProgress(scenarioId);
        }
        
        var now = new Date();
        var formattedDate = now.toLocaleString('ru-RU', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        var payload = {
            action: 'save_result',
            user_name: finalUserName,
            scenario_name: scenarioName,
            total_correct: totalCorrect,
            total_items: totalItems,
            percent: totalItems > 0 ? Math.round((totalCorrect / totalItems) * 100) : 0,
            duration_sec: durationSec || 0,
            xp_earned: xpEarned,
            total_xp_after: this.getXP(),
            steps_detail: JSON.stringify(stepStats),
            timestamp: now.toISOString(),
            formatted_date: formattedDate
        };
        
        var url = typeof GOOGLE_SCRIPT_URL !== 'undefined' ? GOOGLE_SCRIPT_URL : 
                    'https://script.google.com/macros/s/AKfycbzvFwEopjXdZb6QIjmM1RfLzJXtlFnzJPU2bamtdtY2TnzvcUH0oedwPfteLvxOckGt/exec';
        
        console.log('[User] sendResult: отправка для', finalUserName, 'сценарий:', scenarioName);
        console.log('[User] sendResult: payload', payload);
        
        // ===== GET-запрос для надёжности (Google Apps Script лучше принимает GET) =====
        var getUrl = url + '?action=save_result' +
                     '&user_name=' + encodeURIComponent(finalUserName) +
                     '&scenario_name=' + encodeURIComponent(scenarioName) +
                     '&total_correct=' + totalCorrect +
                     '&total_items=' + totalItems +
                     '&percent=' + (totalItems > 0 ? Math.round((totalCorrect / totalItems) * 100) : 0) +
                     '&xp_earned=' + xpEarned +
                     '&formatted_date=' + encodeURIComponent(formattedDate);
        
        fetch(getUrl, {
            method: 'GET',
            mode: 'no-cors'
        }).catch(function() {});
        
        // ===== POST-запрос для полных данных =====
        fetch(url, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        }).catch(function(err) {
            console.warn('[User] sendResult ошибка:', err);
            if (typeof OfflineQueue !== 'undefined' && OfflineQueue.add) {
                OfflineQueue.add(payload, url, 'POST');
                console.log('[User] Результат добавлен в офлайн-очередь');
            }
        });
        
        return {
            xpEarned: xpEarned,
            totalXP: xpResult.xp,
            leveledUp: xpResult.leveledUp,
            newLevel: xpResult.newLevel
        };
    },

    showNamePrompt(callback) {
        const existing = this.get();

        const overlay = document.createElement('div');
        overlay.className = 'name-prompt-overlay';

        overlay.innerHTML = `
            <div class="name-prompt">
                <div class="name-prompt__icon">👋</div>
                <h2 class="name-prompt__title">Добро пожаловать в тренажёр!</h2>
                <p class="name-prompt__sub">Представьтесь, пожалуйста — ваши результаты будут сохранены</p>
                <input
                    type="text"
                    class="name-prompt__input"
                    id="name-input"
                    placeholder="Введите ФИО"
                    value="${existing?.name || ''}"
                    maxlength="80"
                    autocomplete="name"
                />
                <div class="name-prompt__actions">
                    ${existing ? '<button class="btn btn--secondary" id="name-clear-btn">🔁 Не я</button>' : ''}
                    <button class="btn btn--primary" id="name-save-btn" disabled>Начать обучение →</button>
                </div>
                <p class="name-prompt__note">Ваше имя сохраняется только на этом устройстве и используется для отчётности</p>
            </div>
        `;

        document.body.appendChild(overlay);

        const input = document.getElementById('name-input');
        const saveBtn = document.getElementById('name-save-btn');
        const clearBtn = document.getElementById('name-clear-btn');

        const validate = () => {
            const value = input.value.trim();
            saveBtn.disabled = value.length < 3 || /^\s*$/.test(value);
        };

        input.addEventListener('input', validate);
        validate();

        setTimeout(() => input.focus(), 300);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !saveBtn.disabled) {
                saveBtn.click();
            }
        });

        saveBtn.addEventListener('click', () => {
            const name = input.value.trim();
            if (name.length >= 3) {
                this.save(name).then(() => {
                    overlay.remove();
                    if (callback) callback(name);
                });
            }
        });

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clear();
                input.value = '';
                validate();
                clearBtn.remove();
                if (typeof showToast === 'function') {
                    showToast('🔄', 'Данные очищены. Введите новое имя.', 'info');
                }
            });
        }
    }
};
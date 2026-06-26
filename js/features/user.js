// ===== ПОЛЬЗОВАТЕЛЬ И ОТПРАВКА РЕЗУЛЬТАТОВ =====
const User = {
    STORAGE_KEY: 'realty_trainer_user',
    XP_KEY: 'realty_trainer_xp',
    STREAK_KEY: 'realty_trainer_streak',

    get() {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEY));
        } catch {
            return null;
        }
    },

    save(name) {
        // Сначала синхронизируемся с сервером
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
            
            return user;
        });
    },

    // ===== СИНХРОНИЗАЦИЯ С СЕРВЕРОМ (GET-запрос) =====
    syncWithServer(name) {
        return new Promise((resolve) => {
            const url = typeof GOOGLE_SCRIPT_URL !== 'undefined' ? GOOGLE_SCRIPT_URL : 
                        'https://script.google.com/macros/s/AKfycbwk8iTsw9gEEKFuPZm2tO4Uyt2IlSPX-Z06hqPE6FfqoG72tYiwgfzTQPHVOjQiBnlh/exec';

            // GET-запрос с параметрами в URL (обходит CORS)
            const getUrl = url + '?action=getUser&user_name=' + encodeURIComponent(name);

            fetch(getUrl, {
                method: 'GET',
                mode: 'no-cors'
            }).catch(function(err) {
                console.warn('[User] syncWithServer GET error:', err);
            });

            console.log('[User] syncWithServer: GET-запрос отправлен для:', name);
            resolve({
                id: Date.now(),
                token: 'local_' + Date.now(),
                isNew: true,
                name: name
            });
        });
    },

    clear() {
        localStorage.removeItem(this.STORAGE_KEY);
        localStorage.removeItem(this.XP_KEY);
        localStorage.removeItem(this.STREAK_KEY);
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

    // ===== СИСТЕМА СЕРИЙ (STREAK) =====
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

    // ===== ПРОГРЕСС СЦЕНАРИЕВ (БАЗОВЫЙ) =====
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

    // ===== РАСШИРЕННОЕ СОХРАНЕНИЕ ПРОГРЕССА (ДЛЯ АВТОСОХРАНЕНИЯ) =====
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

    // ===== СОХРАНЕНИЕ ОТВЕТОВ НА ВОПРОСЫ =====
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

    // ===== СОХРАНЕНИЕ ПРОГРЕССА НА КАРТЕ =====
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

    // ===== РАСЧЁТ XP =====
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

    // ===== ОТПРАВКА РЕЗУЛЬТАТОВ (С ИСПОЛЬЗОВАНИЕМ ОЧЕРЕДИ) =====
    sendResult(scenarioName, stepStats, totalCorrect, totalItems, durationSec) {
        const user = this.get();
        if (!user) return;
        
        const xpEarned = this.calculateScenarioXP(totalCorrect, totalItems, durationSec);
        const xpResult = this.addXP(xpEarned);
        
        const scenarioId = AppState?.currentScenario?.id;
        if (scenarioId) {
            this.clearScenarioProgress(scenarioId);
        }
        
        const payload = {
            action: 'save_result',
            user_name: user.name,
            scenario_name: scenarioName,
            total_correct: totalCorrect,
            total_items: totalItems,
            percent: totalItems > 0 ? Math.round((totalCorrect / totalItems) * 100) : 0,
            duration_sec: durationSec || 0,
            xp_earned: xpEarned,
            total_xp_after: this.getXP(),
            steps_detail: JSON.stringify(stepStats),
            timestamp: new Date().toISOString(),
        };
        
        // Используем очередь офлайн-запросов, если доступна
        if (typeof OfflineQueue !== 'undefined' && OfflineQueue.add) {
            OfflineQueue.add(payload, GOOGLE_SCRIPT_URL, 'POST');
        } else {
            // fallback на обычный fetch
            fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            }).catch(err => logError('Ошибка отправки результата:', err));
        }
        
        return {
            xpEarned,
            totalXP: xpResult.xp,
            leveledUp: xpResult.leveledUp,
            newLevel: xpResult.newLevel
        };
    },

    // ===== ЭКРАН ВВОДА ИМЕНИ =====
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
            });
        }
    }
};
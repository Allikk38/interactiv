// ===== ПОЛЬЗОВАТЕЛЬ И ОТПРАВКА РЕЗУЛЬТАТОВ =====
const User = {
    STORAGE_KEY: 'realty_trainer_user',

    // Получить сохранённого пользователя
    get() {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEY));
        } catch {
            return null;
        }
    },

    // Сохранить пользователя
    save(name) {
        const user = { name, savedAt: new Date().toISOString() };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
        return user;
    },

    // Очистить (сброс)
    clear() {
        localStorage.removeItem(this.STORAGE_KEY);
    },

    // Показать экран ввода имени (если не сохранён)
    showNamePrompt(callback) {
        const existing = this.get();

        // Создаём модальное окно
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

        // Валидация: минимум 3 символа, не только пробелы
        const validate = () => {
            const value = input.value.trim();
            saveBtn.disabled = value.length < 3 || /^\s*$/.test(value);
        };

        input.addEventListener('input', validate);
        validate(); // начальная проверка

        // Автофокус и Enter
        setTimeout(() => input.focus(), 300);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !saveBtn.disabled) {
                saveBtn.click();
            }
        });

        saveBtn.addEventListener('click', () => {
            const name = input.value.trim();
            if (name.length >= 3) {
                this.save(name);
                overlay.remove();
                if (callback) callback(name);
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
    },

    // Отправить результат прохождения сценария
    sendResult(scenarioName, stepStats, totalCorrect, totalItems, durationSec) {
        const user = this.get();
        if (!user) return;

        fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'save_result',
                user_name: user.name,
                scenario_name: scenarioName,
                total_correct: totalCorrect,
                total_items: totalItems,
                percent: totalItems > 0 ? Math.round((totalCorrect / totalItems) * 100) : 0,
                duration_sec: durationSec || 0,
                steps_detail: JSON.stringify(stepStats),
                timestamp: new Date().toISOString(),
            }),
        }).catch(err => console.error('Ошибка отправки результата:', err));
    }
};

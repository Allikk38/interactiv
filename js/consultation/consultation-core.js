// ===== ЯДРО КОНСУЛЬТАЦИИ =====

const ConsultationCore = {
    state: {
        steps: [],
        currentStepIndex: 0,
        currentStep: null,
        isAnswered: false,
        isComplete: false,
        totalSteps: 0,
        title: '',
        notes: [],           // Заметки агента
        portrait: {          // Портрет клиента
            family: [],      // Семья: состав, дети, кто ещё проживает
            work: [],        // Работа: кем работает, где, график
            lifestyle: [],   // Образ жизни: хобби, привычки, свободное время
            needs: [],       // Потребности: что важно в квартире
            pains: [],       // Боли и страхи: что беспокоит
            connections: []  // Связь с роднёй: близость, помощь, опора
        }
    },

    // Загрузка JSON
    async loadDialogs() {
        try {
            const response = await fetch('data/consultation-dialogs.json');
            const data = await response.json();
            
            this.state.steps = data.steps;
            this.state.totalSteps = data.steps.length;
            this.state.title = data.title;
            this.state.currentStep = this.state.steps[0];
            this.state.currentStepIndex = 0;
            this.state.isAnswered = false;
            this.state.isComplete = false;
            this.state.notes = [];
            this.state.portrait = {
                family: [],
                work: [],
                lifestyle: [],
                needs: [],
                pains: [],
                connections: []
            };
            
            console.log('[ConsultationCore] Загружено шагов:', this.state.totalSteps);
            return true;
        } catch (error) {
            console.error('[ConsultationCore] Ошибка загрузки:', error);
            return false;
        }
    },

    // Получить текущий шаг
    getCurrentStep() {
        return this.state.currentStep;
    },

    // Получить текущий индекс
    getCurrentIndex() {
        return this.state.currentStepIndex;
    },

    // Получить общее количество
    getTotalSteps() {
        return this.state.totalSteps;
    },

    // ===== ЗАМЕТКИ АГЕНТА =====
    getNotes() {
        return this.state.notes;
    },

    addNote(stepId, noteText, icon = '📝') {
        const note = {
            id: Date.now(),
            stepId: stepId,
            stepNumber: this.state.currentStepIndex + 1,
            text: noteText,
            icon: icon,
            timestamp: new Date().toLocaleTimeString()
        };
        
        this.state.notes.push(note);
        console.log('[ConsultationCore] Добавлена заметка:', note);
        return note;
    },

    hasNoteForStep(stepId) {
        return this.state.notes.some(note => note.stepId === stepId);
    },

    clearNotes() {
        this.state.notes = [];
    },

    // ===== ПОРТРЕТ КЛИЕНТА =====
    getPortrait() {
        return this.state.portrait;
    },

    getPortraitCount() {
        let total = 0;
        for (const category in this.state.portrait) {
            total += this.state.portrait[category].length;
        }
        return total;
    },

    addPortraitInfo(category, info, icon = 'ℹ️') {
        if (!this.state.portrait[category]) {
            console.warn('[ConsultationCore] Неизвестная категория портрета:', category);
            return null;
        }
        
        // Проверяем, нет ли уже такой информации (чтобы не дублировать)
        const exists = this.state.portrait[category].some(item => item.text === info);
        if (exists) return null;
        
        const portraitItem = {
            id: Date.now(),
            text: info,
            icon: icon,
            stepNumber: this.state.currentStepIndex + 1,
            timestamp: new Date().toLocaleTimeString()
        };
        
        this.state.portrait[category].push(portraitItem);
        console.log('[ConsultationCore] Добавлен портрет:', category, info);
        return portraitItem;
    },

    hasPortraitInfo(category, info) {
        return this.state.portrait[category].some(item => item.text === info);
    },

    clearPortrait() {
        this.state.portrait = {
            family: [],
            work: [],
            lifestyle: [],
            needs: [],
            pains: [],
            connections: []
        };
    },

    // ===== ПРОВЕРКА ОТВЕТА =====
    checkAnswer(selectedOption) {
        if (this.state.isAnswered) return null;
        
        const isCorrect = selectedOption.correct === true;
        let autoNote = null;
        let autoPortrait = null;
        
        // Если ответ правильный и есть заметка в опции — добавляем автоматически
        if (isCorrect && selectedOption.note) {
            if (!this.hasNoteForStep(this.state.currentStepIndex)) {
                autoNote = this.addNote(
                    this.state.currentStepIndex,
                    selectedOption.note,
                    selectedOption.noteIcon || '✓'
                );
            }
        }
        
        // Если ответ правильный и есть портретная информация — добавляем
        if (isCorrect && selectedOption.portrait) {
            const portraitInfo = selectedOption.portrait;
            for (const [category, data] of Object.entries(portraitInfo)) {
                if (data && data.text && !this.hasPortraitInfo(category, data.text)) {
                    autoPortrait = this.addPortraitInfo(
                        category,
                        data.text,
                        data.icon || 'ℹ️'
                    );
                }
            }
        }
        
        return {
            isCorrect,
            feedback: selectedOption.feedback,
            optionText: selectedOption.text,
            autoNote: autoNote,
            autoPortrait: autoPortrait
        };
    },

    // Перейти к следующему шагу
    nextStep() {
        if (this.state.currentStepIndex + 1 < this.state.totalSteps) {
            this.state.currentStepIndex++;
            this.state.currentStep = this.state.steps[this.state.currentStepIndex];
            this.state.isAnswered = false;
            return { hasNext: true, nextStep: this.state.currentStep };
        } else {
            this.state.isComplete = true;
            return { hasNext: false, isComplete: true };
        }
    },

    // Сбросить состояние
    reset() {
        this.state.currentStepIndex = 0;
        this.state.currentStep = this.state.steps[0];
        this.state.isAnswered = false;
        this.state.isComplete = false;
        this.state.notes = [];
        this.clearPortrait();
    },

    // Получить прогресс в процентах
    getProgressPercent() {
        if (this.state.isComplete) return 100;
        return (this.state.currentStepIndex / this.state.totalSteps) * 100;
    }
};

window.ConsultationCore = ConsultationCore;
// ===== ПРОГРЕСС-БАР =====
const ProgressBar = {
    init() {
        // Создаём контейнер прогресс-бара в DOM, если его нет
        if (!document.getElementById('progress-bar-container')) {
            const container = document.createElement('div');
            container.id = 'progress-bar-container';
            container.className = 'progress-bar-container';
            container.innerHTML = `
                <div class="progress-bar">
                    <div class="progress-bar__fill" id="progress-fill"></div>
                </div>
                <div class="progress-bar__labels" id="progress-labels"></div>
            `;

            // Вставляем после step-header
            const stepHeader = document.querySelector('.step-header');
            if (stepHeader) {
                stepHeader.after(container);
            }
        }
    },

    update(currentStep, totalSteps, steps) {
        const container = document.getElementById('progress-bar-container');
        if (!container) return;

        const fill = document.getElementById('progress-fill');
        const labels = document.getElementById('progress-labels');

        const percent = Math.round((currentStep / totalSteps) * 100);
        fill.style.width = `${percent}%`;

        // Генерируем точки-шаги
        labels.innerHTML = '';
        for (let i = 0; i < totalSteps; i++) {
            const step = steps[i];
            const dot = document.createElement('span');
            dot.className = 'progress-bar__dot';
            dot.title = step.title || `Шаг ${i + 1}`;

            if (i < currentStep) dot.classList.add('progress-bar__dot--done');
            if (i === currentStep) dot.classList.add('progress-bar__dot--current');

            labels.appendChild(dot);
        }
    },

    show() {
        const container = document.getElementById('progress-bar-container');
        if (container) container.style.display = 'block';
    },

    hide() {
        const container = document.getElementById('progress-bar-container');
        if (container) container.style.display = 'none';
    }
};

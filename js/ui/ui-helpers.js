// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ UI =====

function getDifficultyInfo(scenario) {
    const stepCount = scenario.steps.length;
    let difficulty = 'medium';
    let difficultyLabel = 'Средний';
    let difficultyStars = '★★';
    
    if (stepCount <= 3) {
        difficulty = 'easy';
        difficultyLabel = 'Лёгкий';
        difficultyStars = '★';
    } else if (stepCount >= 8) {
        difficulty = 'hard';
        difficultyLabel = 'Сложный';
        difficultyStars = '★★★';
    }
    
    return { difficulty, difficultyLabel, difficultyStars };
}

function getStepIcon(stepType) {
    const icons = {
        'map': '<i class="fas fa-map-marker-alt"></i>',
        'quiz': '<i class="fas fa-question-circle"></i>',
        'brief': '<i class="fas fa-book-open"></i>',
        'matching': '<i class="fas fa-puzzle-piece"></i>',
        'pipeline': '<i class="fas fa-chart-line"></i>',
        'dialogue': '<i class="fas fa-comments"></i>',
        'platforms': '<i class="fab fa-instagram"></i>',
        'rule3t': '<i class="fas fa-music"></i>',
        'profile': '<i class="fas fa-user-circle"></i>',
        'content-plan': '<i class="fas fa-calendar-alt"></i>',
        'funnel': '<i class="fas fa-funnel-dollar"></i>',
        'ai-tools': '<i class="fas fa-robot"></i>',
        'analytics': '<i class="fas fa-chart-simple"></i>',
        'timer-quiz': '<i class="fas fa-stopwatch"></i>',
        'decision-chain': '<i class="fas fa-code-branch"></i>',
        'client-journey': '<i class="fas fa-handshake"></i>'
    };
    return icons[stepType] || '<i class="fas fa-cog"></i>';
}

function countStepsByType(steps) {
    const counts = {};
    for (const step of steps) {
        if (step.type === 'finish') continue;
        counts[step.type] = (counts[step.type] || 0) + 1;
    }
    return counts;
}
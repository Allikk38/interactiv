// ===== РЕКОМЕНДАЦИИ =====

function renderRecommendations() {
    const container = document.getElementById('recommendations');
    const grid = document.getElementById('recommendations-grid');
    if (!container || !grid) return;
    
    const badges = Badges.getAll();
    const notCompleted = allScenarios.filter(s => !badges.includes(s.badge));
    
    if (notCompleted.length === 0 || notCompleted.length === allScenarios.length) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    
    const shuffled = [...notCompleted].sort(() => 0.5 - Math.random());
    const recommendations = shuffled.slice(0, 3);
    
    let recHtml = '';
    for (const rec of recommendations) {
        const icon = rec.icon || 'fa-book-open';
        recHtml += `
            <div class="recommendation-card" data-scenario-id="${rec.id}">
                <div class="recommendation-card__icon"><i class="fas ${icon}"></i></div>
                <div class="recommendation-card__title">${escapeHtml(rec.name)}</div>
                <div class="recommendation-card__desc">${escapeHtml(rec.description.substring(0, 60))}${rec.description.length > 60 ? '…' : ''}</div>
            </div>
        `;
    }
    
    grid.innerHTML = recHtml;
    
    document.querySelectorAll('.recommendation-card').forEach(card => {
        card.addEventListener('click', () => {
            const scenarioId = card.dataset.scenarioId;
            const scenario = allScenarios.find(s => s.id === scenarioId);
            if (scenario && typeof startScenario === 'function') startScenario(scenario);
        });
    });
}
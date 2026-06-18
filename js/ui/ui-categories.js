// ===== КАТЕГОРИИ =====

let currentCategory = 'all';

function renderCategoryChips() {
    const container = document.getElementById('categories-list');
    if (!container) return;
    
    const categories = new Set();
    const categoryCounts = {};
    
    categories.add('all');
    categoryCounts['all'] = allScenarios.length;
    
    for (const scenario of allScenarios) {
        if (scenario.group) {
            categories.add(scenario.group);
            categoryCounts[scenario.group] = (categoryCounts[scenario.group] || 0) + 1;
        }
    }
    
    const sortedCategories = Array.from(categories).sort((a, b) => {
        if (a === 'all') return -1;
        if (b === 'all') return 1;
        return a.localeCompare(b);
    });
    
    let chipsHTML = '';
    for (const cat of sortedCategories) {
        const displayName = cat === 'all' ? 'Все' : cat;
        const activeClass = currentCategory === cat ? 'category-chip--active' : '';
        const icon = cat === 'all' ? '<i class="fas fa-th-large"></i>' : 
                     cat === 'Картография' ? '<i class="fas fa-map-marked-alt"></i>' :
                     cat === 'Обучение' ? '<i class="fas fa-graduation-cap"></i>' :
                     cat === 'Практика: работа с клиентом' ? '<i class="fas fa-handshake"></i>' :
                     cat === 'Быстрые игры' ? '<i class="fas fa-stopwatch"></i>' :
                     '<i class="fas fa-folder"></i>';
        
        chipsHTML += `
            <button class="category-chip ${activeClass}" data-category="${escapeHtml(cat)}">
                ${icon} ${escapeHtml(displayName)}
                <span class="category-chip__count">${categoryCounts[cat]}</span>
            </button>
        `;
    }
    
    container.innerHTML = chipsHTML;
    
    document.querySelectorAll('.category-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const category = chip.dataset.category;
            if (category === currentCategory) return;
            currentCategory = category;
            document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('category-chip--active'));
            chip.classList.add('category-chip--active');
            if (typeof renderScenariosGrid === 'function') renderScenariosGrid();
        });
    });
}
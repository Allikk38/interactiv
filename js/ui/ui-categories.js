// ===== КАТЕГОРИИ =====

// Используем глобальную переменную currentCategory из ui.js

function renderCategoryChips() {
    var container = document.getElementById('categories-list');
    if (!container) return;
    
    var scenarios = window.allScenarios || [];
    if (window.StoreInstance) {
        var storeScenarios = StoreInstance.getScenarios();
        if (storeScenarios && storeScenarios.length > 0) {
            scenarios = storeScenarios;
            window.allScenarios = scenarios;
        }
    }
    
    if (!scenarios || scenarios.length === 0) {
        console.warn('[UI] Нет сценариев для отображения категорий');
        return;
    }
    
    var categories = new Set();
    var categoryCounts = {};
    
    categories.add('all');
    categoryCounts['all'] = scenarios.length;
    
    for (var i = 0; i < scenarios.length; i++) {
        var scenario = scenarios[i];
        if (scenario.group) {
            categories.add(scenario.group);
            categoryCounts[scenario.group] = (categoryCounts[scenario.group] || 0) + 1;
        }
    }
    
    var sortedCategories = Array.from(categories).sort(function(a, b) {
        if (a === 'all') return -1;
        if (b === 'all') return 1;
        return a.localeCompare(b);
    });
    
    var chipsHTML = '';
    for (var i = 0; i < sortedCategories.length; i++) {
        var cat = sortedCategories[i];
        var displayName = cat === 'all' ? 'Все' : cat;
        var activeClass = window.currentCategory === cat ? 'category-chip--active' : '';
        var icon = cat === 'all' ? '<i class="fas fa-th-large"></i>' : 
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
    
    document.querySelectorAll('.category-chip').forEach(function(chip) {
        chip.addEventListener('click', function() {
            var category = this.dataset.category;
            if (category === window.currentCategory) return;
            window.currentCategory = category;
            document.querySelectorAll('.category-chip').forEach(function(c) {
                c.classList.remove('category-chip--active');
            });
            this.classList.add('category-chip--active');
            if (typeof renderScenariosGrid === 'function') {
                renderScenariosGrid();
            }
        });
    });
}

// Экспортируем функцию
window.renderCategoryChips = renderCategoryChips;
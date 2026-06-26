// ===== ДАШБОРД АГЕНТА =====

function renderAgentDashboard() {
    var user = null;
    try {
        user = User.get();
    } catch (e) {
        console.warn('[UI] User не загружен');
        return;
    }
    
    if (!user) return;
    
    var dashboard = document.getElementById('agent-dashboard');
    var quickStats = document.getElementById('quick-stats');
    if (!dashboard) return;
    
    dashboard.style.display = 'block';
    if (quickStats) quickStats.style.display = 'grid';
    
    var initial = user.name.charAt(0).toUpperCase();
    var avatarEl = document.getElementById('dashboard-avatar');
    var nameEl = document.getElementById('dashboard-name');
    var joinedEl = document.getElementById('dashboard-joined');
    
    if (avatarEl) avatarEl.textContent = initial;
    if (nameEl) nameEl.textContent = user.name;
    
    var savedAt = user.savedAt;
    if (savedAt && joinedEl) {
        var date = new Date(savedAt);
        var months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
        joinedEl.textContent = date.getDate() + ' ' + months[date.getMonth()] + ' ' + date.getFullYear();
    }
    
    var xpProgress = null;
    try {
        xpProgress = User.getXPProgress();
    } catch (e) {
        xpProgress = { level: 1, percentToNext: 0, xpNeededForNext: 100 };
    }
    
    var levelEl = document.getElementById('dashboard-level');
    var progressFillEl = document.getElementById('dashboard-progress-fill');
    var nextEl = document.getElementById('dashboard-next');
    
    if (levelEl) levelEl.textContent = xpProgress.level;
    if (progressFillEl) progressFillEl.style.width = xpProgress.percentToNext + '%';
    if (nextEl) nextEl.textContent = 'До следующего уровня: ' + xpProgress.xpNeededForNext + ' XP';
    
    var streak = null;
    try {
        streak = User.getStreak();
    } catch (e) {
        streak = null;
    }
    
    var streakEl = document.getElementById('dashboard-streak');
    if (streakEl && streak && streak.count > 0) {
        streakEl.style.display = 'flex';
        var streakCountEl = document.getElementById('streak-count');
        if (streakCountEl) streakCountEl.textContent = streak.count;
    } else if (streakEl) {
        streakEl.style.display = 'none';
    }
    
    updateRingProgress();
}

function updateRingProgress() {
    var canvas = document.getElementById('ring-canvas');
    if (!canvas) return;
    
    var scenarios = window.allScenarios || [];
    var totalScenarios = scenarios.length || 0;
    
    var badges = [];
    try {
        badges = Badges.getAll();
    } catch (e) {
        badges = [];
    }
    
    var completed = 0;
    for (var i = 0; i < scenarios.length; i++) {
        if (badges.indexOf(scenarios[i].badge) !== -1) {
            completed++;
        }
    }
    
    var percent = totalScenarios > 0 ? Math.round((completed / totalScenarios) * 100) : 0;
    
    var size = 80;
    var center = size / 2;
    var radius = 32;
    var startAngle = -0.5 * Math.PI;
    var endAngle = startAngle + (2 * Math.PI * percent / 100);
    
    canvas.width = size;
    canvas.height = size;
    var ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, size, size);
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 6;
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(center, center, radius, startAngle, endAngle);
    ctx.strokeStyle = '#f39c12';
    ctx.lineWidth = 6;
    ctx.stroke();
    
    var valueEl = document.getElementById('ring-value');
    if (valueEl) valueEl.textContent = percent + '%';
}

function updateQuickStats() {
    var badges = [];
    try {
        badges = Badges.getAll();
    } catch (e) {
        badges = [];
    }
    
    var scenarios = window.allScenarios || [];
    var completedCount = 0;
    for (var i = 0; i < scenarios.length; i++) {
        if (badges.indexOf(scenarios[i].badge) !== -1) {
            completedCount++;
        }
    }
    
    var xpProgress = null;
    try {
        xpProgress = User.getXPProgress();
    } catch (e) {
        xpProgress = { currentXP: 0 };
    }
    
    var quickScenarios = document.getElementById('quick-scenarios');
    var quickTotal = document.getElementById('quick-total');
    var quickXp = document.getElementById('quick-xp');
    var quickBadges = document.getElementById('quick-badges');
    
    if (quickScenarios) quickScenarios.innerHTML = completedCount + '/<span id="quick-total">' + scenarios.length + '</span>';
    if (quickXp) quickXp.textContent = xpProgress.currentXP || 0;
    if (quickBadges) quickBadges.textContent = badges.length;
}

function refreshMainScreen() {
    updateRingProgress();
    updateQuickStats();
    
    if (typeof renderScenariosGrid === 'function') {
        renderScenariosGrid();
    }
    
    if (typeof renderRecommendations === 'function') {
        renderRecommendations();
    }
    
    if (typeof updateContinueLearning === 'function') {
        updateContinueLearning();
    }
    
    if (typeof updateHeaderXP === 'function') {
        updateHeaderXP();
    }
}

// ===== ОБНОВЛЕНИЕ ХЕДЕРА =====

function updateHeaderXP() {
    var xpCard = document.getElementById('xp-card');
    var levelEl = document.getElementById('user-level');
    var xpEl = document.getElementById('user-xp');
    var fillEl = document.getElementById('level-progress-fill');
    
    if (!xpCard) return;
    
    var user = null;
    try {
        user = User.get();
    } catch (e) {
        user = null;
    }
    
    if (!user) {
        xpCard.style.display = 'none';
        return;
    }
    
    var xpProgress = null;
    try {
        xpProgress = User.getXPProgress();
    } catch (e) {
        xpProgress = { level: 1, currentXP: 0, percentToNext: 0 };
    }
    
    xpCard.style.display = 'block';
    if (levelEl) levelEl.textContent = 'Уровень ' + xpProgress.level;
    if (xpEl) xpEl.textContent = xpProgress.currentXP + ' XP';
    if (fillEl) fillEl.style.width = xpProgress.percentToNext + '%';
}

function updateHeaderUser() {
    var nameBtn = document.getElementById('user-name-btn');
    var avatarEl = document.getElementById('user-avatar');
    var nameEl = document.getElementById('user-name-text');
    
    if (!nameBtn) return;
    
    var user = null;
    try {
        user = User.get();
    } catch (e) {
        user = null;
    }
    
    if (!user) {
        nameBtn.style.display = 'none';
        return;
    }
    
    nameBtn.style.display = 'flex';
    if (avatarEl) avatarEl.textContent = user.name.charAt(0).toUpperCase();
    if (nameEl) nameEl.textContent = user.name;
}

function addUserChangeButton() {
    var nameBtn = document.getElementById('user-name-btn');
    if (nameBtn) {
        nameBtn.addEventListener('click', function() {
            if (confirm('Сменить пользователя? Весь прогресс на этом устройстве будет очищен.')) {
                try {
                    User.clear();
                } catch (e) {
                    console.warn('[UI] Ошибка при очистке пользователя:', e);
                }
                location.reload();
            }
        });
    }
}

// Экспортируем функции в глобальную область
window.renderAgentDashboard = renderAgentDashboard;
window.updateQuickStats = updateQuickStats;
window.updateHeaderXP = updateHeaderXP;
window.updateHeaderUser = updateHeaderUser;
window.addUserChangeButton = addUserChangeButton;
window.refreshMainScreen = refreshMainScreen;
window.updateRingProgress = updateRingProgress;
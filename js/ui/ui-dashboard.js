// ===== ДАШБОРД АГЕНТА =====

let allScenarios = [];

function renderAgentDashboard() {
    const user = User.get();
    if (!user) return;
    
    const dashboard = document.getElementById('agent-dashboard');
    const quickStats = document.getElementById('quick-stats');
    if (!dashboard) return;
    
    dashboard.style.display = 'block';
    quickStats.style.display = 'grid';
    
    const initial = user.name.charAt(0).toUpperCase();
    document.getElementById('dashboard-avatar').textContent = initial;
    document.getElementById('dashboard-name').textContent = user.name;
    
    const savedAt = user.savedAt;
    if (savedAt) {
        const date = new Date(savedAt);
        const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
        document.getElementById('dashboard-joined').textContent = `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    }
    
    const xpProgress = User.getXPProgress();
    document.getElementById('dashboard-level').textContent = xpProgress.level;
    document.getElementById('dashboard-progress-fill').style.width = `${xpProgress.percentToNext}%`;
    document.getElementById('dashboard-next').textContent = `До следующего уровня: ${xpProgress.xpNeededForNext} XP`;
    
    const streak = User.getStreak();
    const streakEl = document.getElementById('dashboard-streak');
    if (streak && streak.count > 0) {
        streakEl.style.display = 'flex';
        document.getElementById('streak-count').textContent = streak.count;
    } else {
        streakEl.style.display = 'none';
    }
    
    updateRingProgress();
}

function updateRingProgress() {
    const canvas = document.getElementById('ring-canvas');
    if (!canvas) return;
    
    const totalScenarios = allScenarios.length;
    const badges = Badges.getAll();
    const completed = allScenarios.filter(s => badges.includes(s.badge)).length;
    const percent = totalScenarios > 0 ? Math.round((completed / totalScenarios) * 100) : 0;
    
    const size = 80;
    const center = size / 2;
    const radius = 32;
    const startAngle = -0.5 * Math.PI;
    const endAngle = startAngle + (2 * Math.PI * percent / 100);
    
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
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
    
    document.getElementById('ring-value').textContent = `${percent}%`;
}

function updateQuickStats() {
    const badges = Badges.getAll();
    const completedCount = allScenarios.filter(s => badges.includes(s.badge)).length;
    const xpProgress = User.getXPProgress();
    
    document.getElementById('quick-scenarios').innerHTML = `${completedCount}/<span id="quick-total">${allScenarios.length}</span>`;
    document.getElementById('quick-xp').textContent = xpProgress.currentXP;
    document.getElementById('quick-badges').textContent = badges.length;
}

function refreshMainScreen() {
    updateRingProgress();
    updateQuickStats();
    if (typeof renderScenariosGrid === 'function') renderScenariosGrid();
    if (typeof renderRecommendations === 'function') renderRecommendations();
    if (typeof updateContinueLearning === 'function') updateContinueLearning();
    if (typeof updateHeaderXP === 'function') updateHeaderXP();
}
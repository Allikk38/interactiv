// ===== КОНФИГУРАЦИЯ =====
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzZT7dsLRkNLE0Lp7zzi1oWfGhqdxFhydKV_B-B6GZMBHp7r6OND6LgduyP89YclZQo/exec'; // Замените на ваш URL для отправки в Google Таблицу (опционально)
const MAP_CENTER = [55.018, 82.92]; // Центр Новосибирска
const MAP_ZOOM = 12;

// ===== DOM-ЭЛЕМЕНТЫ =====
const jkListEl = document.getElementById('jk-list');
const placedCountEl = document.getElementById('placed-count');
const totalCountEl = document.getElementById('total-count');
const hintBtn = document.getElementById('hint-btn');
const resetAllBtn = document.getElementById('reset-all-btn');
const toast = document.getElementById('toast');
const toastIcon = document.getElementById('toast-icon');
const toastMessage = document.getElementById('toast-message');
const finishModal = document.getElementById('finish-modal');
const modalStats = document.getElementById('modal-stats');
const restartBtn = document.getElementById('restart-btn');

// ===== СОСТОЯНИЕ =====
let jks = [];
let selectedJkId = null;
let placedJks = new Map(); // id -> { lat, lng, correct }
let map;
let markersLayer;
let toastTimer;

// ===== ИНИЦИАЛИЗАЦИЯ КАРТЫ =====
function initMap() {
    map = L.map('map', {
        center: MAP_CENTER,
        zoom: MAP_ZOOM,
        zoomControl: true,
        scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
    }).addTo(map);

    markersLayer = L.layerGroup().addTo(map);

    map.on('click', onMapClick);
}

// ===== ЗАГРУЗКА ДАННЫХ =====
async function loadJks() {
    try {
        const response = await fetch('data/jks.json');
        if (!response.ok) throw new Error('Ошибка загрузки данных');
        jks = await response.json();
        totalCountEl.textContent = jks.length;
        restoreState();
        renderJkList();
        renderMarkers();
        updateCounter();
    } catch (error) {
        console.error('Ошибка загрузки ЖК:', error);
        showToast('❌', 'Не удалось загрузить данные. Обновите страницу.', 'error');
    }
}

// ===== РЕНДЕР СПИСКА ЖК =====
function renderJkList() {
    jkListEl.innerHTML = '';

    jks.forEach(jk => {
        const isPlaced = placedJks.has(jk.id);
        const li = document.createElement('li');
        li.className = 'jk-list__item';
        if (selectedJkId === jk.id) li.classList.add('jk-list__item--selected');
        if (isPlaced) li.classList.add('jk-list__item--placed');

        li.innerHTML = `
            <div class="jk-list__name">${jk.name}</div>
            <div class="jk-list__developer">${jk.developer}</div>
        `;

        if (!isPlaced) {
            li.addEventListener('click', () => selectJk(jk.id));
        }

        jkListEl.appendChild(li);
    });

    hintBtn.disabled = selectedJkId === null;
}

// ===== ВЫБОР ЖК =====
function selectJk(id) {
    if (placedJks.has(id)) return;
    selectedJkId = id;
    renderJkList();
}

// ===== КЛИК ПО КАРТЕ =====
function onMapClick(e) {
    if (selectedJkId === null) return;

    const jk = jks.find(j => j.id === selectedJkId);
    if (!jk) return;

    const { lat, lng } = e.latlng;
    const distance = getDistance(lat, lng, jk.lat, jk.lng);
    const isCorrect = distance <= jk.radius;

    if (isCorrect) {
        // Правильный ответ
        placedJks.set(jk.id, { lat, lng, correct: true });
        showToast('✅', `Правильно! ${jk.name} на месте.`, 'success');
        selectedJkId = null;
    } else {
        // Неправильный ответ
        const wrongMarker = L.marker([lat, lng], {
            icon: L.divIcon({ className: 'marker-wrong' }),
        }).addTo(markersLayer);

        wrongMarker.bindTooltip(jk.name, {
            permanent: true,
            direction: 'bottom',
            className: 'marker-label',
        }).openTooltip();

        showToast('❌', `Неправильно. ${jk.hint}`, 'error');

        // Удаляем неправильный маркер через 3 секунды
        setTimeout(() => {
            markersLayer.removeLayer(wrongMarker);
        }, 3000);
    }

    saveState();
    renderJkList();
    renderMarkers();
    updateCounter();
    checkFinish();
}

// ===== РЕНДЕР МАРКЕРОВ =====
function renderMarkers() {
    markersLayer.clearLayers();

    placedJks.forEach((data, id) => {
        const jk = jks.find(j => j.id === id);
        if (!jk) return;

        const marker = L.marker([data.lat, data.lng], {
            icon: L.divIcon({ className: 'marker-correct' }),
        }).addTo(markersLayer);

        marker.bindTooltip(jk.name, {
            permanent: true,
            direction: 'bottom',
            className: 'marker-label',
        }).openTooltip();
    });
}

// ===== ОБНОВЛЕНИЕ СЧЁТЧИКА =====
function updateCounter() {
    placedCountEl.textContent = placedJks.size;
}

// ===== ПРОВЕРКА ЗАВЕРШЕНИЯ =====
function checkFinish() {
    if (placedJks.size === jks.length && jks.length > 0) {
        setTimeout(() => {
            modalStats.textContent = `Правильно расставлено: ${placedJks.size} из ${jks.length}`;
            finishModal.classList.remove('hidden');
        }, 500);
    }
}

// ===== ПОКАЗ ТОСТА =====
function showToast(icon, message, type) {
    clearTimeout(toastTimer);
    toastIcon.textContent = icon;
    toastMessage.textContent = message;
    toast.className = `toast toast--${type} toast--show`;
    toastTimer = setTimeout(() => {
        toast.classList.remove('toast--show');
    }, 3000);
}

// ===== ПОДСКАЗКА =====
function showHint() {
    if (selectedJkId === null) return;
    const jk = jks.find(j => j.id === selectedJkId);
    if (jk) {
        showToast('💡', jk.hint, 'error');
    }
}

// ===== СБРОС ВСЕГО =====
function resetAll() {
    placedJks.clear();
    selectedJkId = null;
    saveState();
    renderJkList();
    renderMarkers();
    updateCounter();
    showToast('🔄', 'Прогресс сброшен. Начните заново.', 'success');
}

// ===== ПЕРЕЗАПУСК =====
function restart() {
    placedJks.clear();
    selectedJkId = null;
    localStorage.removeItem('mapTrainerState');
    finishModal.classList.add('hidden');
    renderJkList();
    renderMarkers();
    updateCounter();
    showToast('🔄', 'Новая сессия начата!', 'success');
}

// ===== РАСЧЁТ РАССТОЯНИЯ (Гаверсинус) =====
function getDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // радиус Земли в метрах
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg) {
    return deg * (Math.PI / 180);
}

// ===== LOCALSTORAGE =====
function saveState() {
    const state = {
        placedJks: Array.from(placedJks.entries()),
    };
    localStorage.setItem('mapTrainerState', JSON.stringify(state));
}

function restoreState() {
    const saved = localStorage.getItem('mapTrainerState');
    if (saved) {
        try {
            const state = JSON.parse(saved);
            placedJks = new Map(state.placedJks);
        } catch (e) {
            console.error('Ошибка восстановления состояния:', e);
            placedJks = new Map();
        }
    }
}

// ===== ОТПРАВКА В GOOGLE ТАБЛИЦУ (опционально) =====
function sendToGoogle(agentName, jkName, isCorrect, distance) {
    if (!GOOGLE_SCRIPT_URL) return;

    const data = {
        agent_name: agentName || 'Аноним',
        jk_name: jkName,
        is_correct: isCorrect,
        distance_m: Math.round(distance),
        timestamp: new Date().toISOString(),
    };

    fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    }).catch(err => console.error('Ошибка отправки в Google:', err));
}

// ===== СОБЫТИЯ =====
hintBtn.addEventListener('click', showHint);
resetAllBtn.addEventListener('click', resetAll);
restartBtn.addEventListener('click', restart);

// ===== СТАРТ =====
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    loadJks();
});

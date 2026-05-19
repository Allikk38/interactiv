// ===== КАРТА: ОСНОВНЫЕ ФУНКЦИИ + ЛОГИКА ШАГОВ =====

// ----- БАЗОВЫЕ ФУНКЦИИ КАРТЫ -----
function initMap() {
    const mapContainer = document.getElementById('map');
    mapContainer.innerHTML = '';

    AppState.map = new ymaps.Map('map', {
        center: MAP_CENTER,
        zoom: MAP_ZOOM,
        controls: ['zoomControl']
    }, {
        yandexMapDisablePoiInteractivity: true,
        suppressMapOpenBlock: true,
        suppressObsoleteBrowserNotifier: true
    });

    AppState.map.behaviors.disable([
        'rightMouseButtonMagnifier',
        'leftMouseButtonMagnifier',
        'ruler'
    ]);

    AppState.map.events.add('click', onMapClick);
}

function renderMarkers() {
    if (!AppState.map) return;

    AppState.currentMarkers.forEach(marker => AppState.map.geoObjects.remove(marker));
    AppState.currentMarkers = [];

    AppState.placedJks.forEach((data, id) => {
        const jk = AppState.allJks.find(j => j.id === id);
        if (!jk) return;

        const marker = new ymaps.Placemark([data.lat, data.lng], {
            hintContent: jk.name
        }, {
            preset: 'islands#greenIcon',
            draggable: false
        });

        AppState.map.geoObjects.add(marker);
        AppState.currentMarkers.push(marker);
    });
}

function getDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg) {
    return deg * (Math.PI / 180);
}

function sendToGoogle(jkName, isCorrect, distance) {
    if (!GOOGLE_SCRIPT_URL) return;

    const user = User.get();
    fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'map_click',
            agent_name: user?.name || 'Аноним',
            jk_name: jkName,
            is_correct: isCorrect,
            distance_m: Math.round(distance),
            timestamp: new Date().toISOString(),
        }),
    }).catch(err => console.error('Ошибка отправки:', err));
}

// ----- ЛОГИКА ШАГОВ КАРТЫ -----
function runMapStep(step) {
    const mapScreen = document.getElementById('map-screen');
    const mapStepTitle = document.getElementById('map-step-title');
    const mapStepCounter = document.getElementById('map-step-counter');
    
    mapScreen.classList.remove('hidden');
    
    if (AppState.mapProgress) {
        AppState.mapProgress.style.display = 'block';
    }
    
    const jkIds = step.jk_ids;
    const filteredJks = jkIds.length > 0
        ? AppState.allJks.filter(jk => jkIds.includes(jk.id))
        : AppState.allJks;
    
    if (AppState.mapProgressTotal) {
        AppState.mapProgressTotal.textContent = filteredJks.length;
    }
    if (AppState.mapProgressCount) {
        AppState.mapProgressCount.textContent = '0';
    }
    
    mapStepTitle.textContent = step.title;
    mapStepCounter.textContent = `Шаг ${AppState.currentStepIndex + 1} из ${AppState.currentScenario.steps.length}`;
    
    AppState.selectedJkId = null;
    AppState.placedJks.clear();
    
    if (window.innerWidth <= 768 && typeof Drawer !== 'undefined' && Drawer.isOpen) {
        Drawer.close();
    }
    
    AppState.currentStepJks = filteredJks;
    
    const waitForYmaps = () => {
        if (typeof ymaps !== 'undefined' && ymaps.Map) {
            initMap();
            renderJkList(filteredJks);
            renderMarkers();
            updateMapProgress();
        } else {
            setTimeout(waitForYmaps, 100);
        }
    };
    waitForYmaps();
}

function renderJkList(filteredJks) {
    const jkListEl = document.getElementById('jk-list');
    if (!jkListEl) return;
    
    jkListEl.innerHTML = '';
    
    filteredJks.forEach(jk => {
        const isPlaced = AppState.placedJks.has(jk.id);
        const li = document.createElement('li');
        li.className = 'jk-list__item';
        if (AppState.selectedJkId === jk.id) li.classList.add('jk-list__item--selected');
        if (isPlaced) li.classList.add('jk-list__item--placed');
        li.innerHTML = `
            <div class="jk-list__name">${escapeHtml(jk.name)}</div>
            <div class="jk-list__developer">${escapeHtml(jk.developer)}</div>
        `;
        if (!isPlaced) li.addEventListener('click', () => selectJk(jk.id));
        jkListEl.appendChild(li);
    });
    
    const hintBtn = document.getElementById('hint-btn');
    if (hintBtn) hintBtn.disabled = AppState.selectedJkId === null;
    updateMapProgress();
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function selectJk(id) {
    if (AppState.placedJks.has(id)) return;
    AppState.selectedJkId = id;
    renderJkList(AppState.currentStepJks);
}

function updateMapProgress() {
    if (!AppState.mapProgressCount || !AppState.mapProgressTotal) return;
    
    const total = AppState.currentStepJks ? AppState.currentStepJks.length : 0;
    const placed = AppState.placedJks.size;
    
    AppState.mapProgressCount.textContent = placed;
    AppState.mapProgressTotal.textContent = total;
    
    if (placed === total && total > 0) {
        showContinueButton();
    }
}

function onMapClick(e) {
    if (AppState.selectedJkId === null) {
        showToast('👆', 'Сначала выберите ЖК из списка', 'error');
        return;
    }
    
    const jk = AppState.allJks.find(j => j.id === AppState.selectedJkId);
    if (!jk) return;
    
    const coords = e.get('coords');
    const lat = coords[0];
    const lng = coords[1];
    
    const distance = getDistance(lat, lng, jk.lat, jk.lng);
    const isCorrect = distance <= jk.radius;
    
    if (isCorrect) {
        AppState.placedJks.set(jk.id, { lat, lng, correct: true });
        showToast('✅', `Правильно! ${jk.name} на месте.`, 'success');
        AppState.selectedJkId = null;
        sendToGoogle(jk.name, true, distance);
        updateMapProgress();
    } else {
        const wrongMarker = new ymaps.Placemark([lat, lng], {
            hintContent: `${jk.name} (неверно)`
        }, {
            preset: 'islands#redIcon',
            draggable: false
        });
        AppState.map.geoObjects.add(wrongMarker);
        
        const hintText = jk.hint && jk.hint.trim() ? jk.hint : 'Попробуйте ещё раз!';
        showToast('❌', `Неправильно. ${hintText}`, 'error');
        setTimeout(() => AppState.map.geoObjects.remove(wrongMarker), 3000);
        sendToGoogle(jk.name, false, distance);
    }
    
    renderJkList(AppState.currentStepJks);
    renderMarkers();
    
    if (window.innerWidth <= 768 && typeof Drawer !== 'undefined' && Drawer.isOpen) {
        setTimeout(() => Drawer.close(), 500);
    }
    
    checkMapStepComplete();
}

function checkMapStepComplete() {
    const filteredJks = AppState.currentStepJks;
    if (AppState.placedJks.size === filteredJks.length && filteredJks.length > 0) {
        AppState.stepStats.push({
            step: AppState.currentStepIndex + 1,
            type: 'map',
            title: AppState.currentScenario.steps[AppState.currentStepIndex].title,
            placed: AppState.placedJks.size,
            total: filteredJks.length,
        });
        
        showToast('🎉', 'Все ЖК расставлены! Нажмите "Продолжить".', 'success');
    }
}

function resetMapStep() {
    if (confirm('Вы уверены? Весь прогресс на этом шаге будет потерян.')) {
        AppState.placedJks.clear();
        AppState.selectedJkId = null;
        if (AppState.map) {
            renderMarkers();
        }
        renderJkList(AppState.currentStepJks);
        updateMapProgress();
        
        const continueBtn = document.getElementById('step-continue-btn');
        if (continueBtn) continueBtn.remove();
        
        showToast('🔄', 'Шаг сброшен. Начните заново.', 'success');
    }
}
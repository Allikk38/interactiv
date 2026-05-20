// ===== КАРТА: ОСНОВНЫЕ ФУНКЦИИ + ЛОГИКА ШАГОВ (МОБИЛЬНАЯ ВЕРСИЯ) =====

let ymapsReady = false;
let ymapsQueue = [];

function onYmapsReady(callback) {
    if (ymapsReady && typeof ymaps !== 'undefined' && ymaps.Map) {
        callback();
    } else {
        ymapsQueue.push(callback);
    }
}

// ----- БАЗОВЫЕ ФУНКЦИИ КАРТЫ -----
function initMap() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
        console.error('Контейнер карты не найден');
        return;
    }
    
    // Проверяем, не инициализирована ли уже карта
    if (AppState.map && AppState.map.destroy) {
        try {
            AppState.map.destroy();
        } catch(e) {}
        AppState.map = null;
    }
    
    // Очищаем контейнер
    mapContainer.innerHTML = '';
    
    try {
        AppState.map = new ymaps.Map('map', {
            center: MAP_CENTER,
            zoom: MAP_ZOOM,
            controls: ['zoomControl']
        }, {
            yandexMapDisablePoiInteractivity: true,
            suppressMapOpenBlock: true,
            suppressObsoleteBrowserNotifier: true
        });

        // Настройка контролов для мобильных
        if (window.innerWidth <= 768) {
            const zoomControl = AppState.map.controls.get('zoomControl');
            if (zoomControl) {
                zoomControl.options.set({
                    size: 'large',
                    position: { right: 10, top: 10 }
                });
            }
        }

        AppState.map.behaviors.disable([
            'rightMouseButtonMagnifier',
            'leftMouseButtonMagnifier',
            'ruler'
        ]);
        
        // Включаем мультитач для мобильных
        AppState.map.behaviors.enable(['drag', 'scrollZoom', 'multiTouch']);

        AppState.map.events.add('click', onMapClick);
        
        // Принудительно обновляем размер карты
        setTimeout(() => {
            if (AppState.map && AppState.map.container) {
                AppState.map.container.fitToViewport();
            }
        }, 100);
        
    } catch (error) {
        console.error('Ошибка инициализации карты:', error);
        mapContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: red;">Ошибка загрузки карты. Проверьте подключение к интернету.</div>';
    }
}

function renderMarkers() {
    if (!AppState.map) return;

    AppState.currentMarkers.forEach(marker => AppState.map.geoObjects.remove(marker));
    AppState.currentMarkers = [];

    AppState.placedJks.forEach((data, id) => {
        const jk = AppState.allJks.find(j => j.id === id);
        if (!jk) return;

        // Создаём HTML-содержимое для метки
        const markerContent = `
            <div style="
                background-color: #27ae60;
                color: white;
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                white-space: nowrap;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                border: 2px solid white;
                font-family: sans-serif;
            ">
                📍 ${escapeHtml(jk.name)}
            </div>
        `;

        const marker = new ymaps.Placemark([data.lat, data.lng], {
            hintContent: jk.name,
            balloonContent: `<b>${escapeHtml(jk.name)}</b><br>${escapeHtml(jk.developer)}`
        }, {
            iconLayout: 'default#imageWithContent',
            iconImageHref: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1" height="1"%3E%3C/svg%3E',
            iconImageSize: [1, 1],
            iconContentOffset: [-5, -20],
            iconContentLayout: ymaps.templateLayoutFactory.createClass(
                `<div style="background-color: #27ae60; color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.2); border: 2px solid white; font-family: sans-serif;">
                    📍 {{ properties.name }}
                </div>`
            )
        });

        marker.properties.set('name', jk.name);
        
        AppState.map.geoObjects.add(marker);
        AppState.currentMarkers.push(marker);
    });
}

// Глобальная функция для зума к маркеру
window.zoomToMarker = function(lat, lng) {
    if (AppState.map) {
        AppState.map.setCenter([lat, lng], 17, {
            duration: 300,
            checkZoomRange: true
        });
    }
};

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
    
    // На мобильных устройствах закрываем панель при старте шага
    if (window.innerWidth <= 768 && typeof Drawer !== 'undefined' && Drawer.isOpen) {
        Drawer.close();
    }
    
    AppState.currentStepJks = filteredJks;
    
    // Показываем индикатор загрузки
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
        mapContainer.innerHTML = '<div style="display: flex; justify-content: center; align-items: center; height: 100%; background: #f5f6fa;"><div style="text-align: center;"><div style="width: 40px; height: 40px; border: 4px solid #dfe6e9; border-top-color: #2e86de; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px;"></div><p style="color: #636e72;">Загрузка карты...</p></div></div>';
    }
    
    // Функция инициализации после загрузки API
    const startMap = () => {
        initMap();
        renderJkList(filteredJks);
        renderMarkers();
        updateMapProgress();
    };
    
    // Проверяем готовность Яндекс.Карт с таймаутом
    let checkInterval;
    let timeoutId;
    
    const clearMapLoading = () => {
        if (checkInterval) clearInterval(checkInterval);
        if (timeoutId) clearTimeout(timeoutId);
    };
    
    if (typeof ymaps !== 'undefined' && ymaps.Map) {
        clearMapLoading();
        if (ymaps.ready) {
            ymaps.ready(startMap);
        } else {
            startMap();
        }
    } else {
        checkInterval = setInterval(() => {
            if (typeof ymaps !== 'undefined' && ymaps.Map) {
                clearInterval(checkInterval);
                if (ymaps.ready) {
                    ymaps.ready(startMap);
                } else {
                    startMap();
                }
            }
        }, 200);
        
        timeoutId = setTimeout(() => {
            clearInterval(checkInterval);
            console.error('Яндекс.Карты не загрузились');
            const mapContainer = document.getElementById('map');
            if (mapContainer) {
                mapContainer.innerHTML = '<div style="display: flex; justify-content: center; align-items: center; height: 100%; background: #f5f6fa;"><div style="text-align: center;"><p style="color: #e74c3c;">❌ Ошибка загрузки карты</p><button onclick="location.reload()" style="margin-top: 16px; padding: 8px 16px; background: #2e86de; color: white; border: none; border-radius: 8px; cursor: pointer;">Обновить страницу</button></div></div>';
            }
            showToast('❌', 'Ошибка загрузки карты. Обновите страницу.', 'error');
        }, 10000);
    }
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
            <div class="jk-list__hint" style="font-size: 0.7rem; color: #636e72; margin-top: 4px; ${isPlaced ? 'display: none;' : ''}">${jk.hint && jk.hint.trim() ? '💡 ' + escapeHtml(jk.hint.substring(0, 50)) : ''}</div>
        `;
        if (!isPlaced) {
            li.addEventListener('click', (e) => {
                e.stopPropagation();
                selectJk(jk.id);
                // На мобильных закрываем панель после выбора
                if (window.innerWidth <= 768 && typeof Drawer !== 'undefined' && Drawer.isOpen) {
                    setTimeout(() => Drawer.close(), 200);
                }
            });
        }
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
    if (AppState.placedJks.has(id)) {
        showToast('⚠️', 'Этот ЖК уже расставлен', 'error');
        return;
    }
    AppState.selectedJkId = id;
    renderJkList(AppState.currentStepJks);
    
    // Показываем тост с выбором
    const jk = AppState.allJks.find(j => j.id === id);
    if (jk) {
        showToast('📍', `Выбран: ${jk.name}. Нажмите на карту, чтобы поставить метку`, 'success');
    }
}

function updateMapProgress() {
    if (!AppState.mapProgressCount || !AppState.mapProgressTotal) return;
    
    const total = AppState.currentStepJks ? AppState.currentStepJks.length : 0;
    const placed = AppState.placedJks.size;
    
    AppState.mapProgressCount.textContent = placed;
    AppState.mapProgressTotal.textContent = total;
    
    // Анимация прогресса
    const progressPercent = total > 0 ? (placed / total) * 100 : 0;
    const progressFill = document.querySelector('#map-progress .map-progress__fill');
    if (progressFill) {
        progressFill.style.width = `${progressPercent}%`;
    }
    
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
        
        // Убираем подсветку
        if (AppState.highlightMarker) {
            AppState.map.geoObjects.remove(AppState.highlightMarker);
            AppState.highlightMarker = null;
        }
        
        AppState.selectedJkId = null;
        sendToGoogle(jk.name, true, distance);
        updateMapProgress();
        
        // Вибрация на мобильных (если поддерживается)
        if (window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(100);
        }
    } else {
        // Показываем временный маркер ошибки
        const wrongMarker = new ymaps.Placemark([lat, lng], {
            hintContent: `${jk.name} (неверно)`
        }, {
            preset: 'islands#redIcon',
            iconColor: '#e74c3c'
        });
        AppState.map.geoObjects.add(wrongMarker);
        
        const hintText = jk.hint && jk.hint.trim() ? jk.hint : 'Попробуйте ещё раз! Подсказка в списке ЖК';
        showToast('❌', `Неправильно. ${hintText}`, 'error');
        
        setTimeout(() => AppState.map.geoObjects.remove(wrongMarker), 3000);
        sendToGoogle(jk.name, false, distance);
        
        // Вибрация при ошибке
        if (window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate([100, 50, 100]);
        }
    }
    
    renderJkList(AppState.currentStepJks);
    renderMarkers();
    
    // На мобильных закрываем панель после расстановки
    if (window.innerWidth <= 768 && typeof Drawer !== 'undefined' && Drawer.isOpen) {
        setTimeout(() => Drawer.close(), 300);
    }
    
    checkMapStepComplete();
}

function checkMapStepComplete() {
    const filteredJks = AppState.currentStepJks;
    if (AppState.placedJks.size === filteredJks.length && filteredJks.length > 0) {
        // Проверяем, не сохранена ли уже статистика для этого шага
        const alreadySaved = AppState.stepStats.some(s => 
            s.step === AppState.currentStepIndex + 1 && s.type === 'map'
        );
        
        if (!alreadySaved) {
            AppState.stepStats.push({
                step: AppState.currentStepIndex + 1,
                type: 'map',
                title: AppState.currentScenario.steps[AppState.currentStepIndex].title,
                placed: AppState.placedJks.size,
                total: filteredJks.length,
            });
        }
        
        showToast('🎉', 'Все ЖК расставлены! Нажмите "Продолжить".', 'success');
    }
}

function resetMapStep() {
    if (confirm('Вы уверены? Весь прогресс на этом шаге будет потерян.')) {
        AppState.placedJks.clear();
        AppState.selectedJkId = null;
        
        // Убираем подсветку
        if (AppState.highlightMarker) {
            AppState.map.geoObjects.remove(AppState.highlightMarker);
            AppState.highlightMarker = null;
        }
        
        if (AppState.map) {
            renderMarkers();
            // Центрируем карту обратно
            AppState.map.setCenter(MAP_CENTER, MAP_ZOOM, { duration: 300 });
        }
        renderJkList(AppState.currentStepJks);
        updateMapProgress();
        
        // Удаляем кнопку продолжения, если есть
        const continueBtn = document.getElementById('step-continue-btn');
        if (continueBtn) continueBtn.remove();
        
        showToast('🔄', 'Шаг сброшен. Начните заново.', 'success');
    }
}

// Добавляем обработчик изменения ориентации экрана
window.addEventListener('resize', () => {
    if (AppState.map) {
        setTimeout(() => {
            AppState.map.container.fitToViewport();
        }, 100);
    }
});

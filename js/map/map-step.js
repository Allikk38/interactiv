// ===== MAP STEP: ЛОГИКА ШАГА КАРТЫ, КЛИКИ, ПРОГРЕСС, СБРОС =====

// Ожидание загрузки Яндекс.Карт с таймаутом
function waitForYmaps(timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            reject(new Error('Таймаут загрузки Яндекс.Карт'));
        }, timeoutMs);
        
        const checkInterval = setInterval(() => {
            if (typeof ymaps !== 'undefined' && ymaps.Map) {
                clearInterval(checkInterval);
                clearTimeout(timeoutId);
                resolve();
            }
        }, 200);
    });
}

function runMapStep(step) {
    const mapScreen = document.getElementById('map-screen');
    const mapStepTitle = document.getElementById('map-step-title');
    const mapStepCounter = document.getElementById('map-step-counter');
    
    mapScreen.classList.remove('hidden');
    
    const mapProgress = StoreInstance.getMapProgress();
    if (mapProgress) {
        mapProgress.style.display = 'block';
    }
    
    const jkIds = step.jk_ids;
    const allJks = StoreInstance.getAllJks();
    const filteredJks = jkIds.length > 0
        ? allJks.filter(jk => jkIds.includes(jk.id))
        : allJks;
    
    const mapProgressTotal = StoreInstance.getMapProgressTotal();
    const mapProgressCount = StoreInstance.getMapProgressCount();
    
    if (mapProgressTotal) {
        mapProgressTotal.textContent = filteredJks.length;
    }
    if (mapProgressCount) {
        mapProgressCount.textContent = '0';
    }
    
    mapStepTitle.textContent = step.title;
    mapStepCounter.textContent = `Шаг ${StoreInstance.getCurrentStepIndex() + 1} из ${StoreInstance.getCurrentScenario().steps.length}`;
    
    StoreInstance.setSelectedJkId(null);
    StoreInstance.clearPlacedJks();
    StoreInstance.setCurrentStepJks(filteredJks);
    
    // Восстанавливаем сохранённый прогресс карты для этого шага
    restoreMapProgress();
    
    updateDesktopDrawerList(filteredJks);
    
    if (window.innerWidth <= 768) {
        renderCarousel(filteredJks);
    }
    
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
        mapContainer.innerHTML = renderMapLoadingIndicator();
    }
    
    const startMap = () => {
        initMap();
        renderMarkers();
        updateMapProgress();
    };
    
    if (typeof ymaps !== 'undefined' && ymaps.Map) {
        if (ymaps.ready) {
            ymaps.ready(startMap);
        } else {
            startMap();
        }
    } else {
        waitForYmaps(10000)
            .then(() => {
                if (ymaps.ready) {
                    ymaps.ready(startMap);
                } else {
                    startMap();
                }
            })
            .catch((error) => {
                logError('Ошибка загрузки карты:', error);
                const mapContainer = document.getElementById('map');
                if (mapContainer) {
                    mapContainer.innerHTML = renderMapErrorIndicator();
                }
                showToast('❌', 'Ошибка загрузки карты. Обновите страницу.', 'error');
            });
    }
}

// Восстановление сохранённого прогресса карты
function restoreMapProgress() {
    const scenarioId = StoreInstance.getCurrentScenario()?.id;
    const stepIndex = StoreInstance.getCurrentStepIndex();
    
    if (!scenarioId) return;
    
    const savedPlacedJks = User.getMapProgress(scenarioId, stepIndex);
    if (savedPlacedJks && savedPlacedJks.size > 0) {
        // Восстанавливаем расставленные ЖК
        for (const [id, data] of savedPlacedJks.entries()) {
            StoreInstance.addPlacedJk(id, data);
        }
        logInfo(`Восстановлено ${savedPlacedJks.size} расставленных ЖК на карте`);
        showToast('💾', `Восстановлен прогресс: ${savedPlacedJks.size} ЖК уже расставлены`, 'success');
    }
}

// Сохранение прогресса карты
function saveMapProgress() {
    const scenarioId = StoreInstance.getCurrentScenario()?.id;
    const stepIndex = StoreInstance.getCurrentStepIndex();
    const placedJks = StoreInstance.getPlacedJks();
    
    if (!scenarioId) return;
    
    User.saveMapProgress(scenarioId, stepIndex, placedJks);
}

function selectJk(id) {
    if (StoreInstance.hasPlacedJk(id)) {
        showToast('⚠️', 'Этот ЖК уже расставлен', 'error');
        return;
    }
    StoreInstance.setSelectedJkId(id);
    updateSelectedCard();
    
    const allJks = StoreInstance.getAllJks();
    const jk = allJks.find(j => j.id === id);
    if (jk) {
        showToast('📍', `Выбран: ${jk.name}. Нажмите на карту, чтобы поставить метку`, 'success');
    }
}

function updateMapProgress() {
    const currentStepJks = StoreInstance.getCurrentStepJks();
    const total = currentStepJks ? currentStepJks.length : 0;
    const placed = StoreInstance.getPlacedJksSize();
    
    const mapProgressCount = StoreInstance.getMapProgressCount();
    const mapProgressTotal = StoreInstance.getMapProgressTotal();
    
    if (mapProgressCount) {
        mapProgressCount.textContent = placed;
    }
    if (mapProgressTotal) {
        mapProgressTotal.textContent = total;
    }
    
    const progressPercent = total > 0 ? (placed / total) * 100 : 0;
    const progressFill = document.querySelector('#map-progress .map-progress__fill');
    if (progressFill) {
        progressFill.style.width = `${progressPercent}%`;
    }
    
    updateCarouselCounter();
    
    if (window.innerWidth > 768) {
        const currentStepJks = StoreInstance.getCurrentStepJks();
        updateDesktopDrawerList(currentStepJks);
    }
    
    // Сохраняем прогресс при каждом изменении
    saveMapProgress();
    
    if (placed === total && total > 0) {
        showContinueButton();
    }
}

function onMapClick(e) {
    const selectedJkId = StoreInstance.getSelectedJkId();
    
    if (selectedJkId === null) {
        showToast('👆', 'Сначала выберите ЖК из списка', 'error');
        return;
    }
    
    const allJks = StoreInstance.getAllJks();
    const jk = allJks.find(j => j.id === selectedJkId);
    if (!jk) return;
    
    const coords = e.get('coords');
    const lat = coords[0];
    const lng = coords[1];
    
    const distance = getDistance(lat, lng, jk.lat, jk.lng);
    const isCorrect = distance <= jk.radius;
    
    if (isCorrect) {
        StoreInstance.addPlacedJk(jk.id, { lat, lng, correct: true });
        showToast('✅', `Правильно! ${jk.name} на месте.`, 'success');
        
        StoreInstance.setSelectedJkId(null);
        updateSelectedCard();
        sendToGoogle(jk.name, true, distance);
        updateMapProgress();
        renderMarkers();
        
        const currentStepJks = StoreInstance.getCurrentStepJks();
        if (window.innerWidth <= 768) {
            renderCarousel(currentStepJks);
        } else {
            updateDesktopDrawerList(currentStepJks);
        }
        
        if (window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(100);
        }
    } else {
        const currentMap = StoreInstance.getMap();
        const wrongMarker = new ymaps.Placemark([lat, lng], {
            hintContent: `${jk.name} (неверно)`
        }, {
            preset: 'islands#redIcon',
            iconColor: '#e74c3c'
        });
        currentMap.geoObjects.add(wrongMarker);
        
        const hintText = jk.hint && jk.hint.trim() ? jk.hint : 'Попробуйте ещё раз! Посмотрите подсказку на карточке ЖК';
        showToast('❌', `Неправильно. ${hintText}`, 'error');
        
        setTimeout(() => currentMap.geoObjects.remove(wrongMarker), 3000);
        sendToGoogle(jk.name, false, distance);
        
        if (window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate([100, 50, 100]);
        }
    }
    
    checkMapStepComplete();
}

function checkMapStepComplete() {
    const currentStepJks = StoreInstance.getCurrentStepJks();
    const filteredJks = currentStepJks;
    const placedSize = StoreInstance.getPlacedJksSize();
    const currentStepIndex = StoreInstance.getCurrentStepIndex();
    const stepStats = StoreInstance.getStepStats();
    
    if (placedSize === filteredJks.length && filteredJks.length > 0) {
        const alreadySaved = stepStats.some(s => 
            s.step === currentStepIndex + 1 && s.type === 'map'
        );
        
        if (!alreadySaved) {
            const currentScenario = StoreInstance.getCurrentScenario();
            StoreInstance.addToStepStats({
                step: currentStepIndex + 1,
                type: 'map',
                title: currentScenario.steps[currentStepIndex].title,
                placed: placedSize,
                total: filteredJks.length,
            });
            
            // Очищаем сохранённый прогресс карты после завершения шага
            const scenarioId = currentScenario?.id;
            if (scenarioId) {
                User.clearMapProgress(scenarioId);
            }
            
            if (typeof saveCurrentProgress === 'function') {
                saveCurrentProgress();
            }
            
            if (typeof updateHeaderXP === 'function') {
                updateHeaderXP();
            }
        }
        
        showToast('🎉', 'Все ЖК расставлены! Нажмите "Продолжить".', 'success');
    }
}

function resetMapStep() {
    if (confirm('Вы уверены? Весь прогресс на этом шаге будет потерян.')) {
        StoreInstance.resetMapState();
        
        // Очищаем сохранённый прогресс
        const scenarioId = StoreInstance.getCurrentScenario()?.id;
        const stepIndex = StoreInstance.getCurrentStepIndex();
        if (scenarioId) {
            User.saveMapProgress(scenarioId, stepIndex, new Map()); // Очищаем
        }
        
        const currentMap = StoreInstance.getMap();
        if (currentMap) {
            renderMarkers();
            currentMap.setCenter(MAP_CENTER, MAP_ZOOM, { duration: 300 });
        }
        
        const currentStepJks = StoreInstance.getCurrentStepJks();
        if (window.innerWidth <= 768) {
            renderCarousel(currentStepJks);
        } else {
            updateDesktopDrawerList(currentStepJks);
        }
        updateMapProgress();
        
        const continueBtn = document.getElementById('step-continue-btn');
        if (continueBtn) continueBtn.remove();
        
        showToast('🔄', 'Шаг сброшен. Начните заново.', 'success');
    }
}

window.addEventListener('resize', () => {
    const currentMap = StoreInstance.getMap();
    if (currentMap) {
        setTimeout(() => {
            currentMap.container.fitToViewport();
        }, 100);
    }
});
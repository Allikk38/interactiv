// ===== MAP STEP: ЛОГИКА ШАГА КАРТЫ, КЛИКИ, ПРОГРЕСС, СБРОС =====

function runMapStep(step) {
    const mapScreen = document.getElementById('map-screen');
    const mapStepTitle = document.getElementById('map-step-title');
    const mapStepCounter = document.getElementById('map-step-counter');
    
    mapScreen.classList.remove('hidden');
    
    const mapProgress = Store.getMapProgress();
    if (mapProgress) {
        mapProgress.style.display = 'block';
    }
    
    const jkIds = step.jk_ids;
    const allJks = Store.getAllJks();
    const filteredJks = jkIds.length > 0
        ? allJks.filter(jk => jkIds.includes(jk.id))
        : allJks;
    
    const mapProgressTotal = Store.getMapProgressTotal();
    const mapProgressCount = Store.getMapProgressCount();
    
    if (mapProgressTotal) {
        mapProgressTotal.textContent = filteredJks.length;
    }
    if (mapProgressCount) {
        mapProgressCount.textContent = '0';
    }
    
    mapStepTitle.textContent = step.title;
    mapStepCounter.textContent = `Шаг ${Store.getCurrentStepIndex() + 1} из ${Store.getCurrentScenario().steps.length}`;
    
    Store.setSelectedJkId(null);
    Store.clearPlacedJks();
    Store.setCurrentStepJks(filteredJks);
    
    // Обновляем панель со списком ЖК для десктопа
    updateDesktopDrawerList(filteredJks);
    
    // Создаём карусель только для мобильных
    if (window.innerWidth <= 768) {
        renderCarousel(filteredJks);
    }
    
    // Показываем индикатор загрузки
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
        mapContainer.innerHTML = renderMapLoadingIndicator();
    }
    
    const startMap = () => {
        initMap();
        renderMarkers();
        updateMapProgress();
    };
    
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
                mapContainer.innerHTML = renderMapErrorIndicator();
            }
            showToast('❌', 'Ошибка загрузки карты. Обновите страницу.', 'error');
        }, 10000);
    }
}

function selectJk(id) {
    if (Store.hasPlacedJk(id)) {
        showToast('⚠️', 'Этот ЖК уже расставлен', 'error');
        return;
    }
    Store.setSelectedJkId(id);
    updateSelectedCard();
    
    const allJks = Store.getAllJks();
    const jk = allJks.find(j => j.id === id);
    if (jk) {
        showToast('📍', `Выбран: ${jk.name}. Нажмите на карту, чтобы поставить метку`, 'success');
    }
}

function updateMapProgress() {
    const currentStepJks = Store.getCurrentStepJks();
    const total = currentStepJks ? currentStepJks.length : 0;
    const placed = Store.getPlacedJksSize();
    
    const mapProgressCount = Store.getMapProgressCount();
    const mapProgressTotal = Store.getMapProgressTotal();
    
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
        const currentStepJks = Store.getCurrentStepJks();
        updateDesktopDrawerList(currentStepJks);
    }
    
    if (placed === total && total > 0) {
        showContinueButton();
    }
}

function onMapClick(e) {
    const selectedJkId = Store.getSelectedJkId();
    
    if (selectedJkId === null) {
        showToast('👆', 'Сначала выберите ЖК из списка', 'error');
        return;
    }
    
    const allJks = Store.getAllJks();
    const jk = allJks.find(j => j.id === selectedJkId);
    if (!jk) return;
    
    const coords = e.get('coords');
    const lat = coords[0];
    const lng = coords[1];
    
    const distance = getDistance(lat, lng, jk.lat, jk.lng);
    const isCorrect = distance <= jk.radius;
    
    if (isCorrect) {
        Store.addPlacedJk(jk.id, { lat, lng, correct: true });
        showToast('✅', `Правильно! ${jk.name} на месте.`, 'success');
        
        Store.setSelectedJkId(null);
        updateSelectedCard();
        sendToGoogle(jk.name, true, distance);
        updateMapProgress();
        renderMarkers();
        
        const currentStepJks = Store.getCurrentStepJks();
        if (window.innerWidth <= 768) {
            renderCarousel(currentStepJks);
        } else {
            updateDesktopDrawerList(currentStepJks);
        }
        
        if (window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(100);
        }
    } else {
        const currentMap = Store.getMap();
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
    const currentStepJks = Store.getCurrentStepJks();
    const filteredJks = currentStepJks;
    const placedSize = Store.getPlacedJksSize();
    const currentStepIndex = Store.getCurrentStepIndex();
    const stepStats = Store.getStepStats();
    
    if (placedSize === filteredJks.length && filteredJks.length > 0) {
        const alreadySaved = stepStats.some(s => 
            s.step === currentStepIndex + 1 && s.type === 'map'
        );
        
        if (!alreadySaved) {
            const currentScenario = Store.getCurrentScenario();
            Store.addToStepStats({
                step: currentStepIndex + 1,
                type: 'map',
                title: currentScenario.steps[currentStepIndex].title,
                placed: placedSize,
                total: filteredJks.length,
            });
        }
        
        showToast('🎉', 'Все ЖК расставлены! Нажмите "Продолжить".', 'success');
    }
}

function resetMapStep() {
    if (confirm('Вы уверены? Весь прогресс на этом шаге будет потерян.')) {
        Store.resetMapState();
        
        const currentMap = Store.getMap();
        if (currentMap) {
            renderMarkers();
            currentMap.setCenter(MAP_CENTER, MAP_ZOOM, { duration: 300 });
        }
        
        const currentStepJks = Store.getCurrentStepJks();
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

// Обработчик изменения размера окна
window.addEventListener('resize', () => {
    const currentMap = Store.getMap();
    if (currentMap) {
        setTimeout(() => {
            currentMap.container.fitToViewport();
        }, 100);
    }
});

window.resetMapStep = resetMapStep;

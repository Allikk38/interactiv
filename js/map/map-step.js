// ===== MAP STEP: ЛОГИКА ШАГА КАРТЫ, КЛИКИ, ПРОГРЕСС, СБРОС =====

// Ожидание загрузки Яндекс.Карт с таймаутом
function waitForYmaps(timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
        if (window.PrivacyManager && !window.PrivacyManager.isAnalyticsAllowed()) {
            reject(new Error('Нет согласия на загрузку карт'));
            return;
        }

        if (typeof ymaps !== 'undefined' && ymaps.Map) {
            resolve();
            return;
        }

        if (typeof window.loadYandexMaps === 'function') {
            window.loadYandexMaps();
        }

        const timeoutId = setTimeout(() => {
            clearInterval(checkInterval);
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

// ===== ПОКАЗАТЬ КНОПКУ "ПРОДОЛЖИТЬ" =====
function showContinueButton() {
    // Удаляем старую кнопку, если есть
    const oldBtn = document.getElementById('step-continue-btn');
    if (oldBtn) oldBtn.remove();
    
    // Создаём новую кнопку
    const btn = document.createElement('button');
    btn.id = 'step-continue-btn';
    btn.className = 'btn btn--primary';
    btn.innerHTML = '<i class="fas fa-arrow-right"></i> Продолжить →';
    btn.style.position = 'fixed';
    btn.style.bottom = '100px';
    btn.style.left = '50%';
    btn.style.transform = 'translateX(-50%)';
    btn.style.zIndex = '100';
    btn.style.padding = '14px 32px';
    btn.style.borderRadius = '32px';
    btn.style.fontSize = '1rem';
    btn.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)';
    btn.style.cursor = 'pointer';
    
    btn.addEventListener('click', function() {
        if (typeof AppState !== 'undefined' && AppState) {
            if (typeof saveCurrentProgress === 'function') {
                saveCurrentProgress();
            }
            
            AppState.currentStepIndex++;
            btn.remove();
            
            if (typeof runStep === 'function') {
                runStep();
            }
        }
    });
    
    document.body.appendChild(btn);
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
    
    restoreMapProgress();
    updateDesktopDrawerList(filteredJks);
    
    if (window.innerWidth <= 768) {
        renderCarousel(filteredJks);
    }
    
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
        mapContainer.innerHTML = renderMapLoadingIndicator();
    }
    
    var hasConsent = false;
    if (window.PrivacyManager) {
        hasConsent = PrivacyManager.isAnalyticsAllowed();
    } else {
        try {
            var consentGiven = localStorage.getItem('user_consent_given');
            var categories = localStorage.getItem('user_consent_categories');
            if (consentGiven === 'true') {
                if (categories) {
                    try {
                        var parsed = JSON.parse(categories);
                        hasConsent = parsed.analytics !== false;
                    } catch (_) {
                        hasConsent = true;
                    }
                } else {
                    hasConsent = true;
                }
            }
        } catch (_) {}
    }
    
    if (!hasConsent) {
        if (mapContainer) {
            mapContainer.innerHTML = `
                <div style="
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    background: #f5f6fa;
                    color: #636e72;
                    padding: 40px;
                    text-align: center;
                ">
                    <div style="font-size: 3rem; margin-bottom: 16px;">🔒</div>
                    <h3 style="margin-bottom: 8px;">Карта недоступна</h3>
                    <p style="max-width: 400px; font-size: 0.9rem;">
                        Для отображения карты требуется ваше согласие на обработку данных.
                        <br><br>
                        <button onclick="location.reload()" style="
                            padding: 10px 24px;
                            background: #2e86de;
                            color: white;
                            border: none;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 0.9rem;
                        ">
                            <i class="fas fa-sync-alt"></i> Обновить страницу
                        </button>
                    </p>
                </div>
            `;
        }
        return;
    }
    
    const startMap = () => {
        try {
            initMap();
            renderMarkers();
            updateMapProgress();
        } catch (error) {
            console.error('[MapStep] Ошибка инициализации карты:', error);
            if (mapContainer) {
                mapContainer.innerHTML = renderMapErrorIndicator();
            }
            showToast('❌', 'Ошибка загрузки карты. Попробуйте обновить страницу.', 'error');
        }
    };
    
    if (typeof ymaps !== 'undefined' && ymaps.Map) {
        if (ymaps.ready) {
            ymaps.ready(startMap);
        } else {
            startMap();
        }
    } else {
        if (typeof window.loadYandexMaps === 'function') {
            window.loadYandexMaps();
        }
        
        waitForYmaps(15000)
            .then(() => {
                if (ymaps.ready) {
                    ymaps.ready(startMap);
                } else {
                    startMap();
                }
            })
            .catch((error) => {
                logError('Ошибка загрузки карты:', error);
                if (mapContainer) {
                    mapContainer.innerHTML = renderMapErrorIndicator();
                }
                showToast('❌', 'Не удалось загрузить карту. Проверьте соединение.', 'error');
            });
    }
}

function restoreMapProgress() {
    const scenarioId = StoreInstance.getCurrentScenario()?.id;
    const stepIndex = StoreInstance.getCurrentStepIndex();
    
    if (!scenarioId) return;
    
    const savedPlacedJks = User.getMapProgress(scenarioId, stepIndex);
    if (savedPlacedJks && savedPlacedJks.size > 0) {
        for (const [id, data] of savedPlacedJks.entries()) {
            StoreInstance.addPlacedJk(id, data);
        }
        logInfo(`Восстановлено ${savedPlacedJks.size} расставленных ЖК на карте`);
        showToast('💾', `Восстановлен прогресс: ${savedPlacedJks.size} ЖК уже расставлены`, 'success');
    }
}

function saveMapProgress() {
    const scenarioId = StoreInstance.getCurrentScenario()?.id;
    const stepIndex = StoreInstance.getCurrentStepIndex();
    const placedJks = StoreInstance.getPlacedJks();
    
    if (!scenarioId) return;
    
    User.saveMapProgress(scenarioId, stepIndex, placedJks);
}

function selectJk(id) {
    // Приводим ID к числу для единообразия
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    
    // Проверяем, что ID валидный
    if (isNaN(numericId)) {
        console.warn('[MapStep] Некорректный ID ЖК:', id);
        return;
    }
    
    if (StoreInstance.hasPlacedJk(numericId)) {
        showToast('⚠️', 'Этот ЖК уже расставлен', 'error');
        return;
    }
    StoreInstance.setSelectedJkId(numericId);
    updateSelectedCard();
    
    window.jkSelectionTime = Date.now();
    
    const allJks = StoreInstance.getAllJks();
    const jk = allJks.find(j => j.id === numericId);
    if (jk) {
        showToast('📍', `Выбран: ${jk.name}. Нажмите на карту, чтобы поставить метку`, 'success');
    } else {
        console.warn('[MapStep] ЖК с ID', numericId, 'не найден в allJks');
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
    
    saveMapProgress();
    
    if (placed === total && total > 0) {
        // Показываем кнопку "Продолжить"
        showContinueButton();
        
        if (typeof sendStepResult === 'function') {
            sendStepResult(
                StoreInstance.getCurrentStepIndex(),
                'map',
                StoreInstance.getCurrentScenario()?.steps[StoreInstance.getCurrentStepIndex()]?.title,
                placed,
                total
            );
        }
        
        if (typeof endStepTimer === 'function') {
            endStepTimer(true, { placed: placed, total: total });
        }
        
        const currentStepIndex = StoreInstance.getCurrentStepIndex();
        const stepStats = StoreInstance.getStepStats();
        const alreadySaved = stepStats.some(s => 
            s.step === currentStepIndex + 1 && s.type === 'map'
        );
        
        if (!alreadySaved) {
            const currentScenario = StoreInstance.getCurrentScenario();
            StoreInstance.addToStepStats({
                step: currentStepIndex + 1,
                type: 'map',
                title: currentScenario.steps[currentStepIndex].title,
                placed: placed,
                total: total,
            });
            
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

function onMapClick(e) {
    const selectedJkId = StoreInstance.getSelectedJkId();
    
    if (selectedJkId === null) {
        showToast('👆', 'Сначала выберите ЖК из списка', 'error');
        return;
    }
    
    // Приводим ID к числу для единообразия
    const numericId = typeof selectedJkId === 'string' ? parseInt(selectedJkId, 10) : selectedJkId;
    
    // Проверяем, что ID валидный
    if (isNaN(numericId)) {
        console.warn('[MapStep] Некорректный ID выбранного ЖК:', selectedJkId);
        showToast('❌', 'Ошибка: некорректный ID ЖК', 'error');
        return;
    }
    
    const allJks = StoreInstance.getAllJks();
    const jk = allJks.find(j => j.id === numericId);
    
    if (!jk) {
        console.warn('[MapStep] ЖК с ID', numericId, 'не найден в allJks');
        showToast('❌', 'Ошибка: ЖК не найден', 'error');
        return;
    }
    
    const coords = e.get('coords');
    const lat = coords[0];
    const lng = coords[1];
    
    const distance = getDistance(lat, lng, jk.lat, jk.lng);
    const isCorrect = distance <= jk.radius;
    
    let timeToPlaceSec = 0;
    if (window.jkSelectionTime) {
        timeToPlaceSec = Math.round((Date.now() - window.jkSelectionTime) / 1000);
        window.jkSelectionTime = null;
    }
    
    if (typeof sendMapClick === 'function') {
        sendMapClick(
            jk.id,
            jk.name,
            lat,
            lng,
            jk.lat,
            jk.lng,
            distance,
            isCorrect,
            timeToPlaceSec
        );
    }
    
    if (isCorrect) {
        StoreInstance.addPlacedJk(jk.id, { lat, lng, correct: true });
        showToast('✅', `Правильно! ${jk.name} на месте.`, 'success');
        
        StoreInstance.setSelectedJkId(null);
        updateSelectedCard();
        sendToGoogle(jk.name, true, distance);
        
        renderMarkers();
        
        const currentStepJks = StoreInstance.getCurrentStepJks();
        if (window.innerWidth <= 768) {
            renderCarousel(currentStepJks);
        } else {
            updateDesktopDrawerList(currentStepJks);
        }
        
        // Обновляем прогресс (это вызовет проверку завершения)
        updateMapProgress();
        
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
}

function checkMapStepComplete() {
    updateMapProgress();
}

function resetMapStep() {
    if (confirm('Вы уверены? Весь прогресс на этом шаге будет потерян.')) {
        StoreInstance.resetMapState();
        
        const scenarioId = StoreInstance.getCurrentScenario()?.id;
        const stepIndex = StoreInstance.getCurrentStepIndex();
        if (scenarioId) {
            User.saveMapProgress(scenarioId, stepIndex, new Map());
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
// ===== КАРТА: ОСНОВНЫЕ ФУНКЦИИ + КАРУСЕЛЬ =====

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
    
    if (AppState.map && AppState.map.destroy) {
        try {
            AppState.map.destroy();
        } catch(e) {}
        AppState.map = null;
    }
    
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
        
        AppState.map.behaviors.enable(['drag', 'scrollZoom', 'multiTouch']);

        AppState.map.events.add('click', onMapClick);
        
        setTimeout(() => {
            if (AppState.map && AppState.map.container) {
                AppState.map.container.fitToViewport();
            }
        }, 100);
        
    } catch (error) {
        console.error('Ошибка инициализации карты:', error);
        mapContainer.innerHTML = renderMapErrorIndicator();
    }
}

function renderMarkers() {
    if (!AppState.map) return;

    AppState.currentMarkers.forEach(marker => AppState.map.geoObjects.remove(marker));
    AppState.currentMarkers = [];

    AppState.placedJks.forEach((data, id) => {
        const jk = AppState.allJks.find(j => j.id === id);
        if (!jk) return;

        const marker = new ymaps.Placemark([data.lat, data.lng], {
            hintContent: jk.name,
            balloonContent: `<b>${escapeHtml(jk.name)}</b><br>${escapeHtml(jk.developer)}<br><br><button onclick="window.zoomToMarker(${jk.lat}, ${jk.lng})" style="padding: 8px 16px; background: #2e86de; color: white; border: none; border-radius: 8px; cursor: pointer;">📍 Показать на карте</button>`
        }, {
            iconLayout: 'default#imageWithContent',
            iconImageHref: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1" height="1"%3E%3C/svg%3E',
            iconImageSize: [1, 1],
            iconContentOffset: [-5, -25],
            iconContentLayout: ymaps.templateLayoutFactory.createClass(
                `<div style="
                    background: linear-gradient(135deg, #2c3e50 0%, #1a252f 100%);
                    color: #ecf0f1;
                    padding: 8px 16px;
                    border-radius: 24px;
                    font-size: 13px;
                    font-weight: 600;
                    white-space: nowrap;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.25);
                    border: 1px solid rgba(255,255,255,0.2);
                    backdrop-filter: blur(2px);
                    display: flex;
                    align-items: center;
                    gap: 6px;
                ">
                    <span style="font-size: 14px;">🏢</span>
                    <span style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;">{{ properties.name }}</span>
                </div>`
            )
        });

        marker.properties.set('name', jk.name);
        
        AppState.map.geoObjects.add(marker);
        AppState.currentMarkers.push(marker);
    });
}

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

// ----- ЛОГИКА ШАГОВ КАРТЫ С КАРУСЕЛЬЮ -----
let carouselScrollInterval = null;

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
    AppState.currentStepJks = filteredJks;
    
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

function updateDesktopDrawerList(jks) {
    const drawerList = document.getElementById('jk-drawer-list');
    if (!drawerList) return;
    
    drawerList.innerHTML = '';
    
    jks.forEach(jk => {
        const isPlaced = AppState.placedJks.has(jk.id);
        const isSelected = AppState.selectedJkId === jk.id;
        
        const li = document.createElement('li');
        li.className = `jk-list__item${isPlaced ? ' jk-list__item--placed' : ''}${isSelected ? ' jk-list__item--selected' : ''}`;
        li.dataset.id = jk.id;
        li.innerHTML = renderDesktopDrawerItem(jk, isPlaced, isSelected);
        
        if (!isPlaced) {
            li.addEventListener('click', () => {
                selectJk(jk.id);
                // Обновляем выделение в списке
                document.querySelectorAll('.jk-list__item').forEach(item => {
                    item.classList.remove('jk-list__item--selected');
                });
                li.classList.add('jk-list__item--selected');
            });
        }
        
        drawerList.appendChild(li);
    });
}

function renderCarousel(jks) {
    const existingCarousel = document.querySelector('.jk-carousel');
    if (existingCarousel) existingCarousel.remove();
    
    if (!jks.length) return;
    
    const mapScreen = document.getElementById('map-screen');
    const progressContainer = document.querySelector('.map-progress')?.parentElement;
    
    const carouselHTML = renderCarouselHTML(jks);
    
    if (progressContainer && progressContainer.parentElement) {
        progressContainer.parentElement.insertAdjacentHTML('afterbegin', carouselHTML);
    } else {
        mapScreen.insertAdjacentHTML('afterbegin', carouselHTML);
    }
    
    const track = document.getElementById('carousel-track');
    jks.forEach(jk => {
        const isPlaced = AppState.placedJks.has(jk.id);
        const isSelected = AppState.selectedJkId === jk.id;
        
        const card = document.createElement('div');
        card.className = `jk-card${isSelected ? ' jk-card--selected' : ''}${isPlaced ? ' jk-card--placed' : ''}`;
        card.dataset.id = jk.id;
        card.innerHTML = renderCarouselCard(jk, isPlaced, isSelected);
        
        if (!isPlaced) {
            card.addEventListener('click', (e) => {
                e.stopPropagation();
                selectJk(jk.id);
            });
        }
        
        track.appendChild(card);
    });
    
    initCarouselScroll();
    updateCarouselCounter();
}

function initCarouselScroll() {
    const slides = document.getElementById('carousel-slides');
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');
    
    if (!slides) return;
    
    const updateButtons = () => {
        if (!slides) return;
        const scrollLeft = slides.scrollLeft;
        const maxScroll = slides.scrollWidth - slides.clientWidth;
        if (prevBtn) prevBtn.disabled = scrollLeft <= 5;
        if (nextBtn) nextBtn.disabled = maxScroll <= 5 || scrollLeft >= maxScroll - 5;
    };
    
    const scroll = (direction) => {
        const scrollAmount = slides.clientWidth * 0.8;
        if (direction === 'left') {
            slides.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        } else {
            slides.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
        setTimeout(updateButtons, 300);
    };
    
    if (prevBtn) prevBtn.addEventListener('click', () => scroll('left'));
    if (nextBtn) nextBtn.addEventListener('click', () => scroll('right'));
    
    slides.addEventListener('scroll', updateButtons);
    slides.addEventListener('touchstart', () => {
        if (carouselScrollInterval) clearTimeout(carouselScrollInterval);
        carouselScrollInterval = setTimeout(updateButtons, 100);
    });
    
    setTimeout(updateButtons, 100);
    window.addEventListener('resize', updateButtons);
}

function updateCarouselCounter() {
    const counter = document.getElementById('carousel-counter');
    const total = AppState.currentStepJks ? AppState.currentStepJks.length : 0;
    const placed = AppState.placedJks.size;
    if (counter) {
        counter.textContent = renderCarouselCounter(placed, total);
    }
}

function updateSelectedCard() {
    document.querySelectorAll('.jk-card').forEach(card => {
        card.classList.remove('jk-card--selected');
        if (card.dataset.id == AppState.selectedJkId) {
            card.classList.add('jk-card--selected');
        }
    });
    document.querySelectorAll('.jk-list__item').forEach(item => {
        item.classList.remove('jk-list__item--selected');
        if (item.dataset.id == AppState.selectedJkId) {
            item.classList.add('jk-list__item--selected');
        }
    });
}

function selectJk(id) {
    if (AppState.placedJks.has(id)) {
        showToast('⚠️', 'Этот ЖК уже расставлен', 'error');
        return;
    }
    AppState.selectedJkId = id;
    updateSelectedCard();
    
    const jk = AppState.allJks.find(j => j.id === id);
    if (jk) {
        showToast('📍', `Выбран: ${jk.name}. Нажмите на карту, чтобы поставить метку`, 'success');
    }
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

function updateMapProgress() {
    const total = AppState.currentStepJks ? AppState.currentStepJks.length : 0;
    const placed = AppState.placedJks.size;
    
    if (AppState.mapProgressCount) {
        AppState.mapProgressCount.textContent = placed;
    }
    if (AppState.mapProgressTotal) {
        AppState.mapProgressTotal.textContent = total;
    }
    
    const progressPercent = total > 0 ? (placed / total) * 100 : 0;
    const progressFill = document.querySelector('#map-progress .map-progress__fill');
    if (progressFill) {
        progressFill.style.width = `${progressPercent}%`;
    }
    
    updateCarouselCounter();
    
    if (window.innerWidth > 768) {
        updateDesktopDrawerList(AppState.currentStepJks);
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
        
        AppState.selectedJkId = null;
        updateSelectedCard();
        sendToGoogle(jk.name, true, distance);
        updateMapProgress();
        renderMarkers();
        
        if (window.innerWidth <= 768) {
            renderCarousel(AppState.currentStepJks);
        } else {
            updateDesktopDrawerList(AppState.currentStepJks);
        }
        
        if (window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(100);
        }
    } else {
        const wrongMarker = new ymaps.Placemark([lat, lng], {
            hintContent: `${jk.name} (неверно)`
        }, {
            preset: 'islands#redIcon',
            iconColor: '#e74c3c'
        });
        AppState.map.geoObjects.add(wrongMarker);
        
        const hintText = jk.hint && jk.hint.trim() ? jk.hint : 'Попробуйте ещё раз! Посмотрите подсказку на карточке ЖК';
        showToast('❌', `Неправильно. ${hintText}`, 'error');
        
        setTimeout(() => AppState.map.geoObjects.remove(wrongMarker), 3000);
        sendToGoogle(jk.name, false, distance);
        
        if (window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate([100, 50, 100]);
        }
    }
    
    checkMapStepComplete();
}

function checkMapStepComplete() {
    const filteredJks = AppState.currentStepJks;
    if (AppState.placedJks.size === filteredJks.length && filteredJks.length > 0) {
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
        
        if (AppState.highlightMarker) {
            AppState.map.geoObjects.remove(AppState.highlightMarker);
            AppState.highlightMarker = null;
        }
        
        if (AppState.map) {
            renderMarkers();
            AppState.map.setCenter(MAP_CENTER, MAP_ZOOM, { duration: 300 });
        }
        
        if (window.innerWidth <= 768) {
            renderCarousel(AppState.currentStepJks);
        } else {
            updateDesktopDrawerList(AppState.currentStepJks);
        }
        updateMapProgress();
        
        const continueBtn = document.getElementById('step-continue-btn');
        if (continueBtn) continueBtn.remove();
        
        showToast('🔄', 'Шаг сброшен. Начните заново.', 'success');
    }
}

window.addEventListener('resize', () => {
    if (AppState.map) {
        setTimeout(() => {
            AppState.map.container.fitToViewport();
        }, 100);
    }
});

window.resetMapStep = resetMapStep;

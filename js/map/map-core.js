// ===== MAP CORE: ИНИЦИАЛИЗАЦИЯ КАРТЫ, МАРКЕРЫ, РАССТОЯНИЯ =====

// Глобальные переменные для очереди загрузки
let ymapsReady = false;
let ymapsQueue = [];

function onYmapsReady(callback) {
    if (ymapsReady && typeof ymaps !== 'undefined' && ymaps.Map) {
        callback();
    } else {
        ymapsQueue.push(callback);
    }
}

// Функция для установки готовности
function setYmapsReady() {
    ymapsReady = true;
    ymapsQueue.forEach(cb => cb());
    ymapsQueue = [];
}

// Инициализация карты
function initMap() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
        console.error('Контейнер карты не найден');
        return;
    }
    
    const currentMap = Store.getMap();
    if (currentMap && currentMap.destroy) {
        try {
            currentMap.destroy();
        } catch(e) {}
        Store.setMap(null);
    }
    
    mapContainer.innerHTML = '';
    
    try {
        const map = new ymaps.Map('map', {
            center: MAP_CENTER,
            zoom: MAP_ZOOM,
            controls: ['zoomControl']
        }, {
            yandexMapDisablePoiInteractivity: true,
            suppressMapOpenBlock: true,
            suppressObsoleteBrowserNotifier: true
        });

        if (window.innerWidth <= 768) {
            const zoomControl = map.controls.get('zoomControl');
            if (zoomControl) {
                zoomControl.options.set({
                    size: 'large',
                    position: { right: 10, top: 10 }
                });
            }
        }

        map.behaviors.disable([
            'rightMouseButtonMagnifier',
            'leftMouseButtonMagnifier',
            'ruler'
        ]);
        
        map.behaviors.enable(['drag', 'scrollZoom', 'multiTouch']);

        map.events.add('click', (e) => {
            if (typeof onMapClick === 'function') {
                onMapClick(e);
            }
        });
        
        setTimeout(() => {
            if (map && map.container) {
                map.container.fitToViewport();
            }
        }, 100);
        
        Store.setMap(map);
        
    } catch (error) {
        console.error('Ошибка инициализации карты:', error);
        mapContainer.innerHTML = renderMapErrorIndicator();
    }
}

// Рендер маркеров на карте
function renderMarkers() {
    const currentMap = Store.getMap();
    if (!currentMap) return;

    const currentMarkers = Store.getCurrentMarkers();
    currentMarkers.forEach(marker => currentMap.geoObjects.remove(marker));
    Store.clearCurrentMarkers();

    const placedJks = Store.getPlacedJks();
    const allJks = Store.getAllJks();
    
    placedJks.forEach((data, id) => {
        const jk = allJks.find(j => j.id === id);
        if (!jk) return;

        const marker = new ymaps.Placemark([data.lat, data.lng], {
            hintContent: jk.name,
            balloonContent: `<b>${escapeHtmlForMap(jk.name)}</b><br>${escapeHtmlForMap(jk.developer)}<br><br><button onclick="window.zoomToMarker(${jk.lat}, ${jk.lng})" style="padding: 8px 16px; background: #2e86de; color: white; border: none; border-radius: 8px; cursor: pointer;">📍 Показать на карте</button>`
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
        
        currentMap.geoObjects.add(marker);
        Store.addToCurrentMarkers(marker);
    });
}

// Приближение к маркеру
window.zoomToMarker = function(lat, lng) {
    const currentMap = Store.getMap();
    if (currentMap) {
        currentMap.setCenter([lat, lng], 17, {
            duration: 300,
            checkZoomRange: true
        });
    }
};

// Расчёт расстояния между двумя точками в метрах
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

// Вспомогательная функция экранирования для карты
function escapeHtmlForMap(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Функция для обновления готовности (будет вызвана из map-step)
function notifyYmapsReady() {
    setYmapsReady();
}

// ===== УНИВЕРСАЛЬНАЯ БИБЛИОТЕКА DRAG-AND-DROP (поддержка мобильных) =====
const DragDrop = {
    /**
     * Инициализирует drag-and-drop для элементов
     * @param {Object} config
     * @param {string} config.itemsSelector - селектор перетаскиваемых элементов
     * @param {string} config.zonesSelector - селектор зон для сброса
     * @param {Function} config.onDrop - колбэк после сброса (item, zone, results)
     * @param {Function} config.onDragStart - колбэк при начале перетаскивания (item)
     * @param {Function} config.onAllPlaced - колбэк когда все элементы размещены (results)
     * @param {boolean} config.cloneOnDrag - создавать клон при перетаскивании (по умолчанию false)
     */
    init(config) {
        const items = document.querySelectorAll(config.itemsSelector);
        const zones = document.querySelectorAll(config.zonesSelector);
        
        if (!items.length || !zones.length) return null;
        
        let draggedItem = null;
        let dragClone = null;
        let startX = 0, startY = 0;
        let isDragging = false;
        let currentZone = null;
        let originalParent = null;
        let originalNextSibling = null;
        
        // Проверка на мобильное устройство
        const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        // Настраиваем зоны для сброса
        zones.forEach(zone => {
            // События для мыши
            zone.addEventListener('dragover', (e) => {
                if (!isMobile) {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    zone.classList.add('drag-over');
                }
            });
            
            zone.addEventListener('dragleave', () => {
                if (!isMobile) {
                    zone.classList.remove('drag-over');
                }
            });
            
            zone.addEventListener('drop', (e) => {
                if (!isMobile) {
                    e.preventDefault();
                    zone.classList.remove('drag-over');
                    if (draggedItem) {
                        performDrop(draggedItem, zone, config);
                    }
                }
            });
            
            // События для touch (мобильные)
            zone.addEventListener('touchmove', (e) => {
                if (!isDragging || !dragClone) return;
                e.preventDefault();
                
                const touch = e.touches[0];
                dragClone.style.left = (touch.clientX - 20) + 'px';
                dragClone.style.top = (touch.clientY - 20) + 'px';
                
                // Находим зону под пальцем
                const elemUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
                const zoneUnderTouch = elemUnderTouch?.closest(config.zonesSelector);
                
                if (zoneUnderTouch && zoneUnderTouch !== currentZone) {
                    if (currentZone) currentZone.classList.remove('drag-over');
                    currentZone = zoneUnderTouch;
                    currentZone.classList.add('drag-over');
                } else if (!zoneUnderTouch && currentZone) {
                    currentZone.classList.remove('drag-over');
                    currentZone = null;
                }
            });
            
            zone.addEventListener('touchend', (e) => {
                if (!isDragging || !dragClone) return;
                e.preventDefault();
                
                if (currentZone && draggedItem) {
                    performDrop(draggedItem, currentZone, config);
                } else if (draggedItem && originalParent) {
                    // Возвращаем на место
                    cancelDrag();
                }
                
                endDrag();
            });
        });
        
        // Функция выполнения сброса
        function performDrop(item, zone, cfg) {
            const maxItems = parseInt(zone.dataset.maxItems) || Infinity;
            const currentItems = zone.querySelectorAll(cfg.itemsSelector).length;
            
            if (currentItems >= maxItems) {
                showToast('⚠️', 'Нельзя добавить больше элементов', 'error');
                cancelDrag();
                endDrag();
                return;
            }
            
            // Если элемент уже в другой зоне — удаляем оттуда
            if (item.parentElement && item.parentElement !== zone) {
                item.remove();
            }
            
            // Добавляем в новую зону
            zone.appendChild(item);
            item.classList.add('drag-placed');
            item.setAttribute('draggable', 'false');
            
            // Убираем стили перетаскивания
            item.style.opacity = '';
            item.style.transform = '';
            
            // Собираем результаты
            const results = {};
            zones.forEach(z => {
                const zoneId = z.dataset.zone || z.dataset.tool || 'unknown';
                const zoneItems = z.querySelectorAll(cfg.itemsSelector);
                results[zoneId] = Array.from(zoneItems).map(el => el.dataset.id || el.textContent.trim());
            });
            
            if (cfg.onDrop) {
                cfg.onDrop(item, zone, results);
            }
            
            // Проверяем, все ли элементы размещены
            const allItems = document.querySelectorAll(cfg.itemsSelector);
            const placedItems = document.querySelectorAll(`${cfg.zonesSelector} ${cfg.itemsSelector}`);
            
            if (allItems.length === placedItems.length && cfg.onAllPlaced) {
                cfg.onAllPlaced(results);
            }
            
            endDrag();
        }
        
        function cancelDrag() {
            if (dragClone) {
                dragClone.remove();
                dragClone = null;
            }
            if (draggedItem) {
                draggedItem.style.opacity = '';
                draggedItem.style.transform = '';
                if (originalParent && originalParent !== draggedItem.parentElement) {
                    if (originalNextSibling) {
                        originalParent.insertBefore(draggedItem, originalNextSibling);
                    } else {
                        originalParent.appendChild(draggedItem);
                    }
                }
            }
        }
        
        function endDrag() {
            isDragging = false;
            if (dragClone) {
                dragClone.remove();
                dragClone = null;
            }
            if (currentZone) {
                currentZone.classList.remove('drag-over');
                currentZone = null;
            }
            document.body.style.overflow = '';
            draggedItem = null;
            originalParent = null;
            originalNextSibling = null;
        }
        
        // Настраиваем перетаскиваемые элементы
        items.forEach(item => {
            // Для мыши
            item.setAttribute('draggable', isMobile ? 'false' : 'true');
            
            if (!isMobile) {
                item.addEventListener('dragstart', (e) => {
                    draggedItem = item;
                    item.classList.add('drag-dragging');
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', item.dataset.id || '');
                    
                    if (config.onDragStart) {
                        config.onDragStart(item);
                    }
                });
                
                item.addEventListener('dragend', () => {
                    item.classList.remove('drag-dragging');
                    draggedItem = null;
                    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
                });
            }
            
            // Для touch (мобильные)
            item.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (isDragging) return;
                
                draggedItem = item;
                originalParent = item.parentElement;
                originalNextSibling = item.nextSibling;
                const touch = e.touches[0];
                startX = touch.clientX;
                startY = touch.clientY;
                
                // Создаём клон для визуального отклика
                const rect = item.getBoundingClientRect();
                dragClone = item.cloneNode(true);
                dragClone.style.position = 'fixed';
                dragClone.style.left = rect.left + 'px';
                dragClone.style.top = rect.top + 'px';
                dragClone.style.width = rect.width + 'px';
                dragClone.style.zIndex = '9999';
                dragClone.style.opacity = '0.8';
                dragClone.style.pointerEvents = 'none';
                dragClone.style.transform = 'rotate(3deg)';
                dragClone.style.boxShadow = '0 8px 16px rgba(0,0,0,0.2)';
                document.body.appendChild(dragClone);
                
                // Скрываем оригинал
                item.style.opacity = '0.3';
                item.style.transform = 'scale(0.95)';
                
                // Блокируем скролл страницы
                document.body.style.overflow = 'hidden';
                
                // Устанавливаем таймер для определения перетаскивания
                setTimeout(() => {
                    if (dragClone) {
                        isDragging = true;
                        if (config.onDragStart) {
                            config.onDragStart(item);
                        }
                    }
                }, 100);
            });
            
            item.addEventListener('touchmove', (e) => {
                if (!dragClone) return;
                e.preventDefault();
                
                const touch = e.touches[0];
                dragClone.style.left = (touch.clientX - 20) + 'px';
                dragClone.style.top = (touch.clientY - 20) + 'px';
            });
            
            item.addEventListener('touchend', (e) => {
                if (!isDragging) {
                    // Короткое нажатие — не перетаскивание, игнорируем
                    if (dragClone) {
                        dragClone.remove();
                        dragClone = null;
                    }
                    if (draggedItem) {
                        draggedItem.style.opacity = '';
                        draggedItem.style.transform = '';
                    }
                    document.body.style.overflow = '';
                    draggedItem = null;
                    return;
                }
                
                e.preventDefault();
                
                if (!currentZone) {
                    cancelDrag();
                }
                
                endDrag();
            });
        });
        
        return {
            getResults() {
                const results = {};
                zones.forEach(z => {
                    const zoneId = z.dataset.zone || z.dataset.tool || 'unknown';
                    const zoneItems = z.querySelectorAll(config.itemsSelector);
                    results[zoneId] = Array.from(zoneItems).map(el => el.dataset.id || el.textContent.trim());
                });
                return results;
            },
            
            reset() {
                // Находим исходный контейнер для элементов
                const originalContainer = document.querySelector(config.itemsSelector)?.parentElement;
                if (originalContainer) {
                    zones.forEach(zone => {
                        const zoneItems = zone.querySelectorAll(config.itemsSelector);
                        zoneItems.forEach(item => {
                            item.classList.remove('drag-placed');
                            item.setAttribute('draggable', isMobile ? 'false' : 'true');
                            item.style.opacity = '';
                            item.style.transform = '';
                            originalContainer.appendChild(item);
                        });
                    });
                }
            },
            
            destroy() {
                // Очистка всех обработчиков (опционально)
            }
        };
    }
};

// showToast теперь глобальная (из utils/toast.js)
// Локальное определение УДАЛЕНО

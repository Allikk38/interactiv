// ===== УНИВЕРСАЛЬНАЯ БИБЛИОТЕКА DRAG-AND-DROP =====
const DragDrop = {
    /**
     * Инициализирует drag-and-drop для элементов
     * @param {Object} config
     * @param {string} config.itemsSelector - селектор перетаскиваемых элементов
     * @param {string} config.zonesSelector - селектор зон для сброса
     * @param {Function} config.onDrop - колбэк после сброса (item, zone, itemsInZone)
     * @param {Function} config.onDragStart - колбэк при начале перетаскивания (item)
     * @param {Function} config.onAllPlaced - колбэк когда все элементы размещены (results)
     */
    init(config) {
        const items = document.querySelectorAll(config.itemsSelector);
        const zones = document.querySelectorAll(config.zonesSelector);
        let draggedItem = null;

        // Настраиваем перетаскиваемые элементы
        items.forEach(item => {
            item.setAttribute('draggable', 'true');

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
        });

        // Настраиваем зоны для сброса
        zones.forEach(zone => {
            zone.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                zone.classList.add('drag-over');
            });

            zone.addEventListener('dragleave', () => {
                zone.classList.remove('drag-over');
            });

            zone.addEventListener('drop', (e) => {
                e.preventDefault();
                zone.classList.remove('drag-over');

                if (!draggedItem) return;

                // Проверяем, можно ли добавить в зону (ограничение по количеству)
                const maxItems = parseInt(zone.dataset.maxItems) || Infinity;
                const currentItems = zone.querySelectorAll(config.itemsSelector).length;

                if (currentItems >= maxItems) return;

                // Если элемент уже в другой зоне — удаляем оттуда
                if (draggedItem.parentElement) {
                    draggedItem.parentElement.removeChild(draggedItem);
                }

                zone.appendChild(draggedItem);
                draggedItem.classList.add('drag-placed');

                // Собираем результаты
                const results = {};
                zones.forEach(z => {
                    const zoneId = z.dataset.zone || z.dataset.tool || 'unknown';
                    const zoneItems = z.querySelectorAll(config.itemsSelector);
                    results[zoneId] = Array.from(zoneItems).map(el => el.dataset.id || el.textContent.trim());
                });

                if (config.onDrop) {
                    config.onDrop(draggedItem, zone, results);
                }

                // Проверяем, все ли элементы размещены
                const allItems = document.querySelectorAll(config.itemsSelector);
                const placedItems = document.querySelectorAll(`${config.zonesSelector} ${config.itemsSelector}`);

                if (allItems.length === placedItems.length && config.onAllPlaced) {
                    config.onAllPlaced(results);
                }

                draggedItem = null;
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
                const container = document.querySelector(config.itemsSelector)?.parentElement;
                if (container) {
                    zones.forEach(zone => {
                        const zoneItems = zone.querySelectorAll(config.itemsSelector);
                        zoneItems.forEach(item => {
                            item.classList.remove('drag-placed');
                            container.appendChild(item);
                        });
                    });
                }
            }
        };
    }
};

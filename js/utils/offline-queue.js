// ===== ОЧЕРЕДЬ ЗАПРОСОВ ДЛЯ ОФЛАЙН-РЕЖИМА =====
// Сохраняет запросы, когда нет интернета, и отправляет их при восстановлении соединения

const OfflineQueue = {
    storageKey: 'offline_request_queue',
    maxRetryCount: 3,
    retryDelayMs: 5000,
    maxQueueSize: 100,
    isProcessing: false,
    
    /**
     * Инициализация очереди
     */
    init() {
        // Загружаем настройки из констант, если они доступны
        if (typeof OFFLINE_QUEUE_CONFIG !== 'undefined') {
            this.storageKey = OFFLINE_QUEUE_CONFIG.STORAGE_KEY || this.storageKey;
            this.maxRetryCount = OFFLINE_QUEUE_CONFIG.MAX_RETRY_COUNT || this.maxRetryCount;
            this.retryDelayMs = OFFLINE_QUEUE_CONFIG.RETRY_DELAY_MS || this.retryDelayMs;
            this.maxQueueSize = OFFLINE_QUEUE_CONFIG.MAX_QUEUE_SIZE || this.maxQueueSize;
        }
        
        // Слушаем событие восстановления соединения
        window.addEventListener('online', () => {
            logInfo('[OfflineQueue] Соединение восстановлено, отправка накопленных запросов');
            this.processQueue();
        });
        
        // При загрузке страницы пробуем отправить накопленные запросы
        if (navigator.onLine) {
            setTimeout(() => this.processQueue(), 3000);
        }
        
        logInfo('[OfflineQueue] Инициализирована, ключ хранилища:', this.storageKey);
    },
    
    /**
     * Добавить запрос в очередь
     * @param {Object} payload - данные для отправки
     * @param {string} url - URL для отправки
     * @param {string} method - метод HTTP (POST/GET)
     * @returns {boolean} - успешно ли добавлено
     */
    add(payload, url = GOOGLE_SCRIPT_URL, method = 'POST') {
        // Проверяем размер очереди
        const queue = this.getQueue();
        if (queue.length >= this.maxQueueSize) {
            logWarn('[OfflineQueue] Очередь переполнена, старый запрос удалён');
            queue.shift(); // Удаляем самый старый запрос
        }
        
        const request = {
            id: this.generateId(),
            url: url,
            method: method,
            payload: payload,
            timestamp: Date.now(),
            retryCount: 0,
            action: payload.action || 'unknown'
        };
        
        queue.push(request);
        this.saveQueue(queue);
        
        logInfo(`[OfflineQueue] Запрос добавлен в очередь (${queue.length} в очереди):`, request.action);
        
        // Если есть интернет, пробуем отправить сразу
        if (navigator.onLine) {
            this.processQueue();
        } else {
            showToast('📡', 'Нет соединения. Данные будут отправлены при восстановлении интернета.', 'warning', false);
        }
        
        return true;
    },
    
    /**
     * Обработать очередь (отправить все накопленные запросы)
     */
    async processQueue() {
        // Если уже обрабатываем или нет интернета — выходим
        if (this.isProcessing) {
            logInfo('[OfflineQueue] Уже обрабатывается очередь');
            return;
        }
        
        if (!navigator.onLine) {
            logInfo('[OfflineQueue] Нет соединения, обработка отложена');
            return;
        }
        
        const queue = this.getQueue();
        if (queue.length === 0) {
            return;
        }
        
        this.isProcessing = true;
        logInfo(`[OfflineQueue] Начало обработки очереди (${queue.length} запросов)`);
        
        // Создаём копию очереди для обработки
        const requestsToProcess = [...queue];
        const failedRequests = [];
        
        for (const request of requestsToProcess) {
            const success = await this.sendRequest(request);
            
            if (success) {
                // Удаляем успешно отправленный запрос из очереди
                this.removeFromQueue(request.id);
                logInfo(`[OfflineQueue] Запрос ${request.id} (${request.action}) отправлен успешно`);
            } else {
                // Увеличиваем счётчик попыток
                request.retryCount++;
                failedRequests.push(request);
                logWarn(`[OfflineQueue] Запрос ${request.id} не отправлен, попытка ${request.retryCount}/${this.maxRetryCount}`);
            }
        }
        
        // Если есть неудавшиеся запросы с попытками меньше максимума — возвращаем их в очередь
        if (failedRequests.length > 0) {
            const currentQueue = this.getQueue();
            const remainingRequests = failedRequests.filter(r => r.retryCount < this.maxRetryCount);
            
            // Очищаем очередь и добавляем только те, у которых есть ещё попытки
            this.clearQueue();
            for (const req of remainingRequests) {
                this.addToQueueDirect(req);
            }
            
            if (remainingRequests.length === 0) {
                logInfo('[OfflineQueue] Все запросы исчерпали лимит попыток, очищено');
            } else {
                logInfo(`[OfflineQueue] ${remainingRequests.length} запросов осталось в очереди`);
            }
        }
        
        this.isProcessing = false;
        
        // Если в очереди ещё есть запросы, планируем повторную попытку
        const remainingQueue = this.getQueue();
        if (remainingQueue.length > 0) {
            setTimeout(() => this.processQueue(), this.retryDelayMs);
        }
    },
    
    /**
     * Отправить один запрос
     * @param {Object} request - объект запроса
     * @returns {Promise<boolean>} - успешность отправки
     */
    async sendRequest(request) {
        try {
            // Используем fetch с таймаутом
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            const response = await fetch(request.url, {
                method: request.method,
                mode: 'no-cors',  // Оставляем no-cors для совместимости с Google Sheets
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request.payload),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            // При режиме no-cors ответ всегда пустой, считаем успехом
            // (Google Sheets получает данные, даже если мы не видим ответ)
            return true;
            
        } catch (error) {
            logError(`[OfflineQueue] Ошибка отправки запроса ${request.id}:`, error);
            
            // Если ошибка из-за отсутствия интернета — точно не отправлено
            if (error.name === 'AbortError') {
                logWarn(`[OfflineQueue] Таймаут запроса ${request.id}`);
            }
            
            return false;
        }
    },
    
    /**
     * Получить очередь из localStorage
     * @returns {Array} - массив запросов
     */
    getQueue() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            logError('[OfflineQueue] Ошибка чтения очереди:', error);
            return [];
        }
    },
    
    /**
     * Сохранить очередь в localStorage
     * @param {Array} queue - массив запросов
     */
    saveQueue(queue) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(queue));
        } catch (error) {
            logError('[OfflineQueue] Ошибка сохранения очереди:', error);
        }
    },
    
    /**
     * Очистить всю очередь
     */
    clearQueue() {
        localStorage.removeItem(this.storageKey);
        logInfo('[OfflineQueue] Очередь очищена');
    },
    
    /**
     * Удалить запрос из очереди по ID
     * @param {string} id - идентификатор запроса
     */
    removeFromQueue(id) {
        const queue = this.getQueue();
        const newQueue = queue.filter(req => req.id !== id);
        this.saveQueue(newQueue);
    },
    
    /**
     * Добавить запрос в очередь напрямую (без проверок)
     * @param {Object} request - объект запроса
     */
    addToQueueDirect(request) {
        const queue = this.getQueue();
        queue.push(request);
        this.saveQueue(queue);
    },
    
    /**
     * Генерировать уникальный ID для запроса
     * @returns {string} - уникальный ID
     */
    generateId() {
        return Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },
    
    /**
     * Получить размер очереди
     * @returns {number} - количество запросов в очереди
     */
    getQueueSize() {
        return this.getQueue().length;
    },
    
    /**
     * Проверить, есть ли неотправленные запросы
     * @returns {boolean} - есть ли запросы
     */
    hasPendingRequests() {
        return this.getQueueSize() > 0;
    }
};

// Автоматическая инициализация
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => OfflineQueue.init());
} else {
    OfflineQueue.init();
}

// Экспорт в глобальную область
window.OfflineQueue = OfflineQueue;
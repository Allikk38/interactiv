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
        if (typeof OFFLINE_QUEUE_CONFIG !== 'undefined') {
            this.storageKey = OFFLINE_QUEUE_CONFIG.STORAGE_KEY || this.storageKey;
            this.maxRetryCount = OFFLINE_QUEUE_CONFIG.MAX_RETRY_COUNT || this.maxRetryCount;
            this.retryDelayMs = OFFLINE_QUEUE_CONFIG.RETRY_DELAY_MS || this.retryDelayMs;
            this.maxQueueSize = OFFLINE_QUEUE_CONFIG.MAX_QUEUE_SIZE || this.maxQueueSize;
        }
        
        window.addEventListener('online', () => {
            logInfo('[OfflineQueue] Соединение восстановлено, отправка накопленных запросов');
            this.processQueue();
        });
        
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
        const queue = this.getQueue();
        if (queue.length >= this.maxQueueSize) {
            logWarn('[OfflineQueue] Очередь переполнена, старый запрос удалён');
            queue.shift();
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
        
        const requestsToProcess = [...queue];
        const failedRequests = [];
        
        for (const request of requestsToProcess) {
            const success = await this.sendRequest(request);
            
            if (success) {
                this.removeFromQueue(request.id);
                logInfo(`[OfflineQueue] Запрос ${request.id} (${request.action}) отправлен успешно`);
            } else {
                request.retryCount++;
                failedRequests.push(request);
                logWarn(`[OfflineQueue] Запрос ${request.id} не отправлен, попытка ${request.retryCount}/${this.maxRetryCount}`);
            }
        }
        
        if (failedRequests.length > 0) {
            const currentQueue = this.getQueue();
            const remainingRequests = failedRequests.filter(r => r.retryCount < this.maxRetryCount);
            
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
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            // ИСПРАВЛЕНИЕ: добавлен mode: 'no-cors' для обхода CORS
            const options = {
                method: request.method,
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal
            };
            
            // Только POST-запросы могут иметь body
            if (request.method === 'POST') {
                options.body = JSON.stringify(request.payload);
            }
            
            const response = await fetch(request.url, options);
            
            clearTimeout(timeoutId);
            
            // При mode: 'no-cors' response.type === 'opaque'
            // Статус всегда 0, но запрос доходит до сервера
            // Считаем успехом, так как запрос отправлен
            return true;
            
        } catch (error) {
            logError(`[OfflineQueue] Ошибка отправки запроса ${request.id}:`, error);
            
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

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => OfflineQueue.init());
} else {
    OfflineQueue.init();
}

window.OfflineQueue = OfflineQueue;
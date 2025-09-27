const { HttpClientSingleton, QueueSingleton } = require('../patterns/Singleton');
const { ScoreRequestCommand } = require('../patterns/Command');
const NodeCache = require('node-cache');

class ProxyService {
    constructor() {
        if (ProxyService.instance) {
            return ProxyService.instance;
        }
        
        this.httpClient = HttpClientSingleton.getInstance();
        this.queue = QueueSingleton.getInstance();
        this.cache = new NodeCache({ stdTTL: 300 });
        this.lastRequest = 0;
        
        ProxyService.instance = this;
        this.processQueue();
    }

    static getInstance() {
        if (!ProxyService.instance) {
            ProxyService.instance = new ProxyService();
        }
        return ProxyService.instance;
    }

    async getScore(params = {}) {
        const command = new ScoreRequestCommand(params);
        
        try {
            this.queue.enqueue(command);
        } catch (error) {
            return { success: false, error: 'Servidor sobrecarregado - tente novamente' };
        }
        
        return new Promise((resolve) => {
            command.onComplete = resolve;
        });
    }

    async processQueue() {
        setInterval(async () => {
            if (!this.queue.isEmpty()) {
                const command = this.queue.dequeue();
                await this.executeCommand(command);
            }
        }, 1000);
    }

    async executeCommand(command) {
        const cacheKey = command.getCacheKey();
        const cached = this.cache.get(cacheKey);
        
        if (cached) {
            command.onComplete({ success: true, data: cached, cached: true });
            return;
        }

        try {
            const response = await command.execute(this.httpClient);
            this.cache.set(cacheKey, response.data);
            command.onComplete({ success: true, data: response.data });
        } catch (error) {
            command.onComplete({ success: false, error: error.message });
        }
    }
}

module.exports = ProxyService;
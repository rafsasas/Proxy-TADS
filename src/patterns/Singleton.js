const axios = require('axios');

class HttpClientSingleton {
    constructor() {
        if (HttpClientSingleton.instance) {
            return HttpClientSingleton.instance;
        }
        
        this.client = axios.create();
        HttpClientSingleton.instance = this;
    }

    static getInstance() {
        if (!HttpClientSingleton.instance) {
            HttpClientSingleton.instance = new HttpClientSingleton();
        }
        return HttpClientSingleton.instance;
    }

    async get(url) {
        return await this.client.get(url);
    }
}

class QueueSingleton {
    constructor() {
        if (QueueSingleton.instance) {
            return QueueSingleton.instance;
        }
        
        this.items = [];
        this.maxSize = 100;
        QueueSingleton.instance = this;
    }

    static getInstance() {
        if (!QueueSingleton.instance) {
            QueueSingleton.instance = new QueueSingleton();
        }
        return QueueSingleton.instance;
    }

    enqueue(item) {
        if (this.items.length >= this.maxSize) {
            throw new Error('Fila cheia - backpressure ativado');
        }
        this.items.push(item);
    }

    dequeue() {
        return this.items.shift();
    }

    isEmpty() {
        return this.items.length === 0;
    }

    size() {
        return this.items.length;
    }
}

module.exports = { HttpClientSingleton, QueueSingleton };
const axios = require('axios');

class HttpClientSingleton {
    constructor() {
        if (HttpClientSingleton.instance) {
            return HttpClientSingleton.instance;
        }
        console.log(`CLIENT_ID: '${process.env.CLIENT_ID}'`);
        this.client = axios.create({
            headers: {
                'client-id': process.env.CLIENT_ID
            }
        });
        
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
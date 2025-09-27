class Command {
    execute() {
        throw new Error('Execute deve ser implementado');
    }
}

class ScoreRequestCommand extends Command {
    constructor(params = {}) {
        super();
        this.params = params;
        this.baseUrl = process.env.UPSTREAM_URL + '/score';

        const queryString = new URLSearchParams(params).toString();
        this.url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;
    }

    async execute(httpClient) {
        return await httpClient.get(this.url);
    }

    getCacheKey() {
        const paramString = JSON.stringify(this.params);
        return `score_request_${paramString}`;
    }
}

module.exports = { Command, ScoreRequestCommand };
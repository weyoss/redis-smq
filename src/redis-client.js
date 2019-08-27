'use strict';

const redis = require('ioredis');

const clients = [];

module.exports = {
    /**
     *
     * @param {object} config
     * @return {object}
     */
    getNewInstance(config = {}) {
        const { redis: options = {} } = config;
        const c = redis.createClient(options);
        clients.push(c);
        return c;
    },

    getAllClients() {
        return clients;
    },
};

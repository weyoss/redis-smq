'use strict';

const redis = require('redis');

module.exports = {
    /**
     *
     * @param {object} config
     * @return {object}
     */
    getNewInstance(config = {}) {
        const { redis: options = {} } = config;
        return redis.createClient(options);
    },
};

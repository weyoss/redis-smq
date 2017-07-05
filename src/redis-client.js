'use strict';

const redis = require('redis');

module.exports = {

    /**
     *
     * @param {object} config
     * @return {object}
     */
    getNewInstance(config) {
        if (!config.hasOwnProperty('redis') ||
            !config.redis.hasOwnProperty('port') ||
            !config.redis.hasOwnProperty('host')) {
            throw new Error('Missing redis parameters.');
        }
        return redis.createClient(config.redis.port, config.redis.host);
    },
};

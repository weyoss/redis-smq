'use strict';

const bunyan = require('bunyan');

module.exports = {

    /**
     *
     * @param {string} name
     * @param {object} config
     * @returns {object}
     */
    getNewInstance(name, config = {}) {
        if (!config.enabled) {
            return {
                debug() {},
                warn() {},
                info() {},
                trace() {},
                fatal() {},
                error() {},
            };
        }
        return bunyan.createLogger({ name, ...config.options || {} });
    },
};

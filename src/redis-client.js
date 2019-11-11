'use strict';

const redis = require('redis');
const IORedis = require('ioredis');

const clients = [];

module.exports = {
    /**
     *
     * @param {object} config
     * @param {function} cb
     * @return {object}
     */
    getNewInstance(config = {}, cb) {
        const { redis: redisParams = {} } = config;
        const driverOptions = redisParams.options || {
            host: '127.0.0.1',
            port: 6379,
        };
        const client = (redisParams.driver === 'ioredis') ? new IORedis(driverOptions)
            : redis.createClient(driverOptions);
        client.on('ready', () => {
            clients.push(client);
            cb(client);
        });
    },

    getAllClients() {
        return clients;
    },
};

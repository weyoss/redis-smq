'use strict';

const EventEmitter = require('events').EventEmitter;
const uuid = require('uuid/v4');
const redisKeys = require('./redis-keys');
const redisClient = require('./redis-client');
const statsFactory = require('./stats');

const produceMessage = Symbol('produceMessage');

class Producer extends EventEmitter {

    /**
     *
     * @param {string} queueName
     * @param {object} config
     */
    constructor(queueName, config) {
        super();
        this.producerId = uuid();
        this.queueName = queueName;
        this.keys = redisKeys.getKeys(queueName, null, this.producerId);
        this.client = redisClient.getNewInstance(config);
        this.isTest = process.env.NODE_ENV === 'test';
        const monitorEnabled = !!(config.monitor && config.monitor.enabled);
        if (monitorEnabled) {
            this.stats = statsFactory(this, config);
            this.stats.start();
        }
    }

    /**
     *
     * @param {*} message
     * @param {number} ttl
     * @param {function} cb
     */
    [produceMessage](message, ttl, cb) {
        const payload = {
            uuid: uuid(),
            attempts: 1,
            data: message,
            time: new Date().getTime(),
            ttl: 0,
        };
        if (ttl) payload.ttl = ttl;
        this.client.lpush(this.keys.keyQueueName, JSON.stringify(payload), (err) => {
            if (err) cb(err);
            else {
                if (this.stats) this.stats.incrementInputSlot();
                cb();
            }
        });
    }

    /**
     *
     * @param {*} message
     * @param {function} cb
     */
    produce(message, cb) {
        this[produceMessage](message, null, cb);
    }

    /**
     *
     * @param message
     * @param ttl
     * @param cb
     */
    produceWithTTL(message, ttl, cb) {
        this[produceMessage](message, ttl, cb);
    }

    /**
     *
     * @returns {boolean}
     */
    shutdown() {
        if (this.stats) this.stats.stop();
        this.client.end(true);
        this.client = null;
    }
}

module.exports = Producer;

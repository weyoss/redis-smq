'use strict';

const EventEmitter = require('events').EventEmitter;
const uuid = require('uuid/v4');
const redisKeys = require('./redis-keys');
const redisClient = require('./redis-client');
const statsFactory = require('./stats');

const sProduceMessage = Symbol('produceMessage');
const sRedisClient = Symbol('client');
const sStats = Symbol('stats');

class Producer extends EventEmitter {

    /**
     *
     * @param {string} queueName
     * @param {object} config
     */
    constructor(queueName, config = {}) {
        super();
        this.producerId = uuid();
        this.queueName = redisKeys.validateKeyPart(queueName);
        if (config.hasOwnProperty('namespace')) redisKeys.setNamespace(config.namespace);
        this.keys = redisKeys.getKeys(this);
        this.isTest = process.env.NODE_ENV === 'test';
        this[sRedisClient] = redisClient.getNewInstance(config);
        const monitorEnabled = !!(config.monitor && config.monitor.enabled);
        if (monitorEnabled) {
            this[sStats] = statsFactory(this, config);
            this[sStats].start();
        }
    }

    /**
     *
     * @param {*} message
     * @param {number} ttl
     * @param {function} cb
     */
    [sProduceMessage](message, ttl, cb) {
        if (!this[sRedisClient]) throw new Error('Producer is not running');
        const payload = {
            uuid: uuid(),
            attempts: 1,
            data: message,
            time: new Date().getTime(),
            ttl: 0,
        };
        if (ttl) payload.ttl = ttl;
        this[sRedisClient].lpush(this.keys.keyQueueName, JSON.stringify(payload), (err) => {
            if (err) cb(err);
            else {
                if (this[sStats]) this[sStats].incrementInputSlot();
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
        this[sProduceMessage](message, null, cb);
    }

    /**
     *
     * @param message
     * @param ttl
     * @param cb
     */
    produceWithTTL(message, ttl, cb) {
        this[sProduceMessage](message, ttl, cb);
    }

    /**
     *
     */
    shutdown() {
        if (this[sStats]) this[sStats].stop();
        this[sRedisClient].end(true);
        this[sRedisClient] = null;
    }
}

module.exports = Producer;

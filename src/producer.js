'use strict';

const EventEmitter = require('events').EventEmitter;
const uuid = require('uuid/v4');
const redisKeys = require('./redis-keys');
const redisClient = require('./redis-client');
const statsFactory = require('./stats');
const queue = require('./queue');

const sProduceMessage = Symbol('produceMessage');
const sRedisClient = Symbol('client');
const sStats = Symbol('stats');

class Producer extends EventEmitter {

    /**
     * See docs.
     *
     * @param {string} queueName
     * @param {object} config
     */
    constructor(queueName, config = {}) {
        super();
        if (config.hasOwnProperty('namespace')) redisKeys.setNamespace(config.namespace);
        this.producerId = uuid();
        this.queueName = redisKeys.validateKeyPart(queueName);
        this.keys = redisKeys.getKeys(this);
        this.isTest = process.env.NODE_ENV === 'test';
        this[sRedisClient] = redisClient.getNewInstance(config);
        queue.addMessageQueue(this[sRedisClient], this.keys.keyQueueName, (err) => {
            if (err) throw err;
        });
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

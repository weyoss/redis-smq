'use strict';

const EventEmitter = require('events').EventEmitter;
const uuid = require('uuid/v4');
const redisKeys = require('./redis-keys');
const redisClient = require('./redis-client');
const heartBeat = require('./heartbeat');
const statsFactory = require('./stats');
const garbageCollector = require('./gc');
const logger = require('./logger');

const CONSUMER_STATUS_GOING_DOWN = 0;
const CONSUMER_STATUS_DOWN = 1;
const CONSUMER_STATUS_GOING_UP = 2;
const CONSUMER_STATUS_UP = 3;
const CONSUMER_STATUS_CONSUMING = 4;

const registerEvents = Symbol('registerEvents');
const getEventsHandlers = Symbol('getEventsHandlers');
const getNextMessage = Symbol('getNextMessage');
const consumeMessage = Symbol('consumeMessage');
const processMessageFailure = Symbol('processMessageFailure');
const heartBeatS = Symbol('heartBeat');
const garbageCollectorS = Symbol('garbageCollector');
const statsS = Symbol('stats');
const loggerS = Symbol('logger');
const redisClientS = Symbol('redisClient');

class Consumer extends EventEmitter {

    /**
     *
     * @param {object} config
     * @param {object} config.redis
     * @param {string} config.redis.host
     * @param {number} config.redis.port
     * @param {object} config.log
     * @param {(boolean|number)} config.log.enabled
     * @param {object} config.log.options
     * @param {object} config.monitor
     * @param {(boolean|number)} config.monitor.enabled
     * @param {string} config.monitor.host
     * @param {number} config.monitor.port
     * @param {object} options
     * @param {number} options.messageConsumeTimeout
     * @param {number} options.messageTTL
     * @param {number} options.messageRetryThreshold
     */
    constructor(config, options = {}) {
        super();

        if (!this.constructor.hasOwnProperty('queueName')) throw new Error('Undefined queue name!');

        /**
         * EventEmitter
         */
        EventEmitter.call(this);
        this[registerEvents]();

        /**
         * Consumer parameters
         */
        this.consumerId = uuid();
        this.queueName = this.constructor.queueName;
        this.config = config;
        this.options = options;
        this.messageConsumeTimeout = options.hasOwnProperty('messageConsumeTimeout') ?
            Number(options.messageConsumeTimeout) : 0;
        this.messageTTL = options.hasOwnProperty('messageTTL') ? Number(options.messageTTL) : 0;
        this.keys = redisKeys.getKeys(this.queueName, this.consumerId);
        this.isTest = process.env.NODE_ENV === 'test';
        this.status = CONSUMER_STATUS_DOWN;

        /**
         * Logs
         */
        this[loggerS] = logger.getNewInstance(`${this.queueName}:${this.consumerId}`, config.log);

        /**
         * Heartbeat
         */
        this[heartBeatS] = heartBeat(this);

        /**
         * GC
         */
        this[garbageCollectorS] = garbageCollector(this, this[loggerS]);

        /**
         * Stats
         */
        const monitorEnabled = !!(config.monitor && config.monitor.enabled);
        if (monitorEnabled) this[statsS] = statsFactory(this, config);
    }

    /**
     *
     * @returns {object}
     */
    [getEventsHandlers]() {
        const consumer = this;
        return {
            /**
             *
             */
            halt() {
                consumer.status = CONSUMER_STATUS_DOWN;
                consumer.emit('halt');
            },

            /**
             * If an error occurred, the whole consumer should go down,
             * A consumer can not exit without heartbeat/gc and vice-versa
             */
            onError(err) {
                if (err.name !== 'AbortError' && consumer.status !== CONSUMER_STATUS_GOING_DOWN) {
                    consumer[loggerS].error(err);
                    process.exit(1);
                }
            },

            /**
             *
             */
            onHeartBeatHalt() {
                if (consumer[statsS]) consumer[statsS].stop();
                else this.halt();
            },

            /**
             *
             */
            onConsumerHalt() {
                consumer.status = CONSUMER_STATUS_GOING_DOWN;
                consumer[redisClientS].end(true);
                delete consumer[redisClientS];
                consumer[garbageCollectorS].stop();
            },

            /**
             *
             */
            onGCHalt() {
                consumer[heartBeatS].stop();
            },

            /**
             *
             * @param message
             */
            onConsumeTimeout(message) {
                consumer[processMessageFailure](
                    message, new Error(`Consumer timed out after [${consumer.messageConsumeTimeout}]`));
            },

            /**
             *
             * @param message
             */
            onMessageExpired(message) {
                consumer[loggerS].info(`Message [${message.uuid}] has expired`);
                consumer[garbageCollectorS].collectExpiredMessage(message, consumer.keys.keyQueueNameProcessing, () => {
                    if (consumer[statsS]) consumer[statsS].incrementAcknowledgedSlot();
                    consumer[loggerS].info(`Message [${message.uuid}] successfully processed`);
                    consumer.emit('next');
                });
            },

            /**
             *
             * @param message
             */
            onMessage(message) {
                if (consumer.status === CONSUMER_STATUS_UP) {
                    if (consumer[garbageCollectorS].checkMessageExpiration(message)) {
                        consumer.emit('message_expired', message);
                    } else consumer[consumeMessage](message);
                }
            },

            /**
             *
             */
            onNext() {
                if (consumer.isRunning()) {
                    consumer.status = CONSUMER_STATUS_UP;
                    consumer[getNextMessage]();
                }
            },
        };
    }

    /**
     *
     */
    [registerEvents]() {
        const handlers = this[getEventsHandlers]();

        /**
         * Events
         */
        this
        .on('next', handlers.onNext)
        .on('message', handlers.onMessage)
        .on('message_expired', handlers.onMessageExpired)
        .on('consume_timeout', handlers.onConsumeTimeout)
        .on('consumer_halt', handlers.onConsumerHalt)
        .on('gc_halt', handlers.onGCHalt)
        .on('heartbeat_halt', handlers.onHeartBeatHalt)
        .on('stats_halt', handlers.halt)
        .on('error', handlers.onError);
    }

    /**
     *
     * @param {object} message
     * @param {object} error
     */
    [processMessageFailure](message, error) {
        this[loggerS].error(`Consumer failed to consume message [${message.id}]...`);
        if (this[statsS]) this[statsS].incrementUnacknowledgedSlot();
        this[garbageCollectorS].collectMessage(message, this.keys.keyQueueNameProcessing, error, (err) => {
            if (err) this.emit('error', err);
            else this.emit('next');
        });
    }

    /**
     *
     */
    [getNextMessage]() {
        this[loggerS].info('Waiting for new messages...');
        this[redisClientS].brpoplpush(this.keys.keyQueueName, this.keys.keyQueueNameProcessing, 0, (err, payload) => {
            if (err) this.emit('error', err);
            else {
                this[loggerS].info('Got new message...');
                if (this[statsS]) this[statsS].incrementProcessingSlot();
                const message = JSON.parse(payload);
                this.emit('message', message);
            }
        });
    }

    /**
     *
     * @param {object} message
     */
    [consumeMessage](message) {
        this.status = CONSUMER_STATUS_CONSUMING;
        let isTimeout = false;
        let timer = null;
        this[loggerS].info(`Processing message [${message.uuid}]...`);
        try {
            if (this.messageConsumeTimeout) {
                timer = setTimeout(() => {
                    isTimeout = true;
                    timer = null;
                    this.emit('consume_timeout', message);
                }, this.messageConsumeTimeout);
            }
            const onDeleted = (err) => {
                if (err) this.emit('error', err);
                else {
                    if (this[statsS]) this[statsS].incrementAcknowledgedSlot();
                    this[loggerS].info(`Message [${message.uuid}] successfully processed`);
                    this.emit('next');
                    if (this.isTest) this.emit('message_consumed', JSON.stringify(message));
                }
            };
            const onConsumed = (err) => {
                if (!isTimeout) {
                    if (timer) clearTimeout(timer);
                    if (err) throw err;
                    // when a consumer is stopped, redis client instance is destroyed
                    if (this[redisClientS]) {
                        this[redisClientS].del(this.keys.keyQueueNameProcessing, onDeleted);
                    } else if (this.isRunning()) {
                        throw new Error('Redis client instance has gone!');
                    }
                }
            };
            this.consume(message.data, onConsumed);
        } catch (error) {
            this[processMessageFailure](message, error);
        }
    }

    /**
     *
     */
    run() {
        if (this.status === CONSUMER_STATUS_DOWN) {
            this.status = CONSUMER_STATUS_GOING_UP;

            /**
             * Start heartbeat
             */
            this[heartBeatS].start();

            /**
             * Start garbage collector
             */
            this[garbageCollectorS].start();

            /**
             * Start stats
             */
            if (this[statsS]) this[statsS].start();

            /**
             * Wait for messages
             */
            this[redisClientS] = redisClient.getNewInstance(this.config);
            this.emit('next');
        }
    }

    /**
     *
     */
    stop() {
        if (this.isRunning()) this.emit('consumer_halt');
    }

    /**
     *
     * @returns {boolean}
     */
    isRunning() {
        return ([CONSUMER_STATUS_GOING_DOWN, CONSUMER_STATUS_DOWN].indexOf(this.status) === -1);
    }

    /**
     *
     * @param {*} message
     * @param {function} cb
     */
    consume(message, cb) {
        /* eslint class-methods-use-this: 0 */
        throw new Error('Consume method should be extended');
    }
}

module.exports = Consumer;

'use strict';

const EventEmitter = require('events').EventEmitter;
const uuid = require('uuid/v4');
const redisKeys = require('./redis-keys');
const redisClient = require('./redis-client');
const heartBeat = require('./heartbeat');
const statsFactory = require('./stats');
const garbageCollector = require('./gc');
const logger = require('./logger');
const queue = require('./queue');

const CONSUMER_STATUS_GOING_DOWN = 0;
const CONSUMER_STATUS_DOWN = 1;
const CONSUMER_STATUS_GOING_UP = 2;
const CONSUMER_STATUS_UP = 3;
const CONSUMER_STATUS_CONSUMING = 4;

const sRegisterEventHandlers = Symbol('registerEventHandlers');
const sRegisterConsumerQueues = Symbol('registerConsumerQueues');
const sGetEventsHandlers = Symbol('getEventsHandlers');
const sGetNextMessage = Symbol('getNextMessage');
const sConsumeMessage = Symbol('consumeMessage');
const sProcessMessageFailure = Symbol('processMessageFailure');
const sHeartBeat = Symbol('heartBeat');
const sGarbageCollector = Symbol('garbageCollector');
const sStats = Symbol('stats');
const sLogger = Symbol('logger');
const sRedisClient = Symbol('redisClient');

class Consumer extends EventEmitter {

    /**
     * See docs.
     *
     * @param {object} config
     * @param {object} options
     */
    constructor(config = {}, options = {}) {
        super();

        if (!this.constructor.hasOwnProperty('queueName')) throw new Error('Undefined queue name!');

        /**
         * Event handlers
         */
        this[sRegisterEventHandlers]();

        /**
         * Consumer parameters
         */
        this.consumerId = uuid();
        this.queueName = redisKeys.validateKeyPart(this.constructor.queueName);
        this.config = config;
        this.options = options;
        this.messageConsumeTimeout = options.hasOwnProperty('messageConsumeTimeout') ?
            Number(options.messageConsumeTimeout) : 0;
        this.messageTTL = options.hasOwnProperty('messageTTL') ? Number(options.messageTTL) : 0;
        this.keys = redisKeys.getKeys(this);
        this.isTest = process.env.NODE_ENV === 'test';
        this.status = CONSUMER_STATUS_DOWN;

        /**
         * Project namespace.
         * If not provided the default one is used.
         */
        if (config.hasOwnProperty('namespace')) redisKeys.setNamespace(config.namespace);

        /**
         * Logs
         */
        this[sLogger] = logger.getNewInstance(`${this.queueName}:${this.consumerId}`, config.log);

        /**
         * Heartbeat
         */
        this[sHeartBeat] = heartBeat(this);

        /**
         * GC
         */
        this[sGarbageCollector] = garbageCollector(this, this[sLogger]);

        /**
         * Stats
         */
        const monitorEnabled = !!(config.monitor && config.monitor.enabled);
        if (monitorEnabled) this[sStats] = statsFactory(this, config);
    }

    /**
     *
     * @returns {object}
     */
    [sGetEventsHandlers]() {
        const consumer = this;
        const handlers = {
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
                    consumer[sLogger].error(err);
                    process.exit(1);
                }
            },

            /**
             *
             */
            onHeartBeatHalt() {
                if (consumer[sStats]) consumer[sStats].stop();
                else handlers.halt();
            },

            /**
             *
             */
            onConsumerHalt() {
                consumer.status = CONSUMER_STATUS_GOING_DOWN;
                consumer[sRedisClient].end(true);
                delete consumer[sRedisClient];
                consumer[sGarbageCollector].stop();
            },

            /**
             *
             */
            onGCHalt() {
                consumer[sHeartBeat].stop();
            },

            /**
             *
             * @param message
             */
            onConsumeTimeout(message) {
                consumer[sProcessMessageFailure](
                    message, new Error(`Consumer timed out after [${consumer.messageConsumeTimeout}]`));
            },

            /**
             *
             * @param message
             */
            onMessageExpired(message) {
                consumer[sLogger].info(`Message [${message.uuid}] has expired`);
                consumer[sGarbageCollector].collectExpiredMessage(
                    message,
                    consumer.keys.keyQueueNameProcessing,
                    () => {
                        if (consumer[sStats]) consumer[sStats].incrementAcknowledgedSlot();
                        consumer[sLogger].info(`Message [${message.uuid}] successfully processed`);
                        consumer.emit('next');
                    });
            },

            /**
             *
             * @param message
             */
            onMessage(message) {
                if (consumer.status === CONSUMER_STATUS_UP) {
                    if (consumer[sGarbageCollector].checkMessageExpiration(message)) {
                        consumer.emit('message_expired', message);
                    } else consumer[sConsumeMessage](message);
                }
            },

            /**
             *
             */
            onNext() {
                if (consumer.isRunning()) {
                    consumer[sGetNextMessage]();
                }
            },

            /**
             *
             * @param message
             */
            onMessageConsumed(message) {
                handlers.onNext();
            },
        };
        return handlers;
    }

    /**
     *
     */
    [sRegisterEventHandlers]() {
        const handlers = this[sGetEventsHandlers]();

        /**
         * Events
         */
        this
        .on('next', handlers.onNext)
        .on('message', handlers.onMessage)
        .on('message_expired', handlers.onMessageExpired)
        .on('message_consumed', handlers.onMessageConsumed)
        .on('consume_timeout', handlers.onConsumeTimeout)
        .on('consumer_halt', handlers.onConsumerHalt)
        .on('gc_halt', handlers.onGCHalt)
        .on('heartbeat_halt', handlers.onHeartBeatHalt)
        .on('stats_halt', handlers.halt)
        .on('error', handlers.onError);
    }

    /**
     *
     * @param {function} cb
     */
    [sRegisterConsumerQueues](cb) {
        const messageQueue = () => {
            queue.addMessageQueue(this[sRedisClient], this.keys.keyQueueName, (err) => {
                if (err) cb(err);
                else processingQueue();
            });
        };

        const processingQueue = () => {
            queue.addProcessingQueue(this[sRedisClient], this.keys.keyQueueNameProcessing, (err) => {
                if (err) cb(err);
                else dlQueue();
            });
        };

        const dlQueue = () => {
            queue.addDLQueue(this[sRedisClient], this.keys.keyQueueNameDead, (err) => {
                if (err) cb(err);
                else cb();
            });
        };

        messageQueue();
    }

    /**
     *
     * @param {object} message
     * @param {object} error
     */
    [sProcessMessageFailure](message, error) {
        this[sLogger].error(`Consumer failed to consume message [${message.uuid}]...`);
        if (this[sStats]) this[sStats].incrementUnacknowledgedSlot();
        this[sGarbageCollector].collectMessage(message, this.keys.keyQueueNameProcessing, error, (err) => {
            if (err) this.emit('error', err);
            else this.emit('next');
        });
    }

    /**
     *
     */
    [sGetNextMessage]() {
        if (this.status !== CONSUMER_STATUS_UP) this.status = CONSUMER_STATUS_UP;
        this[sLogger].info('Waiting for new messages...');
        this[sRedisClient].brpoplpush(this.keys.keyQueueName, this.keys.keyQueueNameProcessing, 0, (err, payload) => {
            if (err) this.emit('error', err);
            else {
                this[sLogger].info('Got new message...');
                if (this[sStats]) this[sStats].incrementProcessingSlot();
                const message = JSON.parse(payload);
                this.emit('message', message);
            }
        });
    }

    /**
     *
     * @param {object} message
     */
    [sConsumeMessage](message) {
        this.status = CONSUMER_STATUS_CONSUMING;
        let isTimeout = false;
        let timer = null;
        this[sLogger].info(`Processing message [${message.uuid}]...`);
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
                    if (this[sStats]) this[sStats].incrementAcknowledgedSlot();
                    this[sLogger].info(`Message [${message.uuid}] successfully processed`);
                    this.emit('message_consumed', message);
                }
            };
            const onConsumed = (err) => {
                if (!isTimeout) {
                    if (timer) clearTimeout(timer);
                    if (err) this[sProcessMessageFailure](message, err);
                    else if (this.isRunning()) {
                        if (!this[sRedisClient]) {
                            // Something went wrong. Redis client has been destroyed.
                            this.emit('error', new Error('Redis client instance has gone!'));
                        } else this[sRedisClient].rpop(this.keys.keyQueueNameProcessing, onDeleted);
                    }
                }
            };
            this.consume(message.data, onConsumed);
        } catch (error) {
            this[sProcessMessageFailure](message, error);
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
            this[sHeartBeat].start();

            /**
             * Start garbage collector
             */
            this[sGarbageCollector].start();

            /**
             * Start stats
             */
            if (this[sStats]) this[sStats].start();

            /**
             * Get a new Redis instance
             */
            this[sRedisClient] = redisClient.getNewInstance(this.config);

            /**
             * Register consumer queues
             */
            this[sRegisterConsumerQueues]((err) => {
                if (err) this.emit('error', err);
                else {
                    /**
                     * Wait for messages
                     */
                    this.emit('next');
                }
            });
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

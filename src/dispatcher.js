'use strict';

const uuid = require('uuid/v4');
const redisKeys = require('./redis-keys');
const util = require('./util');
const schedulerFn = require('./scheduler');
const garbageCollectorFn = require('./gc');
const statsFn = require('./stats');
const redisClient = require('./redis-client');
const logger = require('./logger');
const heartBeat = require('./heartbeat');
const Message = require('./message');

const states = {
    UP: 0,
    DOWN: 1,
    GOING_UP: 2,
    GOING_DOWN: 3,
    CONSUMING_MESSAGE: 4,
};

const instanceTypes = {
    CONSUMER: 0,
    PRODUCER: 1,
};

const events = {
    MESSAGE_NEXT: 'message.next',
    MESSAGE_RECEIVED: 'message.new',
    MESSAGE_ACKNOWLEDGED: 'message.consumed',
    MESSAGE_CONSUME_TIMEOUT: 'message.consume_timeout',
    MESSAGE_EXPIRED: 'message.expired',
    MESSAGE_REQUEUED: 'message.requeued',
    MESSAGE_DELAYED: 'message.delayed',
    MESSAGE_DEAD_LETTER: 'message.moved_to_dlq',
    MESSAGE_DESTROYED: 'message.destroyed',
    HEARTBEAT_HALT: 'heartbeat.halt',
    GC_HALT: 'gc.halt',
    STATS_HALT: 'stats.halt',
    SCHEDULER_HALT: 'scheduler.halt',
    HALT: 'halt',
    ERROR: 'error',
    IDLE: 'idle',
};

module.exports = () => {
    let queueName = null;

    let redisClientInstance = null;

    let instance = null;

    let instanceType = null;

    let instanceId = null;

    let consumerOptions = null;

    let config = null;

    let keys = null;

    let gc = null;

    let stats = null;

    let consumerHeartBeat = null;

    let consumerMessageConsumeTimeout = 0;

    let consumerMessageTTL = 0;

    let messageRetryThreshold = 3;

    let messageRetryDelay = 0;

    let state = states.DOWN;

    let loggerInstance = null;

    let isTest = null;

    let shutdownFiredEvents = [];

    let scheduler = null;

    /**
     *
     * @param dispatcher
     */
    function setupCommon(dispatcher) {
        if (config.hasOwnProperty('namespace')) {
            redisKeys.setNamespace(config.namespace);
        }

        instanceId = uuid();
        instance.id = instanceId;

        isTest = (process.env.NODE_ENV === 'test');
        instance.isTest = isTest;

        redisKeys.validateKeyPart(queueName);
        keys = redisKeys.getKeys(dispatcher);

        setupLogger();
        setupMonitor(dispatcher);
        setupScheduler(dispatcher);
    }

    /**
     *
     * @param dispatcher
     */
    function setUpGarbageCollector(dispatcher) {
        gc = garbageCollectorFn(dispatcher);
    }

    /**
     *
     */
    function setupRedisClient() {
        redisClientInstance = redisClient.getNewInstance(config);
    }

    /**
     *
     * @param dispatcher
     */
    function setupMonitor(dispatcher) {
        const enabled = !!(config.monitor && config.monitor.enabled);
        if (enabled) stats = statsFn(dispatcher);
    }

    /**
     *
     */
    function setupLogger() {
        loggerInstance = logger.getNewInstance(`${queueName}:${instanceId}`, config.log);
    }

    /**
     *
     * @param dispatcher
     */
    function setupConsumerHeartBeat(dispatcher) {
        consumerHeartBeat = heartBeat(dispatcher);
    }

    /**
     *
     * @param dispatcher
     */
    function setupConsumerEvents(dispatcher) {
        instance
            .on(events.MESSAGE_NEXT, () => {
                if (dispatcher.isRunning()) dispatcher.getNextMessage();
            })

            .on(events.MESSAGE_RECEIVED, (message) => {
                if (state === states.UP) {
                    if (gc.hasExpired(message)) dispatcher.emit(events.MESSAGE_EXPIRED, message);
                    else dispatcher.consume(message);
                }
            })

            .on(events.MESSAGE_EXPIRED, (message) => {
                loggerInstance.info(`Message [${message.uuid}] has expired`);
                gc.collectExpiredMessage(
                    message,
                    keys.keyQueueNameProcessing,
                    () => {
                        if (stats) stats.incrementAcknowledgedSlot();
                        loggerInstance.info(`Message [${message.uuid}] successfully processed`);
                        dispatcher.emit(events.MESSAGE_NEXT);
                    });
            })

            .on(events.MESSAGE_ACKNOWLEDGED, () => {
                instance.emit(events.MESSAGE_NEXT);
            })

            .on(events.MESSAGE_CONSUME_TIMEOUT, (message) => {
                dispatcher.handleConsumeFailure(
                    message, new Error(`Consumer timed out after [${consumerMessageConsumeTimeout}]`));
            })

            /**
             * If an error occurred, the whole consumer should go down,
             * A consumer can not exit without heartbeat/gc and vice-versa
             */
            .on(events.ERROR, (err) => {
                if (err.name !== 'AbortError' && state !== states.GOING_DOWN) {
                    loggerInstance.error(err);
                    process.exit(1);
                }
            });
    }

    /**
     *
     * @param cb
     */
    function setupQueues(cb) {
        const { keyQueueName, keyQueueNameProcessing, keyQueueNameDead } = keys;
        const messageQueue = () => {
            util.rememberMessageQueue(redisClientInstance, keyQueueName, (err) => {
                if (err) cb(err);
                else processingQueue();
            });
        };
        const processingQueue = () => {
            util.rememberProcessingQueue(redisClientInstance, keyQueueNameProcessing, (err) => {
                if (err) cb(err);
                else dlQueue();
            });
        };
        const dlQueue = () => {
            util.rememberDLQueue(redisClientInstance, keyQueueNameDead, (err) => {
                if (err) cb(err);
                else cb();
            });
        };
        messageQueue();
    }

    /**
     *
     * @param dispatcher
     */
    function setupScheduler(dispatcher) {
        scheduler = schedulerFn(dispatcher);
    }

    /**
     *
     * @param dispatcher
     * @param event
     */
    function shutdownEventsHook(dispatcher, event) {
        shutdownFiredEvents.push(event);
        const down = () => {
            state = states.DOWN;
            shutdownFiredEvents = [];
            instance.emit(events.HALT);
        };
        if (dispatcher.isConsumer()) {
            if (shutdownFiredEvents.includes(events.GC_HALT) &&
                shutdownFiredEvents.includes(events.HEARTBEAT_HALT) &&
                shutdownFiredEvents.includes(events.SCHEDULER_HALT) &&
                (!stats || shutdownFiredEvents.includes(events.STATS_HALT))) {
                down();
            }
        } else if (shutdownFiredEvents.includes(events.SCHEDULER_HALT) &&
            (!stats && shutdownFiredEvents.includes(events.STATS_HALT))) {
            down();
        }
    }

    function handleError(err) {
        if ([states.GOING_DOWN, states.DOWN].indexOf(state) === -1) {
            instance.emit(events.ERROR, err);
        }
    }

    return {
        /**
         *
         * @param inst
         * @param cfg
         * @param qn
         */
        bootstrapProducer(inst, cfg, qn) {
            instance = inst;
            instanceType = instanceTypes.PRODUCER;

            queueName = qn;
            instance.queueName = queueName;

            config = cfg;
            instance.config = config;

            setupCommon(this);
        },

        /**
         *
         * @param inst
         * @param cfg
         * @param options
         */
        bootstrapConsumer(inst, cfg, options) {
            if (!inst.constructor.hasOwnProperty('queueName')) {
                throw new Error('Undefined queue name!');
            }

            instanceType = instanceTypes.CONSUMER;
            queueName = inst.constructor.queueName;
            instance = inst;

            config = cfg;
            instance.config = config;

            consumerOptions = options;
            instance.options = consumerOptions;

            if (options.hasOwnProperty('messageConsumeTimeout')) {
                consumerMessageConsumeTimeout = Number(options.messageConsumeTimeout);
                instance.messageConsumeTimeout = consumerMessageConsumeTimeout;
            }

            if (options.hasOwnProperty('messageTTL')) {
                consumerMessageTTL = Number(options.messageTTL);
                instance.messageTTL = consumerMessageTTL;
            }

            if (options.hasOwnProperty('messageRetryThreshold')) {
                messageRetryThreshold = Number(options.messageRetryThreshold);
                instance.messageRetryThreshold = messageRetryThreshold;
            }

            if (options.hasOwnProperty('messageRetryDelay')) {
                messageRetryDelay = Number(options.messageRetryDelay);
                instance.messageRetryDelay = messageRetryDelay;
            }

            setupCommon(this);
            setupConsumerEvents(this);
            setupConsumerHeartBeat(this);
            setUpGarbageCollector(this);
        },

        run() {
            if (state === states.DOWN) {
                state = states.GOING_UP;

                /**
                 * Get a new Redis instance
                 */
                setupRedisClient();

                /**
                 * Start message scheduler
                 */
                scheduler.start();

                /**
                 *
                 */
                if (stats) stats.start();

                /**
                 *
                 */
                if (this.isConsumer()) {
                    /**
                     * Register consumer queues
                     */
                    setupQueues((err) => {
                        if (err) this.error(err);
                        else {
                            /**
                             * Start heartbeat
                             */
                            consumerHeartBeat.start();

                            /**
                             * Start garbage collector
                             */
                            gc.start();

                            /**
                             * Wait for messages
                             */
                            instance.emit(events.MESSAGE_NEXT);

                            /**
                             *
                             */
                            state = states.UP;
                        }
                    });
                } else {
                    /**
                     *
                     */
                    state = states.UP;
                }
            }
        },

        shutdown() {
            if (this.isRunning()) {
                state = states.GOING_DOWN;
                redisClientInstance.end(true);
                redisClientInstance = null;

                instance.once(events.SCHEDULER_HALT, () => shutdownEventsHook(this, events.SCHEDULER_HALT));
                scheduler.stop();

                if (stats) {
                    instance.once(events.STATS_HALT, () => shutdownEventsHook(this, events.STATS_HALT));
                    stats.stop();
                }

                if (this.isConsumer()) {
                    instance.once(events.HEARTBEAT_HALT, () => shutdownEventsHook(this, events.HEARTBEAT_HALT));
                    consumerHeartBeat.stop();

                    instance.once(events.GC_HALT, () => shutdownEventsHook(this, events.GC_HALT));
                    gc.stop();
                }
            }
        },

        /**
         *
         * @param msg
         * @param cb
         */
        produce(msg, cb) {
            if (scheduler.isScheduled(msg)) scheduler.schedule(msg, null, cb);
            else this.enqueue(msg, null, cb);
        },

        /**
         *
         * @param msg
         * @param multi
         * @param cb
         */
        schedule(msg, multi, cb) {
            return scheduler.schedule(msg, multi, cb);
        },

        /**
         *
         * @param msg
         * @param multi
         * @param cb
         */
        enqueue(msg, multi, cb) {
            if (multi) {
                multi.lpush(keys.keyQueueName, msg.toString());
            } else {
                redisClientInstance.lpush(keys.keyQueueName, msg.toString(), (err) => {
                    if (err) cb(err);
                    else {
                        if (stats) stats.incrementInputSlot();
                        cb();
                    }
                });
            }
        },

        /**
         *
         * @param msg
         */
        consume(msg) {
            state = states.CONSUMING_MESSAGE;
            let isTimeout = false;
            let timer = null;
            const timeout = msg.getConsumeTimeout();
            const consumeTimeout = typeof timeout === 'number' ? timeout : consumerMessageConsumeTimeout;
            loggerInstance.info(`Processing message [${msg.getId()}]...`);
            try {
                if (consumeTimeout) {
                    timer = setTimeout(() => {
                        isTimeout = true;
                        timer = null;
                        instance.emit(events.MESSAGE_CONSUME_TIMEOUT, msg);
                    }, consumeTimeout);
                }
                const onDeleted = (err) => {
                    if (err) handleError(events.ERROR, err);
                    else {
                        if (stats) stats.incrementAcknowledgedSlot();
                        loggerInstance.info(
                            `Message [${msg.getId()}] successfully processed`);
                        instance.emit(events.MESSAGE_ACKNOWLEDGED, msg);
                    }
                };
                const onConsumed = (err) => {
                    if (this.isRunning() && !isTimeout) {
                        if (timer) clearTimeout(timer);
                        if (err) this.handleConsumeFailure(msg, err);
                        else redisClientInstance.rpop(keys.keyQueueNameProcessing, onDeleted);
                    }
                };
                instance.consume(msg.getBody(), onConsumed);
            } catch (error) {
                this.handleConsumeFailure(msg, error);
            }
        },

        /**
         *
         * @param msg
         * @param error
         */
        handleConsumeFailure(msg, error) {
            loggerInstance.error(`Consumer failed to consume message [${msg.uuid}]...`);
            loggerInstance.error(error);
            if (stats) stats.incrementUnacknowledgedSlot();
            gc.collectMessage(msg, keys.keyQueueNameProcessing, (err) => {
                if (err) handleError(err);
                else this.emit(events.MESSAGE_NEXT);
            });
        },

        getNextMessage() {
            state = states.UP;
            loggerInstance.info('Waiting for new messages...');
            redisClientInstance.brpoplpush(keys.keyQueueName, keys.keyQueueNameProcessing, 0, (err, json) => {
                if (err) handleError(err);
                else {
                    loggerInstance.info('Got new message...');
                    if (stats) stats.incrementProcessingSlot();
                    const message = new Message(json);
                    instance.emit(events.MESSAGE_RECEIVED, message);
                }
            });
        },

        getInstance() {
            return instance;
        },

        getInstanceId() {
            return instanceId;
        },

        getConsumerOptions() {
            return consumerOptions;
        },

        getConsumerMessageConsumeTimeout() {
            return consumerMessageConsumeTimeout;
        },

        getConsumerMessageTTL() {
            return consumerMessageTTL;
        },

        getMessageRetryThreshold() {
            return messageRetryThreshold;
        },

        getMessageRetryDelay() {
            return messageRetryDelay;
        },

        getQueueName() {
            return queueName;
        },

        getLogger() {
            return loggerInstance;
        },

        getEvents() {
            return events;
        },

        getConfig() {
            return config;
        },

        getKeys() {
            return keys;
        },

        isProducer() {
            return (instanceType === instanceTypes.PRODUCER);
        },

        isConsumer() {
            return (instanceType === instanceTypes.CONSUMER);
        },

        /**
         *
         * @param message
         * @return {boolean}
         */
        isPeriodic(message) {
            return scheduler.isPeriodic(message);
        },

        isRunning() {
            return ([states.GOING_DOWN, states.DOWN].indexOf(state) === -1);
        },

        isTest() {
            return isTest;
        },

        /**
         *
         * @param err
         */
        error(err) {
            handleError(err);
        },

        emit(...args) {
            instance.emit(...args);
        },
    };
};


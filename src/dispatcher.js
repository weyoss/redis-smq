'use strict';

const uuid = require('uuid/v4');
const redisKeys = require('./redis-keys');
const util = require('./util');
const scheduler = require('./scheduler');
const garbageCollector = require('./gc');
const stats = require('./stats');
const redisClient = require('./redis-client');
const logger = require('./logger');
const heartBeat = require('./heartbeat');
const Message = require('./message');

const instanceTypes = {
    CONSUMER: 0,
    PRODUCER: 1,
};

const states = {
    DOWN: 0,
    UP: 1,
};

const events = {
    GOING_UP: 'going_up',
    UP: 'up',
    GOING_DOWN: 'going_down',
    DOWN: 'down',
    ERROR: 'error',
    IDLE: 'idle',
    HEARTBEAT_UP: 'heartbeat.up',
    HEARTBEAT_DOWN: 'heartbeat.down',
    GC_UP: 'gc.up',
    GC_DOWN: 'gc.down',
    SCHEDULER_UP: 'scheduler.up',
    SCHEDULER_DOWN: 'scheduler.down',
    STATS_UP: 'stats.up',
    STATS_DOWN: 'stats.down',
    MESSAGE_PRODUCED: 'message.produced',
    MESSAGE_NEXT: 'message.next',
    MESSAGE_RECEIVED: 'message.new',
    MESSAGE_ACKNOWLEDGED: 'message.consumed',
    MESSAGE_CONSUME_TIMEOUT: 'message.consume_timeout',
    MESSAGE_EXPIRED: 'message.expired',
    MESSAGE_REQUEUED: 'message.requeued',
    MESSAGE_DELAYED: 'message.delayed',
    MESSAGE_DEAD_LETTER: 'message.moved_to_dlq',
    MESSAGE_DESTROYED: 'message.destroyed',
};

module.exports = function dispatcher() {
    let queueName = null;

    let redisClientInstance = null;

    let instance = null;

    let instanceType = null;

    let instanceId = null;

    let consumerOptions = null;

    let config = null;

    let keys = null;

    let garbageCollectorInstance = null;

    let statsInstance = null;
    
    let heartBeatInstance = null;

    let consumerMessageConsumeTimeout = 0;

    let consumerMessageTTL = 0;

    let messageRetryThreshold = 3;

    let messageRetryDelay = 0;

    let state = states.DOWN;

    let loggerInstance = null;

    let startupFiredEvents = [];

    let shutdownFiredEvents = [];

    let schedulerInstance = null;

    let pending = false;

    let bootstrapping = false;

    /**
     *
     * @param dispatcherInstance
     */
    function bootstrap(dispatcherInstance) {
        if (config.hasOwnProperty('namespace')) {
            redisKeys.setNamespace(config.namespace);
        }

        instanceId = uuid();
        instance.id = instanceId;
        bootstrapping = true;

        redisKeys.validateKeyPart(queueName);
        keys = redisKeys.getKeys(dispatcherInstance);

        setupLogger();
        registerRuntimeEvents(dispatcherInstance);
    }

    /**
     *
     */
    function setupLogger() {
        loggerInstance = logger.getNewInstance(`${queueName}:${instanceId}`, config.log);
    }

    /**
     *
     */
    function setupRedisClient(cb) {
        redisClient.getNewInstance(config, (c) => {
            redisClientInstance = c;
            instance.on(events.GOING_DOWN, () => {
                redisClientInstance.end(true);
                redisClientInstance = null;
            });
            cb();
        });
    }

    /**
     *
     * @param dispatcherInstance
     */
    function setupGarbageCollector(dispatcherInstance) {
        garbageCollectorInstance = garbageCollector(dispatcherInstance);
        garbageCollectorInstance.init();
    }

    /**
     *
     * @param dispatcherInstance
     */
    function setupStats(dispatcherInstance) {
        if (config.monitor && config.monitor.enabled) {
            statsInstance = stats(dispatcherInstance);
            statsInstance.init();
        }
    }

    /**
     *
     * @param dispatcherInstance
     */
    function setupConsumerHeartBeat(dispatcherInstance) {
        heartBeatInstance = heartBeat(dispatcherInstance);
        heartBeatInstance.init();
    }


    /**
     *
     * @param dispatcherInstance
     */
    function setupScheduler(dispatcherInstance) {
        schedulerInstance = scheduler(dispatcherInstance);
        schedulerInstance.init();
    }

    /**
     *
     * @param dispatcherInstance
     */
    function registerRuntimeEvents(dispatcherInstance) {
        instance.on(events.GC_UP, () => startupEventsHook(dispatcherInstance, events.GC_UP));
        instance.on(events.HEARTBEAT_UP, () => startupEventsHook(dispatcherInstance, events.HEARTBEAT_UP));
        instance.on(events.STATS_UP, () => startupEventsHook(dispatcherInstance, events.STATS_UP));
        instance.on(events.SCHEDULER_UP, () => startupEventsHook(dispatcherInstance, events.SCHEDULER_UP));
        instance.on(events.SCHEDULER_DOWN, () => shutdownEventsHook(dispatcherInstance, events.SCHEDULER_DOWN));
        instance.on(events.STATS_DOWN, () => shutdownEventsHook(dispatcherInstance, events.STATS_DOWN));
        instance.on(events.HEARTBEAT_DOWN, () => shutdownEventsHook(dispatcherInstance, events.HEARTBEAT_DOWN));
        instance.on(events.GC_DOWN, () => shutdownEventsHook(dispatcherInstance, events.GC_DOWN));
        instance.on(events.ERROR, (err) => {
            handleError(dispatcherInstance, err);
        });
        if (dispatcherInstance.isConsumer()) {
            instance.on(events.MESSAGE_NEXT, () => {
                if (isUp()) {
                    dispatcherInstance.getNextMessage();
                }
            });
            instance.on(events.MESSAGE_RECEIVED, (message) => {
                if (isUp()) {
                    if (garbageCollectorInstance.hasExpired(message)) {
                        dispatcherInstance.emit(events.MESSAGE_EXPIRED, message);
                    } else dispatcherInstance.consume(message);
                }
            });
            instance.on(events.MESSAGE_EXPIRED, (message) => {
                loggerInstance.info(`Message [${message.uuid}] has expired`);
                garbageCollectorInstance.collectExpiredMessage(
                    message,
                    keys.keyQueueNameProcessing,
                    () => {
                        if (statsInstance) statsInstance.incrementAcknowledgedSlot();
                        loggerInstance.info(`Message [${message.uuid}] successfully processed`);
                        dispatcherInstance.emit(events.MESSAGE_NEXT);
                    },
                );
            });
            instance.on(events.MESSAGE_ACKNOWLEDGED, () => {
                instance.emit(events.MESSAGE_NEXT);
            });
            instance.on(events.MESSAGE_CONSUME_TIMEOUT, (message) => {
                dispatcherInstance.handleConsumeFailure(
                    message,
                    new Error(`Consumer timed out after [${consumerMessageConsumeTimeout}]`),
                );
            });
        }
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
            if (keyQueueNameProcessing) {
                util.rememberProcessingQueue(redisClientInstance, keyQueueNameProcessing, (err) => {
                    if (err) cb(err);
                    else dlQueue();
                });
            } else dlQueue();
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
     * @param dispatcherInstance
     * @param event
     */
    function shutdownEventsHook(dispatcherInstance, event) {
        shutdownFiredEvents.push(event);
        const down = () => {
            shutdownFiredEvents = [];
            garbageCollectorInstance = null;
            heartBeatInstance = null;
            statsInstance = null;
            schedulerInstance = null;
            setState(states.DOWN);
        };
        if (dispatcherInstance.isConsumer()) {
            if (shutdownFiredEvents.includes(events.GC_DOWN)
                && shutdownFiredEvents.includes(events.HEARTBEAT_DOWN)
                && shutdownFiredEvents.includes(events.SCHEDULER_DOWN)
                && (!statsInstance || shutdownFiredEvents.includes(events.STATS_DOWN))) {
                down();
            }
        } else if (shutdownFiredEvents.includes(events.SCHEDULER_DOWN)
            && (!statsInstance || shutdownFiredEvents.includes(events.STATS_DOWN))) {
            down();
        }
    }

    /**
     *
     * @param dispatcherInstance
     * @param event
     */
    function startupEventsHook(dispatcherInstance, event) {
        startupFiredEvents.push(event);
        const up = () => {
            startupFiredEvents = [];
            setState(states.UP);
            if (dispatcherInstance.isConsumer()) instance.emit(events.MESSAGE_NEXT);
        };
        if (dispatcherInstance.isConsumer()) {
            if (startupFiredEvents.includes(events.GC_UP)
                && startupFiredEvents.includes(events.HEARTBEAT_UP)
                && startupFiredEvents.includes(events.SCHEDULER_UP)
                && (!statsInstance || startupFiredEvents.includes(events.STATS_UP))) {
                up();
            }
        } else if (startupFiredEvents.includes(events.SCHEDULER_UP)
            && (!statsInstance || startupFiredEvents.includes(events.STATS_UP))) {
            up();
        }
    }

    /**
     *
     * @param dispatcherInstance
     * @param err
     */
    function handleError(dispatcherInstance, err) {
        if (isUp() && !isGoingDown()) {
            dispatcherInstance.shutdown();
            throw err;
        }
    }

    /**
     *
     * @param s
     */
    function switchState(s) {
        if (!Object.values(states).includes(s)) {
            throw new Error('Can not switch to invalid state');
        }
        if (pending) {
            throw new Error('Can not switch state while another state transition is in progress');
        }
        pending = true;
        if (s === states.UP) {
            if (bootstrapping) bootstrapping = false;
            instance.emit(events.GOING_UP);
        } else instance.emit(events.GOING_DOWN);
    }

    /**
     *
     * @param s
     */
    function setState(s) {
        pending = false;
        state = s;
        if (state === states.UP) {
            instance.emit(events.UP);
        } else instance.emit(events.DOWN);
    }

    /**
     *
     * @returns {boolean}
     */
    function isUp() {
        return (state === states.UP);
    }

    /**
     *
     * @returns {boolean}
     */
    function isDown() {
        return (state === states.DOWN);
    }

    /**
     *
     * @returns {boolean}
     */
    function isGoingUp() {
        return isDown() && pending;
    }

    /**
     *
     * @returns {boolean}
     */
    function isGoingDown() {
        return isUp() && pending;
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

            bootstrap(this);
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

            bootstrap(this);
        },

        /**
         *
         */
        run() {
            if (isDown()) {
                setupStats(this);
                setupScheduler(this);
                setupRedisClient(() => {
                    setupQueues((err) => {
                        if (err) this.error(err);
                        else {
                            if (this.isConsumer()) {
                                setupConsumerHeartBeat(this);
                                setupGarbageCollector(this);
                            }
                            switchState(states.UP);
                        }
                    });
                });
            }
        },

        /**
         *
         */
        shutdown() {
            if (isUp() && !isGoingDown()) {
                switchState(states.DOWN);
            }
        },

        /**
         *
         * @param msg
         * @param cb
         */
        produce(msg, cb) {
            if (!(msg instanceof Message)) {
                const m = new Message();
                m.setBody(msg);
                msg = m;
            }
            const onProduced = () => {
                instance.emit(events.MESSAGE_PRODUCED, msg);
                cb();
            };
            const proceed = () => {
                if (schedulerInstance.isScheduled(msg)) schedulerInstance.schedule(msg, null, onProduced);
                else this.enqueue(msg, null, onProduced);
            };
            if (!isUp()) {
                if (bootstrapping || isGoingUp()) instance.once(events.UP, proceed);
                else handleError(this, new Error(`Producer ID ${this.getInstanceId()} is not running`));
            } else proceed();
        },

        /**
         *
         * @param msg
         * @param multi
         * @param cb
         */
        schedule(msg, multi, cb) {
            return schedulerInstance.schedule(msg, multi, cb);
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
                        if (statsInstance) statsInstance.incrementInputSlot();
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
                    if (err) handleError(this, err);
                    else {
                        if (statsInstance) statsInstance.incrementAcknowledgedSlot();
                        loggerInstance.info(`Message [${msg.getId()}] successfully processed`);
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
            if (statsInstance) statsInstance.incrementUnacknowledgedSlot();
            garbageCollectorInstance.collectMessage(msg, keys.keyQueueNameProcessing, (err) => {
                if (err) handleError(this, err);
                else this.emit(events.MESSAGE_NEXT);
            });
        },

        getNextMessage() {
            loggerInstance.info('Waiting for new messages...');
            redisClientInstance.brpoplpush(keys.keyQueueName, keys.keyQueueNameProcessing, 0, (err, json) => {
                if (err) handleError(this, err);
                else {
                    loggerInstance.info('Got new message...');
                    if (statsInstance) statsInstance.incrementProcessingSlot();
                    const message = Message.createFromMessage(json);
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
            return schedulerInstance.isPeriodic(message);
        },

        isRunning() {
            return (isUp() && !isGoingDown());
        },

        isBootstrapping() {
            return (bootstrapping === true);
        },

        /**
         *
         * @param err
         */
        error(err) {
            handleError(this, err);
        },

        emit(...args) {
            instance.emit(...args);
        },
    };
};

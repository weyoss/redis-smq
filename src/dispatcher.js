'use strict';

const { fork } = require('child_process');
const path = require('path');
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

const states = {
    UP: 0,
    DOWN: 1,
    GOING_UP: 2,
    GOING_DOWN: 3,
    BOOTSTRAPPING: 4,
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
    HEARTBEAT_STARTED: 'heartbeat.started',
    HEARTBEAT_HALT: 'heartbeat.halt',
    GC_STARTED: 'gc.started',
    GC_HALT: 'gc.halt',
    STATS_STARTED: 'stats.started',
    STATS_HALT: 'stats.halt',
    SCHEDULER_STARTED: 'scheduler.started',
    SCHEDULER_HALT: 'scheduler.halt',
    HALT: 'halt',
    ERROR: 'error',
    IDLE: 'idle',
    UP: 'up',
    BOOTSTRAPPING: 'bootstrapping',
    GOING_UP: 'going_up',
    GOING_DOWN: 'going_down',
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

    let statsAggregatorThread = null;

    let heartBeatInstance = null;

    let consumerMessageConsumeTimeout = 0;

    let consumerMessageTTL = 0;

    let messageRetryThreshold = 3;

    let messageRetryDelay = 0;

    let state = states.DOWN;

    let loggerInstance = null;

    let isTest = null;

    let startupFiredEvents = [];

    let shutdownFiredEvents = [];

    let schedulerInstance = null;

    /**
     *
     * @param dispatcherInstance
     */
    function setupCommon(dispatcherInstance) {
        if (config.hasOwnProperty('namespace')) {
            redisKeys.setNamespace(config.namespace);
        }

        instanceId = uuid();
        instance.id = instanceId;

        isTest = (process.env.NODE_ENV === 'test');
        instance.isTest = isTest;

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
        instance.on(events.GOING_UP, () => {
            garbageCollectorInstance.start();
        });
        instance.on(events.GOING_DOWN, () => {
            garbageCollectorInstance.stop();
        });
    }

    /**
     *
     * @param dispatcherInstance
     */
    function setupStats(dispatcherInstance) {
        const enabled = !!(config.monitor && config.monitor.enabled);
        if (enabled) {
            statsInstance = stats(dispatcherInstance);
            instance.on(events.GOING_UP, () => {
                statsInstance.start();
            });
            instance.on(events.GOING_DOWN, () => {
                statsInstance.stop();
            });
            if (dispatcherInstance.isConsumer()) {
                statsAggregatorThread = fork(path.resolve(path.resolve(`${__dirname}/stats-aggregator.js`)));
                statsAggregatorThread.on('error', (err) => {
                    handleError(err);
                });
                statsAggregatorThread.on('exit', (code, signal) => {
                    const err = new Error(`statsAggregatorThread exited with code ${code} and signal ${signal}`);
                    handleError(err);
                });
                instance.on(events.GOING_UP, () => {
                    statsAggregatorThread.send(JSON.stringify(config));
                });
                instance.on(events.GOING_DOWN, () => {
                    statsAggregatorThread.kill('SIGHUP');
                    statsAggregatorThread = null;
                });
            }
        }
    }

    /**
     *
     * @param dispatcherInstance
     */
    function setupConsumerHeartBeat(dispatcherInstance) {
        heartBeatInstance = heartBeat(dispatcherInstance);
        heartBeatInstance.start();
        instance.on(events.GOING_UP, () => {
            heartBeatInstance.start();
        });
        instance.on(events.GOING_DOWN, () => {
            heartBeatInstance.stop();
        });
    }

    /**
     *
     * @param dispatcherInstance
     */
    function registerRuntimeEvents(dispatcherInstance) {
        instance.on(events.GC_STARTED, () => startupEventsHook(dispatcherInstance, events.GC_STARTED));
        instance.on(events.HEARTBEAT_STARTED, () => startupEventsHook(dispatcherInstance, events.HEARTBEAT_STARTED));
        instance.on(events.STATS_STARTED, () => startupEventsHook(dispatcherInstance, events.STATS_STARTED));
        instance.on(events.SCHEDULER_STARTED, () => startupEventsHook(dispatcherInstance, events.SCHEDULER_STARTED));
        instance.on(events.SCHEDULER_HALT, () => shutdownEventsHook(dispatcherInstance, events.SCHEDULER_HALT));
        instance.on(events.STATS_HALT, () => shutdownEventsHook(dispatcherInstance, events.STATS_HALT));
        instance.on(events.HEARTBEAT_HALT, () => shutdownEventsHook(dispatcherInstance, events.HEARTBEAT_HALT));
        instance.on(events.GC_HALT, () => shutdownEventsHook(dispatcherInstance, events.GC_HALT));
        instance.on(events.ERROR, (err) => {
            if (err.name !== 'AbortError' && state !== states.GOING_DOWN) {
                loggerInstance.error(err);
                dispatcherInstance.shutdown();
            }
        });
        if (dispatcherInstance.isConsumer()) {
            instance.on(events.MESSAGE_NEXT, () => {
                if (state === states.UP) {
                    dispatcherInstance.getNextMessage();
                }
            });
            instance.on(events.MESSAGE_RECEIVED, (message) => {
                if (state === states.UP) {
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
     */
    function setupScheduler(dispatcherInstance) {
        schedulerInstance = scheduler(dispatcherInstance);
        instance.on(events.GOING_UP, () => {
            schedulerInstance.start();
        });
        instance.on(events.GOING_DOWN, () => {
            schedulerInstance.stop();
        });
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
            state = states.DOWN;
            instance.emit(events.HALT);
        };
        if (dispatcherInstance.isConsumer()) {
            if (shutdownFiredEvents.includes(events.GC_HALT)
                && shutdownFiredEvents.includes(events.HEARTBEAT_HALT)
                && shutdownFiredEvents.includes(events.SCHEDULER_HALT)
                && (!statsInstance || shutdownFiredEvents.includes(events.STATS_HALT))) {
                down();
            }
        } else if (shutdownFiredEvents.includes(events.SCHEDULER_HALT)
            && (!statsInstance || shutdownFiredEvents.includes(events.STATS_HALT))) {
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
            state = states.UP;
            instance.emit(events.UP);
            if (dispatcherInstance.isConsumer()) instance.emit(events.MESSAGE_NEXT);
        };
        if (dispatcherInstance.isConsumer()) {
            if (startupFiredEvents.includes(events.GC_STARTED)
                && startupFiredEvents.includes(events.HEARTBEAT_STARTED)
                && startupFiredEvents.includes(events.SCHEDULER_STARTED)
                && (!statsInstance || startupFiredEvents.includes(events.STATS_STARTED))) {
                up();
            }
        } else if (startupFiredEvents.includes(events.SCHEDULER_STARTED)
            && (!statsInstance || startupFiredEvents.includes(events.STATS_STARTED))) {
            up();
        }
    }

    /**
     *
     * @param err
     */
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
        },

        /**
         *
         */
        run() {
            if (state === states.DOWN) {
                state = states.BOOTSTRAPPING;
                instance.emit(events.BOOTSTRAPPING);
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
                            state = states.GOING_UP;
                            instance.emit(events.GOING_UP);
                        }
                    });
                });
            }
        },

        /**
         *
         */
        shutdown() {
            if (this.isRunning()) {
                state = states.GOING_DOWN;
                instance.emit(events.GOING_DOWN);
            }
        },

        /**
         *
         * @param msg
         * @param cb
         */
        produce(msg, cb) {
            const proceed = () => {
                if (schedulerInstance.isScheduled(msg)) schedulerInstance.schedule(msg, null, cb);
                else this.enqueue(msg, null, cb);
            };
            if (state !== states.UP) {
                if ([states.BOOTSTRAPPING, states.GOING_UP].indexOf(state) === -1) {
                    instance.emit(
                        events.ERROR,
                        new Error(`Producer ID ${this.getInstanceId()} is not running`),
                    );
                } else instance.once(events.UP, proceed);
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
                    if (err) handleError(events.ERROR, err);
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
                if (err) handleError(err);
                else this.emit(events.MESSAGE_NEXT);
            });
        },

        getNextMessage() {
            loggerInstance.info('Waiting for new messages...');
            redisClientInstance.brpoplpush(keys.keyQueueName, keys.keyQueueNameProcessing, 0, (err, json) => {
                if (err) handleError(err);
                else {
                    loggerInstance.info('Got new message...');
                    if (statsInstance) statsInstance.incrementProcessingSlot();
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
            return schedulerInstance.isPeriodic(message);
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

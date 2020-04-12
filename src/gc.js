'use strict';

const redisKeys = require('./redis-keys');
const redisClient = require('./redis-client');
const lockManager = require('./lock-manager');
const heartBeat = require('./heartbeat');
const Message = require('./message');
const util = require('./util');

const GC_INSPECTION_INTERVAL = 1000; // in ms

/**
 *
 * @param dispatcher
 */
function garbageCollector(dispatcher) {
    const instanceId = dispatcher.getInstanceId();
    const events = dispatcher.getEvents();
    const keys = dispatcher.getKeys();
    const {
        keyQueueName,
        keyQueueNameProcessingCommon,
        keyQueueNameDead,
        keyGCLock,
    } = keys;
    const logger = dispatcher.getLogger();
    const states = {
        UP: 1,
        DOWN: 0,
    };

    /**
     * @type {null|function}
     */
    let shutdownNow = null;

    /**
     *
     * @type {null|object}
     */
    let lockManagerInstance = null;

    /**
     *
     * @type {null|object}
     */
    let redisClientInstance = null;

    /**
     *
     */
    let state = states.DOWN;

    /**
     *
     * @type {number}
     */
    let timer = 0;

    /**
     * 
     * @param {string} message
     */
    function debug(message) {
        logger.debug({ gc: true }, message);
    }

    /**
     *
     * @param {Array} queues
     * @param {function} done
     */
    function collectProcessingQueuesMessages(queues, done) {
        if (queues.length) {
            let deadConsumer = false;
            const processingQueueName = queues.pop();
            debug(`Inspecting processing queue [${processingQueueName}]... `);
            const segments = redisKeys.getKeySegments(processingQueueName);
            if (segments.consumerId !== instanceId) {
                const purgeProcessingQueue = (name) => {
                    util.purgeProcessingQueue(redisClientInstance, name, (err) => {
                        if (err) dispatcher.error(err);
                    });
                };
                const collectMessageCallback = (err) => {
                    if (err) dispatcher.error(err);
                    else {
                        if (deadConsumer) purgeProcessingQueue(processingQueueName);
                        collectProcessingQueuesMessages(queues, done);
                    }
                };
                const lrangeCallback = (err, range) => {
                    if (err) dispatcher.error(err);
                    else if (range.length) {
                        const message = Message.createFromMessage(range[0]);
                        const uuid = message.getId();
                        debug(`Collecting message [${uuid}]...`);
                        if (hasExpired(message)) {
                            collectExpiredMessage(message, processingQueueName, collectMessageCallback);
                        } else {
                            collectMessage(message, processingQueueName, collectMessageCallback);
                        }
                    } else collectMessageCallback();
                };
                const isOnlineCallback = (err, online) => {
                    if (err) dispatcher.err(err);
                    else if (online) {
                        debug(`Consumer ID [${segments.consumerId}] is alive!`);
                        collectProcessingQueuesMessages(queues, done);
                    } else {
                        deadConsumer = true;
                        debug(`Consumer ID [${segments.consumerId}] seems to be dead. Fetching queue message...`);
                        redisClientInstance.lrange(processingQueueName, 0, 0, lrangeCallback);
                    }
                };
                debug(`Is consumer ID [${segments.consumerId}] alive?`);
                heartBeat.isOnline({
                    client: redisClientInstance,
                    queueName: segments.queueName,
                    id: segments.consumerId,
                }, isOnlineCallback);
            } else {
                debug('Skipping self consumer instance ID...');
                collectProcessingQueuesMessages(queues, done);
            }
        } else done();
    }

    /**
     *
     */
    function runInspectionTimer() {
        debug(`Waiting for ${GC_INSPECTION_INTERVAL} before a new iteration...`);
        timer = setTimeout(() => {
            debug('Time is up...');
            if (shutdownNow) shutdownNow();
            else inspectProcessingQueues();
        }, GC_INSPECTION_INTERVAL);
    }

    /**
     *
     */
    function inspectProcessingQueues() {
        if (state === states.UP) {
            lockManagerInstance.acquireLock(keyGCLock, 10000, (err) => {
                if (err) dispatcher.error(err);

                // after a lock has been acquired, the gc could be shutdown
                else if (state === states.UP) {
                    debug('Inspecting processing queues...');
                    util.getProcessingQueuesOf(redisClientInstance, keyQueueNameProcessingCommon, (e, result) => {
                        if (e) dispatcher.error(e);
                        else if (result && result.length) {
                            debug(`Found [${result.length}] processing queues`);
                            collectProcessingQueuesMessages(result, runInspectionTimer);
                        } else {
                            debug('No processing queues found');
                            runInspectionTimer();
                        }
                    });
                }
            });
        }
    }

    /**
     * Move message to dead-letter queue when max attempts threshold is reached
     * otherwise requeue it again
     *
     * @param {object} message
     * @param {string} processingQueue
     * @param {function} cb
     */
    function collectMessage(message, processingQueue, cb) {
        const threshold = message.getRetryThreshold();
        const messageRetryThreshold = typeof threshold === 'number' ? threshold : dispatcher.getMessageRetryThreshold();

        const delay = message.getRetryDelay();
        const messageRetryDelay = typeof delay === 'number' ? delay : dispatcher.getMessageRetryDelay();

        let destQueueName = null;
        let delayed = false;
        let requeued = false;

        const multi = redisClientInstance.multi();

        /**
         * Only exceptions from non periodic messages are handled.
         * Periodic messages are ignored once they are delivered to a consumer.
         */
        if (!dispatcher.isPeriodic(message)) {
            const uuid = message.getId();

            /**
             * Attempts
             */
            const attempts = increaseAttempts(message);

            /**
             *
             */
            if (attempts < messageRetryThreshold) {
                debug(`Trying to consume message ID [${uuid}] again (attempts: [${attempts}]) ...`);
                if (messageRetryDelay) {
                    debug(`Scheduling message ID [${uuid}]  (delay: [${messageRetryDelay}])...`);
                    message.setScheduledDelay(messageRetryDelay);
                    dispatcher.schedule(message, multi);
                    delayed = true;
                } else {
                    debug(`Message ID [${uuid}] is going to be enqueued immediately...`);
                    destQueueName = keyQueueName;
                    requeued = true;
                }
            } else {
                debug(`Message ID [${uuid}] has exceeded max retry threshold...`);
                destQueueName = keyQueueNameDead;
            }

            /**
             *
             */
            if (destQueueName) {
                debug(`Moving message [${uuid}] to queue [${destQueueName}]...`);
                multi.lpush(destQueueName, message.toString());
            }
            multi.rpop(processingQueue);
            multi.exec((err) => {
                if (err) cb(err);
                else {
                    if (requeued) dispatcher.emit(events.MESSAGE_REQUEUED, message);
                    else if (delayed) dispatcher.emit(events.MESSAGE_DELAYED, message);
                    else dispatcher.emit(events.MESSAGE_DEAD_LETTER, message);
                    cb();
                }
            });
        } else {
            redisClientInstance.rpop(processingQueue, cb);
        }
    }

    /**
     *
     * @param {object} message
     * @param {string} processingQueue
     * @param {function} cb
     */
    function collectExpiredMessage(message, processingQueue, cb) {
        const id = message.getId();
        debug(`Processing expired message [${id}]...`);
        // Just pop it out
        redisClientInstance.rpop(processingQueue, (err) => {
            if (err) dispatcher.error(err);
            else {
                cb();
                dispatcher.emit(events.MESSAGE_DESTROYED, message);
            }
        });
    }

    /**
     *
     * @param {object} message
     * @returns {boolean}
     */
    function hasExpired(message) {
        const ttl = message.getTTL();
        const messageTTL = typeof ttl === 'number' ? ttl : dispatcher.getConsumerMessageTTL();
        if (messageTTL) {
            const curTime = new Date().getTime();
            const createdAt = message.getCreatedAt();
            return (((createdAt + messageTTL) - curTime) <= 0);
        }
        return false;
    }


    /**
     *
     * @param message
     * @return {number}
     */
    function increaseAttempts(message) {
        message[Message.PROPERTY_ATTEMPTS] += 1;
        return message[Message.PROPERTY_ATTEMPTS];
    }

    return {
        init() {
            const instance = dispatcher.getInstance();
            instance.on(events.GOING_UP, () => {
                this.start();
            });
            instance.on(events.GOING_DOWN, () => {
                this.stop();
            });
        },

        start() {
            if (state === states.DOWN) {
                const config = dispatcher.getConfig();
                lockManager.getInstance(config, (l) => {
                    lockManagerInstance = l;
                    redisClient.getNewInstance(config, (c) => {
                        redisClientInstance = c;
                        state = states.UP;
                        dispatcher.emit(events.GC_UP);
                        inspectProcessingQueues();
                    });
                });
            }
        },

        stop() {
            if (state === states.UP && !shutdownNow) {
                shutdownNow = () => {
                    if (timer) clearTimeout(timer);
                    lockManagerInstance.quit(() => {
                        lockManagerInstance = null;
                        redisClientInstance.end(true);
                        redisClientInstance = null;
                        shutdownNow = null;
                        state = states.DOWN;
                        dispatcher.emit(events.GC_DOWN);
                    });
                };
                if (!lockManagerInstance.isLocked()) {
                    shutdownNow();
                }
            }
        },

        collectMessage,

        collectExpiredMessage,

        hasExpired,
    };
}

module.exports = garbageCollector;

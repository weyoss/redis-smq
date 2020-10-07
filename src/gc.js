'use strict';

const redisKeys = require('./redis-keys');
const redisClient = require('./redis-client');
const LockManager = require('./lock-manager');
const HeartBeat = require('./heartbeat');
const Message = require('./message');
const util = require('./util');
const events = require('./events');

const GC_INSPECTION_INTERVAL = 1000; // in ms

/**
 * @param {Instance} instance
 * @return {object}
 */
function GarbageCollector(instance) {
    const instanceId = instance.getId();
    const keys = instance.getInstanceRedisKeys();
    const { keyQueueName, keyQueueNameProcessingCommon, keyQueueNameDead, keyGCLock } = keys;
    const logger = instance.getLogger();
    const states = {
        UP: 1,
        DOWN: 0
    };

    /**
     * @type {function|null}
     */
    let shutdownNow = null;

    /**
     *
     * @type {Object|null}
     */
    let lockManagerInstance = null;

    /**
     *
     * @type {Object|null}
     */
    let redisClientInstance = null;

    /**
     *@type {number}
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
     * @param {string[]} queues
     * @param {function} done
     */
    function collectProcessingQueuesMessages(queues, done) {
        const next = () => {
            if (queues.length) {
                const processingQueueName = queues.pop();
                consumerStatus(processingQueueName);
            } else done();
        };
        const consumerStatus = (processingQueueName) => {
            debug(`Inspecting processing queue [${processingQueueName}]... `);
            const { queueName, consumerId } = redisKeys.getKeySegments(processingQueueName);
            if (consumerId !== instanceId) {
                debug(`Is consumer ID [${consumerId}] alive?`);
                HeartBeat.isOnline(
                    {
                        client: redisClientInstance,
                        queueName,
                        id: consumerId
                    },
                    (err, online) => {
                        if (err) instance.error(err);
                        else if (online) {
                            debug(`Consumer ID [${consumerId}] is alive!`);
                            next();
                        } else {
                            debug(`Consumer ID [${consumerId}] seems to be dead. Fetching queue message...`);
                            fetchMessage(processingQueueName);
                        }
                    }
                );
            } else {
                debug('Skipping self consumer instance ID...');
                next();
            }
        };

        /**
         *
         * @param {string} processingQueueName
         */
        const fetchMessage = (processingQueueName) => {
            redisClientInstance.lrange(processingQueueName, 0, 0, (err, range) => {
                if (err) instance.error(err);
                else if (range.length) {
                    const msg = Message.createFromMessage(range[0]);
                    debug(`Fetched a message with ID [${msg.getId()}].`);
                    message(processingQueueName, msg);
                } else destroyQueue(processingQueueName);
            });
        };

        /**
         *
         * @param {string} processingQueueName
         * @param {Message} msg
         */
        const message = (processingQueueName, msg) => {
            const uuid = msg.getId();
            debug(`Collecting message [${uuid}]...`);
            const cb = (err) => {
                if (err) instance.error(err);
                else destroyQueue(processingQueueName);
            };
            if (hasExpired(msg)) {
                collectExpiredMessage(msg, processingQueueName, cb);
            } else {
                collectMessage(msg, processingQueueName, cb);
            }
        };

        /**
         * @param {string} processingQueueName
         */
        const destroyQueue = (processingQueueName) => {
            util.purgeProcessingQueue(redisClientInstance, processingQueueName, (err) => {
                if (err) instance.error(err);
                else next();
            });
        };
        next();
    }

    function runInspectionTimer() {
        debug(`Waiting for ${GC_INSPECTION_INTERVAL} before a new iteration...`);
        timer = setTimeout(() => {
            debug('Time is up...');
            if (shutdownNow) shutdownNow();
            else inspectProcessingQueues();
        }, GC_INSPECTION_INTERVAL);
    }

    function inspectProcessingQueues() {
        if (state === states.UP) {
            lockManagerInstance.acquireLock(keyGCLock, 10000, (err) => {
                if (err) instance.error(err);
                // It could takes a long time before a lock could be acquired. Once a lock has been acquired
                // before continuing check first if we are still running. (may be a shutdown command is being in
                // process for example)
                else if (state === states.UP) {
                    debug('Inspecting processing queues...');
                    util.getProcessingQueuesOf(redisClientInstance, keyQueueNameProcessingCommon, (e, result) => {
                        if (e) instance.error(e);
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
     * Move the message to a dead-letter queue when max the attempts threshold is reached
     * or otherwise re-queue it again
     *
     * @param {Message} message
     * @param {string} processingQueue
     * @param {function} cb
     */
    function collectMessage(message, processingQueue, cb) {
        const threshold = message.getRetryThreshold();
        const messageRetryThreshold = typeof threshold === 'number' ? threshold : instance.getMessageRetryThreshold();

        const delay = message.getRetryDelay();
        const messageRetryDelay = typeof delay === 'number' ? delay : instance.getMessageRetryDelay();

        let destQueueName = null;
        let delayed = false;
        let requeued = false;

        const multi = redisClientInstance.multi();

        /**
         * Try to recover only non-periodic messages.
         * Periodic messages failure is ignored since such messages by default are scheduled for delivery
         * based on a period of time.
         */
        const scheduler = instance.getScheduler();
        if (!scheduler.isPeriodic(message)) {
            const uuid = message.getId();
            const attempts = increaseAttempts(message);
            if (attempts < messageRetryThreshold) {
                debug(`Trying to consume message ID [${uuid}] again (attempts: [${attempts}]) ...`);
                if (messageRetryDelay) {
                    debug(`Scheduling message ID [${uuid}]  (delay: [${messageRetryDelay}])...`);
                    message.setScheduledDelay(messageRetryDelay);
                    scheduler.schedule(message, multi);
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
            if (destQueueName) {
                debug(`Moving message [${uuid}] to queue [${destQueueName}]...`);
                multi.lpush(destQueueName, message.toString());
            }
            multi.rpop(processingQueue);
            multi.exec((err) => {
                if (err) cb(err);
                else {
                    if (requeued) instance.emit(events.MESSAGE_REQUEUED, message);
                    else if (delayed) instance.emit(events.MESSAGE_DELAYED, message);
                    else instance.emit(events.MESSAGE_DEAD_LETTER, message);
                    cb();
                }
            });
        } else {
            redisClientInstance.rpop(processingQueue, cb);
        }
    }

    /**
     *
     * @param {Message} message
     * @param {string} processingQueue
     * @param {function} cb
     */
    function collectExpiredMessage(message, processingQueue, cb) {
        const id = message.getId();
        debug(`Processing expired message [${id}]...`);
        // Just pop it out
        redisClientInstance.rpop(processingQueue, (err) => {
            if (err) instance.error(err);
            else {
                cb();
                instance.emit(events.MESSAGE_DESTROYED, message);
            }
        });
    }

    /**
     *
     * @param {Message} message
     * @returns {boolean}
     */
    function hasExpired(message) {
        const ttl = message.getTTL();
        const messageTTL = typeof ttl === 'number' ? ttl : instance.getConsumerMessageTTL();
        if (messageTTL) {
            const curTime = new Date().getTime();
            const createdAt = message.getCreatedAt();
            return createdAt + messageTTL - curTime <= 0;
        }
        return false;
    }

    /**
     *
     * @param {Message} message
     * @return {number}
     */
    function increaseAttempts(message) {
        message[Message.PROPERTY_ATTEMPTS] += 1;
        return message[Message.PROPERTY_ATTEMPTS];
    }

    return {
        start() {
            if (state === states.DOWN) {
                const config = instance.getConfig();
                LockManager.getInstance(config, (l) => {
                    lockManagerInstance = l;
                    redisClient.getNewInstance(config, (c) => {
                        redisClientInstance = c;
                        state = states.UP;
                        instance.emit(events.GC_UP);
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
                        instance.emit(events.GC_DOWN);
                    });
                };
                if (!lockManagerInstance.isLocked()) {
                    shutdownNow();
                }
            }
        },
        collectMessage,
        collectExpiredMessage,
        hasExpired
    };
}

module.exports = GarbageCollector;

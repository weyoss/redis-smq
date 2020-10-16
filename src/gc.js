'use strict';

const redisKeys = require('./redis-keys');
const redisClient = require('./redis-client');
const LockManager = require('./lock-manager');
const { isOnline } = require('./heartbeat');
const Message = require('./message');
const util = require('./util');
const events = require('./events');
const PowerStateManager = require('./power-state-manager');
const Ticker = require('./ticker');

const GC_INSPECTION_INTERVAL = 1000; // in ms

/**
 * @param {Consumer} consumer
 * @return {object}
 */
function GarbageCollector(consumer) {
    const powerStateManager = PowerStateManager();
    const instanceId = consumer.getId();
    const { keyQueueName, keyQueueNameProcessingCommon, keyQueueNameDead, keyGCLock } = consumer.getInstanceRedisKeys();
    const logger = consumer.getLogger();

    /**
     *
     * @type {object|null}
     */
    let lockManagerInstance = null;

    /**
     *
     * @type {object|null}
     */
    let redisClientInstance = null;

    /**
     * @type {string[]}
     */
    let queues = [];

    /**
     * @type {object|null}
     */
    let ticker = null;

    /**
     *
     * @param {string} message
     */
    function debug(message) {
        logger.debug({ gc: true }, message);
    }

    function registerEvents() {
        consumer.on(events.GC_SM_QUEUE, (queue) => {
            debug(`Inspecting processing queue [${queue}]... `);
            const { queueName, consumerId } = redisKeys.getKeySegments(queue);
            if (consumerId !== instanceId) {
                debug(`Is consumer ID [${consumerId}] alive?`);
                isOnline({ client: redisClientInstance, queueName, id: consumerId }, (err, online) => {
                    if (err) consumer.error(err);
                    else if (online) {
                        debug(`Consumer [${consumerId}]: The consumer is online.`);
                        consumer.emit(events.GC_SM_NEXT_QUEUE);
                    } else {
                        debug(`Consumer [${consumerId}]: The consumer seems to be offline.`);
                        consumer.emit(events.GC_SM_CONSUMER_OFFLINE, consumerId, queue);
                    }
                });
            } else {
                debug(`Consumer [${consumerId}]: The consumer is online.`);
                consumer.emit(events.GC_SM_NEXT_QUEUE);
            }
        });

        consumer.on(events.GC_SM_CONSUMER_OFFLINE, (consumerId, queue) => {
            debug(`Consumer [${consumerId}]: Trying to fetch a message from the processing queue ...`);
            redisClientInstance.lrange(queue, 0, 0, (err, range) => {
                if (err) consumer.error(err);
                else if (range.length) {
                    const msg = Message.createFromMessage(range[0]);
                    debug(
                        `Consumer [${consumerId}]: Fetched a message (ID [${msg.getId()}]) from the processing queue.`
                    );
                    consumer.emit(events.GC_SM_MESSAGE, msg, queue);
                } else {
                    debug(`Consumer [${consumerId}]: Processing queue is empty.`);
                    consumer.emit(events.GC_SM_EMPTY_QUEUE, queue, consumerId);
                }
            });
        });

        consumer.on(events.GC_SM_MESSAGE, (msg, queue) => {
            const cb = (err) => {
                if (err) consumer.error(err);
                else consumer.emit(events.GC_SM_MESSAGE_COLLECTED, msg, queue);
            };
            if (hasMessageExpired(msg)) {
                debug(`Message [${msg.getId()}]: Collecting expired message...`);
                collectExpiredMessage(msg, queue, cb);
            } else {
                debug(`Message [${msg.getId()}]: Collecting message...`);
                collectMessage(msg, queue, cb);
            }
        });

        consumer.on(events.GC_SM_MESSAGE_COLLECTED, (message, queue) => {
            debug(`Message [${message.getId()}]: Message collected.`);
            destroyQueue(queue);
        });

        consumer.on(events.GC_SM_EMPTY_QUEUE, (queue, consumerId) => {
            debug(`Consumer [${consumerId}]: Deleting the processing queue...`);
            destroyQueue(queue);
        });

        consumer.on(events.GC_SM_QUEUE_DESTROYED, (queue) => {
            debug(`Queue [${queue}] has been deleted. Inspecting next processing queue...`);
            consumer.emit(events.GC_SM_NEXT_QUEUE);
        });

        consumer.on(events.GC_SM_NEXT_QUEUE, () => {
            if (queues.length) {
                const processingQueueName = queues.pop();
                debug(`Got a new processing queue [${processingQueueName}].`);
                consumer.emit(events.GC_SM_QUEUE, processingQueueName);
            } else {
                debug(`All queues has been inspected. Next iteration...`);
                consumer.emit(events.GC_SM_NEXT_TICK);
            }
        });

        consumer.on(events.GC_SM_NEXT_TICK, () => {
            debug(`Waiting for ${GC_INSPECTION_INTERVAL} before the next iteration...`);
            ticker.nextTick();
        });

        consumer.on(events.GC_SM_TICK, () => {
            lockManagerInstance.acquireLock(keyGCLock, 10000, (error, extended) => {
                if (error) consumer.error(error);
                else {
                    consumer.emit(events.GC_LOCK_ACQUIRED, instanceId, extended);
                    debug('Inspecting processing queues...');
                    util.getProcessingQueuesOf(redisClientInstance, keyQueueNameProcessingCommon, (e, result) => {
                        if (e) consumer.error(e);
                        else if (result) {
                            debug(`Fetched [${result.length}] processing queues`);
                            queues = result;
                            consumer.emit(events.GC_SM_NEXT_QUEUE);
                        } else {
                            debug('No processing queues found');
                            consumer.emit(events.GC_SM_NEXT_TICK);
                        }
                    });
                }
            });
        });
    }

    function unregisterEvents() {
        consumer.removeAllListeners(events.GC_SM_QUEUE);
        consumer.removeAllListeners(events.GC_SM_CONSUMER_OFFLINE);
        consumer.removeAllListeners(events.GC_SM_EMPTY_QUEUE);
        consumer.removeAllListeners(events.GC_SM_MESSAGE);
        consumer.removeAllListeners(events.GC_SM_MESSAGE_COLLECTED);
        consumer.removeAllListeners(events.GC_SM_NEXT_QUEUE);
        consumer.removeAllListeners(events.GC_SM_NEXT_TICK);
        consumer.removeAllListeners(events.GC_SM_QUEUE_DESTROYED);
        consumer.removeAllListeners(events.GC_SM_TICK);
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
        const scheduler = consumer.getScheduler();

        /**
         * @param {Message} message
         * @param {number} delay
         * @param multi
         */
        const requeueMessageAfterDelay = (message, delay, multi) => {
            debug(`Scheduling message ID [${message.getId()}]  (delay: [${delay}])...`);
            message.setScheduledDelay(delay);
            scheduler.schedule(message, multi);
        };

        /**
         * @param {Message} message
         * @param multi
         */
        const moveMessageToDLQ = (message, multi) => {
            debug(`Moving message [${message.getId()}] to DLQ [${keyQueueNameDead}]...`);
            multi.lpush(keyQueueNameDead, message.toString());
        };

        /**
         * @param {Message} message
         * @param multi
         */
        const requeueMessage = (message, multi) => {
            debug(`Re-queuing message [${message.getId()}] ...`);
            multi.lpush(keyQueueName, message.toString());
        };

        /**
         * @param message
         * @return {number}
         */
        const incrMessageAttempts = (message) => {
            message.incrAttempts();
            return message.getAttempts();
        };

        /**
         * @param {Message} message
         * @return {boolean}
         */
        const checkMessageThreshold = (message) => {
            const attempts = incrMessageAttempts(message);
            const threshold = message.getRetryThreshold();
            const retryThreshold = typeof threshold === 'number' ? threshold : consumer.getMessageRetryThreshold();
            return attempts < retryThreshold;
        };

        /**
         * Try to recover only non-periodic messages.
         * Periodic messages failure is ignored since such messages by default are scheduled for delivery
         * based on a period of time.
         */
        if (scheduler.isPeriodic(message)) {
            redisClientInstance.rpop(processingQueue, cb);
        } else {
            let delayed = false;
            let requeued = false;
            const multi = redisClientInstance.multi();
            multi.rpop(processingQueue);
            const retry = checkMessageThreshold(message);
            if (retry) {
                const delay = message.getRetryDelay();
                const retryDelay = typeof delay === 'number' ? delay : consumer.getMessageRetryDelay();
                if (retryDelay) {
                    delayed = true;
                    requeueMessageAfterDelay(message, retryDelay, multi);
                } else {
                    requeued = true;
                    requeueMessage(message, multi);
                }
            } else moveMessageToDLQ(message, multi);
            multi.exec((err) => {
                if (err) cb(err);
                else {
                    if (requeued) consumer.emit(events.GC_MESSAGE_REQUEUED, message);
                    else if (delayed) consumer.emit(events.GC_MESSAGE_DELAYED, message);
                    else consumer.emit(events.GC_MESSAGE_DLQ, message);
                    cb();
                }
            });
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
            if (err) cb(err);
            else {
                consumer.emit(events.GC_MESSAGE_DESTROYED, message);
                cb();
            }
        });
    }

    /**
     *
     * @param {Message} message
     * @returns {boolean}
     */
    function hasMessageExpired(message) {
        const ttl = message.getTTL();
        const messageTTL = typeof ttl === 'number' ? ttl : consumer.getConsumerMessageTTL();
        if (messageTTL) {
            const curTime = new Date().getTime();
            const createdAt = message.getCreatedAt();
            return createdAt + messageTTL - curTime <= 0;
        }
        return false;
    }

    /**
     * @param {string} processingQueueName
     */
    function destroyQueue(processingQueueName) {
        util.purgeProcessingQueue(redisClientInstance, processingQueueName, (err) => {
            if (err) consumer.error(err);
            else consumer.emit(events.GC_SM_QUEUE_DESTROYED, processingQueueName);
        });
    }

    return {
        start() {
            powerStateManager.goingUp();
            const config = consumer.getConfig();
            LockManager.getInstance(config, (lockManager) => {
                lockManagerInstance = lockManager;
                redisClient.getNewInstance(config, (client) => {
                    redisClientInstance = client;
                    ticker = Ticker(() => consumer.emit(events.GC_SM_TICK), GC_INSPECTION_INTERVAL);
                    registerEvents();
                    powerStateManager.up();
                    consumer.emit(events.GC_SM_TICK);
                    consumer.emit(events.GC_UP);
                });
            });
        },
        stop() {
            powerStateManager.goingDown();
            const shutdownFn = () => {
                lockManagerInstance.quit(() => {
                    lockManagerInstance = null;
                    redisClientInstance.end(true);
                    redisClientInstance = null;
                    ticker = null;
                    unregisterEvents();
                    powerStateManager.down();
                    consumer.emit(events.GC_DOWN);
                });
            };
            if (!lockManagerInstance.isLocked()) shutdownFn();
            else ticker.shutdown(shutdownFn);
        },
        collectMessage,
        collectExpiredMessage,
        hasMessageExpired
    };
}

module.exports = GarbageCollector;

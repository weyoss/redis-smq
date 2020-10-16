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
const MessageCollector = require('./gc-message-collector');

const GC_INSPECTION_INTERVAL = 1000; // in ms

/**
 * @param {Consumer} consumer
 * @return {object}
 */
function GarbageCollector(consumer) {
    const powerStateManager = PowerStateManager();
    const instanceId = consumer.getId();
    const { keyQueueNameProcessingCommon, keyGCLock } = consumer.getInstanceRedisKeys();
    const logger = consumer.getLogger();

    /**
     * @type {object|null}
     */
    let messageCollector = null;

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
            messageCollector.collectMessage(msg, queue, (err) => {
                if (err) consumer.error(err);
                else consumer.emit(events.GC_SM_MESSAGE_COLLECTED, msg, queue);
            });
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
     * @param {string} processingQueueName
     */
    function destroyQueue(processingQueueName) {
        util.purgeProcessingQueue(redisClientInstance, processingQueueName, (err) => {
            if (err) consumer.error(err);
            else consumer.emit(events.GC_SM_QUEUE_DESTROYED, processingQueueName);
        });
    }

    function setupMessageCollector() {
        messageCollector = MessageCollector(consumer, redisClientInstance);
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
                    setupMessageCollector();
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
                    messageCollector = null;
                    ticker = null;
                    unregisterEvents();
                    powerStateManager.down();
                    consumer.emit(events.GC_DOWN);
                });
            };
            if (!lockManagerInstance.isLocked()) shutdownFn();
            else ticker.shutdown(shutdownFn);
        },
        getMessageCollector() {
            return messageCollector;
        }
    };
}

module.exports = GarbageCollector;

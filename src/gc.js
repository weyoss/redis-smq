'use strict';

const redisKeys = require('./redis-keys');
const redisClient = require('./redis-client');
const heartBeat = require('./heartbeat');
const lockManagerFn = require('./lock-manager');
const Message = require('./message');
const util = require('./util');

const GC_INSPECTION_INTERVAL = 1000; // in ms

/**
 *
 * @param {object} dispatcher
 * @returns {object}
 */
function garbageCollector(dispatcher) {
    const instanceId = dispatcher.getInstanceId();
    const config = dispatcher.getConfig();
    const events = dispatcher.getEvents();
    const keys = dispatcher.getKeys();
    const { keyQueueName, keyQueueNameDead, keyGCLock, keyGCLockTmp } = keys;
    const messageRetryThreshold = dispatcher.getMessageRetryThreshold();
    const messageRetryDelay = dispatcher.getMessageRetryDelay();

    const logger = dispatcher.getLogger();
    const lockManager = lockManagerFn(dispatcher, keyGCLock, keyGCLockTmp);

    /**
     *
     * @type {(object|null)}
     */
    let client = null;

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
                    util.purgeProcessingQueue(client, name, (err) => {
                        if (err) dispatcher.error(err);
                    });
                };
                const onMessageCollected = (err) => {
                    if (err) dispatcher.error(err);
                    else {
                        if (deadConsumer) purgeProcessingQueue(processingQueueName);
                        collectProcessingQueuesMessages(queues, done);
                    }
                };
                const onRange = (err, range) => {
                    if (err) dispatcher.error(err);
                    else if (range.length) {
                        const message = new Message(range[0]);
                        const uuid = message.getId();
                        debug(`Collecting message [${uuid}]...`);
                        if (hasExpired(message)) {
                            collectExpiredMessage(message, processingQueueName, onMessageCollected);
                        } else {
                            collectMessage(message, processingQueueName, onMessageCollected);
                        }
                    } else onMessageCollected();
                };
                const onConsumerOnline = (err, online) => {
                    if (err) dispatcher.err(err);
                    else if (online) {
                        debug(`Consumer ID [${segments.consumerId}] is alive!`);
                        collectProcessingQueuesMessages(queues, done);
                    } else {
                        deadConsumer = true;
                        debug(`Consumer ID [${segments.consumerId}] seems to be dead. Fetching queue message...`);
                        client.lrange(processingQueueName, 0, 0, onRange);
                    }
                };
                debug(`Is consumer ID [${segments.consumerId}] alive?`);
                heartBeat.isOnline(client, segments.queueName, segments.consumerId, onConsumerOnline);
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
        if (dispatcher.isRunning()) {
            debug(`Waiting for ${GC_INSPECTION_INTERVAL} before a new iteration...`);
            timer = setTimeout(() => {
                debug('Time is up...');
                inspectProcessingQueues();
            }, GC_INSPECTION_INTERVAL);
        }
    }

    /**
     *
     */
    function inspectProcessingQueues() {
        lockManager.acquire((err) => {
            if (err) dispatcher.error(err);
            else {
                debug('Inspecting processing queues...');
                util.getProcessingQueues(client, (e, result) => {
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

    /**
     * Move message to dead-letter queue when max attempts threshold is reached
     * otherwise requeue it again
     *
     * @param {object} message
     * @param {string} processingQueue
     * @param {function} cb
     */
    function collectMessage(message, processingQueue, cb) {
        let destQueueName = null;
        let delayed = false;
        let requeued = false;
        const multi = client.multi();

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
                    if (dispatcher.isTest()) {
                        if (requeued) dispatcher.emit(events.MESSAGE_REQUEUED, message);
                        else if (delayed) dispatcher.emit(events.MESSAGE_DELAYED, message);
                        else dispatcher.emit(events.MESSAGE_DEAD_LETTER, message);
                    }
                    cb();
                }
            });
        } else {
            client.rpop(processingQueue, cb);
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
        client.rpop(processingQueue, (err) => {
            if (err) dispatcher.error(err);
            else {
                cb();
                if (dispatcher.isTest()) dispatcher.emit(events.MESSAGE_DESTROYED, message);
            }
        });
    }

    /**
     *
     * @param {object} message
     * @returns {boolean}
     */
    function hasExpired(message) {
        let expired = false;
        const ttl = message.getTTL();
        const consumerMessageTTL = dispatcher.getConsumerMessageTTL();
        if (ttl || consumerMessageTTL) {
            const curTime = new Date().getTime();
            const createdAt = message.getCreatedAt();
            expired = (ttl && ((createdAt + ttl) - curTime) <= 0) ||
                (consumerMessageTTL && ((createdAt + consumerMessageTTL) - curTime) <= 0);
        }
        return expired;
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
        start() {
            client = redisClient.getNewInstance(config);
            lockManager.setRedisClient(client);
            inspectProcessingQueues();
        },

        stop() {
            if (timer) clearTimeout(timer);
            lockManager.release(() => {
                client.end(true);
                client = null;
                dispatcher.emit(events.GC_HALT);
            });
        },

        collectMessage,

        collectExpiredMessage,

        hasExpired,
    };
}

module.exports = garbageCollector;

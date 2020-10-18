'use strict';

const events = require('./events');

module.exports = function MessageCollector(consumer, redisClientInstance) {
    const { keyQueue, keyQueueDLQ } = consumer.getInstanceRedisKeys();
    const scheduler = consumer.getScheduler();
    const logger = consumer.getLogger();

    /**
     * @param {string} message
     */
    function debug(message) {
        logger.debug({ gc: true }, message);
    }

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
        debug(`Moving message [${message.getId()}] to DLQ [${keyQueueDLQ}]...`);
        multi.lpush(keyQueueDLQ, message.toString());
    };

    /**
     * @param {Message} message
     * @param multi
     */
    const requeueMessage = (message, multi) => {
        debug(`Re-queuing message [${message.getId()}] ...`);
        multi.lpush(keyQueue, message.toString());
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

    return {
        /**
         * @param {Message} message
         * @returns {boolean}
         */
        hasMessageExpired(message) {
            const ttl = message.getTTL();
            const messageTTL = typeof ttl === 'number' ? ttl : consumer.getConsumerMessageTTL();
            if (messageTTL) {
                const curTime = new Date().getTime();
                const createdAt = message.getCreatedAt();
                return createdAt + messageTTL - curTime <= 0;
            }
            return false;
        },

        /**
         * Moves the message to a dead-letter queue when max the attempts threshold is reached
         * or otherwise re-queue it again.
         * Only recovers non-periodic messages.
         * Periodic messages failure is ignored since such messages by default are scheduled for delivery
         * based on a period of time.
         *
         * @param {Message} message
         * @param {string} processingQueue
         * @param {function} cb
         */
        collectMessage(message, processingQueue, cb) {
            if (this.hasMessageExpired(message)) {
                debug(`Message [${message.getId()}]: Collecting expired message...`);
                this.collectExpiredMessage(message, processingQueue, cb);
            } else if (scheduler.isPeriodic(message)) {
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
        },

        /**
         *
         * @param {Message} message
         * @param {string} processingQueue
         * @param {function} cb
         */
        collectExpiredMessage(message, processingQueue, cb) {
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
    };
};

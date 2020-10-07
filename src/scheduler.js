'use strict';

const cronParser = require('cron-parser');
const Message = require('./message');
const redisClient = require('./redis-client');
const LockManager = require('./lock-manager');
const events = require('./events');

/**
 *
 * @param instance
 * @param tickPeriod
 */
function Scheduler(instance, tickPeriod = 1000) {
    const { keySchedulerLock, keyQueueName, keyQueueNameDelayed } = instance.getInstanceRedisKeys();
    const logger = instance.getLogger();
    const states = {
        UP: 1,
        DOWN: 0,
    };
    let lockManagerInstance = null;
    let redisClientInstance = null;
    let state = states.DOWN;
    let timer = 0;
    let shutdownNow = null;

    /**
     *
     * @param {string} message
     */
    function debug(message) {
        logger.debug({ scheduler: true }, message);
    }

    /**
     *
     * @param message
     * @param timestamp
     * @param multi
     * @param cb
     */
    function scheduleMessage(message, timestamp, multi, cb) {
        if (multi) multi.zadd(keyQueueNameDelayed, timestamp, message.toString());
        else redisClientInstance.zadd(keyQueueNameDelayed, timestamp, message.toString(), cb);
    }

    /**
     *
     */
    function getNextMessages() {
        const now = Date.now();
        const process = (messages) => {
            if (messages.length) {
                const msg = messages.pop();
                const message = Message.createFromMessage(msg);
                const multi = redisClientInstance.multi();
                multi.lpush(keyQueueName, msg.toString());
                multi.zrem(keyQueueNameDelayed, msg);
                if (isPeriodic(message)) {
                    const timestamp = getNextScheduledTimestamp(message);
                    if (timestamp) {
                        const newMessage = Message.createFromMessage(message, true);
                        scheduleMessage(newMessage, timestamp, multi);
                    }
                }
                multi.exec((err, res) => {
                    if (err) instance.error(err);
                    else process(messages);
                });
            } else runTicker();
        };
        if (state === states.UP) {
            redisClientInstance.zrangebyscore(keyQueueNameDelayed, 0, now, (err, messages) => {
                if (err) instance.error(err);
                else process(messages);
            });
        }
    }

    /**
     *
     */
    function runTicker() {
        if (state === states.UP) {
            lockManagerInstance.acquireLock(keySchedulerLock, 10000, (err) => {
                if (err) instance.error(err);

                // after lock has been acquired, the scheduler could be shutdown
                else if (state === states.UP) {
                    debug(`Waiting for ${tickPeriod} before a new iteration...`);
                    timer = setTimeout(() => {
                        debug('Time is up...');
                        if (shutdownNow) shutdownNow();
                        else getNextMessages();
                    }, tickPeriod);
                }
            });
        }
    }

    /**
     *
     * @return {number|boolean}
     */
    function getNextScheduledTimestamp(message) {
        if (isScheduled(message)) {
            const getScheduleRepeatTimestamp = () => {
                if (message[Message.PROPERTY_SCHEDULED_REPEAT]) {
                    message[Message.PROPERTY_SCHEDULED_REPEAT_COUNT] += 1;
                    if (message[Message.PROPERTY_SCHEDULED_REPEAT_COUNT] < message[Message.PROPERTY_SCHEDULED_REPEAT]) {
                        const now = Date.now();
                        if (message[Message.PROPERTY_SCHEDULED_PERIOD]) {
                            return now + message[Message.PROPERTY_SCHEDULED_PERIOD];
                        }
                        return now;
                    }
                    message[Message.PROPERTY_SCHEDULED_REPEAT_COUNT] = 0;
                }
                return 0;
            };
            const getDelayTimestamp = () => {
                if (message[Message.PROPERTY_SCHEDULED_DELAY]
                    && !message[Message.PROPERTY_SCHEDULED_CRON]
                    && !message[Message.PROPERTY_DELAYED]) {
                    message[Message.PROPERTY_DELAYED] = true;
                    return Date.now() + message[Message.PROPERTY_SCHEDULED_DELAY];
                }
                return 0;
            };
            const delayTimestamp = getDelayTimestamp();
            if (delayTimestamp) {
                return delayTimestamp;
            }
            const nextCRONTimestamp = message[Message.PROPERTY_SCHEDULED_CRON]
                ? cronParser.parseExpression(message[Message.PROPERTY_SCHEDULED_CRON]).next().getTime() : 0;
            const nextRepeatTimestamp = getScheduleRepeatTimestamp();
            if (nextCRONTimestamp && nextRepeatTimestamp) {
                if (!message[Message.PROPERTY_SCHEDULED_CRON_FIRED]
                    || nextCRONTimestamp < nextRepeatTimestamp) {
                    message[Message.PROPERTY_SCHEDULED_REPEAT_COUNT] = 0;
                    message[Message.PROPERTY_SCHEDULED_CRON_FIRED] = true;
                    return nextCRONTimestamp;
                }
                return nextRepeatTimestamp;
            }
            if (nextCRONTimestamp) return nextCRONTimestamp;
            return nextRepeatTimestamp;
        }
        return false;
    }

    /**
     *
     * @return {boolean}
     */
    function isScheduled(message) {
        return (
            message.hasOwnProperty(Message.PROPERTY_SCHEDULED_CRON)
            || message.hasOwnProperty(Message.PROPERTY_SCHEDULED_DELAY)
            || message.hasOwnProperty(Message.PROPERTY_SCHEDULED_REPEAT)
        );
    }

    /**
     *
     * @param message
     * @return {boolean}
     */
    function isPeriodic(message) {
        return (
            message.hasOwnProperty(Message.PROPERTY_SCHEDULED_CRON)
            || message.hasOwnProperty(Message.PROPERTY_SCHEDULED_REPEAT)
        );
    }

    return {
        /**
         *
         * @param message
         * @param multi
         * @param cb
         */
        schedule(message, multi, cb) {
            const timestamp = getNextScheduledTimestamp(message);
            scheduleMessage(message, timestamp, multi, cb);
        },

        start() {
            if (state === states.DOWN) {
                const config = instance.getConfig();
                LockManager.getInstance(config, (l) => {
                    lockManagerInstance = l;
                    redisClient.getNewInstance(config, (c) => {
                        state = states.UP;
                        redisClientInstance = c;
                        instance.emit(events.SCHEDULER_UP);
                    });
                });
            }
        },

        stop() {
            if (state === states.UP && !shutdownNow) {
                shutdownNow = () => {
                    state = states.DOWN;
                    shutdownNow = null;
                    if (timer) clearTimeout(timer);
                    const handler = () => {
                        lockManagerInstance = null;
                        redisClientInstance.end(true);
                        redisClientInstance = null;
                        instance.emit(events.SCHEDULER_DOWN);
                    };
                    lockManagerInstance.quit(handler);
                };
                if (!lockManagerInstance.isLocked()) {
                    shutdownNow();
                }
            }
        },

        isScheduled,
        isPeriodic,
        runTicker,
    };
}

module.exports = Scheduler;

'use strict';

const async = require('neo-async');
const cronParser = require('cron-parser');
const Message = require('./message');
const redisClient = require('./redis-client');
const LockManager = require('./lock-manager');
const events = require('./events');
const PowerStateManager = require('./power-state-manager');
const Ticker = require('./ticker');

/**
 *
 * @param {Instance} instance
 * @param {number} tickPeriod
 */
function Scheduler(instance, tickPeriod = 1000) {
    const powerStateManager = PowerStateManager();
    const { keyLockScheduler, keyQueue, keyQueueDelayed } = instance.getInstanceRedisKeys();
    const logger = instance.getLogger();
    let lockManagerInstance = null;
    let redisClientInstance = null;
    let ticker = null;

    /**
     *
     * @param {string} message
     */
    function debug(message) {
        logger.debug({ scheduler: true }, message);
    }

    /**
     *
     * @param {Message} message
     * @param {number} timestamp
     * @param {object|null} multi
     * @param {function|null} cb
     */
    function scheduleMessage(message, timestamp, multi, cb) {
        if (multi) multi.zadd(keyQueueDelayed, timestamp, message.toString());
        else {
            if (!cb) {
                throw new Error('Callback function is required');
            }
            redisClientInstance.zadd(keyQueueDelayed, timestamp, message.toString(), cb);
        }
    }

    /**
     * @param {string} msg
     * @param {object|null} multi
     * @param {function|null} cb
     */
    function scheduleNextDelivery(msg, multi, cb) {
        const message = Message.createFromMessage(msg);
        if (isPeriodic(message)) {
            const timestamp = getNextScheduledTimestamp(message);
            if (timestamp) {
                const newMessage = Message.createFromMessage(message, true);
                scheduleMessage(newMessage, timestamp, multi, cb);
            }
        } else if (cb) cb();
    }

    /**
     * @param {string} msg
     * @param {object|null} multi
     * @param {function|null} cb
     */
    function deliverScheduledMessage(msg, multi, cb) {
        if (multi) {
            multi.lpush(keyQueue, msg);
            multi.zrem(keyQueueDelayed, msg);
        } else {
            if (typeof cb !== 'function') {
                throw new Error('Callback function required.');
            }
            multi = redisClientInstance.multi();
            multi.lpush(keyQueue, msg);
            multi.zrem(keyQueueDelayed, msg);
            multi.exec(cb);
        }
    }

    /**
     * @param {function} callback
     */
    function run(callback) {
        lockManagerInstance.acquireLock(keyLockScheduler, 10000, (err) => {
            if (err) instance.error(err);
            else {
                const now = Date.now();
                const process = (messages, cb) => {
                    if (messages.length) {
                        async.each(
                            messages,
                            (msg, done) => {
                                const multi = redisClientInstance.multi();
                                deliverScheduledMessage(msg, multi);
                                scheduleNextDelivery(msg, multi);
                                multi.exec(done);
                            },
                            cb
                        );
                    } else cb();
                };
                const fetch = (cb) => {
                    redisClientInstance.zrangebyscore(keyQueueDelayed, 0, now, (err, messages) => {
                        if (err) cb(err);
                        else cb(null, messages);
                    });
                };
                async.waterfall([fetch, process], callback);
            }
        });
    }

    function tick() {
        run((err) => {
            if (err) instance.error(err);
            else ticker.nextTick();
        });
    }

    /**
     * @param {Message} message
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
                if (
                    message[Message.PROPERTY_SCHEDULED_DELAY] &&
                    !message[Message.PROPERTY_SCHEDULED_CRON] &&
                    !message[Message.PROPERTY_DELAYED]
                ) {
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
                ? cronParser.parseExpression(message[Message.PROPERTY_SCHEDULED_CRON]).next().getTime()
                : 0;
            const nextRepeatTimestamp = getScheduleRepeatTimestamp();
            if (nextCRONTimestamp && nextRepeatTimestamp) {
                if (!message[Message.PROPERTY_SCHEDULED_CRON_FIRED] || nextCRONTimestamp < nextRepeatTimestamp) {
                    //@todo Modify message from outside this function
                    //@todo Function getNextScheduledTimestamp() should just return values
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
     * @param {Message} message
     * @return {boolean}
     */
    function isScheduled(message) {
        return (
            message.hasOwnProperty(Message.PROPERTY_SCHEDULED_CRON) ||
            message.hasOwnProperty(Message.PROPERTY_SCHEDULED_DELAY) ||
            message.hasOwnProperty(Message.PROPERTY_SCHEDULED_REPEAT)
        );
    }

    /**
     * @param {Message} message
     * @return {boolean}
     */
    function isPeriodic(message) {
        return (
            message.hasOwnProperty(Message.PROPERTY_SCHEDULED_CRON) ||
            message.hasOwnProperty(Message.PROPERTY_SCHEDULED_REPEAT)
        );
    }

    return {
        isScheduled,
        isPeriodic,

        /**
         * @param message
         * @param multi
         * @param cb
         */
        schedule(message, multi, cb) {
            const timestamp = getNextScheduledTimestamp(message);
            scheduleMessage(message, timestamp, multi, cb);
        },

        start() {
            powerStateManager.goingUp();
            const config = instance.getConfig();
            LockManager.getInstance(config, (l) => {
                lockManagerInstance = l;
                redisClient.getNewInstance(config, (c) => {
                    redisClientInstance = c;
                    powerStateManager.up();
                    instance.emit(events.SCHEDULER_UP);
                });
            });
        },

        stop() {
            powerStateManager.goingDown();
            const shutdownFn = () => {
                if (powerStateManager.isGoingDown()) {
                    lockManagerInstance.quit(() => {
                        lockManagerInstance = null;
                        redisClientInstance.end(true);
                        redisClientInstance = null;
                        powerStateManager.down();
                        instance.emit(events.SCHEDULER_DOWN);
                    });
                }
            };
            if (ticker) {
                if (!lockManagerInstance.isLocked()) shutdownFn();
                else ticker.shutdown(shutdownFn);
            } else shutdownFn();
        },

        runTicker() {
            if (!ticker) {
                ticker = Ticker(tick, tickPeriod);
                tick();
            }
        }
    };
}

module.exports = Scheduler;

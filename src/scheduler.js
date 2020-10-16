'use strict';

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
    const { keySchedulerLock, keyQueueName, keyQueueNameDelayed } = instance.getInstanceRedisKeys();
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
     * @param {Object|null} multi
     * @param {function} cb
     */
    function scheduleMessage(message, timestamp, multi, cb) {
        if (multi) multi.zadd(keyQueueNameDelayed, timestamp, message.toString());
        else redisClientInstance.zadd(keyQueueNameDelayed, timestamp, message.toString(), cb);
    }

    function getNextMessages() {
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
            } else nextTick();
        };
        const now = Date.now();
        redisClientInstance.zrangebyscore(keyQueueNameDelayed, 0, now, (err, messages) => {
            if (err) instance.error(err);
            else process(messages);
        });
    }

    function nextTick() {
        ticker.nextTick();
    }

    function tick() {
        if (!ticker) {
            ticker = Ticker(tick, tickPeriod);
        }
        lockManagerInstance.acquireLock(keySchedulerLock, 10000, (err) => {
            if (err) instance.error(err);
            else {
                getNextMessages();
            }
        });
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
            message.hasOwnProperty(Message.PROPERTY_SCHEDULED_CRON) ||
            message.hasOwnProperty(Message.PROPERTY_SCHEDULED_DELAY) ||
            message.hasOwnProperty(Message.PROPERTY_SCHEDULED_REPEAT)
        );
    }

    /**
     *
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
        isScheduled,
        isPeriodic,
        tick
    };
}

module.exports = Scheduler;

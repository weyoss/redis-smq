'use strict';

const lockManagerFn = require('./lock-manager');
const redisClient = require('./redis-client');
const Message = require('./message');
const cronParser = require('cron-parser');

function scheduler(dispatcher, tickPeriod = 1000) {
    const config = dispatcher.getConfig();
    const { keySchedulerLock, keySchedulerLockTmp, keyQueueNameDelayed } = dispatcher.getKeys();
    const logger = dispatcher.getLogger();
    const events = dispatcher.getEvents();
    const lockManager = lockManagerFn(dispatcher, keySchedulerLock, keySchedulerLockTmp);

    let client = null;
    let timer = 0;

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
        else client.zadd(keyQueueNameDelayed, timestamp, message.toString(), cb);
    }

    /**
     *
     */
    function getNextMessages() {
        const now = Date.now();
        const process = (messages) => {
            if (messages.length) {
                const msg = messages.pop();
                const message = new Message(msg);
                const multi = client.multi();
                dispatcher.enqueue(message, multi);
                multi.zrem(keyQueueNameDelayed, msg);
                if (isPeriodic(message)) {
                    const timestamp = getNextScheduledTimestamp(message);
                    if (timestamp) {
                        const newMessage = Message.createFromMessage(message);
                        scheduleMessage(newMessage, timestamp, multi);
                    }
                }
                multi.exec((err, res) => {
                    if (err) dispatcher.error(err);
                    else process(messages);
                });
            } else run();
        };
        client.zrangebyscore(keyQueueNameDelayed, 0, now, (err, messages) => {
            if (err) dispatcher.error(err);
            else process(messages);
        });
    }

    /**
     *
     */
    function run() {
        if (dispatcher.isRunning()) {
            debug(`Waiting for ${tickPeriod} before a new iteration...`);
            timer = setTimeout(() => {
                debug('Time is up...');
                getNextMessages();
            }, tickPeriod);
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
                if (message[Message.PROPERTY_SCHEDULED_DELAY] &&
                    !message[Message.PROPERTY_SCHEDULED_CRON] &&
                    !message[Message.PROPERTY_DELAYED]) {
                    message[Message.PROPERTY_DELAYED] = true;
                    return Date.now() + message[Message.PROPERTY_SCHEDULED_DELAY];
                }
                return 0;
            };
            const delayTimestamp = getDelayTimestamp();
            if (delayTimestamp) {
                return delayTimestamp;
            }
            const nextCRONTimestamp = message[Message.PROPERTY_SCHEDULED_CRON] ?
                cronParser.parseExpression(message[Message.PROPERTY_SCHEDULED_CRON]).next().getTime() : 0;
            const nextRepeatTimestamp = getScheduleRepeatTimestamp();
            if (nextCRONTimestamp && nextRepeatTimestamp) {
                if (nextCRONTimestamp < nextRepeatTimestamp) {
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
     * @param message
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
         * @param cb
         */
        schedule(message, cb) {
            const timestamp = getNextScheduledTimestamp(message);
            scheduleMessage(message, timestamp, null, cb);
        },

        start() {
            client = redisClient.getNewInstance(config);
            lockManager.setRedisClient(client);
            if (dispatcher.isConsumer()) {
                lockManager.acquire((err) => {
                    if (err) dispatcher.error(err);
                    else run();
                });
            }
        },

        stop() {
            if (timer) clearTimeout(timer);
            const handler = () => {
                client.end(true);
                client = null;
                dispatcher.emit(events.SCHEDULER_HALT);
            };
            if (dispatcher.isConsumer()) {
                if (timer) clearTimeout(timer);
                lockManager.release((err) => {
                    if (err) {
                        dispatcher.error(err);
                    } else {
                        handler();
                    }
                });
            } else handler();
        },

        isScheduled,
        isPeriodic,
    };
}

module.exports = scheduler;

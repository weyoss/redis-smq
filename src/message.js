'use strict';

const cronParser = require('cron-parser');
const uuid = require('uuid/v4');


class Message {
    /**
     *
     */
    constructor() {
        this[Message.PROPERTY_CREATED_AT] = Date.now();
        this[Message.PROPERTY_UUID] = uuid();
        this[Message.PROPERTY_ATTEMPTS] = 0;
        this[Message.PROPERTY_SCHEDULED_REPEAT_COUNT] = 0;
        this[Message.PROPERTY_DELAYED] = false;
        this[Message.PROPERTY_SCHEDULED_CRON_FIRED] = false;
    }

    /**
     *
     * @param {number} period
     * @return {Message}
     */
    setScheduledPeriod(period) {
        if (period < 1) throw new Error('Scheduling period should not be less than 1 second');
        this[Message.PROPERTY_SCHEDULED_PERIOD] = period * 1000; // in ms
        return this;
    }

    /**
     *
     * @param {number} delay
     * @return {Message}
     */
    setScheduledDelay(delay) {
        if (delay < 1) throw new Error('Scheduling delay should not be less than 1 second');
        this[Message.PROPERTY_SCHEDULED_DELAY] = delay * 1000; // in ms
        this[Message.PROPERTY_DELAYED] = false;
        return this;
    }

    /**
     *
     * @param {string} cron
     * @return {Message}
     */
    setScheduledCron(cron) {
        // throws an exception for invalid value
        cronParser.parseExpression(cron);
        this[Message.PROPERTY_SCHEDULED_CRON] = cron;
        return this;
    }

    /**
     *
     * @param {number} repeat
     * @return {Message}
     */
    setScheduledRepeat(repeat) {
        this[Message.PROPERTY_SCHEDULED_REPEAT] = Number(repeat);
        return this;
    }

    /**
     *
     * @param ttl
     * @return {Message}
     */
    setTTL(ttl) {
        this[Message.PROPERTY_TTL] = Number(ttl);
        return this;
    }

    /**
     *
     * @param timeout
     * @return {Message}
     */
    setConsumeTimeout(timeout) {
        this[Message.PROPERTY_CONSUME_TIMEOUT] = Number(timeout);
        return this;
    }

    /**
     *
     * @param threshold
     * @return {Message}
     */
    setRetryThreshold(threshold) {
        this[Message.PROPERTY_RETRY_THRESHOLD] = Number(threshold);
        return this;
    }

    /**
     *
     * @param delay
     * @return {Message}
     */
    setRetryDelay(delay) {
        this[Message.PROPERTY_RETRY_DELAY] = Number(delay);
        return this;
    }

    /**
     *
     * @param body
     * @return {Message}
     */
    setBody(body) {
        this[Message.PROPERTY_BODY] = body;
        return this;
    }

    /**
     *
     * @return {*}
     */
    getBody() {
        return this[Message.PROPERTY_BODY];
    }

    /**
     *
     * @return {string}
     */
    getId() {
        return this[Message.PROPERTY_UUID];
    }

    /**
     *
     * @return {number|null}
     */
    getTTL() {
        return this[Message.PROPERTY_TTL];
    }

    /**
     *
     * @return {number|null}
     */
    getRetryThreshold() {
        return this[Message.PROPERTY_RETRY_THRESHOLD];
    }

    /**
     *
     * @return {number|null}
     */
    getRetryDelay() {
        return this[Message.PROPERTY_RETRY_DELAY];
    }

    /**
     *
     * @return {number|null}
     */
    getConsumeTimeout() {
        return this[Message.PROPERTY_CONSUME_TIMEOUT];
    }

    /**
     *
     * @return {number}
     */
    getCreatedAt() {
        return this[Message.PROPERTY_CREATED_AT];
    }

    /**
     *
     * @return {number}
     */
    getAttempts() {
        return this[Message.PROPERTY_ATTEMPTS];
    }

    /**
     *
     * @return {number|null}
     */
    getMessageScheduledRepeat() {
        return this[Message.PROPERTY_SCHEDULED_REPEAT];
    }

    /**
     *
     * @return {number}
     */
    getMessageScheduledRepeatCount() {
        return this[Message.PROPERTY_SCHEDULED_REPEAT_COUNT];
    }

    /**
     *
     * @return {number|null}
     */
    getMessageScheduledPeriod() {
        return this[Message.PROPERTY_SCHEDULED_PERIOD];
    }

    /**
     *
     * @return {string|null}
     */
    getMessageScheduledCRON() {
        return this[Message.PROPERTY_SCHEDULED_CRON];
    }

    /**
     *
     * @return {number|null}
     */
    getMessageScheduledDelay() {
        return this[Message.PROPERTY_SCHEDULED_DELAY];
    }

    /**
     *
     * @return {boolean}
     */
    isDelayed() {
        return this[Message.PROPERTY_DELAYED];
    }

    /**
     *
     * @param property
     * @return {*}
     */
    getProperty(property) {
        return this[property];
    }

    /**
     *
     * @return {string}
     */
    toString() {
        return JSON.stringify(this);
    }
}

/**
 *
 * @param message
 * @param reset
 * @return {Message}
 */
Message.createFromMessage = (message, reset = false) => {
    const messageJSON = (typeof message === 'string') ? JSON.parse(message) : message;
    const m = new Message();
    Object.assign(m, messageJSON);
    if (reset) {
        m[Message.PROPERTY_UUID] = uuid();
        m[Message.PROPERTY_ATTEMPTS] = 0;
        m[Message.PROPERTY_CREATED_AT] = Date.now();
    }
    return m;
};

/**
 *
 * @type {number}
 */
Message.PROPERTY_TTL = 'ttl';

/**
 *
 * @type {number}
 */
Message.PROPERTY_RETRY_THRESHOLD = 'retryThreshold';

/**
 *
 * @type {number}
 */
Message.PROPERTY_RETRY_DELAY = 'retryDelay';

/**
 *
 * @type {number}
 */
Message.PROPERTY_CONSUME_TIMEOUT = 'consumeTimeout';

/**
 *
 * @type {string}
 */
Message.PROPERTY_BODY = 'body';

/**
 *
 * @type {string}
 */
Message.PROPERTY_UUID = 'uuid';

/**
 *
 * @type {string}
 */
Message.PROPERTY_ATTEMPTS = 'attempts';

/**
 *
 * @type {string}
 */
Message.PROPERTY_CREATED_AT = 'createdAt';

/**
 * The Cron entry to set the schedule
 * @type {string}
 */
Message.PROPERTY_SCHEDULED_CRON = 'scheduledCron';

/**
 *
 * @type {boolean}
 */
Message.PROPERTY_SCHEDULED_CRON_FIRED = 'scheduledCronFired';

/**
 * The time in milliseconds that a message will wait before being scheduled to be delivered
 * @type {string}
 */
Message.PROPERTY_SCHEDULED_DELAY = 'scheduledDelay';

/**
 * The time in milliseconds to wait after the start time to wait before scheduling the message again
 * @type {string}
 */
Message.PROPERTY_SCHEDULED_PERIOD = 'scheduledPeriod';

/**
 * The number of times to repeat scheduling a message for delivery
 * @type {string}
 */
Message.PROPERTY_SCHEDULED_REPEAT = 'scheduledRepeat';

/**
 *
 * @type {string}
 */
Message.PROPERTY_SCHEDULED_REPEAT_COUNT = 'scheduledRepeatCount';

/**
 *
 * @type {boolean}
 */
Message.PROPERTY_DELAYED = 'delayed';


module.exports = Message;

'use strict';

const events = require('./events');

/**
 * @param {Consumer} consumer
 * @return {object}
 */
module.exports = function ConsumerStatsProvider(consumer) {
    const processingSlots = new Array(1000).fill(0);
    const acknowledgedSlots = new Array(1000).fill(0);
    const unacknowledgedSlots = new Array(1000).fill(0);
    const { keyRate, keyRateProcessing, keyRateAcknowledged, keyRateUnacknowledged } = consumer.getInstanceRedisKeys();

    /**
     * @type {number}
     */
    let processingRate = 0;

    /**
     * @type {number}
     */
    let acknowledgedRate = 0;

    /**
     * @type {number}
     */
    let unacknowledgedRate = 0;

    /**
     * @type {number[]}
     */
    let idleStack = new Array(5).fill(0);

    /**
     * When the idle status is true, it indicates that the consumer has been inactive for the last 5 seconds
     * @type {boolean}
     */
    let isIdle = false;

    return {
        tick() {
            processingRate = processingSlots.reduce((acc, cur) => acc + cur, 0);
            processingSlots.fill(0);
            acknowledgedRate = acknowledgedSlots.reduce((acc, cur) => acc + cur, 0);
            acknowledgedSlots.fill(0);
            unacknowledgedRate = unacknowledgedSlots.reduce((acc, cur) => acc + cur, 0);
            unacknowledgedSlots.fill(0);
            if (processingRate === 0 && acknowledgedRate === 0 && unacknowledgedRate === 0) idleStack.push(1);
            else idleStack.push(0);
            idleStack.shift();
            isIdle = idleStack.find((i) => i === 0) === undefined;
            return {
                processingRate,
                acknowledgedRate,
                unacknowledgedRate,
                isIdle
            };
        },
        publish(redisClient, stats) {
            const now = Date.now();
            const { processingRate, acknowledgedRate, unacknowledgedRate, isIdle } = stats;
            redisClient.hmset(
                keyRate,
                keyRateProcessing,
                `${processingRate}|${now}`,
                keyRateAcknowledged,
                `${acknowledgedRate}|${now}`,
                keyRateUnacknowledged,
                `${unacknowledgedRate}|${now}`,
                () => {}
            );
            if (isIdle) consumer.emit(events.IDLE);
        },
        incrementProcessingSlot() {
            const slot = new Date().getMilliseconds();
            processingSlots[slot] += 1;
        },
        incrementAcknowledgedSlot() {
            const slot = new Date().getMilliseconds();
            acknowledgedSlots[slot] += 1;
        },
        incrementUnacknowledgedSlot() {
            const slot = new Date().getMilliseconds();
            unacknowledgedSlots[slot] += 1;
        }
    };
};

'use strict';

/**
 * @param {Producer} producer
 * @return {object}
 */
module.exports = function ProducerStatsProvider(producer) {
    const { keyRate, keyRateInput } = producer.getInstanceRedisKeys();

    /**
     * @type {number[]}
     */
    const inputSlots = new Array(1000).fill(0);

    /**
     * @type {number}
     */
    let inputRate = 0;

    return {
        tick() {
            inputRate = inputSlots.reduce((acc, cur) => acc + cur, 0);
            inputSlots.fill(0);
            return {
                inputRate
            };
        },
        publish(redisClient, stats) {
            const now = Date.now();
            const { inputRate } = stats;
            redisClient.hset(keyRate, keyRateInput, `${inputRate}|${now}`, () => {});
        },
        incrementInputSlot() {
            const slot = new Date().getMilliseconds();
            inputSlots[slot] += 1;
        }
    };
};

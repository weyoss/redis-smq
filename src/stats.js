'use strict';

const redisKeys = require('./redis-keys');
const redisClient = require('./redis-client');

/**
 *
 * @param {object} eventEmitter
 * @param {object} config
 * @returns {object}
 */
function stats(eventEmitter, config) {
    const inputSlots = new Array(1000).fill(0);
    const processingSlots = new Array(1000).fill(0);
    const acknowledgedSlots = new Array(1000).fill(0);
    const unacknowledgedSlots = new Array(1000).fill(0);
    const keys = redisKeys.getKeys(eventEmitter);
    const noop = () => {};
    let client = null;
    let inputRate = 0;
    let processingRate = 0;
    let acknowledgedRate = 0;
    let unacknowledgedRate = 0;
    let statsTickInterval = 0;
    let halt = false;

    /**
     *
     */
    function processHalt() {
        clearInterval(statsTickInterval);
        client.end(true);
        client = null;
        halt = false;
        eventEmitter.emit('stats_halt');
    }

    /**
     *
     */
    function runProducerStats() {
        statsTickInterval = setInterval(() => {
            if (!halt) {
                const now = Date.now();
                inputRate = inputSlots.reduce((acc, cur) => acc + cur, 0);
                inputSlots.fill(0);
                client.hset(keys.keyRate, keys.keyRateInput, `${inputRate}|${now}`, noop);
            } else processHalt();
        }, 1000);
    }

    /**
     *
     */
    function runConsumerStats() {
        let idle = 0;
        statsTickInterval = setInterval(() => {
            const now = Date.now();
            if (!halt) {
                processingRate = processingSlots.reduce((acc, cur) => acc + cur, 0);
                processingSlots.fill(0);
                acknowledgedRate = acknowledgedSlots.reduce((acc, cur) => acc + cur, 0);
                acknowledgedSlots.fill(0);
                unacknowledgedRate = unacknowledgedSlots.reduce((acc, cur) => acc + cur, 0);
                unacknowledgedSlots.fill(0);
                if (eventEmitter.isTest) {
                    if (processingRate === 0 && acknowledgedRate === 0 && unacknowledgedRate === 0) idle += 1;
                    else idle = 0;
                    if (idle > 5) {
                        idle = 0;
                        eventEmitter.emit('idle', JSON.stringify({ consumerId: eventEmitter.consumerId }));
                    }
                }
                client.hmset(
                    keys.keyRate,
                    keys.keyRateProcessing, `${processingRate}|${now}`,
                    keys.keyRateAcknowledged, `${acknowledgedRate}|${now}`,
                    keys.keyRateUnacknowledged, `${unacknowledgedRate}|${now}`,
                    noop);
            } else processHalt();
        }, 1000);
    }

    return {

        /**
         *
         */
        incrementProcessingSlot() {
            const slot = new Date().getMilliseconds();
            processingSlots[slot] += 1;
        },

        /**
         *
         */
        incrementAcknowledgedSlot() {
            const slot = new Date().getMilliseconds();
            acknowledgedSlots[slot] += 1;
        },

        /**
         *
         */
        incrementUnacknowledgedSlot() {
            const slot = new Date().getMilliseconds();
            unacknowledgedSlots[slot] += 1;
        },

        /**
         *
         */
        incrementInputSlot() {
            const slot = new Date().getMilliseconds();
            inputSlots[slot] += 1;
        },

        /**
         *
         * @returns {boolean}
         */
        start() {
            if (halt) return false;
            client = redisClient.getNewInstance(config);
            if (eventEmitter.hasOwnProperty('consumerId')) runConsumerStats();
            else runProducerStats();
            return true;
        },

        /**
         *
         * @returns {boolean}
         */
        stop() {
            if (halt) return false;
            halt = true;
            return true;
        },
    };
}

module.exports = stats;

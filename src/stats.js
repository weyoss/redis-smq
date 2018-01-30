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
    let client = null;
    let inputRate = 0;
    let processingRate = 0;
    let acknowledgedRate = 0;
    let unacknowledgedRate = 0;
    let interval = 0;
    let halt = false;

    /**
     *
     */
    function processHalt() {
        clearInterval(interval);
        client.end(true);
        client = null;
        halt = false;
        eventEmitter.emit('stats_halt');
    }

    /**
     *
     */
    function runProducerStats() {
        const keys = redisKeys.getKeys(eventEmitter.queueName, null, eventEmitter.producerId);
        interval = setInterval(() => {
            if (!halt) {
                inputRate = inputSlots.reduce((acc, cur) => acc + cur, 0);
                inputSlots.fill(0);
                client.setex(keys.keyRateInput, 1, inputRate);
            } else processHalt();
        }, 1000);
    }

    /**
     *
     */
    function runConsumerStats() {
        const keys = redisKeys.getKeys(eventEmitter.queueName, eventEmitter.consumerId);
        let idle = 0;
        interval = setInterval(() => {
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
                const multi = client.multi();
                multi.setex(keys.keyRateProcessing, 1, processingRate);
                multi.setex(keys.keyRateAcknowledged, 1, acknowledgedRate);
                multi.setex(keys.keyRateUnacknowledged, 1, unacknowledgedRate);
                multi.exec();
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

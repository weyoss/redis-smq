'use strict';

const redisClient = require('./redis-client');

/**
 * 
 * @param dispatcher
 * @return {*}
 */
function stats(dispatcher) {
    const inputSlots = new Array(1000).fill(0);
    const processingSlots = new Array(1000).fill(0);
    const acknowledgedSlots = new Array(1000).fill(0);
    const unacknowledgedSlots = new Array(1000).fill(0);
    const keys = dispatcher.getKeys();
    const events = dispatcher.getEvents();
    const config = dispatcher.getConfig();
    const noop = () => {};
    let client = null;
    let inputRate = 0;
    let processingRate = 0;
    let acknowledgedRate = 0;
    let unacknowledgedRate = 0;
    let timer = null;

    /**
     *
     */
    function runProducerStats() {
        timer = setInterval(() => {
            if (dispatcher.isRunning()) {
                const now = Date.now();
                inputRate = inputSlots.reduce((acc, cur) => acc + cur, 0);
                inputSlots.fill(0);
                client.hset(keys.keyRate, keys.keyRateInput, `${inputRate}|${now}`, noop);
            }
        }, 1000);
    }

    /**
     *
     */
    function runConsumerStats() {
        let idle = 0;
        timer = setInterval(() => {
            if (dispatcher.isRunning()) {
                const now = Date.now();
                processingRate = processingSlots.reduce((acc, cur) => acc + cur, 0);
                processingSlots.fill(0);
                acknowledgedRate = acknowledgedSlots.reduce((acc, cur) => acc + cur, 0);
                acknowledgedSlots.fill(0);
                unacknowledgedRate = unacknowledgedSlots.reduce((acc, cur) => acc + cur, 0);
                unacknowledgedSlots.fill(0);
                if (dispatcher.isTest()) {
                    if (processingRate === 0 && acknowledgedRate === 0 && unacknowledgedRate === 0) idle += 1;
                    else idle = 0;
                    if (idle > 5) {
                        idle = 0;
                        dispatcher.emit(events.IDLE);
                    }
                }
                client.hmset(
                    keys.keyRate,
                    keys.keyRateProcessing, `${processingRate}|${now}`,
                    keys.keyRateAcknowledged, `${acknowledgedRate}|${now}`,
                    keys.keyRateUnacknowledged, `${unacknowledgedRate}|${now}`,
                    noop);
            }
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
            client = redisClient.getNewInstance(config);
            if (dispatcher.isConsumer()) runConsumerStats();
            else runProducerStats();
            return true;
        },

        /**
         *
         * @returns {boolean}
         */
        stop() {
            if (timer) clearInterval(timer);
            client.end(true);
            client = null;
            dispatcher.emit(events.STATS_HALT);
        },
    };
}

module.exports = stats;

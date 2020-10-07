'use strict';

const path = require('path');
const { fork } = require('child_process');
const redisClient = require('./redis-client');
const events = require('./events');

/**
 *
 * @param instance
 * @constructor
 */
function Stats(instance) {
    const inputSlots = new Array(1000).fill(0);
    const processingSlots = new Array(1000).fill(0);
    const acknowledgedSlots = new Array(1000).fill(0);
    const unacknowledgedSlots = new Array(1000).fill(0);
    const keys = instance.getInstanceRedisKeys();
    const noop = () => {};
    const states = {
        UP: 1,
        DOWN: 0,
    };
    let inputRate = 0;
    let processingRate = 0;
    let acknowledgedRate = 0;
    let unacknowledgedRate = 0;
    let redisClientInstance = null;
    let timer = null;
    let state = states.DOWN;
    let shutdownNow = null;
    let consumerIdle = [];
    let statsAggregatorThread = null;

    function runStats(fn) {
        timer = setInterval(() => {
            if (shutdownNow) shutdownNow();
            else fn();
        }, 1000);
    }

    /**
     *
     */
    function producerStats() {
        if (state === states.UP) {
            const now = Date.now();
            inputRate = inputSlots.reduce((acc, cur) => acc + cur, 0);
            inputSlots.fill(0);
            redisClientInstance.hset(keys.keyRate, keys.keyRateInput, `${inputRate}|${now}`, noop);
        }
    }

    /**
     *
     */
    function consumerStats() {
        if (state === states.UP) {
            const now = Date.now();
            processingRate = processingSlots.reduce((acc, cur) => acc + cur, 0);
            processingSlots.fill(0);
            acknowledgedRate = acknowledgedSlots.reduce((acc, cur) => acc + cur, 0);
            acknowledgedSlots.fill(0);
            unacknowledgedRate = unacknowledgedSlots.reduce((acc, cur) => acc + cur, 0);
            unacknowledgedSlots.fill(0);
            if (processingRate === 0 && acknowledgedRate === 0 && unacknowledgedRate === 0) consumerIdle.push(1);
            else consumerIdle.push(0);
            if (consumerIdle.length === 5) {
                const r = consumerIdle.find((i) => i === 0);
                if (r === undefined) instance.emit(events.IDLE);
                consumerIdle = [];
            }
            redisClientInstance.hmset(
                keys.keyRate,
                keys.keyRateProcessing, `${processingRate}|${now}`,
                keys.keyRateAcknowledged, `${acknowledgedRate}|${now}`,
                keys.keyRateUnacknowledged, `${unacknowledgedRate}|${now}`,
                noop,
            );
        }
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

        start() {
            if (state === states.DOWN) {
                redisClient.getNewInstance(instance.getConfig(), (c) => {
                    redisClientInstance = c;
                    state = states.UP;
                    instance.emit(events.STATS_UP);
                });
            }
        },

        consumerStats() {
            runStats(consumerStats);
        },

        producerStats() {
            runStats(producerStats);
        },

        startAggregator() {
            statsAggregatorThread = fork(path.resolve(path.resolve(`${__dirname}/stats-aggregator.js`)));
            statsAggregatorThread.on('error', (err) => {
                instance.error(err);
            });
            statsAggregatorThread.on('exit', (code, signal) => {
                const err = new Error(`statsAggregatorThread exited with code ${code} and signal ${signal}`);
                instance.error(err);
            });
            const config = instance.getConfig();
            statsAggregatorThread.send(JSON.stringify(config));
        },

        stopAggregator() {
            if (statsAggregatorThread) {
                statsAggregatorThread.kill('SIGHUP');
                statsAggregatorThread = null;
            }
        },

        /**
         *
         * @returns {boolean}
         */
        stop() {
            if (state === states.UP && !shutdownNow) {
                this.stopAggregator();
                shutdownNow = () => {
                    state = states.DOWN;
                    if (timer) clearInterval(timer);
                    redisClientInstance.end(true);
                    redisClientInstance = null;
                    shutdownNow = null;
                    instance.emit(events.STATS_DOWN);
                };
            }
        },
    };
}

module.exports = Stats;

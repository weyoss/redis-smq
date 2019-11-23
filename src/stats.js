'use strict';

const path = require('path');
const { fork } = require('child_process');
const redisClient = require('./redis-client');

/**
 *
 * @param dispatcher
 * @constructor
 */
function stats(dispatcher) {
    const inputSlots = new Array(1000).fill(0);
    const processingSlots = new Array(1000).fill(0);
    const acknowledgedSlots = new Array(1000).fill(0);
    const unacknowledgedSlots = new Array(1000).fill(0);
    const keys = dispatcher.getKeys();
    const events = dispatcher.getEvents();
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
                if (r === undefined) dispatcher.emit(events.IDLE);
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

        init() {
            const instance = dispatcher.getInstance();
            instance.on(events.GOING_UP, () => {
                this.start();
            });
            instance.on(events.GOING_DOWN, () => {
                this.stop();
            });
            if (dispatcher.isConsumer()) {
                statsAggregatorThread = fork(path.resolve(path.resolve(`${__dirname}/stats-aggregator.js`)));
                statsAggregatorThread.on('error', (err) => {
                    dispatcher.error(err);
                });
                statsAggregatorThread.on('exit', (code, signal) => {
                    const err = new Error(`statsAggregatorThread exited with code ${code} and signal ${signal}`);
                    dispatcher.error(err);
                });
                instance.on(events.GOING_UP, () => {
                    const config = dispatcher.getConfig();
                    statsAggregatorThread.send(JSON.stringify(config));
                });
                instance.on(events.GOING_DOWN, () => {
                    statsAggregatorThread.kill('SIGHUP');
                    statsAggregatorThread = null;
                });
            }
        },

        /**
         *
         * @returns {boolean}
         */
        start() {
            if (state === states.DOWN) {
                redisClient.getNewInstance(dispatcher.getConfig(), (c) => {
                    redisClientInstance = c;
                    state = states.UP;
                    if (dispatcher.isConsumer()) runStats(consumerStats);
                    else runStats(producerStats);
                    dispatcher.emit(events.STATS_UP);
                });
            }
        },

        /**
         *
         * @returns {boolean}
         */
        stop() {
            if (state === states.UP && !shutdownNow) {
                shutdownNow = () => {
                    state = states.DOWN;
                    if (timer) clearInterval(timer);
                    redisClientInstance.end(true);
                    redisClientInstance = null;
                    dispatcher.emit(events.STATS_DOWN);
                };
            }
        },
    };
}

module.exports = stats;

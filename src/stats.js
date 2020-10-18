'use strict';

const path = require('path');
const { fork } = require('child_process');
const redisClient = require('./redis-client');
const events = require('./events');
const PowerStateManager = require('./power-state-manager');
const Ticker = require('./ticker');

/**
 * @param instance
 * @param statsProvider
 * @return {object}
 */
function Stats(instance, statsProvider) {
    const config = instance.getConfig();
    const powerStateManager = PowerStateManager();

    /**
     * @type {object|null}
     */
    let redisClientInstance = null;

    /**
     * @type {*}
     */
    let statsAggregatorThread = null;

    /**
     * @type {object|null}
     */
    let ticker = null;

    return {
        start() {
            powerStateManager.goingUp();
            redisClient.getNewInstance(config, (c) => {
                redisClientInstance = c;
                ticker = Ticker(() => {
                    const stats = statsProvider.tick();
                    statsProvider.publish(redisClientInstance, stats);
                }, 1000);
                ticker.autoRun();
                powerStateManager.up();
                instance.emit(events.STATS_UP);
            });
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
            statsAggregatorThread.send(JSON.stringify(config));
        },

        stopAggregator() {
            if (statsAggregatorThread) {
                statsAggregatorThread.kill('SIGHUP');
                statsAggregatorThread = null;
            }
        },

        stop() {
            powerStateManager.goingDown();
            this.stopAggregator();
            ticker.shutdown(() => {
                redisClientInstance.end(true);
                redisClientInstance = null;
                powerStateManager.down();
                instance.emit(events.STATS_DOWN);
            });
        }
    };
}

module.exports = Stats;

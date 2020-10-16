'use strict';

const LockManager = require('./lock-manager');
const redisKeys = require('./redis-keys');
const redisClient = require('./redis-client');
const { getConsumersByOnlineStatus, handleOfflineConsumers } = require('./heartbeat');
const Ticker = require('./ticker');

/**
 *
 * @param {object} config
 */
function heartbeatMonitor(config) {
    if (config.hasOwnProperty('namespace')) {
        redisKeys.setNamespace(config.namespace);
    }
    const { keyHeartBeatMonitorLock } = redisKeys.getCommonKeys();
    let redisClientInstance = null;
    let lockManagerInstance = null;

    function run() {
        const handleConsumers = (offlineConsumers, cb) => {
            handleOfflineConsumers(redisClientInstance, offlineConsumers, (err) => {
                if (err) throw err;
                cb();
            });
        };
        const getOfflineConsumers = (cb) => {
            getConsumersByOnlineStatus(redisClientInstance, (err, result) => {
                if (err) throw err;
                else {
                    const { offlineConsumers } = result;
                    cb(offlineConsumers);
                }
            });
        };
        const tick = () => {
            lockManagerInstance.acquireLock(keyHeartBeatMonitorLock, 10000, (err) => {
                if (err) throw err;
                getOfflineConsumers((consumers) => handleConsumers(consumers, ticker.nextTick));
            });
        };
        const ticker = Ticker(tick, 1000);
        ticker.nextTick();
    }

    redisClient.getNewInstance(config, (c) => {
        redisClientInstance = c;
        LockManager.getInstance(config, (l) => {
            lockManagerInstance = l;
            run();
        });
    });
}

process.on('message', (c) => {
    const config = JSON.parse(c);
    heartbeatMonitor(config);
});

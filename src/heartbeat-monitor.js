'use strict';

const async = require('neo-async');
const LockManager = require('./lock-manager');
const redisClient = require('./redis-client');
const { getConsumersByOnlineStatus, handleOfflineConsumers } = require('./heartbeat');
const Ticker = require('./ticker');
const ConsumerRedisKeys = require('./consumer-redis-keys');

/**
 *
 * @param {object} config
 */
function heartbeatMonitor(config) {
    if (config.hasOwnProperty('namespace')) {
        ConsumerRedisKeys.setNamespace(config.namespace);
    }
    const { keyLockHeartBeatMonitor } = ConsumerRedisKeys.getGlobalKeys();
    const ticker = Ticker(tick, 1000);

    let redisClientInstance = null;
    let lockManagerInstance = null;

    function handleConsumers(offlineConsumers, cb) {
        handleOfflineConsumers(redisClientInstance, offlineConsumers, cb);
    }

    function getOfflineConsumers(cb) {
        getConsumersByOnlineStatus(redisClientInstance, (err, result) => {
            if (err) cb(err);
            else {
                const { offlineConsumers } = result;
                cb(null, offlineConsumers);
            }
        });
    }

    function tick() {
        lockManagerInstance.acquireLock(keyLockHeartBeatMonitor, 10000, () => {
            async.waterfall([getOfflineConsumers, handleConsumers], (err) => {
                if (err) throw err;
                ticker.nextTick();
            });
        });
    }

    redisClient.getNewInstance(config, (c) => {
        redisClientInstance = c;
        LockManager.getInstance(config, (l) => {
            lockManagerInstance = l;
            tick();
        });
    });
}

process.on('message', (c) => {
    const config = JSON.parse(c);
    heartbeatMonitor(config);
});

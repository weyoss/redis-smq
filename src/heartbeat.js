'use strict';

const os = require('os');
const path = require('path');
const { fork } = require('child_process');
const lodash = require('lodash');
const async = require('neo-async');
const redisClient = require('./redis-client');
const events = require('./events');
const PowerStateManager = require('./power-state-manager');
const Ticker = require('./ticker');
const ConsumerRedisKeys = require('./consumer-redis-keys');

const IPAddresses = getIPAddresses();

const cpuUsageStats = {
    cpuUsage: process.cpuUsage(),
    time: process.hrtime()
};

// convert hrtime to milliseconds
function hrtime(time) {
    return time[0] * 1e3 + time[1] / 1e6;
}

// convert (user/system) usage time from micro to milliseconds
function usageTime(time) {
    return time / 1000;
}

function cpuUsage() {
    const currentTimestamp = process.hrtime();
    const currentCPUUsage = process.cpuUsage();
    const timestampDiff = process.hrtime(cpuUsageStats.time);
    const cpuUsageDiff = process.cpuUsage(cpuUsageStats.cpuUsage);
    cpuUsageStats.time = currentTimestamp;
    cpuUsageStats.cpuUsage = currentCPUUsage;
    return {
        percentage: ((usageTime(cpuUsageDiff.user + cpuUsageDiff.system) / hrtime(timestampDiff)) * 100).toFixed(1),
        ...cpuUsageDiff
    };
}

function getIPAddresses() {
    const nets = os.networkInterfaces();
    const addresses = [];
    for (const netInterface in nets) {
        for (const netAddr of nets[netInterface]) {
            if (netAddr.family === 'IPv4' && !netAddr.internal) {
                addresses.push(netAddr.address);
            }
        }
    }
    return addresses;
}

function validateOnlineTimestamp(timestamp) {
    const now = Date.now();
    return now - timestamp <= 10000;
}

function handleConsumerData(hashKey, resources) {
    const { ns, queueName, consumerId } = ConsumerRedisKeys.extractData(hashKey);
    return {
        queues: {
            [ns]: {
                [queueName]: {
                    consumers: {
                        [consumerId]: {
                            id: consumerId,
                            namespace: ns,
                            queueName: queueName,
                            resources
                        }
                    }
                }
            }
        }
    };
}

function getAllHeartBeats(client, cb) {
    const { keyIndexHeartBeat } = ConsumerRedisKeys.getGlobalKeys();
    client.hgetall(keyIndexHeartBeat, (err, result) => {
        if (err) cb(err);
        else cb(null, result);
    });
}

function getConsumerHeartBeat(client, id, queueName, cb) {
    const { keyConsumerHeartBeat, keyIndexHeartBeat } = new ConsumerRedisKeys(id, queueName).getKeys();
    client.hget(keyIndexHeartBeat, keyConsumerHeartBeat, (err, res) => {
        if (err) cb(err);
        else cb(null, res);
    });
}

/**
 *
 * @param {Instance} instance
 */
function HeartBeat(instance) {
    const powerStateManager = PowerStateManager();
    const config = instance.getConfig();
    const instanceRedisKeys = instance.getInstanceRedisKeys();
    const { keyIndexHeartBeat, keyConsumerHeartBeat } = instanceRedisKeys;
    let redisClientInstance = null;
    let monitorThread = null;
    let ticker = null;

    function nextTick() {
        if (!ticker) {
            ticker = Ticker(beat, 1000);
        }
        ticker.nextTick();
    }

    function beat() {
        const usage = {
            ipAddress: IPAddresses,
            hostname: os.hostname(),
            pid: process.pid,
            ram: {
                usage: process.memoryUsage(),
                free: os.freemem(),
                total: os.totalmem()
            },
            cpu: cpuUsage()
        };
        const timestamp = Date.now();
        const payload = JSON.stringify({
            timestamp,
            usage
        });
        redisClientInstance.hset(keyIndexHeartBeat, keyConsumerHeartBeat, payload, (err) => {
            if (err) instance.error(err);
            else nextTick();
        });
    }

    function startMonitor() {
        monitorThread = fork(path.resolve(path.resolve(`${__dirname}/heartbeat-monitor.js`)));
        monitorThread.on('error', (err) => {
            instance.error(err);
        });
        monitorThread.on('exit', (code, signal) => {
            const err = new Error(`statsAggregatorThread exited with code ${code} and signal ${signal}`);
            instance.error(err);
        });
        monitorThread.send(JSON.stringify(config));
    }

    function stopMonitor() {
        if (monitorThread) {
            monitorThread.kill('SIGHUP');
            monitorThread = null;
        }
    }

    return {
        start() {
            powerStateManager.goingUp();
            redisClient.getNewInstance(config, (c) => {
                redisClientInstance = c;
                startMonitor();
                nextTick();
                instance.emit(events.HEARTBEAT_UP);
                powerStateManager.up();
            });
        },

        stop() {
            powerStateManager.goingDown();
            stopMonitor();
            ticker.shutdown(() => {
                redisClientInstance.hdel(keyIndexHeartBeat, keyConsumerHeartBeat, (err) => {
                    if (err) instance.error(err);
                    else {
                        redisClientInstance.end(true);
                        redisClientInstance = null;
                        powerStateManager.down();
                        instance.emit(events.HEARTBEAT_DOWN);
                    }
                });
            });
        }
    };
}

/**
 * @param client
 * @param cb
 */
HeartBeat.getConsumersByOnlineStatus = (client, cb) => {
    getAllHeartBeats(client, (err, data) => {
        if (err) cb(err);
        else {
            const onlineConsumers = [];
            const offlineConsumers = [];
            async.each(
                data,
                (value, key, done) => {
                    const { timestamp } = JSON.parse(value);
                    const r = validateOnlineTimestamp(timestamp);
                    if (r) onlineConsumers.push(key);
                    else offlineConsumers.push(key);
                    done();
                },
                () => {
                    cb(null, {
                        onlineConsumers,
                        offlineConsumers
                    });
                }
            );
        }
    });
};

/**
 *
 * @param {object} params
 * @param {object} params.client
 * @param {string} params.queueName
 * @param {string} params.id
 * @param {function} cb
 */
HeartBeat.isOnline = function isOnline({ client, queueName, id }, cb) {
    getConsumerHeartBeat(client, id, queueName, (err, res) => {
        if (err) cb(err);
        else {
            let online = false;
            if (res) {
                const { timestamp } = JSON.parse(res);
                online = validateOnlineTimestamp(timestamp);
            }
            cb(null, online);
        }
    });
};

/**
 * @param {object} client
 * @param {string[]} offlineConsumers
 * @param {function} cb
 */
HeartBeat.handleOfflineConsumers = (client, offlineConsumers, cb) => {
    if (offlineConsumers.length) {
        const { keyIndexHeartBeat } = ConsumerRedisKeys.getGlobalKeys();
        client.hdel(keyIndexHeartBeat, ...offlineConsumers, cb);
    } else cb();
};

/**
 *
 * @param {object} client
 * @param {function} cb
 */
HeartBeat.getOnlineConsumers = (client, cb) => {
    getAllHeartBeats(client, (err, data) => {
        if (err) cb(err);
        else {
            const onlineConsumers = {};
            async.each(
                data,
                (value, key, done) => {
                    const { usage: resources } = JSON.parse(value);
                    const r = handleConsumerData(key, resources);
                    lodash.merge(onlineConsumers, r);
                    done();
                },
                () => {
                    cb(null, onlineConsumers);
                }
            );
        }
    });
};

module.exports = HeartBeat;

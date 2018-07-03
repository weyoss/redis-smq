'use strict';

const os = require('os');
const redisKeys = require('./redis-keys');
const redisClient = require('./redis-client');

function getHeartBeatIndexName(queueName, consumerId) {
    return `${queueName}|${consumerId}`;
}

/**
 *
 * @param dispatcher
 * @return {object}
 */
function heartBeat(dispatcher) {
    const queueName = dispatcher.getQueueName();
    const instanceId = dispatcher.getInstanceId();
    const config = dispatcher.getConfig();
    const events = dispatcher.getEvents();
    const { keyHeartBeat } = dispatcher.getKeys();
    let client = null;
    let timer = null;

    return {
        start() {
            client = redisClient.getNewInstance(config);
            this.beat();
        },

        stop() {
            if (timer) clearTimeout(timer);
            const hashKey = getHeartBeatIndexName(queueName, instanceId);
            client.hdel(keyHeartBeat, hashKey, (err) => {
                if (err) dispatcher.error(err);
                else {
                    client.end(true);
                    client = null;
                    dispatcher.emit(events.HEARTBEAT_HALT);
                }
            });
        },

        beat() {
            if (dispatcher.isRunning()) {
                const usage = {
                    pid: process.pid,
                    ram: {
                        usage: process.memoryUsage(),
                        free: os.freemem(),
                        total: os.totalmem(),
                    },
                    cpu: process.cpuUsage(),
                };
                const timestamp = Date.now();
                const payload = JSON.stringify({
                    timestamp,
                    usage,
                });
                const hashKey = getHeartBeatIndexName(queueName, instanceId);
                client.hset(keyHeartBeat, hashKey, payload, (err, result) => {
                    if (err) dispatcher.error(err);
                    else {
                        timer = setTimeout(() => {
                            this.beat();
                        }, 1000);
                    }
                });
            }
        },
    };
}

/**
 *
 * @param {Object} client
 * @param {string} queueName
 * @param {string} consumerId
 * @param {function} cb
 */
heartBeat.isOnline = function isOnline(client, queueName, consumerId, cb) {
    const keys = redisKeys.getKeys();
    const hashKey = getHeartBeatIndexName(queueName, consumerId);

    const noop = () => {};
    client.hget(keys.keyHeartBeat, hashKey, (err, res) => {
        if (err) cb(err);
        else {
            let online = false;
            if (res) {
                const now = Date.now();
                const payload = JSON.parse(res);
                const { timestamp } = payload;
                online = (now - timestamp <= 10000);
                cb(null, online);

                // Do not wait for keys deletion, reply as fast as possible
                if (!online) client.hdel(keys.keyHeartBeat, hashKey, noop);
            } else {
                cb(null, online);
            }
        }
    });
};

/**
 *
 * @param {object} client
 * @param {function} cb
 */
heartBeat.getOnlineConsumers = function getOnlineConsumers(client, cb) {
    const rKeys = redisKeys.getKeys();
    const consumers = {};
    const deadConsumers = [];
    const noop = () => {};
    client.hgetall(rKeys.keyHeartBeat, (err, result) => {
        if (err) cb(err);
        else if (result) {
            const now = Date.now();
            for (const hashKey in result) {
                const { timestamp, usage: resources } = JSON.parse(result[hashKey]);
                if (now - timestamp <= 10000) {
                    const [queueName, consumerId] = hashKey.split('|');
                    if (!consumers.hasOwnProperty(queueName)) (consumers[queueName] = []);
                    consumers[queueName].push({
                        consumerId,
                        resources,
                    });
                } else deadConsumers.push(hashKey);
            }
            // Do not wait for keys deletion, reply as fast as possible
            if (deadConsumers.length) client.hdel(rKeys.keyHeartBeat, ...deadConsumers, noop);
            cb(null, consumers);
        } else cb(null, consumers);
    });
};

module.exports = heartBeat;

'use strict';

const os = require('os');
const redisKeys = require('./redis-keys');
const redisClient = require('./redis-client');

function getHeartBeatIndexName(queueName, consumerId) {
    const ns = redisKeys.getNamespace();
    return `${ns}|${queueName}|${consumerId}`;
}

/**
 *
 * @param dispatcher
 * @constructor
 */
function heartBeat(dispatcher) {
    const queueName = dispatcher.getQueueName();
    const instanceId = dispatcher.getInstanceId();
    const events = dispatcher.getEvents();
    const { keyHeartBeat } = dispatcher.getKeys();
    const states = {
        UP: 1,
        DOWN: 0,
    };
    let redisClientInstance = null;
    let state = states.DOWN;
    let timer = null;
    let shutdownNow = null;

    function beat() {
        if (state === states.UP) {
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
            redisClientInstance.hset(keyHeartBeat, hashKey, payload, (err) => {
                if (err) dispatcher.error(err);
                else {
                    timer = setTimeout(() => {
                        if (shutdownNow) shutdownNow();
                        else beat();
                    }, 1000);
                }
            });
        }
    }

    return {
        init() {
            const instance = dispatcher.getInstance();
            instance.on(events.GOING_UP, () => {
                this.start();
            });
            instance.on(events.GOING_DOWN, () => {
                this.stop();
            });
        },

        start() {
            if (state === states.DOWN) {
                state = states.UP;
                redisClient.getNewInstance(dispatcher.getConfig(), (c) => {
                    redisClientInstance = c;
                    this.beat();
                    dispatcher.emit(events.HEARTBEAT_UP);
                });
            }
        },

        stop() {
            if (state === states.UP && !shutdownNow) {
                shutdownNow = () => {
                    state = states.DOWN;
                    shutdownNow = null;
                    if (timer) clearTimeout(timer);
                    const hashKey = getHeartBeatIndexName(queueName, instanceId);
                    redisClientInstance.hdel(keyHeartBeat, hashKey, (err) => {
                        if (err) dispatcher.error(err);
                        else {
                            redisClientInstance.end(true);
                            redisClientInstance = null;
                            dispatcher.emit(events.HEARTBEAT_DOWN);
                        }
                    });
                };
            }
        },

        beat,
    };
}

/**
 *
 * @param {Object} params
 * @param {Object} params.client
 * @param {string} params.ns
 * @param {string} params.queueName
 * @param {string} params.id
 * @param {function} cb
 */
heartBeat.isOnline = function isOnline(params, cb) {
    const { client, queueName, id } = params;
    const keys = redisKeys.getKeys();
    const hashKey = getHeartBeatIndexName(queueName, id);

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
    const data = {
        queues: {},
    };
    const deadConsumers = [];
    const noop = () => {};
    client.hgetall(rKeys.keyHeartBeat, (err, result) => {
        if (err) cb(err);
        else if (result) {
            const now = Date.now();
            for (const hashKey in result) {
                const { timestamp, usage: resources } = JSON.parse(result[hashKey]);
                if (now - timestamp <= 10000) {
                    const [ns, queueName, consumerId] = hashKey.split('|');
                    if (!data.queues[ns]) {
                        data.queues[ns] = {};
                    }
                    if (!data.queues[ns][queueName]) {
                        data.queues[ns][queueName] = {
                            consumers: {},
                        };
                    }
                    if (!data.queues[ns][queueName].consumers[consumerId]) {
                        data.queues[ns][queueName].consumers[consumerId] = {
                            id: consumerId,
                        };
                    }
                    data.queues[ns][queueName].consumers[consumerId].resources = resources;
                } else deadConsumers.push(hashKey);
            }
            // Do not wait for keys deletion, reply as fast as possible
            if (deadConsumers.length) client.hdel(rKeys.keyHeartBeat, ...deadConsumers, noop);
            cb(null, data);
        } else cb(null, data);
    });
};

module.exports = heartBeat;

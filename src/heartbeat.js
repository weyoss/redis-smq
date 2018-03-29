'use strict';

const os = require('os');
const redisKeys = require('./redis-keys');
const redisClient = require('./redis-client');

/**
 *
 * @param {object} consumer
 * @returns {object}
 */
function heartBeat(consumer) {
    const { queueName, consumerId, config } = consumer;
    const { keyHeartBeat } = consumer.keys;
    let client = null;
    let halt = false;

    /**
     *
     */
    function processHalt() {
        client.del(keyHeartBeat, (err) => {
            if (err) consumer.emit('error', err);
            client.end(true);
            client = null;
            consumer.emit('heartbeat_halt');
        });
    }

    return {
        start() {
            halt = false;
            client = redisClient.getNewInstance(config);
            this.beat();
        },

        stop() {
            halt = true;
        },

        beat() {
            if (!halt) {
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
                const hashKey = `${queueName}|${consumerId}`;
                client.hset(keyHeartBeat, hashKey, payload, (err, result) => {
                    if (err) consumer.emit('error', err);
                    else {
                        setTimeout(() => {
                            this.beat();
                        }, 1000);
                    }
                });
            } else processHalt();
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
    const hashKey = `${queueName}|${consumerId}`;
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
                // Do not wait for keys deletion, reply as fast as possible
                if (!online) client.hdel(keys.keyHeartBeat, hashKey, noop);
            }
            cb(null, online);
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

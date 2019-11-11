'use strict';

const lodash = require('lodash');
const lockManager = require('./lock-manager');
const redisKeys = require('./redis-keys');
const redisClient = require('./redis-client');
const { getOnlineConsumers } = require('./heartbeat');
const util = require('./util');

/**
 *
 * @param config
 */
function statsAggregator(config) {
    if (config.hasOwnProperty('namespace')) {
        redisKeys.setNamespace(config.namespace);
    }

    const rKeys = redisKeys.getKeys();

    const noop = () => {};

    let redisClientInstance = null;

    let lockManagerInstance = null;

    /**
     *
     * @param {function} cb
     */
    function getRates(cb) {
        const data = {
            rates: {
                processing: 0,
                acknowledged: 0,
                unacknowledged: 0,
                input: 0,
            },
            queues: {},
        };

        const processResult = (result) => {
            if (result) {
                const now = Date.now();
                const expiredKeys = [];
                const keyTypes = redisKeys.getKeyTypes();
                for (const key in result) {
                    const segments = redisKeys.getKeySegments(key);
                    const { ns, queueName, type } = segments;
                    if (!data.queues[ns]) {
                        data.queues[ns] = {};
                    }
                    if (!data.queues[ns][queueName]) {
                        data.queues[ns][queueName] = {
                            name: queueName,
                            namespace: ns,
                            consumers: {},
                            producers: {},
                        };
                    }
                    const [valueStr, timestamp] = result[key].split('|');
                    if (now - timestamp <= 1000) {
                        const value = Number(valueStr);
                        const { consumers, producers } = data.queues[ns][queueName];
                        let rates = null;
                        if (type === keyTypes.KEY_TYPE_RATE_INPUT) {
                            if (!producers[segments.producerId]) {
                                producers[segments.producerId] = {
                                    id: segments.producerId,
                                    rates: {},
                                };
                            }
                            rates = producers[segments.producerId].rates;
                        } else {
                            if (!consumers[segments.consumerId]) {
                                consumers[segments.consumerId] = {
                                    id: segments.consumerId,
                                    rates: {
                                        processing: 0,
                                        acknowledged: 0,
                                        unacknowledged: 0,
                                    },
                                };
                            }
                            rates = consumers[segments.consumerId].rates;
                        }
                        /* eslint default-case: 0 indent: 0 */
                        switch (type) {
                            case keyTypes.KEY_TYPE_RATE_PROCESSING:
                                data.rates.processing += value;
                                rates.processing = value;
                                break;

                            case keyTypes.KEY_TYPE_RATE_ACKNOWLEDGED:
                                data.rates.acknowledged += value;
                                rates.acknowledged = value;
                                break;

                            case keyTypes.KEY_TYPE_RATE_UNACKNOWLEDGED:
                                data.rates.unacknowledged += value;
                                rates.unacknowledged = value;
                                break;

                            case keyTypes.KEY_TYPE_RATE_INPUT:
                                data.rates.input += value;
                                rates.input = value;
                                break;
                        }
                    } else expiredKeys.push(key);
                }
                // Do not wait for keys deletion, reply as fast as possible
                if (expiredKeys.length) redisClientInstance.hdel(rKeys.keyRate, ...expiredKeys, noop);
            }
            cb(null, data);
        };
        redisClientInstance.hgetall(rKeys.keyRate, (err, result) => {
            if (err) cb(err);
            else processResult(result);
        });
    }

    /**
     *
     * @param {Array} queues
     * @param {function} cb
     */
    function getQueuesSize(queues, cb) {
        const data = {
            queues: {},
        };
        const keyTypes = redisKeys.getKeyTypes();
        if (queues && queues.length) {
            const multi = redisClientInstance.multi();
            for (const queueName of queues) multi.llen(queueName);
            multi.exec((err, res) => {
                if (err) cb(err);
                else {
                    res.forEach((size, index) => {
                        const { ns, queueName, type } = redisKeys.getKeySegments(queues[index]);
                        if (!data.queues[ns]) {
                            data.queues[ns] = {};
                        }
                        data.queues[ns][queueName] = {
                            name: queueName,
                            namespace: ns,
                        };
                        if (type === keyTypes.KEY_TYPE_DEAD_LETTER_QUEUE) {
                            data.queues[ns][queueName] = {
                                erroredMessages: size,
                            };
                        } else {
                            data.queues[ns][queueName] = {
                                size,
                            };
                        }
                    });
                    cb(null, data);
                }
            });
        } else cb(null, data);
    }

    /**
     *
     * @param {function} cb
     */
    function getMessageQueues(cb) {
        util.getMessageQueues(redisClientInstance, (err, queues) => {
            if (err) cb(err);
            else getQueuesSize(queues, cb);
        });
    }

    /**
     *
     * @param {function} cb
     */
    function getDLQueues(cb) {
        util.getDLQueues(redisClientInstance, (err, queues) => {
            if (err) cb(err);
            else getQueuesSize(queues, cb);
        });
    }

    /**
     *
     * @param {function} cb
     */
    function getStats(cb) {
        const result = {};
        const onDeadQueues = (err, deadLetterQueues) => {
            if (err) cb(err);
            else {
                lodash.merge(result, deadLetterQueues);
                cb(null, result);
            }
        };
        const onQueues = (err, queues) => {
            if (err) cb(err);
            else {
                lodash.merge(result, queues);
                getDLQueues(onDeadQueues);
            }
        };
        const onConsumers = (err, consumers) => {
            if (err) cb(err);
            else {
                lodash.merge(result, consumers);
                getMessageQueues(onQueues);
            }
        };
        const onRates = (err, rates) => {
            if (err) cb(err);
            else {
                lodash.merge(result, rates);
                getOnlineConsumers(redisClientInstance, onConsumers);
            }
        };
        getRates(onRates);
    }

    function run() {
        const onPublished = (err) => {
            if (err) throw err;
            else {
                setTimeout(() => {
                    run();
                }, 1000);
            }
        };
        const sanitize = (data) => {
            for (const ns in data.queues) {
                for (const name in data.queues[ns]) {
                    if (!data.queues[ns][name].consumers) {
                        data.queues[ns][name].consumers = {};
                    }
                    if (!data.queues[ns][name].producers) {
                        data.queues[ns][name].producers = {};
                    }
                    for (const consumerId in data.queues[ns][name].consumers) {
                        const consumer = data.queues[ns][name].consumers[consumerId];
                        if (!consumer.rates || !consumer.resources) {
                            delete data.queues[ns][name].consumers[consumerId];
                        }
                    }
                }
            }
        };
        const onData = (err, data) => {
            if (err) throw err;
            else {
                sanitize(data);
                const statsString = JSON.stringify(data);
                redisClientInstance.publish('stats', statsString, onPublished);
            }
        };
        lockManagerInstance.acquireLock(rKeys.keyStatsAggregatorLock, 10000, () => {
            getStats(onData);
        });
    }

    return {
        /**
         *
         */
        start() {
            const getLockManager = (c) => {
                redisClientInstance = c;
                lockManager.getInstance(config, (l) => {
                    lockManagerInstance = l;
                    run();
                });
            };
            redisClient.getNewInstance(config, getLockManager);
        },
    };
}

let instance = null;

process.on('message', (c) => {
    if (!instance) {
        const config = JSON.parse(c);
        instance = statsAggregator(config);
        instance.start();
    }
});

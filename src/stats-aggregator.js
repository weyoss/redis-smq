'use strict';

const lodash = require('lodash');
const async = require('neo-async');
const LockManager = require('./lock-manager');
const redisClient = require('./redis-client');
const { getOnlineConsumers } = require('./heartbeat');
const Instance = require('./instance');
const MQRedisKeys = require('./mq-redis-keys');
const InstanceRedisKeys = require('./instance-redis-keys');
const ConsumerRedisKeys = require('./consumer-redis-keys');
const ProducerRedisKeys = require('./producer-redis-keys');

/**
 *
 * @param {object} config
 * @return {object}
 */
function StatsAggregator(config) {
    if (config.hasOwnProperty('namespace')) {
        MQRedisKeys.setNamespace(config.namespace);
    }
    const { keyIndexRate, keyLockStatsAggregator } = InstanceRedisKeys.getGlobalKeys();
    const noop = () => {};

    /**
     * @type {object|null}
     */
    let redisClientInstance = null;

    /**
     *
     * @type {LockManager|null}
     */
    let lockManagerInstance = null;

    /**
     * @type {object|null}
     */
    let data = null;

    /**
     * @param {function} cb
     */
    function getRates(cb) {
        const addConsumerIfNotExists = (ns, queueName, consumerId) => {
            const { consumers } = data.queues[ns][queueName];
            if (!consumers[consumerId]) {
                consumers[consumerId] = {
                    id: consumerId,
                    namespace: ns,
                    queueName: queueName,
                    rates: {
                        processing: 0,
                        acknowledged: 0,
                        unacknowledged: 0
                    }
                };
            }
        };

        const addProducerIfNotExists = (ns, queueName, producerId) => {
            const { producers } = data.queues[ns][queueName];
            if (!producers[producerId]) {
                producers[producerId] = {
                    id: producerId,
                    namespace: ns,
                    queueName: queueName,
                    rates: {}
                };
            }
        };

        const addQueueIfNotExists = (ns, queueName) => {
            if (!data.queues[ns]) {
                data.queues[ns] = {};
            }
            if (!data.queues[ns][queueName]) {
                data.queues[ns][queueName] = {
                    name: queueName,
                    namespace: ns,
                    consumers: {},
                    producers: {}
                };
            }
        };

        const handleProducerRate = ({ ns, queueName, producerId }, rate) => {
            addQueueIfNotExists(ns, queueName);
            rate = Number(rate);
            const { producers } = data.queues[ns][queueName];
            addProducerIfNotExists(ns, queueName, producerId);
            data.rates.input += rate;
            producers[producerId].rates.input = rate;
        };

        const handleConsumerRate = ({ ns, queueName, type, consumerId }, rate) => {
            addQueueIfNotExists(ns, queueName);
            rate = Number(rate);
            const { consumers } = data.queues[ns][queueName];
            addConsumerIfNotExists(ns, queueName, consumerId);
            const consumerTypes = ConsumerRedisKeys.getTypes();
            switch (type) {
                case consumerTypes.KEY_TYPE_CONSUMER_RATE_PROCESSING:
                    data.rates.processing += rate;
                    consumers[consumerId].rates.processing = rate;
                    break;

                case consumerTypes.KEY_TYPE_CONSUMER_RATE_ACKNOWLEDGED:
                    data.rates.acknowledged += rate;
                    consumers[consumerId].rates.acknowledged = rate;
                    break;

                case consumerTypes.KEY_TYPE_CONSUMER_RATE_UNACKNOWLEDGED:
                    data.rates.unacknowledged += rate;
                    consumers[consumerId].rates.unacknowledged = rate;
                    break;
            }
        };

        const hasExpired = (timestamp) => {
            const now = Date.now();
            return now - timestamp > 1000;
        };

        redisClientInstance.hgetall(keyIndexRate, (err, result) => {
            if (err) cb(err);
            else {
                if (result) {
                    const expiredKeys = [];
                    async.each(
                        result,
                        (item, key, done) => {
                            const [rate, timestamp] = item.split('|');
                            if (!hasExpired(timestamp)) {
                                let extractedData = ProducerRedisKeys.extractData(key);
                                if (extractedData) handleProducerRate(extractedData, rate);
                                else {
                                    extractedData = ConsumerRedisKeys.extractData(key);
                                    handleConsumerRate(extractedData, rate);
                                }
                            } else expiredKeys.push(key);
                            done();
                        },
                        () => {
                            if (expiredKeys.length) redisClientInstance.hdel(keyIndexRate, ...expiredKeys, noop);
                            cb();
                        }
                    );
                } else cb();
            }
        });
    }

    /**
     * @param {string[]} queues
     * @param {function} cb
     */
    function getQueueSize(queues, cb) {
        if (queues && queues.length) {
            const multi = redisClientInstance.multi();
            const handleResult = (res) => {
                const instanceTypes = InstanceRedisKeys.getTypes();
                async.each(
                    res,
                    (size, index, done) => {
                        const { ns, queueName, type } = InstanceRedisKeys.extractData(queues[index]);
                        if (!data.queues[ns]) {
                            data.queues[ns] = {};
                        }
                        if (!data.queues[ns][queueName]) {
                            data.queues[ns][queueName] = {};
                        }
                        data.queues[ns][queueName] = {
                            ...data.queues[ns][queueName],
                            name: queueName,
                            namespace: ns
                        };
                        if (type === instanceTypes.KEY_TYPE_QUEUE_DLQ) {
                            data.queues[ns][queueName].erroredMessages = size;
                        } else {
                            data.queues[ns][queueName].size = size;
                        }
                        done();
                    },
                    () => cb()
                );
            };
            async.each(
                queues,
                (queue, done) => {
                    multi.llen(queue);
                    done();
                },
                () => {
                    multi.exec((err, res) => {
                        if (err) cb(err);
                        else handleResult(res);
                    });
                }
            );
        } else cb();
    }

    /**
     * @param {function} cb
     */
    function getQueues(cb) {
        Instance.getMessageQueues(redisClientInstance, (err, queues) => {
            if (err) cb(err);
            else cb(null, queues);
        });
    }

    /**
     * @param {function} cb
     */
    function getDLQQueues(cb) {
        Instance.getDLQQueues(redisClientInstance, (err, queues) => {
            if (err) cb(err);
            else cb(null, queues);
        });
    }

    function getConsumers(cb) {
        getOnlineConsumers(redisClientInstance, (err, consumers) => {
            if (err) cb(err);
            else {
                lodash.merge(data, consumers);
                cb();
            }
        });
    }

    function sanitizeData(cb) {
        const handleConsumer = (consumer, done) => {
            if (!consumer.rates || !consumer.resources) {
                const { id, namespace, queueName } = consumer;
                delete data.queues[namespace][queueName].consumers[id];
            }
            done();
        };
        const handleQueue = (queue, done) => {
            if (!queue.consumers) {
                queue.consumers = {};
            }
            if (!queue.producers) {
                queue.producers = {};
            }
            async.each(queue.consumers, handleConsumer, done);
        };
        const handleQueues = (queues, done) => {
            async.each(queues, handleQueue, done);
        };

        // this way: async.each(data.queues, handleQueues, cb), it doesn't work.
        async.each(data.queues, handleQueues, () => cb());
    }

    function publish(cb) {
        const statsString = JSON.stringify(data);
        redisClientInstance.publish('stats', statsString, cb);
    }

    function nextTick() {
        setTimeout(() => {
            run();
        }, 1000);
    }

    function reset(cb) {
        data = {
            rates: {
                processing: 0,
                acknowledged: 0,
                unacknowledged: 0,
                input: 0
            },
            queues: {}
        };
        cb();
    }

    function run() {
        lockManagerInstance.acquireLock(keyLockStatsAggregator, 10000, (err) => {
            if (err) throw err;
            async.waterfall(
                [
                    reset,
                    getRates,
                    getConsumers,
                    getQueues,
                    getQueueSize,
                    getDLQQueues,
                    getQueueSize,
                    sanitizeData,
                    publish
                ],
                (err) => {
                    if (err) throw err;
                    nextTick();
                }
            );
        });
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
    StatsAggregator(config);
});

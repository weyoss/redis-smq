'use strict';

const redisKeys = require('./redis-keys');
const redisClient = require('./redis-client');
const heartBeat = require('./heartbeat');
const queue = require('./queue');

/**
 *
 * @param {object} config
 * @returns {object}
 */
function statsFrontend(config) {
    const client = redisClient.getNewInstance(config);
    const rKeys = redisKeys.getKeys();
    let lockAcquired = false;

    /**
     *
     * @param {function} cb
     */
    function acquireLock(cb) {
        if (lockAcquired) {
            client.expire(rKeys.keyStatsFrontendLock, 10, (err) => {
                if (err) cb(err);
                else cb();
            });
        } else {
            client.set(rKeys.keyStatsFrontendLock, 1, 'EX', 10, 'NX', (err, success) => {
                if (err) cb(err);
                else {
                    lockAcquired = !!success;
                    if (lockAcquired) cb();
                    else {
                        setTimeout(() => {
                            acquireLock(cb);
                        }, 1000);
                    }
                }
            });
        }
    }

    /**
     *
     * @param {function} cb
     */
    function getRates(cb) {
        const rates = {
            processing: 0,
            acknowledged: 0,
            unacknowledged: 0,
            input: 0,
            consumers: {},
            producers: {},
        };
        const processResult = (result) => {
            const now = Date.now();
            const expiredKeys = [];
            const keyTypes = redisKeys.getKeyTypes();
            for (const key in result) {
                const [valueStr, timestamp] = result[key].split('|');
                if (now - timestamp <= 1000) {
                    const value = Number(valueStr);
                    const segments = redisKeys.getKeySegments(key);
                    if (segments.type !== keyTypes.KEY_TYPE_RATE_INPUT) {
                        if (!rates.consumers.hasOwnProperty(segments.queueName)) {
                            rates.consumers[segments.queueName] = {};
                        }
                        if (!rates.consumers[segments.queueName].hasOwnProperty(segments.consumerId)) {
                            rates.consumers[segments.queueName][segments.consumerId] = {};
                        }
                    } else if (!rates.producers.hasOwnProperty(segments.queueName)) {
                        rates.producers[segments.queueName] = {};
                    }
                    /* eslint default-case: 0 indent: 0 */
                    switch (segments.type) {
                        case keyTypes.KEY_TYPE_RATE_PROCESSING:
                            rates.processing += value;
                            rates.consumers[segments.queueName][segments.consumerId].processing = value;
                            break;

                        case keyTypes.KEY_TYPE_RATE_ACKNOWLEDGED:
                            rates.acknowledged += value;
                            rates.consumers[segments.queueName][segments.consumerId].acknowledged = value;
                            break;

                        case keyTypes.KEY_TYPE_RATE_UNACKNOWLEDGED:
                            rates.unacknowledged += value;
                            rates.consumers[segments.queueName][segments.consumerId].unacknowledged = value;
                            break;

                        case keyTypes.KEY_TYPE_RATE_INPUT:
                            rates.input += value;
                            rates.producers[segments.queueName][segments.producerId] = value;
                            break;
                    }
                } else expiredKeys.push(key);
            }
            // Do not wait for keys deletion, reply as fast as possible
            if (expiredKeys.length) client.hdel(rKeys.keyRate, ...expiredKeys);
            cb(null, rates);
        };
        client.hgetall(rKeys.keyRate, (err, result) => {
            if (err) cb(err);
            else if (result) processResult(result);
            else cb(null, rates);
        });
    }

    /**
     *
     * @param {Array} queues
     * @param {function} cb
     */
    function getQueuesSize(queues, cb) {
        queue.calculateQueueSize(client, queues, (err, res) => {
            if (err) cb(err);
            else cb(null, res);
        });
    }

    /**
     *
     * @param {function} cb
     */
    function getMessageQueues(cb) {
        queue.getMessageQueues(client, (err, queues) => {
            if (err) cb(err);
            else getQueuesSize(queues, cb);
        });
    }

    /**
     *
     * @param {function} cb
     */
    function getDLQueues(cb) {
        queue.getDLQueues(client, (err, queues) => {
            if (err) cb(err);
            else getQueuesSize(queues, cb);
        });
    }

    /**
     *
     * @param {function} cb
     */
    function getStats(cb) {
        const stats = {};
        const onDeadQueues = (err, deadLetterQueues) => {
            if (err) cb(err);
            else {
                stats.deadLetterQueues = deadLetterQueues;
                cb(null, stats);
            }
        };
        const onQueues = (err, queues) => {
            if (err) cb(err);
            else {
                stats.queues = queues;
                getDLQueues(onDeadQueues);
            }
        };
        const onConsumers = (err, consumers) => {
            if (err) cb(err);
            else {
                stats.consumers = consumers;
                getMessageQueues(onQueues);
            }
        };
        const onRates = (err, rates) => {
            if (err) cb(err);
            else {
                stats.rates = rates;
                heartBeat.getOnlineConsumers(client, onConsumers);
            }
        };
        getRates(onRates);
    }

    return {

        /**
         *
         */
        run() {
            const onPublished = (err) => {
                if (err) throw err;
                else {
                    setTimeout(() => {
                        this.run();
                    }, 1000);
                }
            };
            const onStats = (err, stats) => {
                if (err) throw err;
                else {
                    const statsString = JSON.stringify(stats);
                    client.publish('stats', statsString, onPublished);
                }
            };
            acquireLock((err) => {
                if (err) throw err;
                else getStats(onStats);
            });
        },
    };
}

module.exports = statsFrontend;

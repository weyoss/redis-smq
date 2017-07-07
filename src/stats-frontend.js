'use strict';

const redisKeys = require('./redis-keys');
const redisClient = require('./redis-client');
const heartBeat = require('./hearbeat');
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
        let ratesKeys = [];
        const onRatesValues = (err, values) => {
            if (err) cb(err);
            else {
                values.forEach((value, index) => {
                    if (value) {
                        value = Number(value);
                        const segments = redisKeys.getKeySegments(ratesKeys[index]);
                        if (segments.type !== 'input') {
                            if (!rates.consumers.hasOwnProperty(segments.queueName)) {
                                rates.consumers[segments.queueName] = {};
                            }
                            if (!rates.consumers[segments.queueName].hasOwnProperty(segments.id)) {
                                rates.consumers[segments.queueName][segments.id] = {};
                            }
                        } else if (!rates.producers.hasOwnProperty(segments.queueName)) {
                            rates.producers[segments.queueName] = {};
                        }
                        /* eslint default-case: 0 indent: 0 */
                        switch (segments.type) {
                            case 'processing':
                                rates.processing += value;
                                rates.consumers[segments.queueName][segments.id].processing = value;
                                break;

                            case 'acknowledged':
                                rates.acknowledged += value;
                                rates.consumers[segments.queueName][segments.id].acknowledged = value;
                                break;

                            case 'unacknowledged':
                                rates.unacknowledged += value;
                                rates.consumers[segments.queueName][segments.id].unacknowledged = value;
                                break;

                            case 'input':
                                rates.input += value;
                                rates.producers[segments.queueName][segments.id] = value;
                                break;
                        }
                    }
                });
                cb(null, rates);
            }
        };
        const onRatesKeys = (err, res) => {
            if (err) cb(err);
            else {
                const [cur, keys] = res;
                if (keys && keys.length) {
                    ratesKeys = keys;
                    client.mget(keys, onRatesValues);
                } else cb(null, rates);
            }
        };
        client.scan('0', 'match', rKeys.patternRate, 'count', 1000, onRatesKeys);
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
    function getQueues(cb) {
        queue.getQueues(client, (err, queues) => {
            if (err) cb(err);
            else getQueuesSize(queues, cb);
        });
    }

    /**
     *
     * @param {function} cb
     */
    function getDeadLetterQueues(cb) {
        queue.getDeadLetterQueues(client, (err, queues) => {
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
                getDeadLetterQueues(onDeadQueues);
            }
        };
        const onConsumers = (err, consumers) => {
            if (err) cb(err);
            else {
                stats.consumers = consumers;
                getQueues(onQueues);
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

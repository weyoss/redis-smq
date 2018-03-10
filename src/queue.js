'use strict';

const redisKeys = require('./redis-keys');

module.exports = {
    /**
     *
     * @param {object} client
     * @param {string} queueName
     * @param {function} cb
     */
    addMessageQueue(client, queueName, cb) {
        const keys = redisKeys.getKeys();
        client.sadd(keys.keyMessageQueuesIndex, queueName, (err) => {
            if (err) cb(err);
            else cb();
        });
    },

    /**
     *
     * @param {object} client
     * @param {string} queueName
     * @param {function} cb
     */
    addProcessingQueue(client, queueName, cb) {
        const keys = redisKeys.getKeys();
        client.sadd(keys.keyProcessingQueuesIndex, queueName, (err) => {
            if (err) cb(err);
            else cb();
        });
    },

    /**
     *
     * @param {object} client
     * @param {string} queueName
     * @param {function} cb
     */
    purgeProcessingQueue(client, queueName, cb) {
        const keys = redisKeys.getKeys();
        const multi = client.multi();
        multi.srem(keys.keyProcessingQueuesIndex, queueName);
        multi.del(queueName);
        multi.exec((err) => {
            if (err) cb(err);
            else cb();
        });
    },

    /**
     *
     * @param {object} client
     * @param {string} queueName
     * @param {function} cb
     */
    addDLQueue(client, queueName, cb) {
        const keys = redisKeys.getKeys();
        client.sadd(keys.keyDLQueuesIndex, queueName, (err) => {
            if (err) cb(err);
            else cb();
        });
    },

    /**
     *
     * @param {object} client
     * @param {function} cb
     */
    getMessageQueues(client, cb) {
        const keys = redisKeys.getKeys();
        client.smembers(keys.keyMessageQueuesIndex, (err, result) => {
            if (err) cb(err);
            else if (result.length) cb(null, result);
            else cb();
        });
    },

    /**
     *
     * @param {object} client
     * @param {function} cb
     */
    getDLQueues(client, cb) {
        const keys = redisKeys.getKeys();
        client.smembers(keys.keyDLQueuesIndex, (err, result) => {
            if (err) cb(err);
            else if (result.length) cb(null, result);
            else cb();
        });
    },

    /**
     *
     * @param {object} client
     * @param {function} cb
     */
    getProcessingQueues(client, cb) {
        const keys = redisKeys.getKeys();
        client.smembers(keys.keyProcessingQueuesIndex, (err, result) => {
            if (err) cb(err);
            else if (result.length) cb(null, result);
            else cb();
        });
    },

    /**
     *
     * @param {object} client
     * @param {Array} queues
     * @param {function} cb
     */
    calculateQueueSize(client, queues, cb) {
        const queuesList = [];
        if (queues && queues.length) {
            const multi = client.multi();
            for (const queueName of queues) multi.llen(queueName);
            multi.exec((err, res) => {
                if (err) cb(err);
                else {
                    res.forEach((size, index) => {
                        const segments = redisKeys.getKeySegments(queues[index]);
                        queuesList.push({
                            name: segments.queueName,
                            size,
                        });
                    });
                    cb(null, queuesList);
                }
            });
        } else cb(null, queuesList);
    },

};

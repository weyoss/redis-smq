'use strict';

const redisKeys = require('./redis-keys').getKeys();


module.exports = {
    /**
     *
     * @param redisClient
     * @param queueName
     * @param cb
     */
    rememberMessageQueue(redisClient, queueName, cb) {
        redisClient.sadd(redisKeys.keyMessageQueuesIndex, queueName, cb);
    },

    /**
     *
     * @param redisClient
     * @param queueName
     * @param cb
     */
    rememberProcessingQueue(redisClient, queueName, cb) {
        redisClient.sadd(redisKeys.keyProcessingQueuesIndex, queueName, cb);
    },

    /**
     *
     * @param redisClient
     * @param queueName
     * @param cb
     */
    purgeProcessingQueue(redisClient, queueName, cb) {
        const multi = redisClient.multi();
        multi.srem(redisKeys.keyProcessingQueuesIndex, queueName);
        multi.del(queueName);
        multi.exec(err => cb);
    },

    /**
     *
     * @param redisClient
     * @param queueName
     * @param cb
     */
    rememberDLQueue(redisClient, queueName, cb) {
        redisClient.sadd(redisKeys.keyDLQueuesIndex, queueName, cb);
    },

    /**
     *
     * @param redisClient
     * @param cb
     */
    getMessageQueues(redisClient, cb) {
        redisClient.smembers(redisKeys.keyMessageQueuesIndex, cb);
    },

    /**
     *
     * @param redisClient
     * @param cb
     */
    getDLQueues(redisClient, cb) {
        redisClient.smembers(redisKeys.keyDLQueuesIndex, cb);
    },

    /**
     *
     * @param redisClient
     * @param cb
     */
    getProcessingQueues(redisClient, cb) {
        redisClient.smembers(redisKeys.keyProcessingQueuesIndex, cb);
    },
};

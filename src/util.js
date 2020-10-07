'use strict';

const redisKeys = require('./redis-keys');

module.exports = {
    /**
     *
     * @param {object} redisClient
     * @param {string} queueName
     * @param {function} cb
     */
    rememberMessageQueue(redisClient, queueName, cb) {
        const { keyMessageQueuesIndex } = redisKeys.getCommonKeys();
        redisClient.sadd(keyMessageQueuesIndex, queueName, cb);
    },

    /**
     *
     * @param {object} redisClient
     * @param {string} processingQueueName
     * @param {function} cb
     */
    rememberProcessingQueue(redisClient, processingQueueName, cb) {
        const { keyProcessingQueuesIndex } = redisKeys.getCommonKeys();
        const { queueName, consumerId } = redisKeys.getKeySegments(processingQueueName);
        const { keyQueueNameProcessingCommon } = redisKeys.getQueueKeys(queueName);
        const multi = redisClient.multi();
        multi.hset(keyQueueNameProcessingCommon, processingQueueName, consumerId);
        multi.sadd(keyProcessingQueuesIndex, processingQueueName);
        multi.exec(cb);
    },

    /**
     *
     * @param {object} redisClient
     * @param {string} processingQueueName
     * @param {function} cb
     */
    purgeProcessingQueue(redisClient, processingQueueName, cb) {
        const { keyProcessingQueuesIndex } = redisKeys.getCommonKeys();
        const { queueName } = redisKeys.getKeySegments(processingQueueName);
        const { keyQueueNameProcessingCommon } = redisKeys.getQueueKeys(queueName);
        const multi = redisClient.multi();
        multi.srem(keyProcessingQueuesIndex, processingQueueName);
        multi.hdel(keyQueueNameProcessingCommon, processingQueueName);
        multi.del(processingQueueName);
        multi.exec(cb);
    },

    /**
     *
     * @param {object} redisClient
     * @param {string} queueName
     * @param {function} cb
     */
    rememberDLQueue(redisClient, queueName, cb) {
        const { keyDLQueuesIndex } = redisKeys.getCommonKeys();
        redisClient.sadd(keyDLQueuesIndex, queueName, cb);
    },

    /**
     *
     * @param {object} redisClient
     * @param {function} cb
     */
    getMessageQueues(redisClient, cb) {
        const { keyMessageQueuesIndex } = redisKeys.getCommonKeys();
        redisClient.smembers(keyMessageQueuesIndex, cb);
    },

    /**
     *
     * @param {object} redisClient
     * @param {function} cb
     */
    getDLQueues(redisClient, cb) {
        const { keyDLQueuesIndex } = redisKeys.getCommonKeys();
        redisClient.smembers(keyDLQueuesIndex, cb);
    },

    /**
     *
     * @param {object} redisClient
     * @param {function} cb
     */
    getProcessingQueues(redisClient, cb) {
        const { keyProcessingQueuesIndex } = redisKeys.getCommonKeys();
        redisClient.smembers(keyProcessingQueuesIndex, cb);
    },

    /**
     *
     * @param {object} redisClient
     * @param {string} keyQueueNameProcessingCommon
     * @param {function} cb
     */
    getProcessingQueuesOf(redisClient, keyQueueNameProcessingCommon, cb) {
        redisClient.hkeys(keyQueueNameProcessingCommon, cb);
    }
};

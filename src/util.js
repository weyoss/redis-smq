'use strict';

const redisKeys = require('./redis-keys');


module.exports = {
    /**
     *
     * @param redisClient
     * @param queueName
     * @param cb
     */
    rememberMessageQueue(redisClient, queueName, cb) {
        const { keyMessageQueuesIndex } = redisKeys.getKeys();
        redisClient.sadd(keyMessageQueuesIndex, queueName, cb);
    },

    /**
     *
     * @param redisClient
     * @param processingQueueName
     * @param cb
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
     * @param redisClient
     * @param processingQueueName
     * @param cb
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
     * @param redisClient
     * @param queueName
     * @param cb
     */
    rememberDLQueue(redisClient, queueName, cb) {
        const { keyDLQueuesIndex } = redisKeys.getKeys();
        redisClient.sadd(keyDLQueuesIndex, queueName, cb);
    },

    /**
     *
     * @param redisClient
     * @param cb
     */
    getMessageQueues(redisClient, cb) {
        const { keyMessageQueuesIndex } = redisKeys.getKeys();
        redisClient.smembers(keyMessageQueuesIndex, cb);
    },

    /**
     *
     * @param redisClient
     * @param cb
     */
    getDLQueues(redisClient, cb) {
        const { keyDLQueuesIndex } = redisKeys.getKeys();
        redisClient.smembers(keyDLQueuesIndex, cb);
    },

    /**
     *
     * @param redisClient
     * @param cb
     */
    getProcessingQueues(redisClient, cb) {
        const { keyProcessingQueuesIndex } = redisKeys.getKeys();
        redisClient.smembers(keyProcessingQueuesIndex, cb);
    },

    /**
     *
     * @param redisClient
     * @param keyQueueNameProcessingCommon
     * @param cb
     * @return {*}
     */
    getProcessingQueuesOf(redisClient, keyQueueNameProcessingCommon, cb) {
        redisClient.hkeys(keyQueueNameProcessingCommon, cb);
    },
};

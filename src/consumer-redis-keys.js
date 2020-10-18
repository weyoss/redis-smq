'use strict';

const InstanceRedisKeys = require('./instance-redis-keys');

/**
 * Keeping type values unchanged for compatibility with previous versions (<= 2.x.x).
 * In the next major release type values will be refactored.
 */
const types = {
    KEY_TYPE_CONSUMER_RATE_PROCESSING: '4.2',
    KEY_TYPE_CONSUMER_RATE_ACKNOWLEDGED: '4.3',
    KEY_TYPE_CONSUMER_RATE_UNACKNOWLEDGED: '4.4',
    KEY_TYPE_CONSUMER_HEARTBEAT: '4.5',
    KEY_TYPE_CONSUMER_PROCESSING_QUEUE: '1.2',
    KEY_TYPE_LOCK_GC: '3.1',
    KEY_TYPE_INDEX_QUEUE_QUEUES_PROCESSING: '6.4', // index of all processing queues of a given queue
    KEY_TYPE_INDEX_QUEUE_PROCESSING: '6.2', // index of all processing queues
    KEY_TYPE_INDEX_HEARTBEAT: '2.1',
    KEY_TYPE_LOCK_HEARTBEAT_MONITOR: '2.2'
};

class ConsumerRedisKeys extends InstanceRedisKeys {
    getKeys(redisKeys) {
        const parentKeys = super.getKeys();
        const globalKeys = ConsumerRedisKeys.getGlobalKeys();
        const keys = {};
        keys.keyConsumerProcessingQueue = ConsumerRedisKeys.joinSegments(
            types.KEY_TYPE_CONSUMER_PROCESSING_QUEUE,
            this.queueName,
            this.instanceId
        );
        keys.keyConsumerRateUnacknowledged = ConsumerRedisKeys.joinSegments(
            types.KEY_TYPE_CONSUMER_RATE_UNACKNOWLEDGED,
            this.queueName,
            this.instanceId
        );
        keys.keyConsumerHeartBeat = ConsumerRedisKeys.joinSegments(
            types.KEY_TYPE_CONSUMER_HEARTBEAT,
            this.queueName,
            this.instanceId
        );
        keys.keyConsumerRateProcessing = ConsumerRedisKeys.joinSegments(
            types.KEY_TYPE_CONSUMER_RATE_PROCESSING,
            this.queueName,
            this.instanceId
        );
        keys.keyConsumerRateAcknowledged = ConsumerRedisKeys.joinSegments(
            types.KEY_TYPE_CONSUMER_RATE_ACKNOWLEDGED,
            this.queueName,
            this.instanceId
        );
        keys.keyLockGC = ConsumerRedisKeys.joinSegments(types.KEY_TYPE_LOCK_GC, this.queueName);
        keys.keyIndexQueueQueuesProcessing = ConsumerRedisKeys.joinSegments(
            types.KEY_TYPE_INDEX_QUEUE_QUEUES_PROCESSING,
            this.queueName
        );
        return {
            ...parentKeys,
            ...globalKeys,
            ...this.makeNamespacedKeys(keys)
        };
    }
}

ConsumerRedisKeys.getTypes = () => {
    return {
        ...types
    };
};

ConsumerRedisKeys.extractData = (key) => {
    const { ns, segments } = ConsumerRedisKeys.getSegments(key);
    if (
        segments[0] === types.KEY_TYPE_CONSUMER_PROCESSING_QUEUE ||
        segments[0] === types.KEY_TYPE_CONSUMER_RATE_PROCESSING ||
        segments[0] === types.KEY_TYPE_CONSUMER_RATE_ACKNOWLEDGED ||
        segments[0] === types.KEY_TYPE_CONSUMER_RATE_UNACKNOWLEDGED ||
        segments[0] === types.KEY_TYPE_CONSUMER_HEARTBEAT
    ) {
        const [type, queueName, consumerId] = segments;
        return {
            ns,
            queueName,
            type,
            consumerId
        };
    }
    if (segments[0] === types.KEY_TYPE_LOCK_GC || segments[0] === types.KEY_TYPE_INDEX_QUEUE_QUEUES_PROCESSING) {
        const [type, queueName] = segments;
        return {
            ns,
            type,
            queueName
        };
    }
    return false;
};

ConsumerRedisKeys.getGlobalKeys = () => {
    const parentKeys = InstanceRedisKeys.getGlobalKeys();
    const keys = {};
    keys.keyIndexHeartBeat = types.KEY_TYPE_INDEX_HEARTBEAT;
    keys.keyLockHeartBeatMonitor = types.KEY_TYPE_LOCK_HEARTBEAT_MONITOR;
    keys.keyIndexQueueProcessing = types.KEY_TYPE_INDEX_QUEUE_PROCESSING;
    return {
        ...parentKeys,
        ...ConsumerRedisKeys.makeGlobalNamespacedKeys(keys)
    };
};

module.exports = ConsumerRedisKeys;

'use strict';

const MQRedisKeys = require('./mq-redis-keys');

/**
 * Keeping type values unchanged for compatibility with previous versions (<= 2.x.x).
 * In the next major release type values will be refactored.
 */
const types = {
    KEY_TYPE_QUEUE: '1.1',
    KEY_TYPE_QUEUE_DLQ: '1.3',
    KEY_TYPE_QUEUE_DELAYED_QUEUE: '1.4',
    KEY_TYPE_LOCK_SCHEDULER: '7.1',
    KEY_TYPE_INDEX_RATE: '4',
    KEY_TYPE_INDEX_QUEUE: '6.1',
    KEY_TYPE_INDEX_QUEUE_DLQ: '6.3',
    KEY_TYPE_LOCK_STATS_AGGREGATOR: '5.1'
};

class InstanceRedisKeys extends MQRedisKeys {
    /**
     * @param instanceId
     * @param queueName
     */
    constructor(instanceId, queueName) {
        super();
        this.queueName = queueName;
        this.instanceId = instanceId;
    }

    getKeys() {
        const globalKeys = InstanceRedisKeys.getGlobalKeys();
        const keys = {};
        keys.keyQueue = InstanceRedisKeys.joinSegments(types.KEY_TYPE_QUEUE, this.queueName);
        keys.keyQueueDLQ = InstanceRedisKeys.joinSegments(types.KEY_TYPE_QUEUE_DLQ, this.queueName);
        keys.keyQueueDelayed = InstanceRedisKeys.joinSegments(types.KEY_TYPE_QUEUE_DELAYED_QUEUE, this.queueName);
        keys.keyLockScheduler = InstanceRedisKeys.joinSegments(types.KEY_TYPE_LOCK_SCHEDULER, this.queueName);
        return {
            ...globalKeys,
            ...this.makeNamespacedKeys(keys)
        };
    }
}

InstanceRedisKeys.getTypes = () => {
    return {
        ...types
    };
};

InstanceRedisKeys.extractData = (key) => {
    const { ns, segments } = InstanceRedisKeys.getSegments(key);
    if (
        segments[0] === types.KEY_TYPE_QUEUE ||
        segments[0] === types.KEY_TYPE_QUEUE_DELAYED_QUEUE ||
        segments[0] === types.KEY_TYPE_QUEUE_DLQ ||
        segments[0] === types.KEY_TYPE_LOCK_SCHEDULER
    ) {
        const [type, queueName] = segments;
        return {
            ns,
            type,
            queueName
        };
    }
    return false;
};

InstanceRedisKeys.getGlobalKeys = () => {
    const keys = {};
    keys.keyIndexQueue = types.KEY_TYPE_INDEX_QUEUE;
    keys.keyIndexQueueDLQ = types.KEY_TYPE_INDEX_QUEUE_DLQ;
    keys.keyIndexRate = types.KEY_TYPE_INDEX_RATE;
    keys.keyLockStatsAggregator = types.KEY_TYPE_LOCK_STATS_AGGREGATOR;
    return MQRedisKeys.makeGlobalNamespacedKeys(keys);
};

module.exports = InstanceRedisKeys;

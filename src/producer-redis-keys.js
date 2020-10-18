'use strict';

const InstanceRedisKeys = require('./instance-redis-keys');

/**
 * Keeping type values unchanged for compatibility with previous versions (<= 2.x.x)
 * In the next major release type values will be refactored.
 */
const types = {
    KEY_TYPE_PRODUCER_RATE_INPUT: '4.1'
};

class ProducerRedisKeys extends InstanceRedisKeys {
    getKeys(redisKeys) {
        const parentKeys = super.getKeys();
        const globalKeys = ProducerRedisKeys.getGlobalKeys();
        const keys = {};
        keys.keyProducerRateInput = ProducerRedisKeys.joinSegments(
            types.KEY_TYPE_PRODUCER_RATE_INPUT,
            this.queueName,
            this.instanceId
        );
        return {
            ...parentKeys,
            ...globalKeys,
            ...this.makeNamespacedKeys(keys)
        };
    }
}

ProducerRedisKeys.getTypes = () => {
    return {
        ...types
    };
};

ProducerRedisKeys.extractData = (key) => {
    const { ns, segments } = ProducerRedisKeys.getSegments(key);
    if (segments[0] === types.KEY_TYPE_PRODUCER_RATE_INPUT) {
        const [type, queueName, producerId] = segments;
        return {
            ns,
            type,
            queueName,
            producerId
        };
    }
    return false;
};

module.exports = ProducerRedisKeys;

'use strict';

const globalNamespace = '___redis-smq-global-ns';

let namespace = 'redis-smq-default-ns';

const keyTypes = {
    KEY_TYPE_MESSAGE_QUEUE: '1.1',
    KEY_TYPE_PROCESSING_QUEUE: '1.2',
    KEY_TYPE_DEAD_LETTER_QUEUE: '1.3',
    KEY_TYPE_MESSAGE_QUEUE_DELAYED: '1.4',
    KEY_TYPE_HEARTBEAT: '2.1',
    KEY_TYPE_GC_LOCK: '3.1',
    KEY_TYPE_RATE: '4',
    KEY_TYPE_RATE_INPUT: '4.1',
    KEY_TYPE_RATE_PROCESSING: '4.2',
    KEY_TYPE_RATE_ACKNOWLEDGED: '4.3',
    KEY_TYPE_RATE_UNACKNOWLEDGED: '4.4',
    KEY_TYPE_STATS_AGGREGATOR_LOCK: '5.1',
    KEY_TYPE_MESSAGE_QUEUES_INDEX: '6.1',
    KEY_TYPE_PROCESSING_QUEUES_INDEX: '6.2',
    KEY_TYPE_DEAD_LETTER_QUEUES_INDEX: '6.3',
    KEY_TYPE_SCHEDULER_LOCK: '7.1',
};

/**
 *
 * @param keys
 * @return {*}
 */
function formatKeys(keys) {
    for (const k in keys) {
        keys[k] = `${namespace}|@${keys[k]}`;
    }
    return keys;
}

/**
 *
 * @param keys
 * @returns {*}
 */
function formatGlobalKeys(keys) {
    for (const k in keys) {
        keys[k] = `${globalNamespace}|@${keys[k]}`;
    }
    return keys;
}

module.exports = {

    /**
     * 
     * @return {object}
     */
    getKeyTypes() {
        return keyTypes;
    },

    /**
     *
     * @param {string} ns
     */
    setNamespace(ns) {
        ns = this.validateKeyPart(ns);
        namespace = `redis-smq-${ns}`;
    },

    getNamespace() {
        return namespace;
    },

    /**
     *
     * @param {string} part
     * @return {string}
     */
    validateKeyPart(part) {
        if (typeof part !== 'string' || !part.length) {
            throw new Error('Redis key validation error. Expected be a non empty string.');
        }
        const filtered = part.toLowerCase().replace(/[^a-z0-9_-]/g, '');
        if (filtered.length !== part.length) {
            throw new Error('Redis key validation error. Expected only letters (a-z), numbers (0-9) and (-_)');
        }
        return filtered;
    },

    /**
     *
     * @param dispatcher
     */
    getKeys(dispatcher = null) {
        if (dispatcher) {
            const instanceId = dispatcher.getInstanceId();
            const queueName = dispatcher.getQueueName();
            if (dispatcher.isConsumer()) {
                return this.getConsumerKeys(instanceId, queueName);
            }
            if (dispatcher.isProducer()) {
                return this.getProducerKeys(instanceId, queueName);
            }
        }
        return this.getCommonKeys();
    },

    /**
     *
     * @param instanceId
     * @param queueName
     * @return {*}
     */
    getConsumerKeys(instanceId, queueName) {
        const consumerKeys = {};
        consumerKeys.keyQueueNameProcessing = `${keyTypes.KEY_TYPE_PROCESSING_QUEUE}|${queueName}|${instanceId}`;
        consumerKeys.keyRateProcessing = `${keyTypes.KEY_TYPE_RATE_PROCESSING}|${queueName}|${instanceId}`;
        consumerKeys.keyRateAcknowledged = `${keyTypes.KEY_TYPE_RATE_ACKNOWLEDGED}|${queueName}|${instanceId}`;
        consumerKeys.keyRateUnacknowledged = `${keyTypes.KEY_TYPE_RATE_UNACKNOWLEDGED}|${queueName}|${instanceId}`;
        const keys = formatKeys(consumerKeys);
        Object.assign(keys, this.getQueueKeys(queueName));
        Object.assign(keys, this.getCommonKeys());
        return keys;
    },

    /**
     *
     * @param instanceId
     * @param queueName
     * @return {*}
     */
    getProducerKeys(instanceId, queueName) {
        const producerKeys = {};
        producerKeys.keyRateInput = `${keyTypes.KEY_TYPE_RATE_INPUT}|${queueName}|${instanceId}`;
        const keys = formatKeys(producerKeys);
        Object.assign(keys, this.getQueueKeys(queueName));
        Object.assign(keys, this.getCommonKeys());
        return keys;
    },

    /**
     *
     * @param queueName
     * @return {*}
     */
    getQueueKeys(queueName) {
        const keys = {};
        keys.keyQueueName = `${keyTypes.KEY_TYPE_MESSAGE_QUEUE}|${queueName}`;
        keys.keyQueueNameDelayed = `${keyTypes.KEY_TYPE_MESSAGE_QUEUE_DELAYED}|${queueName}`;
        keys.keyQueueNameDead = `${keyTypes.KEY_TYPE_DEAD_LETTER_QUEUE}|${queueName}`;
        keys.keyQueueNameProcessingCommon = `${keyTypes.KEY_TYPE_PROCESSING_QUEUE}|${queueName}`;
        keys.keyGCLock = `${keyTypes.KEY_TYPE_GC_LOCK}|${queueName}`;
        keys.keySchedulerLock = `${keyTypes.KEY_TYPE_SCHEDULER_LOCK}|${queueName}`;
        return formatKeys(keys);
    },

    /**
     *
     * @return {*}
     */
    getCommonKeys() {
        const keys = {};
        keys.keyHeartBeat = keyTypes.KEY_TYPE_HEARTBEAT;
        keys.keyMessageQueuesIndex = keyTypes.KEY_TYPE_MESSAGE_QUEUES_INDEX;
        keys.keyProcessingQueuesIndex = keyTypes.KEY_TYPE_PROCESSING_QUEUES_INDEX;
        keys.keyDLQueuesIndex = keyTypes.KEY_TYPE_DEAD_LETTER_QUEUES_INDEX;
        keys.keyStatsAggregatorLock = keyTypes.KEY_TYPE_STATS_AGGREGATOR_LOCK;
        keys.keyRate = keyTypes.KEY_TYPE_RATE;
        return formatGlobalKeys(keys);
    },

    /**
     *
     * @param {string} key
     * @returns {object}
     */
    getKeySegments(key) {
        const segments = key.split('|');
        const ns = segments[0];
        const type = segments[1].replace(/[@]/g, '');
        if (type === keyTypes.KEY_TYPE_PROCESSING_QUEUE
            || type === keyTypes.KEY_TYPE_HEARTBEAT
            || type === keyTypes.KEY_TYPE_RATE_PROCESSING
            || type === keyTypes.KEY_TYPE_RATE_ACKNOWLEDGED
            || type === keyTypes.KEY_TYPE_RATE_UNACKNOWLEDGED) {
            const [, , queueName, consumerId] = segments;
            return {
                ns,
                type,
                queueName,
                consumerId,
            };
        }
        if (type === keyTypes.KEY_TYPE_RATE_INPUT) {
            const [, , queueName, producerId] = segments;
            return {
                ns,
                type,
                queueName,
                producerId,
            };
        }
        if (type === keyTypes.KEY_TYPE_MESSAGE_QUEUE
            || type === keyTypes.KEY_TYPE_DEAD_LETTER_QUEUE
            || type === keyTypes.KEY_TYPE_GC_LOCK) {
            const [, , queueName] = segments;
            return {
                ns,
                type,
                queueName,
            };
        }
        return {};
    },
};

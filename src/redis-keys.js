'use strict';

let namespace = 'default';

module.exports = {

    /**
     *
     * @param {string} ns
     */
    setNamespace(ns) {
        namespace = this.validateKeyPart(ns);
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
        const filtered = part.toLowerCase().replace(/[^a-z0-9_-]/gi, '');
        if (filtered.length !== part.length) {
            throw new Error('Redis key validation error. Expected only letters (a-z), numbers (0-9) and (-_)');
        }
        return filtered;
    },

    /**
     *
     * @param {object} args
     * @param {string} args.queueName
     * @param {string} [args.consumerId]
     * @param {string} [args.producerId]
     * @returns {object}
     */
    getKeys(args = {}) {
        let { queueName } = args;
        const { consumerId, producerId } = args;
        if (queueName && queueName.indexOf('queue:') === 10) {
            queueName = queueName.split(':')[2];
        }
        const keys = {};
        keys.patternQueueNameDead = 'dead:*';
        keys.patternQueueNameProcessing = 'processing:*';
        keys.patternQueueName = 'queue:*';
        keys.patternHeartBeat = 'heartbeat:*';
        keys.patternGC = 'gc:*';
        keys.patternRate = 'rate:*';
        keys.patternRateProcessing = 'rate:processing:*';
        keys.patternRateAcknowledged = 'rate:acknowledged:*';
        keys.patternRateUnacknowledged = 'rate:unacknowledged:*';
        keys.patternRateInput = 'rate:input:*';
        keys.keyStatsFrontendLock = 'stats:frontend:lock';
        if (queueName) {
            keys.patternQueueNameProcessing = `processing:${queueName}:*`;
            keys.keyQueueName = `queue:${queueName}`;
            keys.keyQueueNameDead = `dead:${queueName}`;
            keys.keyGCLock = `gc:${queueName}:lock`;
            keys.keyGCLockTmp = `${keys.keyGCLock}:tmp`;
            if (consumerId) {
                keys.keyQueueNameProcessing = `processing:${queueName}:${consumerId}`;
                keys.keyHeartBeat = `heartbeat:${queueName}:${consumerId}`;
                keys.keyRateProcessing = `rate:processing:${queueName}:${consumerId}`;
                keys.keyRateAcknowledged = `rate:acknowledged:${queueName}:${consumerId}`;
                keys.keyRateUnacknowledged = `rate:unacknowledged:${queueName}:${consumerId}`;
            }
            if (producerId) {
                keys.keyRateInput = `rate:input:${queueName}:${producerId}`;
            }
        }
        const ns = `redis-smp-${namespace}`;
        for (const k in keys) keys[k] = `${ns}:${keys[k]}`;
        return keys;
    },

    /**
     *
     * @param {string} key
     * @returns {object}
     */
    getKeySegments(key) {
        if (key.indexOf('processing:') === 10) {
            const [, , queueName, consumerId] = key.split(':');
            return {
                queueName,
                consumerId,
            };
        }
        if (key.indexOf('rate:') === 10) {
            const [, , type, queueName, id] = key.split(':');
            return {
                type,
                queueName,
                id,
            };
        }
        if (key.indexOf('heartbeat:') === 10) {
            const [, , queueName, consumerId] = key.split(':');
            return {
                queueName,
                consumerId,
            };
        }
        if (key.indexOf('dead:') === 10 || key.indexOf('queue:') === 10) {
            const [, , queueName] = key.split(':');
            return {
                queueName,
            };
        }
        return {};
    },
};

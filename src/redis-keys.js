'use strict';

let namespace = 'default';

const keyTypes = {
    KEY_TYPE_MESSAGE_QUEUE: '1.1',
    KEY_TYPE_PROCESSING_QUEUE: '1.2',
    KEY_TYPE_DEAD_LETTER_QUEUE: '1.3',
    KEY_TYPE_HEARTBEAT: '2.1',
    KEY_TYPE_GC_LOCK: '3.1',
    KEY_TYPE_GC_LOCK_TMP: '3.2',
    KEY_TYPE_RATE_INPUT: '4.1',
    KEY_TYPE_RATE_PROCESSING: '4.2',
    KEY_TYPE_RATE_ACKNOWLEDGED: '4.3',
    KEY_TYPE_RATE_UNACKNOWLEDGED: '4.4',
    KEY_TYPE_STATS_FRONTEND_LOCK: '5.1',
};


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
        const filtered = part.toLowerCase().replace(/[^a-z0-9_-]/g, '');
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
        if (queueName && queueName.indexOf(`|@${keyTypes.KEY_TYPE_MESSAGE_QUEUE}|`) > 0) {
            queueName = queueName.split('|')[2].replace(/[@]/g, '');
        }
        const keys = {};

        /**
         * Key patterns
         */
        keys.patternQueueNameDead = `@${keyTypes.KEY_TYPE_DEAD_LETTER_QUEUE}|*`;
        keys.patternQueueNameProcessing = `@${keyTypes.KEY_TYPE_PROCESSING_QUEUE}|*`;
        keys.patternQueueName = `@${keyTypes.KEY_TYPE_MESSAGE_QUEUE}|*`;
        keys.patternHeartBeat = `@${keyTypes.KEY_TYPE_HEARTBEAT}|*`;
        keys.patternGC = '@3.*';
        keys.patternRate = '@4.*';
        keys.patternRateProcessing = `@${keyTypes.KEY_TYPE_RATE_PROCESSING}|*`;
        keys.patternRateAcknowledged = `@${keyTypes.KEY_TYPE_RATE_ACKNOWLEDGED}|*`;
        keys.patternRateUnacknowledged = `@${keyTypes.KEY_TYPE_RATE_UNACKNOWLEDGED}|*`;
        keys.patternRateInput = `@${keyTypes.KEY_TYPE_RATE_INPUT}|*`;
        keys.keyStatsFrontendLock = `@${keyTypes.KEY_TYPE_STATS_FRONTEND_LOCK}`;
        if (queueName) {
            keys.patternQueueNameProcessing = `@${keyTypes.KEY_TYPE_PROCESSING_QUEUE}|${queueName}|*`;
            keys.keyQueueName = `@${keyTypes.KEY_TYPE_MESSAGE_QUEUE}|${queueName}`;
            keys.keyQueueNameDead = `@${keyTypes.KEY_TYPE_DEAD_LETTER_QUEUE}|${queueName}`;
            keys.keyGCLock = `@${keyTypes.KEY_TYPE_GC_LOCK}|${queueName}`;
            keys.keyGCLockTmp = `@${keyTypes.KEY_TYPE_GC_LOCK_TMP}|${queueName}`;
            if (consumerId) {
                keys.keyQueueNameProcessing = `@${keyTypes.KEY_TYPE_PROCESSING_QUEUE}|${queueName}|${consumerId}`;
                keys.keyHeartBeat = `@${keyTypes.KEY_TYPE_HEARTBEAT}|${queueName}|${consumerId}`;
                keys.keyRateProcessing = `@${keyTypes.KEY_TYPE_RATE_PROCESSING}|${queueName}|${consumerId}`;
                keys.keyRateAcknowledged = `@${keyTypes.KEY_TYPE_RATE_ACKNOWLEDGED}|${queueName}|${consumerId}`;
                keys.keyRateUnacknowledged = `@${keyTypes.KEY_TYPE_RATE_UNACKNOWLEDGED}|${queueName}|${consumerId}`;
            }
            if (producerId) {
                keys.keyRateInput = `@${keyTypes.KEY_TYPE_RATE_INPUT}|${queueName}|${producerId}`;
            }
        }
        const ns = `redis-smp-${namespace}`;
        for (const k in keys) keys[k] = `${ns}|${keys[k]}`;
        return keys;
    },

    /**
     *
     * @param {string} key
     * @returns {object}
     */
    getKeySegments(key) {
        const segments = key.split('|');
        const type = segments[1].replace(/[@]/g, '');
        if (type === keyTypes.KEY_TYPE_PROCESSING_QUEUE ||
            type === keyTypes.KEY_TYPE_HEARTBEAT ||
            keyTypes.KEY_TYPE_RATE_PROCESSING ||
            keyTypes.KEY_TYPE_RATE_ACKNOWLEDGED ||
            keyTypes.KEY_TYPE_RATE_UNACKNOWLEDGED) {
            const [, , queueName, consumerId] = segments;
            return {
                type,
                queueName,
                consumerId,
            };
        }
        if (type === keyTypes.KEY_TYPE_RATE_INPUT) {
            const [, , queueName, producerId] = segments;
            return {
                type,
                queueName,
                producerId,
            };
        }
        if (type === keyTypes.KEY_TYPE_MESSAGE_QUEUE ||
            type === keyTypes.KEY_TYPE_DEAD_LETTER_QUEUE ||
            type === keyTypes.KEY_TYPE_GC_LOCK ||
            type === keyTypes.KEY_TYPE_GC_LOCK_TMP) {
            const [, , queueName] = segments;
            return {
                type,
                queueName,
            };
        }
        return {};
    },
};

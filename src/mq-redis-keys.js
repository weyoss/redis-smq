'use strict';

const globalNamespace = '___redis-smq-global-ns';

let namespace = 'redis-smq-default-ns';

class MQRedisKeys {
    getKeys() {
        throw new Error('Method not implemented.');
    }

    makeNamespacedKeys(keys) {
        for (const k in keys) {
            keys[k] = MQRedisKeys.joinSegments(namespace, `@${keys[k]}`);
        }
        return keys;
    }

    extractData(key) {}
}

MQRedisKeys.getTypes = () => {
    throw new Error('Method not implemented.');
};

/**
 * @param {string} ns
 */
MQRedisKeys.setNamespace = (ns) => {
    ns = MQRedisKeys.sanitizeKeySegment(ns);
    namespace = `redis-smq-${ns}`;
};

/**
 * @param {string} segment
 * @return {string}
 */
MQRedisKeys.sanitizeKeySegment = (segment) => {
    if (typeof segment !== 'string' || !segment.length) {
        throw new Error('Redis key validation error. Expected be a non empty string.');
    }
    const filtered = segment.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (filtered.length !== segment.length) {
        throw new Error('Redis key validation error. Expected only letters (a-z), numbers (0-9) and (-_)');
    }
    return filtered;
};

MQRedisKeys.joinSegments = (...segments) => {
    return segments.join('|');
};

MQRedisKeys.getSegments = (key) => {
    const [ns, ...segments] = key.split('|');
    segments[0] = segments[0].replace(/[@]/g, '');
    return {
        ns,
        segments
    };
};

MQRedisKeys.makeGlobalNamespacedKeys = (keys) => {
    for (const k in keys) {
        keys[k] = MQRedisKeys.joinSegments(globalNamespace, `@${keys[k]}`);
    }
    return keys;
};

MQRedisKeys.getGlobalKeys = () => {
    return {};
};

MQRedisKeys.extractData = (key) => {
    throw new Error('Method not implemented');
};

module.exports = MQRedisKeys;

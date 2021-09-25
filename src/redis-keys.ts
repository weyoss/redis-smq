const globalNamespace = '___redis-smq-global-ns';
let namespace = 'redis-smq-default-ns';

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
  KEY_INDEX_QUEUE_DELAYED_MESSAGES: '8',
  KEY_TYPE_LOCK_STATS_AGGREGATOR: '5.1',
  KEY_TYPE_INDEX_QUEUE_PROCESSING: '6.2', // index of all processing queues
  KEY_TYPE_INDEX_QUEUE_QUEUES_PROCESSING: '6.4', // index of all processing queues of a given queue
  KEY_TYPE_LOCK_GC: '3.1',
  KEY_TYPE_INDEX_HEARTBEAT: '2.1',
  KEY_TYPE_LOCK_HEARTBEAT_MONITOR: '2.2',
  KEY_TYPE_CONSUMER_RATE_PROCESSING: '4.2',
  KEY_TYPE_CONSUMER_RATE_ACKNOWLEDGED: '4.3',
  KEY_TYPE_CONSUMER_RATE_UNACKNOWLEDGED: '4.4',
  KEY_TYPE_CONSUMER_HEARTBEAT: '4.5',
  KEY_TYPE_CONSUMER_PROCESSING_QUEUE: '1.2',
  KEY_TYPE_PRODUCER_RATE_INPUT: '4.1',
};

export const redisKeys = {
  getTypes() {
    return {
      ...types,
    };
  },

  getKeys(queueName: string) {
    const globalKeys = this.getGlobalKeys();
    const keys = {
      keyQueue: this.joinSegments(types.KEY_TYPE_QUEUE, queueName),
      keyQueueDLQ: this.joinSegments(types.KEY_TYPE_QUEUE_DLQ, queueName),
      keyQueueDelayed: this.joinSegments(
        types.KEY_TYPE_QUEUE_DELAYED_QUEUE,
        queueName,
      ),
      keyLockScheduler: this.joinSegments(
        types.KEY_TYPE_LOCK_SCHEDULER,
        queueName,
      ),
      keyIndexQueueDelayedMessages: this.joinSegments(
        types.KEY_INDEX_QUEUE_DELAYED_MESSAGES,
        queueName,
      ),
      keyLockGC: this.joinSegments(types.KEY_TYPE_LOCK_GC, queueName),
      keyIndexQueueQueuesProcessing: this.joinSegments(
        types.KEY_TYPE_INDEX_QUEUE_QUEUES_PROCESSING,
        queueName,
      ),
    };
    return {
      ...globalKeys,
      ...this.makeNamespacedKeys(keys),
    };
  },

  getInstanceKeys(queueName: string, instanceId: string) {
    const parentKeys = this.getKeys(queueName);
    const globalKeys = this.getGlobalKeys();
    const keys = {
      keyConsumerProcessingQueue: this.joinSegments(
        types.KEY_TYPE_CONSUMER_PROCESSING_QUEUE,
        queueName,
        instanceId,
      ),
      keyConsumerRateUnacknowledged: this.joinSegments(
        types.KEY_TYPE_CONSUMER_RATE_UNACKNOWLEDGED,
        queueName,
        instanceId,
      ),
      keyConsumerHeartBeat: this.joinSegments(
        types.KEY_TYPE_CONSUMER_HEARTBEAT,
        queueName,
        instanceId,
      ),
      keyConsumerRateProcessing: this.joinSegments(
        types.KEY_TYPE_CONSUMER_RATE_PROCESSING,
        queueName,
        instanceId,
      ),
      keyConsumerRateAcknowledged: this.joinSegments(
        types.KEY_TYPE_CONSUMER_RATE_ACKNOWLEDGED,
        queueName,
        instanceId,
      ),
      keyProducerRateInput: this.joinSegments(
        types.KEY_TYPE_PRODUCER_RATE_INPUT,
        queueName,
        instanceId,
      ),
    };
    return {
      ...parentKeys,
      ...globalKeys,
      ...this.makeNamespacedKeys(keys),
    };
  },

  extractData(key: string) {
    const { ns, segments } = this.getSegments(key);
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
        queueName,
      };
    }
    if (
      segments[0] === types.KEY_TYPE_LOCK_GC ||
      segments[0] === types.KEY_TYPE_INDEX_QUEUE_QUEUES_PROCESSING
    ) {
      const [type, queueName] = segments;
      return {
        ns,
        type,
        queueName,
      };
    }
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
        consumerId,
      };
    }
    if (segments[0] === types.KEY_TYPE_PRODUCER_RATE_INPUT) {
      const [type, queueName, producerId] = segments;
      return {
        ns,
        type,
        queueName,
        producerId,
      };
    }
    return null;
  },

  getSegments(key: string) {
    const [ns, ...segments] = key.split('|');
    segments[0] = segments[0].replace(/[@]/g, '');
    return {
      ns,
      segments,
    };
  },

  getGlobalKeys() {
    const keys = {
      keyIndexQueue: types.KEY_TYPE_INDEX_QUEUE,
      keyIndexQueueDLQ: types.KEY_TYPE_INDEX_QUEUE_DLQ,
      keyIndexRate: types.KEY_TYPE_INDEX_RATE,
      keyLockStatsAggregator: types.KEY_TYPE_LOCK_STATS_AGGREGATOR,
      keyIndexQueueProcessing: types.KEY_TYPE_INDEX_QUEUE_PROCESSING,
      keyIndexHeartBeat: types.KEY_TYPE_INDEX_HEARTBEAT,
      keyLockHeartBeatMonitor: types.KEY_TYPE_LOCK_HEARTBEAT_MONITOR,
    };
    return this.makeGlobalNamespacedKeys(keys);
  },

  joinSegments(...segments: string[]) {
    return segments.join('|');
  },

  makeGlobalNamespacedKeys<T extends Record<string, string>>(
    keys: T,
  ): Record<Extract<keyof T, string>, string> {
    const result: Record<string, string> = {};
    for (const k in keys) {
      result[k] = this.joinSegments(globalNamespace, `@${keys[k]}`);
    }
    return result;
  },

  makeNamespacedKeys<T extends Record<string, string>>(
    keys: T,
  ): Record<Extract<keyof T, string>, string> {
    const result: Record<string, string> = {};
    for (const k in keys) {
      result[k] = this.joinSegments(namespace, `@${keys[k]}`);
    }
    return result;
  },

  setNamespace(ns: string) {
    ns = this.validateRedisKey(ns);
    namespace = `redis-smq-${ns}`;
  },

  validateRedisKey(key: string) {
    if (!key || !key.length) {
      throw new Error(
        'Redis key validation error. Expected be a non empty string.',
      );
    }
    const filtered = key.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (filtered.length !== key.length) {
      throw new Error(
        'Redis key validation error. Expected only letters (a-z), numbers (0-9) and (-_)',
      );
    }
    return filtered;
  },
};

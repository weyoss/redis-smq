const globalNamespace = '___redis-smq-global-ns';
let namespace = 'redis-smq-default-ns';

/**
 * Keeping type values unchanged for compatibility with previous versions (<= 3.x.x).
 * In the next major release type values will be refactored.
 */
const types = {
  KEY_QUEUE: '1.1',
  KEY_QUEUE_DL: '1.3',
  KEY_QUEUE_SCHEDULED_MESSAGES: '1.4',
  KEY_QUEUE_PRIORITY: '1.5',
  KEY_QUEUE_PROCESSING: '1.2',
  KEY_QUEUE_ACKNOWLEDGED_MESSAGES: '1.6',
  KEY_QUEUE_UNACKNOWLEDGED_MESSAGES: '1.7',

  KEY_INDEX_QUEUES: '6.1', // Redis key for message queues
  KEY_INDEX_DL_QUEUES: '6.3', // Redis key for dead-letter queues
  KEY_INDEX_SCHEDULED_MESSAGES: '8', // Redis key for scheduled messages of a given queue
  KEY_INDEX_MESSAGE_PROCESSING_QUEUES: '6.2', // Redis key for all processing queues
  KEY_INDEX_QUEUE_MESSAGE_PROCESSING_QUEUES: '6.4', // Redis key for processing queues of a given queue
  KEY_INDEX_RATES: '4', // Redis key for rates from all producers and consumers
  KEY_INDEX_HEARTBEATS: '2.1', // Redis key for consumers heartbeats

  KEY_LOCK_SCHEDULER: '7.1',
  KEY_LOCK_STATS_AGGREGATOR: '5.1',
  KEY_LOCK_GC: '3.1',
  KEY_LOCK_HEARTBEAT_MONITOR: '2.2',

  KEY_RATE_PRODUCER_INPUT: '4.1',
  KEY_RATE_CONSUMER_PROCESSING: '4.2',
  KEY_RATE_CONSUMER_ACKNOWLEDGED: '4.3',
  KEY_RATE_CONSUMER_UNACKNOWLEDGED: '4.4',

  KEY_HEARTBEAT: '4.5',

  KEY_METADATA_QUEUE: '9',
  KEY_METADATA_MESSAGE: '10',
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
      keyQueue: this.joinSegments(types.KEY_QUEUE, queueName),
      keyQueueDL: this.joinSegments(types.KEY_QUEUE_DL, queueName),
      keyQueueScheduledMessages: this.joinSegments(
        types.KEY_QUEUE_SCHEDULED_MESSAGES,
        queueName,
      ),
      keyLockScheduler: this.joinSegments(types.KEY_LOCK_SCHEDULER, queueName),
      keyLockGC: this.joinSegments(types.KEY_LOCK_GC, queueName),
      keyIndexQueueMessageProcessingQueues: this.joinSegments(
        types.KEY_INDEX_QUEUE_MESSAGE_PROCESSING_QUEUES,
        queueName,
      ),
      keyQueuePriority: this.joinSegments(types.KEY_QUEUE_PRIORITY, queueName),
      keyMetadataQueue: this.joinSegments(types.KEY_METADATA_QUEUE, queueName),
      keyQueueAcknowledgedMessages: this.joinSegments(
        types.KEY_QUEUE_ACKNOWLEDGED_MESSAGES,
        queueName,
      ),
      keyQueueUnacknowledgedMessages: this.joinSegments(
        types.KEY_QUEUE_UNACKNOWLEDGED_MESSAGES,
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
      keyQueueProcessing: this.joinSegments(
        types.KEY_QUEUE_PROCESSING,
        queueName,
        instanceId,
      ),
      keyRateConsumerUnacknowledged: this.joinSegments(
        types.KEY_RATE_CONSUMER_UNACKNOWLEDGED,
        queueName,
        instanceId,
      ),
      keyHeartbeat: this.joinSegments(
        types.KEY_HEARTBEAT,
        queueName,
        instanceId,
      ),
      keyRateConsumerProcessing: this.joinSegments(
        types.KEY_RATE_CONSUMER_PROCESSING,
        queueName,
        instanceId,
      ),
      keyRateConsumerAcknowledged: this.joinSegments(
        types.KEY_RATE_CONSUMER_ACKNOWLEDGED,
        queueName,
        instanceId,
      ),
      keyRateProducerInput: this.joinSegments(
        types.KEY_RATE_PRODUCER_INPUT,
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

  getMessageKeys(messageId: string) {
    const keys = {
      keyMetadataMessage: this.joinSegments(
        types.KEY_METADATA_MESSAGE,
        messageId,
      ),
    };
    return {
      ...this.makeNamespacedKeys(keys),
    };
  },

  extractData(key: string) {
    const { ns, segments } = this.getSegments(key);
    if (
      segments[0] === types.KEY_QUEUE ||
      segments[0] === types.KEY_QUEUE_SCHEDULED_MESSAGES ||
      segments[0] === types.KEY_QUEUE_DL ||
      segments[0] === types.KEY_LOCK_SCHEDULER
    ) {
      const [type, queueName] = segments;
      return {
        ns,
        type,
        queueName,
      };
    }
    if (
      segments[0] === types.KEY_LOCK_GC ||
      segments[0] === types.KEY_INDEX_QUEUE_MESSAGE_PROCESSING_QUEUES
    ) {
      const [type, queueName] = segments;
      return {
        ns,
        type,
        queueName,
      };
    }
    if (
      segments[0] === types.KEY_QUEUE_PROCESSING ||
      segments[0] === types.KEY_RATE_CONSUMER_PROCESSING ||
      segments[0] === types.KEY_RATE_CONSUMER_ACKNOWLEDGED ||
      segments[0] === types.KEY_RATE_CONSUMER_UNACKNOWLEDGED ||
      segments[0] === types.KEY_HEARTBEAT
    ) {
      const [type, queueName, consumerId] = segments;
      return {
        ns,
        queueName,
        type,
        consumerId,
      };
    }
    if (segments[0] === types.KEY_RATE_PRODUCER_INPUT) {
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
      keyIndexQueue: types.KEY_INDEX_QUEUES,
      keyIndexDLQueues: types.KEY_INDEX_DL_QUEUES,
      keyIndexRates: types.KEY_INDEX_RATES,
      keyLockStatsAggregator: types.KEY_LOCK_STATS_AGGREGATOR,
      keyIndexMessageProcessingQueues:
        types.KEY_INDEX_MESSAGE_PROCESSING_QUEUES,
      keyIndexHeartbeats: types.KEY_INDEX_HEARTBEATS,
      keyLockHeartBeatMonitor: types.KEY_LOCK_HEARTBEAT_MONITOR,
    };
    return this.makeGlobalNamespacedKeys(keys);
  },

  joinSegments(...segments: string[]): string {
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

  setNamespace(ns: string): void {
    ns = this.validateRedisKey(ns);
    namespace = `redis-smq-${ns}`;
  },

  validateRedisKey(key: string): string {
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

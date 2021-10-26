const nsPrefix = 'redis-smq';
const globalNamespace = 'global-ns';
let namespace = 'default-ns';

enum ERedisKey {
  KEY_QUEUE,
  KEY_QUEUE_DL,
  KEY_QUEUE_DELAY,
  KEY_QUEUE_REQUEUE,
  KEY_QUEUE_SCHEDULED_MESSAGES,
  KEY_QUEUE_PRIORITY,
  KEY_QUEUE_PROCESSING,
  KEY_QUEUE_ACKNOWLEDGED_MESSAGES,
  KEY_QUEUE_UNACKNOWLEDGED_MESSAGES,
  KEY_INDEX_QUEUES, // Redis key for message queues
  KEY_INDEX_DL_QUEUES, // Redis key for dead-letter queues
  KEY_INDEX_MESSAGE_PROCESSING_QUEUES, // Redis key for all processing queues
  KEY_INDEX_QUEUE_MESSAGE_PROCESSING_QUEUES, // Redis key for processing queues of a given queue
  KEY_INDEX_RATES, // Redis key for rates from all producersand consumers
  KEY_INDEX_HEARTBEATS, // Redis key for consumers heartbeats
  KEY_LOCK_SCHEDULER,
  KEY_LOCK_STATS_AGGREGATOR,
  KEY_LOCK_GC,
  KEY_LOCK_HEARTBEAT_MONITOR,
  KEY_LOCK_MESSAGE_MANAGER,
  KEY_LOCK_QUEUE_MANAGER,
  KEY_RATE_PRODUCER_INPUT,
  KEY_RATE_CONSUMER_PROCESSING,
  KEY_RATE_CONSUMER_ACKNOWLEDGED,
  KEY_RATE_CONSUMER_UNACKNOWLEDGED,
  KEY_HEARTBEAT,
  KEY_METADATA_QUEUE,
  KEY_METADATA_MESSAGE,
}

export const redisKeys = {
  getTypes() {
    return {
      ...ERedisKey,
    };
  },

  getKeys(queueName: string) {
    const globalKeys = this.getGlobalKeys();
    const keys = {
      keyQueue: this.joinSegments(ERedisKey.KEY_QUEUE, queueName),
      keyQueueDelay: this.joinSegments(ERedisKey.KEY_QUEUE_DELAY, queueName),
      keyQueueRequeue: this.joinSegments(
        ERedisKey.KEY_QUEUE_REQUEUE,
        queueName,
      ),
      keyQueueDL: this.joinSegments(ERedisKey.KEY_QUEUE_DL, queueName),
      keyQueueScheduledMessages: this.joinSegments(
        ERedisKey.KEY_QUEUE_SCHEDULED_MESSAGES,
        queueName,
      ),
      keyLockScheduler: this.joinSegments(
        ERedisKey.KEY_LOCK_SCHEDULER,
        queueName,
      ),
      keyLockGC: this.joinSegments(ERedisKey.KEY_LOCK_GC, queueName),
      keyIndexQueueMessageProcessingQueues: this.joinSegments(
        ERedisKey.KEY_INDEX_QUEUE_MESSAGE_PROCESSING_QUEUES,
        queueName,
      ),
      keyQueuePriority: this.joinSegments(
        ERedisKey.KEY_QUEUE_PRIORITY,
        queueName,
      ),
      keyMetadataQueue: this.joinSegments(
        ERedisKey.KEY_METADATA_QUEUE,
        queueName,
      ),
      keyQueueAcknowledgedMessages: this.joinSegments(
        ERedisKey.KEY_QUEUE_ACKNOWLEDGED_MESSAGES,
        queueName,
      ),
      keyQueueUnacknowledgedMessages: this.joinSegments(
        ERedisKey.KEY_QUEUE_UNACKNOWLEDGED_MESSAGES,
        queueName,
      ),
    };
    return {
      ...globalKeys,
      ...this.makeNamespacedKeys(keys, namespace),
    };
  },

  getInstanceKeys(queueName: string, instanceId: string) {
    const parentKeys = this.getKeys(queueName);
    const globalKeys = this.getGlobalKeys();
    const keys = {
      keyQueueProcessing: this.joinSegments(
        ERedisKey.KEY_QUEUE_PROCESSING,
        queueName,
        instanceId,
      ),
      keyRateConsumerUnacknowledged: this.joinSegments(
        ERedisKey.KEY_RATE_CONSUMER_UNACKNOWLEDGED,
        queueName,
        instanceId,
      ),
      keyHeartbeat: this.joinSegments(
        ERedisKey.KEY_HEARTBEAT,
        queueName,
        instanceId,
      ),
      keyRateConsumerProcessing: this.joinSegments(
        ERedisKey.KEY_RATE_CONSUMER_PROCESSING,
        queueName,
        instanceId,
      ),
      keyRateConsumerAcknowledged: this.joinSegments(
        ERedisKey.KEY_RATE_CONSUMER_ACKNOWLEDGED,
        queueName,
        instanceId,
      ),
      keyRateProducerInput: this.joinSegments(
        ERedisKey.KEY_RATE_PRODUCER_INPUT,
        queueName,
        instanceId,
      ),
    };
    return {
      ...parentKeys,
      ...globalKeys,
      ...this.makeNamespacedKeys(keys, namespace),
    };
  },

  getMessageKeys(messageId: string) {
    const keys = {
      keyMetadataMessage: this.joinSegments(
        ERedisKey.KEY_METADATA_MESSAGE,
        messageId,
      ),
    };
    return {
      ...this.makeNamespacedKeys(keys, namespace),
    };
  },

  extractData(key: string) {
    const { ns, type, segments } = this.getSegments(key);
    if (
      type === ERedisKey.KEY_QUEUE ||
      type === ERedisKey.KEY_QUEUE_SCHEDULED_MESSAGES ||
      type === ERedisKey.KEY_QUEUE_DL ||
      type === ERedisKey.KEY_LOCK_SCHEDULER
    ) {
      const [queueName] = segments;
      return {
        ns,
        type,
        queueName,
      };
    }
    if (
      type === ERedisKey.KEY_LOCK_GC ||
      type === ERedisKey.KEY_INDEX_QUEUE_MESSAGE_PROCESSING_QUEUES
    ) {
      const [queueName] = segments;
      return {
        ns,
        type,
        queueName,
      };
    }
    if (
      type === ERedisKey.KEY_QUEUE_PROCESSING ||
      type === ERedisKey.KEY_RATE_CONSUMER_PROCESSING ||
      type === ERedisKey.KEY_RATE_CONSUMER_ACKNOWLEDGED ||
      type === ERedisKey.KEY_RATE_CONSUMER_UNACKNOWLEDGED ||
      type === ERedisKey.KEY_HEARTBEAT
    ) {
      const [queueName, consumerId] = segments;
      return {
        ns,
        queueName,
        type,
        consumerId,
      };
    }
    if (type === ERedisKey.KEY_RATE_PRODUCER_INPUT) {
      const [queueName, producerId] = segments;
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
    const [, ns, type, ...segments] = key.split('|');
    return {
      ns,
      type: Number(type),
      segments,
    };
  },

  getGlobalKeys() {
    const keys = {
      keyIndexQueue: ERedisKey.KEY_INDEX_QUEUES,
      keyIndexDLQueues: ERedisKey.KEY_INDEX_DL_QUEUES,
      keyIndexRates: ERedisKey.KEY_INDEX_RATES,
      keyLockStatsAggregator: ERedisKey.KEY_LOCK_STATS_AGGREGATOR,
      keyIndexMessageProcessingQueues:
        ERedisKey.KEY_INDEX_MESSAGE_PROCESSING_QUEUES,
      keyIndexHeartbeats: ERedisKey.KEY_INDEX_HEARTBEATS,
      keyLockHeartBeatMonitor: ERedisKey.KEY_LOCK_HEARTBEAT_MONITOR,
      keyLockMessageManager: ERedisKey.KEY_LOCK_MESSAGE_MANAGER,
      keyLockQueueManager: ERedisKey.KEY_LOCK_QUEUE_MANAGER,
    };
    return {
      ...this.makeNamespacedKeys(keys, globalNamespace),
    };
  },

  joinSegments(...segments: (string | number)[]): string {
    return segments.join('|');
  },

  makeNamespacedKeys<T extends Record<string, string | number>>(
    keys: T,
    namespace: string,
  ): Record<Extract<keyof T, string>, string> {
    const result: Record<string, string> = {};
    for (const k in keys) {
      result[k] = this.joinSegments(nsPrefix, namespace, keys[k]);
    }
    return result;
  },

  setNamespace(ns: string): void {
    ns = this.validateRedisKey(ns);
    namespace = ns;
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

import { RedisKeysError } from './redis-keys.error';

const nsPrefix = 'redis-smq';
const globalNamespace = 'global';
let namespace = 'default';

enum ERedisKey {
  KEY_QUEUE = 58,
  KEY_QUEUE_DL,
  KEY_QUEUE_DELAY,
  KEY_QUEUE_REQUEUE,
  KEY_QUEUE_SCHEDULED,
  KEY_QUEUE_PRIORITY,
  KEY_QUEUE_PROCESSING,
  KEY_QUEUE_ACKNOWLEDGED_MESSAGES,
  KEY_QUEUE_UNACKNOWLEDGED_MESSAGES,
  KEY_INDEX_QUEUES, // Redis key for message queues
  KEY_INDEX_PROCESSING_QUEUES, // Redis key for all processing queues
  KEY_INDEX_QUEUE_MESSAGE_PROCESSING_QUEUES, // Redis key for processing queues of a given queue
  RESERVED, // Not used anymore. Will be removed in the next major releases.
  KEY_INDEX_HEARTBEATS, // Redis key for heartbeats
  KEY_LOCK_MESSAGE_MANAGER,
  KEY_LOCK_QUEUE_MANAGER,
  KEY_RATE_PRODUCER_INPUT,
  KEY_RATE_CONSUMER_PROCESSING,
  KEY_RATE_CONSUMER_ACKNOWLEDGED,
  KEY_RATE_CONSUMER_UNACKNOWLEDGED,
  KEY_LOCK_WEBSOCKET_MAIN_STREAM_WORKER,
  KEY_LOCK_CONSUMER_WORKERS_RUNNER,
  KEY_LOCK_DELETE_PENDING_MESSAGE,
  KEY_LOCK_DELETE_PENDING_MESSAGE_WITH_PRIORITY,
  KEY_LOCK_DELETE_ACKNOWLEDGED_MESSAGE,
  KEY_LOCK_DELETE_DEAD_LETTER_MESSAGE,
  KEY_LOCK_DELETE_SCHEDULED_MESSAGE,
  RESERVED_2, // Not used anymore. Will be removed in the next major releases.
  KEY_SCHEDULED_MESSAGES,
  KEY_PENDING_MESSAGES_WITH_PRIORITY,
  KEY_RATE_QUEUE_PROCESSING,
  KEY_RATE_QUEUE_PROCESSING_INDEX,
  KEY_RATE_QUEUE_ACKNOWLEDGED,
  KEY_RATE_QUEUE_ACKNOWLEDGED_INDEX,
  KEY_RATE_QUEUE_UNACKNOWLEDGED,
  KEY_RATE_QUEUE_UNACKNOWLEDGED_INDEX,
  KEY_RATE_QUEUE_INPUT,
  KEY_RATE_QUEUE_PUBLISHED_INDEX,
  KEY_RATE_GLOBAL_PROCESSING,
  KEY_RATE_GLOBAL_PROCESSING_INDEX,
  KEY_RATE_GLOBAL_ACKNOWLEDGED,
  KEY_RATE_GLOBAL_ACKNOWLEDGED_INDEX,
  KEY_RATE_GLOBAL_UNACKNOWLEDGED,
  KEY_RATE_GLOBAL_UNACKNOWLEDGED_INDEX,
  KEY_RATE_GLOBAL_PUBLISHED,
  KEY_RATE_GLOBAL_PUBLISHED_INDEX,
  KEY_HEARTBEAT_PRODUCER,
  KEY_HEARTBEAT_CONSUMER,
  KEY_HEARTBEAT_TIMESTAMPS,
  KEY_LOCK_WEBSOCKET_RATE_STREAM_WORKER,
  KEY_RATE_GLOBAL_PUBLISHED_LOCK,
  KEY_RATE_GLOBAL_PROCESSING_LOCK,
  KEY_RATE_GLOBAL_ACKNOWLEDGED_LOCK,
  KEY_RATE_GLOBAL_UNACKNOWLEDGED_LOCK,
  KEY_RATE_QUEUE_PUBLISHED_LOCK,
  KEY_RATE_QUEUE_PROCESSING_LOCK,
  KEY_RATE_QUEUE_ACKNOWLEDGED_LOCK,
  KEY_RATE_QUEUE_UNACKNOWLEDGED_LOCK,
  KEY_QUEUE_CONSUMERS,
  KEY_QUEUE_PRODUCERS,
  KEY_LOCK_WEBSOCKET_HEARTBEAT_STREAM_WORKER,
  KEY_LOCK_WEBSOCKET_ONLINE_STREAM_WORKER,
}

export const redisKeys = {
  getTypes() {
    return {
      ...ERedisKey,
    };
  },

  getKeys(queueName: string, ns?: string) {
    const globalKeys = this.getGlobalKeys();
    const keys = {
      keyQueue: this.joinSegments(ERedisKey.KEY_QUEUE, queueName),
      keyQueueDL: this.joinSegments(ERedisKey.KEY_QUEUE_DL, queueName),
      keyIndexQueueMessageProcessingQueues: this.joinSegments(
        ERedisKey.KEY_INDEX_QUEUE_MESSAGE_PROCESSING_QUEUES,
        queueName,
      ),
      keyQueuePriority: this.joinSegments(
        ERedisKey.KEY_QUEUE_PRIORITY,
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
      keyPendingMessagesWithPriority: this.joinSegments(
        ERedisKey.KEY_PENDING_MESSAGES_WITH_PRIORITY,
        queueName,
      ),
      keyRateQueueUnacknowledged: this.joinSegments(
        ERedisKey.KEY_RATE_QUEUE_UNACKNOWLEDGED,
        queueName,
      ),
      keyRateQueueAcknowledged: this.joinSegments(
        ERedisKey.KEY_RATE_QUEUE_ACKNOWLEDGED,
        queueName,
      ),
      keyRateQueueProcessing: this.joinSegments(
        ERedisKey.KEY_RATE_QUEUE_PROCESSING,
        queueName,
      ),
      keyRateQueueInput: this.joinSegments(
        ERedisKey.KEY_RATE_QUEUE_INPUT,
        queueName,
      ),
      keyRateQueueUnacknowledgedIndex: this.joinSegments(
        ERedisKey.KEY_RATE_QUEUE_UNACKNOWLEDGED_INDEX,
        queueName,
      ),
      keyRateQueueAcknowledgedIndex: this.joinSegments(
        ERedisKey.KEY_RATE_QUEUE_ACKNOWLEDGED_INDEX,
        queueName,
      ),
      keyRateQueueProcessingIndex: this.joinSegments(
        ERedisKey.KEY_RATE_QUEUE_PROCESSING_INDEX,
        queueName,
      ),
      keyRateQueuePublishedIndex: this.joinSegments(
        ERedisKey.KEY_RATE_QUEUE_PUBLISHED_INDEX,
        queueName,
      ),
      keyRateQueuePublishedLock: this.joinSegments(
        ERedisKey.KEY_RATE_QUEUE_PUBLISHED_LOCK,
        queueName,
      ),
      keyRateQueueProcessingLock: this.joinSegments(
        ERedisKey.KEY_RATE_QUEUE_PROCESSING_LOCK,
        queueName,
      ),
      keyRateQueueAcknowledgedLock: this.joinSegments(
        ERedisKey.KEY_RATE_QUEUE_ACKNOWLEDGED_LOCK,
        queueName,
      ),
      keyRateQueueUnacknowledgedLock: this.joinSegments(
        ERedisKey.KEY_RATE_QUEUE_UNACKNOWLEDGED_LOCK,
        queueName,
      ),
      keyQueueConsumers: this.joinSegments(
        ERedisKey.KEY_QUEUE_CONSUMERS,
        queueName,
      ),
      keyQueueProducers: this.joinSegments(
        ERedisKey.KEY_QUEUE_PRODUCERS,
        queueName,
      ),
    };
    return {
      ...globalKeys,
      ...this.makeNamespacedKeys(keys, ns ?? namespace),
    };
  },

  getConsumerKeys(queueName: string, instanceId: string, ns?: string) {
    const globalKeys = this.getGlobalKeys();
    const parentKeys = this.getKeys(queueName, ns);
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
      keyHeartbeatConsumer: this.joinSegments(
        ERedisKey.KEY_HEARTBEAT_CONSUMER,
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
    };
    return {
      ...parentKeys,
      ...globalKeys,
      ...this.makeNamespacedKeys(keys, ns ?? namespace),
    };
  },

  getProducerKeys(queueName: string, instanceId: string, ns?: string) {
    const parentKeys = this.getKeys(queueName, ns);
    const globalKeys = this.getGlobalKeys();
    const keys = {
      keyHeartbeatProducer: this.joinSegments(
        ERedisKey.KEY_HEARTBEAT_PRODUCER,
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
      ...this.makeNamespacedKeys(keys, ns ?? namespace),
    };
  },

  extractData(key: string) {
    const { ns, type, segments } = this.getSegments(key);
    if (
      type === ERedisKey.KEY_QUEUE ||
      type === ERedisKey.KEY_QUEUE_PRIORITY ||
      type === ERedisKey.KEY_QUEUE_ACKNOWLEDGED_MESSAGES ||
      type === ERedisKey.KEY_QUEUE_DL
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
      type === ERedisKey.KEY_HEARTBEAT_CONSUMER
    ) {
      const [queueName, consumerId] = segments;
      return {
        ns,
        queueName,
        type,
        consumerId,
      };
    }
    if (
      type === ERedisKey.KEY_RATE_PRODUCER_INPUT ||
      type === ERedisKey.KEY_HEARTBEAT_PRODUCER
    ) {
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
      keyIndexProcessingQueues: ERedisKey.KEY_INDEX_PROCESSING_QUEUES,
      keyIndexHeartbeats: ERedisKey.KEY_INDEX_HEARTBEATS,
      keyLockMessageManager: ERedisKey.KEY_LOCK_MESSAGE_MANAGER,
      keyLockQueueManager: ERedisKey.KEY_LOCK_QUEUE_MANAGER,
      keyLockConsumerWorkersRunner: ERedisKey.KEY_LOCK_CONSUMER_WORKERS_RUNNER,
      keyLockWebsocketMainStreamWorker:
        ERedisKey.KEY_LOCK_WEBSOCKET_MAIN_STREAM_WORKER,
      keyLockWebsocketRateStreamWorker:
        ERedisKey.KEY_LOCK_WEBSOCKET_RATE_STREAM_WORKER,
      keyLockWebsocketHeartbeatStreamWorker:
        ERedisKey.KEY_LOCK_WEBSOCKET_HEARTBEAT_STREAM_WORKER,
      keyLockWebsocketOnlineStreamWorker:
        ERedisKey.KEY_LOCK_WEBSOCKET_ONLINE_STREAM_WORKER,
      keyQueueDelay: ERedisKey.KEY_QUEUE_DELAY,
      keyQueueRequeue: ERedisKey.KEY_QUEUE_REQUEUE,
      keyQueueScheduled: ERedisKey.KEY_QUEUE_SCHEDULED,
      keyLockDeleteAcknowledgedMessage:
        ERedisKey.KEY_LOCK_DELETE_ACKNOWLEDGED_MESSAGE,
      keyLockDeleteDeadLetterMessage:
        ERedisKey.KEY_LOCK_DELETE_DEAD_LETTER_MESSAGE,
      keyLockDeleteScheduledMessage:
        ERedisKey.KEY_LOCK_DELETE_SCHEDULED_MESSAGE,
      keyLockDeletePendingMessage: ERedisKey.KEY_LOCK_DELETE_PENDING_MESSAGE,
      keyLockDeletePendingMessageWithPriority:
        ERedisKey.KEY_LOCK_DELETE_PENDING_MESSAGE_WITH_PRIORITY,
      keyScheduledMessages: ERedisKey.KEY_SCHEDULED_MESSAGES,
      keyRateGlobalUnacknowledged: ERedisKey.KEY_RATE_GLOBAL_UNACKNOWLEDGED,
      keyRateGlobalAcknowledged: ERedisKey.KEY_RATE_GLOBAL_ACKNOWLEDGED,
      keyRateGlobalProcessing: ERedisKey.KEY_RATE_GLOBAL_PROCESSING,
      keyRateGlobalPublished: ERedisKey.KEY_RATE_GLOBAL_PUBLISHED,
      keyRateGlobalUnacknowledgedIndex:
        ERedisKey.KEY_RATE_GLOBAL_UNACKNOWLEDGED_INDEX,
      keyRateGlobalAcknowledgedIndex:
        ERedisKey.KEY_RATE_GLOBAL_ACKNOWLEDGED_INDEX,
      keyRateGlobalProcessingIndex: ERedisKey.KEY_RATE_GLOBAL_PROCESSING_INDEX,
      keyRateGlobalInputIndex: ERedisKey.KEY_RATE_GLOBAL_PUBLISHED_INDEX,
      keyHeartbeatTimestamps: ERedisKey.KEY_HEARTBEAT_TIMESTAMPS,
      keyRateGlobalPublishedLock: ERedisKey.KEY_RATE_GLOBAL_PUBLISHED_LOCK,
      keyRateGlobalAcknowledgedLock:
        ERedisKey.KEY_RATE_GLOBAL_ACKNOWLEDGED_LOCK,
      keyRateGlobalUnacknowledgedLock:
        ERedisKey.KEY_RATE_GLOBAL_UNACKNOWLEDGED_LOCK,
      keyRateGlobalProcessingLock: ERedisKey.KEY_RATE_GLOBAL_PROCESSING_LOCK,
    };
    return this.makeNamespacedKeys(keys, globalNamespace);
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
    if (ns === globalNamespace) {
      throw new RedisKeysError(
        `Namespace [${ns}] is reserved. Use another one.`,
      );
    }
    namespace = ns;
  },

  getNamespace(): string {
    return namespace;
  },

  validateRedisKey(key: string): string {
    if (!key || !key.length) {
      throw new RedisKeysError(
        'Invalid Redis key. Expected be a non empty string.',
      );
    }
    const filtered = key.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (filtered.length !== key.length) {
      throw new RedisKeysError(
        'Invalid Redis key. Only letters (a-z), numbers (0-9) and (-_) are allowed.',
      );
    }
    return filtered;
  },
};
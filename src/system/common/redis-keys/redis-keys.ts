import { RedisKeysError } from './redis-keys.error';

// Namespace prefix
const nsPrefix = 'redis-smq-v6';

// Namespaces
const globalNamespace = 'global';
let namespace = 'default';

enum ERedisKey {
  KEY_QUEUE_PENDING = 1,
  KEY_QUEUE_PENDING_WITH_PRIORITY,
  KEY_QUEUE_DL,
  KEY_DELAYED_MESSAGES,
  KEY_MESSAGES_REQUEUE,
  KEY_SCHEDULED_MESSAGES,
  KEY_QUEUE_PRIORITY,
  KEY_QUEUE_PROCESSING,
  KEY_QUEUE_ACKNOWLEDGED,
  RESERVED,
  KEY_QUEUE_CONSUMERS,
  RESERVED_6,
  KEY_QUEUE_PROCESSING_QUEUES, // Redis key for processing queues of a given queue

  KEY_LOCK_CONSUMER_WORKERS_RUNNER,
  KEY_LOCK_DELETE_PENDING_MESSAGE,
  KEY_LOCK_DELETE_PENDING_MESSAGE_WITH_PRIORITY,
  KEY_LOCK_DELETE_ACKNOWLEDGED_MESSAGE,
  KEY_LOCK_DELETE_DEAD_LETTER_MESSAGE,
  KEY_LOCK_DELETE_SCHEDULED_MESSAGE,
  KEY_LOCK_MESSAGE_MANAGER,
  KEY_LOCK_QUEUE_MANAGER,
  KEY_LOCK_WEBSOCKET_MAIN_STREAM_WORKER,
  KEY_LOCK_WEBSOCKET_HEARTBEAT_STREAM_WORKER,
  KEY_LOCK_WEBSOCKET_ONLINE_STREAM_WORKER,
  KEY_LOCK_WEBSOCKET_RATE_STREAM_WORKER,
  KEY_LOCK_RATE_GLOBAL_PUBLISHED,
  KEY_LOCK_RATE_GLOBAL_ACKNOWLEDGED,
  KEY_LOCK_RATE_GLOBAL_DEAD_LETTERED,
  KEY_LOCK_RATE_QUEUE_PUBLISHED,
  KEY_LOCK_RATE_QUEUE_ACKNOWLEDGED,
  KEY_LOCK_RATE_QUEUE_DEAD_LETTERED,

  RESERVED_4,
  KEY_RATE_CONSUMER_ACKNOWLEDGED,
  KEY_RATE_QUEUE_ACKNOWLEDGED,
  KEY_RATE_QUEUE_ACKNOWLEDGED_INDEX,
  KEY_RATE_QUEUE_DEAD_LETTERED,
  KEY_RATE_QUEUE_DEAD_LETTERED_INDEX,
  KEY_RATE_QUEUE_PUBLISHED,
  KEY_RATE_QUEUE_PUBLISHED_INDEX,
  KEY_RATE_GLOBAL_ACKNOWLEDGED,
  KEY_RATE_GLOBAL_ACKNOWLEDGED_INDEX,
  KEY_RATE_GLOBAL_DEAD_LETTERED,
  KEY_RATE_GLOBAL_DEAD_LETTERED_INDEX,
  KEY_RATE_GLOBAL_PUBLISHED,
  KEY_RATE_GLOBAL_PUBLISHED_INDEX,
  KEY_RATE_CONSUMER_DEAD_LETTERED,
  RESERVED_1,

  RESERVED_5,
  KEY_HEARTBEAT_CONSUMER,
  KEY_HEARTBEAT_TIMESTAMPS,
  RESERVED_2,

  KEY_SCHEDULED_MESSAGES_INDEX,
  KEY_HEARTBEATS,
  RESERVED_3,
  KEY_QUEUES,
  KEY_PROCESSING_QUEUES,
  KEY_LOCK_QUEUE,
}

export const redisKeys = {
  getTypes() {
    return {
      ...ERedisKey,
    };
  },

  getKeys(queueName: string, ns?: string | null) {
    const globalKeys = this.getGlobalKeys();
    const keys = {
      keyQueuePending: this.joinSegments(
        ERedisKey.KEY_QUEUE_PENDING,
        queueName,
      ),
      keyQueueDL: this.joinSegments(ERedisKey.KEY_QUEUE_DL, queueName),
      keyQueueProcessingQueues: this.joinSegments(
        ERedisKey.KEY_QUEUE_PROCESSING_QUEUES,
        queueName,
      ),
      keyQueuePriority: this.joinSegments(
        ERedisKey.KEY_QUEUE_PRIORITY,
        queueName,
      ),
      keyQueueAcknowledged: this.joinSegments(
        ERedisKey.KEY_QUEUE_ACKNOWLEDGED,
        queueName,
      ),
      keyQueuePendingWithPriority: this.joinSegments(
        ERedisKey.KEY_QUEUE_PENDING_WITH_PRIORITY,
        queueName,
      ),
      keyRateQueueDeadLettered: this.joinSegments(
        ERedisKey.KEY_RATE_QUEUE_DEAD_LETTERED,
        queueName,
      ),
      keyRateQueueAcknowledged: this.joinSegments(
        ERedisKey.KEY_RATE_QUEUE_ACKNOWLEDGED,
        queueName,
      ),
      keyRateQueuePublished: this.joinSegments(
        ERedisKey.KEY_RATE_QUEUE_PUBLISHED,
        queueName,
      ),
      keyRateQueueDeadLetteredIndex: this.joinSegments(
        ERedisKey.KEY_RATE_QUEUE_DEAD_LETTERED_INDEX,
        queueName,
      ),
      keyRateQueueAcknowledgedIndex: this.joinSegments(
        ERedisKey.KEY_RATE_QUEUE_ACKNOWLEDGED_INDEX,
        queueName,
      ),
      keyRateQueuePublishedIndex: this.joinSegments(
        ERedisKey.KEY_RATE_QUEUE_PUBLISHED_INDEX,
        queueName,
      ),
      keyLockRateQueuePublished: this.joinSegments(
        ERedisKey.KEY_LOCK_RATE_QUEUE_PUBLISHED,
        queueName,
      ),
      keyLockRateQueueAcknowledged: this.joinSegments(
        ERedisKey.KEY_LOCK_RATE_QUEUE_ACKNOWLEDGED,
        queueName,
      ),
      keyLockRateQueueDeadLettered: this.joinSegments(
        ERedisKey.KEY_LOCK_RATE_QUEUE_DEAD_LETTERED,
        queueName,
      ),
      keyQueueConsumers: this.joinSegments(
        ERedisKey.KEY_QUEUE_CONSUMERS,
        queueName,
      ),
      keyLockQueue: this.joinSegments(ERedisKey.KEY_LOCK_QUEUE, queueName),
    };
    return {
      ...globalKeys,
      ...this.makeNamespacedKeys(keys, ns ?? namespace),
    };
  },

  getConsumerKeys(queueName: string, instanceId: string, ns?: string | null) {
    const globalKeys = this.getGlobalKeys();
    const parentKeys = this.getKeys(queueName, ns);
    const keys = {
      keyQueueProcessing: this.joinSegments(
        ERedisKey.KEY_QUEUE_PROCESSING,
        queueName,
        instanceId,
      ),
      keyRateConsumerDeadLettered: this.joinSegments(
        ERedisKey.KEY_RATE_CONSUMER_DEAD_LETTERED,
        queueName,
        instanceId,
      ),
      keyHeartbeatConsumer: this.joinSegments(
        ERedisKey.KEY_HEARTBEAT_CONSUMER,
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

  extractData(key: string) {
    const { ns, type, segments } = this.getSegments(key);
    if (
      type === ERedisKey.KEY_QUEUE_PENDING ||
      type === ERedisKey.KEY_QUEUE_PRIORITY ||
      type === ERedisKey.KEY_QUEUE_ACKNOWLEDGED ||
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
      type === ERedisKey.KEY_RATE_CONSUMER_ACKNOWLEDGED ||
      type === ERedisKey.KEY_RATE_CONSUMER_DEAD_LETTERED ||
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
      keyQueues: ERedisKey.KEY_QUEUES,
      keyProcessingQueues: ERedisKey.KEY_PROCESSING_QUEUES,
      keyHeartbeats: ERedisKey.KEY_HEARTBEATS,
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
      keyDelayedMessages: ERedisKey.KEY_DELAYED_MESSAGES,
      keyMessagesRequeue: ERedisKey.KEY_MESSAGES_REQUEUE,
      keyScheduledMessages: ERedisKey.KEY_SCHEDULED_MESSAGES,
      keyScheduledMessagesIndex: ERedisKey.KEY_SCHEDULED_MESSAGES_INDEX,
      keyLockDeleteAcknowledgedMessage:
        ERedisKey.KEY_LOCK_DELETE_ACKNOWLEDGED_MESSAGE,
      keyLockdeleteDeadLetteredMessage:
        ERedisKey.KEY_LOCK_DELETE_DEAD_LETTER_MESSAGE,
      keyLockDeleteScheduledMessage:
        ERedisKey.KEY_LOCK_DELETE_SCHEDULED_MESSAGE,
      keyLockDeletePendingMessage: ERedisKey.KEY_LOCK_DELETE_PENDING_MESSAGE,
      keyLockDeletePendingMessageWithPriority:
        ERedisKey.KEY_LOCK_DELETE_PENDING_MESSAGE_WITH_PRIORITY,
      keyRateGlobalDeadLettered: ERedisKey.KEY_RATE_GLOBAL_DEAD_LETTERED,
      keyRateGlobalAcknowledged: ERedisKey.KEY_RATE_GLOBAL_ACKNOWLEDGED,
      keyRateGlobalPublished: ERedisKey.KEY_RATE_GLOBAL_PUBLISHED,
      keyRateGlobalDeadLetteredIndex:
        ERedisKey.KEY_RATE_GLOBAL_DEAD_LETTERED_INDEX,
      keyRateGlobalAcknowledgedIndex:
        ERedisKey.KEY_RATE_GLOBAL_ACKNOWLEDGED_INDEX,
      keyRateGlobalInputIndex: ERedisKey.KEY_RATE_GLOBAL_PUBLISHED_INDEX,
      keyHeartbeatTimestamps: ERedisKey.KEY_HEARTBEAT_TIMESTAMPS,
      keyLockRateGlobalPublished: ERedisKey.KEY_LOCK_RATE_GLOBAL_PUBLISHED,
      keyLockRateGlobalAcknowledged:
        ERedisKey.KEY_LOCK_RATE_GLOBAL_ACKNOWLEDGED,
      keyLockRateGlobalDeadLettered:
        ERedisKey.KEY_LOCK_RATE_GLOBAL_DEAD_LETTERED,
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

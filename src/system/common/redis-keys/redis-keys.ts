import { RedisKeysError } from './redis-keys.error';

//
const keySegmentSeparator = '.';

// Keys prefix
const nsPrefix = 'redis-smq-v600rc10';

// Namespaces
const globalNamespace = 'global';
let namespace = 'default';

enum ERedisKey {
  KEY_QUEUE_PENDING = 1,
  KEY_QUEUE_PENDING_PRIORITY_MESSAGES,
  KEY_QUEUE_PENDING_PRIORITY_MESSAGE_IDS,
  KEY_QUEUE_DL,
  KEY_QUEUE_PROCESSING,
  KEY_QUEUE_ACKNOWLEDGED,
  KEY_QUEUE_CONSUMERS,
  KEY_QUEUE_PROCESSING_QUEUES, // Redis key for processing queues of a given queue

  KEY_LOCK_CONSUMER_WORKERS_RUNNER,
  KEY_LOCK_DELETE_PENDING_MESSAGE,
  KEY_LOCK_DELETE_PENDING_MESSAGE_WITH_PRIORITY,
  KEY_LOCK_DELETE_ACKNOWLEDGED_MESSAGE,
  KEY_LOCK_DELETE_DEAD_LETTER_MESSAGE,
  KEY_LOCK_DELETE_SCHEDULED_MESSAGE,
  KEY_LOCK_MESSAGE_MANAGER,
  KEY_LOCK_QUEUE_MANAGER,
  KEY_LOCK_MONITOR_SERVER_WORKERS,
  KEY_LOCK_RATE_GLOBAL_PUBLISHED,
  KEY_LOCK_RATE_GLOBAL_ACKNOWLEDGED,
  KEY_LOCK_RATE_GLOBAL_DEAD_LETTERED,
  KEY_LOCK_RATE_QUEUE_PUBLISHED,
  KEY_LOCK_RATE_QUEUE_ACKNOWLEDGED,
  KEY_LOCK_RATE_QUEUE_DEAD_LETTERED,

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

  KEY_DELAYED_MESSAGES,
  KEY_REQUEUE_MESSAGES,
  KEY_SCHEDULED_MESSAGES,
  KEY_SCHEDULED_MESSAGE_IDS,
  KEY_HEARTBEATS,
  KEY_HEARTBEAT_INSTANCE_IDS,
  KEY_QUEUES,
  KEY_PROCESSING_QUEUES,
  KEY_LOCK_QUEUE,
  KEY_CONSUMER_QUEUES,
}

export const redisKeys = {
  getKeyTypes() {
    return {
      ...ERedisKey,
    };
  },

  getQueueKeys(queueName: string, ns: string = namespace) {
    const mainKeys = this.getMainKeys();
    const queueKeys = {
      keyQueuePending: ERedisKey.KEY_QUEUE_PENDING,
      keyQueueDL: ERedisKey.KEY_QUEUE_DL,
      keyQueueProcessingQueues: ERedisKey.KEY_QUEUE_PROCESSING_QUEUES,
      keyQueueAcknowledged: ERedisKey.KEY_QUEUE_ACKNOWLEDGED,
      keyQueuePendingPriorityMessageIds:
        ERedisKey.KEY_QUEUE_PENDING_PRIORITY_MESSAGE_IDS,
      keyQueuePendingPriorityMessages:
        ERedisKey.KEY_QUEUE_PENDING_PRIORITY_MESSAGES,
      keyRateQueueDeadLettered: ERedisKey.KEY_RATE_QUEUE_DEAD_LETTERED,
      keyRateQueueAcknowledged: ERedisKey.KEY_RATE_QUEUE_ACKNOWLEDGED,
      keyRateQueuePublished: ERedisKey.KEY_RATE_QUEUE_PUBLISHED,
      keyRateQueueDeadLetteredIndex:
        ERedisKey.KEY_RATE_QUEUE_DEAD_LETTERED_INDEX,
      keyRateQueueAcknowledgedIndex:
        ERedisKey.KEY_RATE_QUEUE_ACKNOWLEDGED_INDEX,
      keyRateQueuePublishedIndex: ERedisKey.KEY_RATE_QUEUE_PUBLISHED_INDEX,
      keyLockRateQueuePublished: ERedisKey.KEY_LOCK_RATE_QUEUE_PUBLISHED,
      keyLockRateQueueAcknowledged: ERedisKey.KEY_LOCK_RATE_QUEUE_ACKNOWLEDGED,
      keyLockRateQueueDeadLettered: ERedisKey.KEY_LOCK_RATE_QUEUE_DEAD_LETTERED,
      keyQueueConsumers: ERedisKey.KEY_QUEUE_CONSUMERS,
      keyLockQueue: ERedisKey.KEY_LOCK_QUEUE,
    };
    return {
      ...mainKeys,
      ...queueKeys,
      ...this.makeNamespacedKeys(queueKeys, ns, queueName),
    };
  },

  getConsumerKeys(instanceId: string) {
    const mainKeys = this.getMainKeys();
    const consumerKeys = {
      keyConsumerQueues: ERedisKey.KEY_CONSUMER_QUEUES,
    };
    return {
      ...mainKeys,
      ...this.makeNamespacedKeys(consumerKeys, globalNamespace, instanceId),
    };
  },

  getQueueConsumerKeys(
    queueName: string,
    instanceId: string,
    ns: string = namespace,
  ) {
    const mainKeys = this.getMainKeys();
    const queueKeys = this.getQueueKeys(queueName, ns);
    const consumerKeys = this.getConsumerKeys(instanceId);
    const consumerQueuekeys = {
      keyQueueProcessing: ERedisKey.KEY_QUEUE_PROCESSING,
      keyRateConsumerDeadLettered: ERedisKey.KEY_RATE_CONSUMER_DEAD_LETTERED,
      keyRateConsumerAcknowledged: ERedisKey.KEY_RATE_CONSUMER_ACKNOWLEDGED,
    };
    return {
      ...queueKeys,
      ...consumerKeys,
      ...mainKeys,
      ...this.makeNamespacedKeys(consumerQueuekeys, ns, queueName, instanceId),
    };
  },

  getMainKeys() {
    const mainKeys = {
      keyQueues: ERedisKey.KEY_QUEUES,
      keyProcessingQueues: ERedisKey.KEY_PROCESSING_QUEUES,
      keyHeartbeats: ERedisKey.KEY_HEARTBEATS,
      keyHeartbeatInstanceIds: ERedisKey.KEY_HEARTBEAT_INSTANCE_IDS,
      keyScheduledMessages: ERedisKey.KEY_SCHEDULED_MESSAGES,
      keyScheduledMessageIds: ERedisKey.KEY_SCHEDULED_MESSAGE_IDS,
      keyLockMessageManager: ERedisKey.KEY_LOCK_MESSAGE_MANAGER,
      keyLockQueueManager: ERedisKey.KEY_LOCK_QUEUE_MANAGER,
      keyLockConsumerWorkersRunner: ERedisKey.KEY_LOCK_CONSUMER_WORKERS_RUNNER,
      keyLockMonitorServerWorkers: ERedisKey.KEY_LOCK_MONITOR_SERVER_WORKERS,
      keyDelayedMessages: ERedisKey.KEY_DELAYED_MESSAGES,
      keyRequeueMessages: ERedisKey.KEY_REQUEUE_MESSAGES,
      keyLockDeleteAcknowledgedMessage:
        ERedisKey.KEY_LOCK_DELETE_ACKNOWLEDGED_MESSAGE,
      keyLockDeleteDeadLetteredMessage:
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
      keyLockRateGlobalPublished: ERedisKey.KEY_LOCK_RATE_GLOBAL_PUBLISHED,
      keyLockRateGlobalAcknowledged:
        ERedisKey.KEY_LOCK_RATE_GLOBAL_ACKNOWLEDGED,
      keyLockRateGlobalDeadLettered:
        ERedisKey.KEY_LOCK_RATE_GLOBAL_DEAD_LETTERED,
    };
    return this.makeNamespacedKeys(mainKeys, globalNamespace);
  },

  extractData(key: string) {
    const { ns, type, segments } = this.getSegments(key);
    if (type === ERedisKey.KEY_QUEUE_PROCESSING) {
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

  makeNamespacedKeys<T extends Record<string, ERedisKey>>(
    keys: T,
    namespace: string,
    ...rest: string[]
  ): Record<Extract<keyof T, string>, string> {
    const result: Record<string, string> = {};
    for (const k in keys) {
      result[k] = [nsPrefix, namespace, keys[k], ...rest].join(
        keySegmentSeparator,
      );
    }
    return result;
  },

  getSegments(key: string): {
    ns: string;
    type: ERedisKey;
    segments: string[];
  } {
    const [, ns, type, ...segments] = key.split(keySegmentSeparator);
    return {
      ns,
      type: Number(type),
      segments,
    };
  },
};

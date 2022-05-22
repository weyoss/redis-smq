import { RedisKeysError } from './redis-keys.error';
import { TQueueParams } from '../../../types';

// Key segments separator
const keySegmentSeparator = ':';

// Key prefix
const nsPrefix = 'redis-smq-v700-rc0';

// Namespaces
const globalNamespace = 'global';
let namespace = 'default';

enum ERedisKey {
  KEY_QUEUE_PENDING = 1,
  KEY_QUEUE_PENDING_PRIORITY_MESSAGES,
  KEY_QUEUE_PENDING_PRIORITY_MESSAGE_WEIGHT,
  KEY_QUEUE_DL,
  KEY_QUEUE_PROCESSING,
  KEY_QUEUE_ACKNOWLEDGED,
  KEY_QUEUE_CONSUMERS,
  KEY_QUEUE_PROCESSING_QUEUES,

  KEY_LOCK_CONSUMER_WORKERS_RUNNER,

  KEY_DELAYED_MESSAGES,
  KEY_REQUEUE_MESSAGES,
  KEY_SCHEDULED_MESSAGES,
  KEY_SCHEDULED_MESSAGE_WEIGHT,
  KEY_HEARTBEATS,
  KEY_HEARTBEAT_CONSUMER_WEIGHT,
  KEY_QUEUES,
  KEY_PROCESSING_QUEUES,
  KEY_CONSUMER_QUEUES,
  KEY_NS_QUEUES,
  KEY_NAMESPACES,
  KEY_QUEUE_RATE_LIMIT_COUNTER,
  KEY_QUEUE_SETTINGS,
  KEY_QUEUE_SETTINGS_RATE_LIMIT,
  KEY_QUEUE_SETTINGS_PRIORITY_QUEUING,
}

function makeNamespacedKeys<T extends Record<string, ERedisKey>>(
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
}

export const redisKeys = {
  getNamespaceKeys(ns: string) {
    const mainKeys = this.getMainKeys();
    const keys = {
      keyNsQueues: ERedisKey.KEY_NS_QUEUES,
    };
    return {
      ...mainKeys,
      ...makeNamespacedKeys(keys, ns),
    };
  },

  getQueueKeys(queueParams: TQueueParams) {
    const nsKeys = this.getNamespaceKeys(queueParams.ns);
    const queueKeys = {
      keyQueuePending: ERedisKey.KEY_QUEUE_PENDING,
      keyQueueDL: ERedisKey.KEY_QUEUE_DL,
      keyQueueProcessingQueues: ERedisKey.KEY_QUEUE_PROCESSING_QUEUES,
      keyQueueAcknowledged: ERedisKey.KEY_QUEUE_ACKNOWLEDGED,
      keyQueuePendingPriorityMessageWeight:
        ERedisKey.KEY_QUEUE_PENDING_PRIORITY_MESSAGE_WEIGHT,
      keyQueuePendingPriorityMessages:
        ERedisKey.KEY_QUEUE_PENDING_PRIORITY_MESSAGES,
      keyQueueConsumers: ERedisKey.KEY_QUEUE_CONSUMERS,
      keyQueueRateLimitCounter: ERedisKey.KEY_QUEUE_RATE_LIMIT_COUNTER,
      keyQueueSettings: ERedisKey.KEY_QUEUE_SETTINGS,
    };
    return {
      ...nsKeys,
      ...makeNamespacedKeys(queueKeys, queueParams.ns, queueParams.name),
    };
  },

  getConsumerKeys(instanceId: string) {
    const mainKeys = this.getMainKeys();
    const consumerKeys = {
      keyConsumerQueues: ERedisKey.KEY_CONSUMER_QUEUES,
    };
    return {
      ...mainKeys,
      ...makeNamespacedKeys(consumerKeys, globalNamespace, instanceId),
    };
  },

  getQueueConsumerKeys(queueParams: TQueueParams, instanceId: string) {
    const queueKeys = this.getQueueKeys(queueParams);
    const consumerKeys = this.getConsumerKeys(instanceId);
    const consumerQueueKeys = {
      keyQueueProcessing: ERedisKey.KEY_QUEUE_PROCESSING,
    };
    return {
      ...queueKeys,
      ...consumerKeys,
      ...makeNamespacedKeys(
        consumerQueueKeys,
        queueParams.ns,
        queueParams.name,
        instanceId,
      ),
    };
  },

  getMainKeys() {
    const mainKeys = {
      keyQueues: ERedisKey.KEY_QUEUES,
      keyProcessingQueues: ERedisKey.KEY_PROCESSING_QUEUES,
      keyHeartbeats: ERedisKey.KEY_HEARTBEATS,
      keyHeartbeatConsumerWeight: ERedisKey.KEY_HEARTBEAT_CONSUMER_WEIGHT,
      keyScheduledMessages: ERedisKey.KEY_SCHEDULED_MESSAGES,
      keyScheduledMessageWeight: ERedisKey.KEY_SCHEDULED_MESSAGE_WEIGHT,
      keyLockConsumerWorkersRunner: ERedisKey.KEY_LOCK_CONSUMER_WORKERS_RUNNER,
      keyDelayedMessages: ERedisKey.KEY_DELAYED_MESSAGES,
      keyRequeueMessages: ERedisKey.KEY_REQUEUE_MESSAGES,
      keyNamespaces: ERedisKey.KEY_NAMESPACES,
      keyQueueSettingsRateLimit: ERedisKey.KEY_QUEUE_SETTINGS_RATE_LIMIT,
      keyQueueSettingsPriorityQueuing:
        ERedisKey.KEY_QUEUE_SETTINGS_PRIORITY_QUEUING,
    };
    return makeNamespacedKeys(mainKeys, globalNamespace);
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

  validateRedisKey(key?: string): string {
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

/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IQueueParams } from '../../../index.js';
import { RedisKeysInvalidKeyError } from '../../../errors/index.js';

/**
 * Redis key configuration constants
 */
const REDIS_KEY_CONFIG = {
  /** Key segments separator */
  SEGMENT_SEPARATOR: ':',

  /**
   * Major version of the Redis data structure.
   *
   * This value MUST be updated upon introducing breaking changes to the Redis data structure.
   *
   * The versioning scheme is based on the major version of the application. For instance,
   * for an application version like v9.x.x, this value should be 9.
   */
  VERSION: 9,

  /** Global namespace identifier */
  GLOBAL_NAMESPACE: 'global',
} as const;

/**
 * Redis key prefix with version
 */
const KEY_PREFIX = `redis-smq-${REDIS_KEY_CONFIG.VERSION}`;

/**
 * Enum for Redis key types
 */
enum ERedisKey {
  // Queue related keys
  QUEUE_PENDING = 1,
  QUEUE_PRIORITY_PENDING,
  QUEUE_DL,
  QUEUE_PROCESSING,
  QUEUE_ACKNOWLEDGED,
  QUEUE_SCHEDULED,
  QUEUE_DELAYED,
  QUEUE_REQUEUED,
  QUEUE_CONSUMERS,
  QUEUE_PROCESSING_QUEUES,
  QUEUE_WORKERS_LOCK,
  QUEUE_RATE_LIMIT_COUNTER,
  QUEUE_PROPERTIES,
  QUEUE_MESSAGES,
  QUEUE_MESSAGE_IDS,
  QUEUE_CONSUMER_GROUPS,
  QUEUE_EXCHANGE_BINDINGS,

  // Message keys
  MESSAGE,

  // Consumer keys
  CONSUMER_QUEUES,
  CONSUMER_HEARTBEAT,

  // Namespace keys
  NS_QUEUES,
  NS_EXCHANGES,

  //
  EXCHANGE,
  EXCHANGE_DIRECT_ROUTING_KEYS,
  EXCHANGE_DIRECT_ROUTING_KEY_QUEUES,
  EXCHANGE_TOPIC_BINDING_PATTERNS,
  EXCHANGE_TOPIC_BINDING_PATTERN_QUEUES,
  EXCHANGE_FANOUT_QUEUES,

  // Global keys
  QUEUES,
  NAMESPACES,
  EXCHANGES,
  CONFIGURATION,
}

/**
 * Type for key mapping objects
 */
type TRedisKeyMap = Record<string, ERedisKey>;

/**
 * Creates namespaced Redis keys from a key mapping
 *
 * @param keys - Object mapping key names to ERedisKey values
 * @param namespace - Namespace for the keys
 * @param rest - Additional key segments
 * @returns Record with the same keys but values as formatted Redis key strings
 */
function makeNamespacedKeys<T extends TRedisKeyMap>(
  keys: T,
  namespace: string,
  ...rest: (string | number)[]
): Record<Extract<keyof T, string>, string> {
  const result: Record<string, string> = {};

  for (const keyName in keys) {
    result[keyName] = [KEY_PREFIX, namespace, keys[keyName], ...rest].join(
      REDIS_KEY_CONFIG.SEGMENT_SEPARATOR,
    );
  }

  return result;
}

/**
 * Redis keys utility functions
 */
export const redisKeys = {
  /**
   * Get keys for a specific namespace
   *
   * @param ns - Namespace
   * @returns Namespace-specific keys
   */
  getNamespaceKeys(ns: string) {
    const keys = {
      keyNamespaceQueues: ERedisKey.NS_QUEUES,
      keyNamespaceExchanges: ERedisKey.NS_EXCHANGES,
    };
    return {
      ...makeNamespacedKeys(keys, ns),
    };
  },

  getExchangeKeys(ns: string, exchangeName: string) {
    const keys = {
      keyExchange: ERedisKey.EXCHANGE,
    };
    return {
      ...makeNamespacedKeys(keys, ns, exchangeName),
    };
  },

  getExchangeDirectKeys(ns: string, exchangeName: string) {
    const keys = {
      keyExchangeRoutingKeys: ERedisKey.EXCHANGE_DIRECT_ROUTING_KEYS,
    };
    return {
      ...this.getExchangeKeys(ns, exchangeName),
      ...makeNamespacedKeys(keys, ns, exchangeName),
    };
  },

  getExchangeTopicKeys(ns: string, exchangeName: string) {
    const keys = {
      keyExchangeBindingPatterns: ERedisKey.EXCHANGE_TOPIC_BINDING_PATTERNS,
    };
    return {
      ...this.getExchangeKeys(ns, exchangeName),
      ...makeNamespacedKeys(keys, ns, exchangeName),
    };
  },

  getExchangeFanoutKeys(ns: string, exchangeName: string) {
    const keys = {
      keyFanoutQueues: ERedisKey.EXCHANGE_FANOUT_QUEUES,
    };
    return {
      ...this.getExchangeKeys(ns, exchangeName),
      ...makeNamespacedKeys(keys, ns, exchangeName),
    };
  },

  getExchangeDirectRoutingKeyKeys(
    ns: string,
    exchangeName: string,
    routingKey: string,
  ) {
    const keys = {
      keyRoutingKeyQueues: ERedisKey.EXCHANGE_DIRECT_ROUTING_KEY_QUEUES,
    };
    return {
      ...makeNamespacedKeys(keys, ns, exchangeName, routingKey),
    };
  },

  getExchangeTopicBindingPatternKeys(
    ns: string,
    exchangeName: string,
    bindingPattern: string,
  ) {
    const keys = {
      keyBindingPatternQueues: ERedisKey.EXCHANGE_TOPIC_BINDING_PATTERN_QUEUES,
    };
    return {
      ...makeNamespacedKeys(keys, ns, exchangeName, bindingPattern),
    };
  },

  /**
   * Get keys for a specific queue
   *
   * @param queueParams - Queue parameters
   * @param consumerGroupId - Optional consumer group ID
   * @returns Queue-specific keys
   */
  getQueueKeys(queueParams: IQueueParams, consumerGroupId: string | null) {
    const queueKeys = {
      keyQueueDL: ERedisKey.QUEUE_DL,
      keyQueueProcessingQueues: ERedisKey.QUEUE_PROCESSING_QUEUES,
      keyQueueAcknowledged: ERedisKey.QUEUE_ACKNOWLEDGED,
      keyQueueScheduled: ERedisKey.QUEUE_SCHEDULED,
      keyQueueRequeued: ERedisKey.QUEUE_REQUEUED,
      keyQueueDelayed: ERedisKey.QUEUE_DELAYED,
      keyQueueConsumers: ERedisKey.QUEUE_CONSUMERS,
      keyQueueRateLimitCounter: ERedisKey.QUEUE_RATE_LIMIT_COUNTER,
      keyQueueProperties: ERedisKey.QUEUE_PROPERTIES,
      keyQueueMessages: ERedisKey.QUEUE_MESSAGES,
      keyQueueMessageIds: ERedisKey.QUEUE_MESSAGE_IDS,
      keyQueueConsumerGroups: ERedisKey.QUEUE_CONSUMER_GROUPS,
      keyQueueWorkersLock: ERedisKey.QUEUE_WORKERS_LOCK,
      keyQueueExchangeBindings: ERedisKey.QUEUE_EXCHANGE_BINDINGS,
    };

    const pendingKeys = {
      keyQueuePending: ERedisKey.QUEUE_PENDING,
      keyQueuePriorityPending: ERedisKey.QUEUE_PRIORITY_PENDING,
    };

    const payload = [queueParams.name];
    const pendingPayload = [
      ...payload,
      ...(consumerGroupId ? [consumerGroupId] : []),
    ];

    return {
      ...makeNamespacedKeys(queueKeys, queueParams.ns, ...payload),
      ...makeNamespacedKeys(pendingKeys, queueParams.ns, ...pendingPayload),
    };
  },

  /**
   * Get keys for a specific message
   *
   * @param messageId - Message ID
   * @returns Message-specific keys
   */
  getMessageKeys(messageId: string) {
    const messageKeys = {
      keyMessage: ERedisKey.MESSAGE,
    };
    return {
      ...makeNamespacedKeys(
        messageKeys,
        REDIS_KEY_CONFIG.GLOBAL_NAMESPACE,
        messageId,
      ),
    };
  },

  /**
   * Get keys for a consumer instance
   *
   * @param instanceId - Consumer instance ID
   * @returns Consumer-specific keys
   */
  getConsumerKeys(instanceId: string) {
    const consumerKeys = {
      keyConsumerQueues: ERedisKey.CONSUMER_QUEUES,
      keyConsumerHeartbeat: ERedisKey.CONSUMER_HEARTBEAT,
    };
    return {
      ...makeNamespacedKeys(
        consumerKeys,
        REDIS_KEY_CONFIG.GLOBAL_NAMESPACE,
        instanceId,
      ),
    };
  },

  /**
   * Get keys for a queue consumer
   *
   * @param queueParams - Queue parameters
   * @param instanceId - Consumer instance ID
   * @returns Queue consumer-specific keys
   */
  getQueueConsumerKeys(queueParams: IQueueParams, instanceId: string) {
    const keys = {
      keyQueueProcessing: ERedisKey.QUEUE_PROCESSING,
    };
    return {
      ...makeNamespacedKeys(keys, queueParams.ns, queueParams.name, instanceId),
    };
  },

  /**
   * Get main global keys
   *
   * @returns Global keys
   */
  getMainKeys() {
    const mainKeys = {
      keyQueues: ERedisKey.QUEUES,
      keyExchanges: ERedisKey.EXCHANGES,
      keyNamespaces: ERedisKey.NAMESPACES,
      keyConfiguration: ERedisKey.CONFIGURATION,
    };
    return makeNamespacedKeys(mainKeys, REDIS_KEY_CONFIG.GLOBAL_NAMESPACE);
  },

  /**
   * Validate a namespace string
   *
   * @param ns - Namespace to validate
   * @returns Validated namespace or error
   */
  validateNamespace(ns: string): string | RedisKeysInvalidKeyError {
    const validated = this.validateRedisKey(ns);

    if (validated instanceof RedisKeysInvalidKeyError) {
      return validated;
    }

    if (validated === REDIS_KEY_CONFIG.GLOBAL_NAMESPACE) {
      return new RedisKeysInvalidKeyError();
    }

    return validated;
  },

  /**
   * Validate a Redis key string
   *
   * @param key - Key to validate
   * @returns Validated key or error
   */
  validateRedisKey(
    key: string | null | undefined,
  ): string | RedisKeysInvalidKeyError {
    if (!key || !key.length) {
      return new RedisKeysInvalidKeyError();
    }

    const lowerCase = key.toLowerCase();
    // Regex matches valid key patterns, then we check if anything remains
    const filtered = lowerCase.replace(
      /(?:[a-z][a-z0-9]?)+(?:[-_.]?[a-z0-9])*/g,
      '',
    );

    if (filtered.length) {
      return new RedisKeysInvalidKeyError();
    }

    return lowerCase;
  },

  /**
   * Get the key segment separator
   *
   * @returns Key segment separator
   */
  getKeySegmentSeparator() {
    return REDIS_KEY_CONFIG.SEGMENT_SEPARATOR;
  },
};

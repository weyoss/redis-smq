/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IQueueParams } from '../../lib/index.js';
import { RedisKeysInvalidKeyError } from './errors/index.js';

// Key segments separator
const keySegmentSeparator = ':';

// Key prefix
const nsPrefix = 'redis-smq-rc826';

// Namespaces
const globalNamespace = 'global';

enum ERedisKey {
  KEY_QUEUE_PENDING = 1,
  KEY_QUEUE_PRIORITY_PENDING,
  KEY_QUEUE_DL,
  KEY_QUEUE_PROCESSING,
  KEY_QUEUE_ACKNOWLEDGED,
  KEY_QUEUE_SCHEDULED,
  KEY_QUEUE_DELAYED,
  KEY_QUEUE_REQUEUED,
  KEY_QUEUE_CONSUMERS,
  KEY_QUEUE_PROCESSING_QUEUES,
  KEY_QUEUE_WORKERS_LOCK,
  KEY_QUEUE_RATE_LIMIT_COUNTER,
  KEY_QUEUE_PROPERTIES,
  KEY_QUEUE_MESSAGES,
  KEY_QUEUE_MESSAGE_IDS,
  KEY_QUEUE_CONSUMER_GROUPS,
  KEY_QUEUES,
  KEY_CONSUMER_QUEUES,
  KEY_CONSUMER_HEARTBEAT,
  KEY_NS_QUEUES,
  KEY_NAMESPACES,
  KEY_EXCHANGE_BINDINGS,
  KEY_FANOUT_EXCHANGES,
  KEY_MESSAGE,
}

function makeNamespacedKeys<T extends Record<string, ERedisKey>>(
  keys: T,
  namespace: string,
  ...rest: (string | number)[]
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
    const keys = {
      keyNamespaceQueues: ERedisKey.KEY_NS_QUEUES,
    };
    return {
      ...makeNamespacedKeys(keys, ns),
    };
  },

  getQueueKeys(queueParams: IQueueParams, consumerGroupId: string | null) {
    const queueKeys = {
      keyQueueDL: ERedisKey.KEY_QUEUE_DL,
      keyQueueProcessingQueues: ERedisKey.KEY_QUEUE_PROCESSING_QUEUES,
      keyQueueAcknowledged: ERedisKey.KEY_QUEUE_ACKNOWLEDGED,
      keyQueueScheduled: ERedisKey.KEY_QUEUE_SCHEDULED,
      keyQueueRequeued: ERedisKey.KEY_QUEUE_REQUEUED,
      keyQueueDelayed: ERedisKey.KEY_QUEUE_DELAYED,
      keyQueueConsumers: ERedisKey.KEY_QUEUE_CONSUMERS,
      keyQueueRateLimitCounter: ERedisKey.KEY_QUEUE_RATE_LIMIT_COUNTER,
      keyQueueProperties: ERedisKey.KEY_QUEUE_PROPERTIES,
      keyQueueMessages: ERedisKey.KEY_QUEUE_MESSAGES,
      keyQueueMessageIds: ERedisKey.KEY_QUEUE_MESSAGE_IDS,
      keyQueueConsumerGroups: ERedisKey.KEY_QUEUE_CONSUMER_GROUPS,
      keyQueueWorkersLock: ERedisKey.KEY_QUEUE_WORKERS_LOCK,
    };
    const pendingKeys = {
      keyQueuePending: ERedisKey.KEY_QUEUE_PENDING,
      keyQueuePriorityPending: ERedisKey.KEY_QUEUE_PRIORITY_PENDING,
    };
    const payload = [queueParams.name];
    return {
      ...makeNamespacedKeys(queueKeys, queueParams.ns, ...payload),
      ...makeNamespacedKeys(
        pendingKeys,
        queueParams.ns,
        ...payload,
        ...(consumerGroupId ? [consumerGroupId] : []),
      ),
    };
  },

  getMessageKeys(messageId: string) {
    const exchangeKeys = {
      keyMessage: ERedisKey.KEY_MESSAGE,
    };
    return {
      ...makeNamespacedKeys(exchangeKeys, globalNamespace, messageId),
    };
  },

  getFanOutExchangeKeys(bindingKey: string) {
    const exchangeKeys = {
      keyExchangeBindings: ERedisKey.KEY_EXCHANGE_BINDINGS,
    };
    return {
      ...makeNamespacedKeys(exchangeKeys, globalNamespace, bindingKey),
    };
  },

  getConsumerKeys(instanceId: string) {
    const consumerKeys = {
      keyConsumerQueues: ERedisKey.KEY_CONSUMER_QUEUES,
      keyConsumerHeartbeat: ERedisKey.KEY_CONSUMER_HEARTBEAT,
    };
    return {
      ...makeNamespacedKeys(consumerKeys, globalNamespace, instanceId),
    };
  },

  getQueueConsumerKeys(queueParams: IQueueParams, instanceId: string) {
    const keys = {
      keyQueueProcessing: ERedisKey.KEY_QUEUE_PROCESSING,
    };
    return {
      ...makeNamespacedKeys(keys, queueParams.ns, queueParams.name, instanceId),
    };
  },

  getMainKeys() {
    const mainKeys = {
      keyQueues: ERedisKey.KEY_QUEUES,
      keyNamespaces: ERedisKey.KEY_NAMESPACES,
      keyFanOutExchanges: ERedisKey.KEY_FANOUT_EXCHANGES,
    };
    return makeNamespacedKeys(mainKeys, globalNamespace);
  },

  validateNamespace(ns: string): string | RedisKeysInvalidKeyError {
    const validated = this.validateRedisKey(ns);
    if (validated === globalNamespace) {
      return new RedisKeysInvalidKeyError();
    }
    return validated;
  },

  validateRedisKey(
    key: string | null | undefined,
  ): string | RedisKeysInvalidKeyError {
    if (!key || !key.length) {
      return new RedisKeysInvalidKeyError();
    }
    const lowerCase = key.toLowerCase();
    const filtered = lowerCase.replace(
      /(?:[a-z][a-z0-9]?)+(?:[-_.]?[a-z0-9])*/,
      '',
    );
    if (filtered.length) {
      return new RedisKeysInvalidKeyError();
    }
    return lowerCase;
  },

  getKeySegmentSeparator() {
    return keySegmentSeparator;
  },
};

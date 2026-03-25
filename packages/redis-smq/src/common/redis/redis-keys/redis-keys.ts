/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IQueueParams } from '../../../index.js';
import { InvalidRedisKeyError } from '../../../errors/index.js';

// Configuration
const VERSION = 10;
const PREFIX = `redis-smq:${VERSION}`;
const GLOBAL = 'global';
const KEY_SEPARATOR = ':';

// Key Hierarchy Structure
//
// Level 1: Entity (domain)
// Level 2: Scope (namespace/global)
// Level 3: Resource (queue/exchange name)
// Level 4: Sub-resource (consumer group, routing key)
// Level 5: Type (data structure type)
//
// Examples:
//   redis-smq:10:queue:production:orders:props
//   redis-smq:10:queue:production:orders:group1:pending
//   redis-smq:10:namespace:production:queues
//   redis-smq:10:exchange:production:orders:routing-keys
//   redis-smq:10:global:queues
//   redis-smq:10:consumer:abc123:queues

// Level 1: Entities
const Entity = {
  QUEUE: 'queue',
  NAMESPACE: 'namespace',
  EXCHANGE: 'exchange',
  MESSAGE: 'message',
  CONSUMER: 'consumer',
  JOB: 'job',
  WORKER: 'worker',
  GLOBAL: 'global',
} as const;

// Level 5: Types (last segment)
const Type = {
  PENDING: 'pending',
  PRIORITY: 'priority',
  DEAD_LETTER: 'dead-letter',
  PROCESSING: 'processing',
  ACKNOWLEDGED: 'ack',
  SCHEDULED: 'scheduled',
  DELAYED: 'delayed',
  REQUEUED: 'requeued',
  PROPERTIES: 'props',
  CONSUMERS: 'consumers',
  CONSUMER_GROUPS: 'consumer-groups',
  STATE_HISTORY: 'state-history',
  BINDINGS: 'bindings',
  PROCESSING_QUEUES: 'proc-queues',
  WORKER_LOCK: 'worker-lock',
  RATE_LIMIT: 'rate',
  QUEUES: 'queues',
  EXCHANGES: 'exchanges',
  NAMESPACES: 'namespaces',
  ROUTING_KEYS: 'routing-keys',
  ROUTING_PATTERNS: 'routing-patterns',
  CONFIG: 'config',
  JOBS: 'jobs',
  JOB_WORKER: 'worker',
  HEARTBEAT: 'heartbeat',
} as const;

/**
 * Build a key following the hierarchy: entity > scope > resource > sub > type
 */
function buildKey(entity: string, ...segments: string[]): string {
  return [PREFIX, entity, ...segments].join(KEY_SEPARATOR);
}

export const redisKeys = {
  // ==========================================================================
  // Queue Keys - hierarchy: queue > namespace > queue > [group] > type
  // ==========================================================================

  getQueueKeys(
    ns: string,
    queueName: string,
    consumerGroupId: string | null = null,
  ) {
    // Path: queue > namespace > queueName
    const basePath = [ns, queueName];

    // Path with group: queue > namespace > queueName > groupId
    const groupPath = consumerGroupId
      ? [ns, queueName, consumerGroupId]
      : basePath;

    return {
      // Message queues
      keyQueuePending: buildKey(Entity.QUEUE, ...groupPath, Type.PENDING),
      keyQueuePriorityPending: buildKey(
        Entity.QUEUE,
        ...groupPath,
        Type.PRIORITY,
      ),
      keyQueueDL: buildKey(Entity.QUEUE, ...basePath, Type.DEAD_LETTER),
      keyQueueProcessing: buildKey(Entity.QUEUE, ...basePath, Type.PROCESSING),
      keyQueueAcknowledged: buildKey(
        Entity.QUEUE,
        ...basePath,
        Type.ACKNOWLEDGED,
      ),
      keyQueueScheduled: buildKey(Entity.QUEUE, ...basePath, Type.SCHEDULED),
      keyQueueDelayed: buildKey(Entity.QUEUE, ...basePath, Type.DELAYED),
      keyQueueRequeued: buildKey(Entity.QUEUE, ...basePath, Type.REQUEUED),

      // Metadata
      keyQueueProperties: buildKey(Entity.QUEUE, ...basePath, Type.PROPERTIES),
      keyQueueConsumers: buildKey(Entity.QUEUE, ...basePath, Type.CONSUMERS),
      keyQueueConsumerGroups: buildKey(
        Entity.QUEUE,
        ...basePath,
        Type.CONSUMER_GROUPS,
      ),
      keyQueueStateHistory: buildKey(
        Entity.QUEUE,
        ...basePath,
        Type.STATE_HISTORY,
      ),
      keyQueueExchangeBindings: buildKey(
        Entity.QUEUE,
        ...basePath,
        Type.BINDINGS,
      ),
      keyQueueProcessingQueues: buildKey(
        Entity.QUEUE,
        ...basePath,
        Type.PROCESSING_QUEUES,
      ),

      // Control
      keyQueueWorkersLock: buildKey(
        Entity.QUEUE,
        ...basePath,
        Type.WORKER_LOCK,
      ),
      keyQueueRateLimitCounter: buildKey(
        Entity.QUEUE,
        ...basePath,
        Type.RATE_LIMIT,
      ),

      // Legacy
      keyQueueMessages: buildKey(Entity.QUEUE, ...basePath, 'messages'),
      keyQueuePublished: buildKey(Entity.QUEUE, ...basePath, 'published'),
    };
  },

  getQueueConsumerKeys(queue: IQueueParams, instanceId: string) {
    return {
      keyQueueProcessing: buildKey(
        Entity.QUEUE,
        queue.ns,
        queue.name,
        instanceId,
        Type.PROCESSING,
      ),
    };
  },

  // ==========================================================================
  // Namespace Keys - hierarchy: namespace > ns > type
  // ==========================================================================

  getNamespaceKeys(ns: string) {
    return {
      keyNamespaceQueues: buildKey(Entity.NAMESPACE, ns, Type.QUEUES),
      keyNamespaceExchanges: buildKey(Entity.NAMESPACE, ns, Type.EXCHANGES),
    };
  },

  // ==========================================================================
  // Exchange Keys - hierarchy: exchange > ns > name > [routing] > type
  // ==========================================================================

  getExchangeKeys(ns: string, exchangeName: string) {
    return {
      keyExchange: buildKey(Entity.EXCHANGE, ns, exchangeName, Type.PROPERTIES),
    };
  },

  getExchangeDirectKeys(ns: string, exchangeName: string) {
    return {
      keyExchange: buildKey(Entity.EXCHANGE, ns, exchangeName, Type.PROPERTIES),
      keyExchangeRoutingKeys: buildKey(
        Entity.EXCHANGE,
        ns,
        exchangeName,
        Type.ROUTING_KEYS,
      ),
    };
  },

  getExchangeDirectRoutingKeyKeys(
    ns: string,
    exchangeName: string,
    routingKey: string,
  ) {
    return {
      keyRoutingKeyQueues: buildKey(
        Entity.EXCHANGE,
        ns,
        exchangeName,
        routingKey,
        Type.QUEUES,
      ),
    };
  },

  getExchangeTopicKeys(ns: string, exchangeName: string) {
    return {
      keyExchange: buildKey(Entity.EXCHANGE, ns, exchangeName, Type.PROPERTIES),
      keyExchangeBindingPatterns: buildKey(
        Entity.EXCHANGE,
        ns,
        exchangeName,
        Type.ROUTING_PATTERNS,
      ),
    };
  },

  getExchangeTopicBindingPatternKeys(
    ns: string,
    exchangeName: string,
    pattern: string,
  ) {
    return {
      keyBindingPatternQueues: buildKey(
        Entity.EXCHANGE,
        ns,
        exchangeName,
        pattern,
        Type.QUEUES,
      ),
    };
  },

  getExchangeFanoutKeys(ns: string, exchangeName: string) {
    return {
      keyExchange: buildKey(Entity.EXCHANGE, ns, exchangeName, Type.PROPERTIES),
      keyFanoutQueues: buildKey(Entity.EXCHANGE, ns, exchangeName, Type.QUEUES),
    };
  },

  // ==========================================================================
  // Global Keys - hierarchy: global > type
  // ==========================================================================

  getMainKeys() {
    return {
      // Registry
      keyQueues: buildKey(Entity.GLOBAL, Type.QUEUES),
      keyExchanges: buildKey(Entity.GLOBAL, Type.EXCHANGES),
      keyNamespaces: buildKey(Entity.GLOBAL, Type.NAMESPACES),
      keyConfiguration: buildKey(Entity.GLOBAL, Type.CONFIG),

      // Purge jobs
      keyPurgeQueueBackgroundJobs: buildKey(Entity.GLOBAL, 'purge', Type.JOBS),
      keyPurgeQueueBackgroundJobsPending: buildKey(
        Entity.GLOBAL,
        'purge',
        Type.PENDING,
      ),
      keyPurgeQueueBackgroundJobsProcessing: buildKey(
        Entity.GLOBAL,
        'purge',
        Type.PROCESSING,
      ),

      // Create jobs
      keyCreateQueueBackgroundJobs: buildKey(
        Entity.GLOBAL,
        'create',
        Type.JOBS,
      ),
      keyCreateQueueBackgroundJobsPending: buildKey(
        Entity.GLOBAL,
        'create',
        Type.PENDING,
      ),
      keyCreateQueueBackgroundJobsProcessing: buildKey(
        Entity.GLOBAL,
        'create',
        Type.PROCESSING,
      ),
    };
  },

  // ==========================================================================
  // Message Keys - hierarchy: message > id
  // ==========================================================================

  getMessageKeys(messageId: string) {
    return {
      keyMessage: buildKey(Entity.MESSAGE, messageId),
    };
  },

  // ==========================================================================
  // Consumer Keys - hierarchy: consumer > id > type
  // ==========================================================================

  getConsumerKeys(instanceId: string) {
    return {
      keyConsumerQueues: buildKey(Entity.CONSUMER, instanceId, Type.QUEUES),
      keyConsumerHeartbeat: buildKey(
        Entity.CONSUMER,
        instanceId,
        Type.HEARTBEAT,
      ),
    };
  },

  // ==========================================================================
  // Job Keys - hierarchy: job > id > type
  // ==========================================================================

  getBackgroundJobKeys(jobId: string) {
    return {
      keyBackgroundJobWorkerId: buildKey(Entity.JOB, jobId, Type.JOB_WORKER),
    };
  },

  getBackgroundJobWorkerKeys(workerId: string) {
    return {
      keyBackgroundJobWorkerHeartbeat: buildKey(
        Entity.WORKER,
        workerId,
        Type.HEARTBEAT,
      ),
    };
  },

  // ==========================================================================
  // Validation
  // ==========================================================================

  validateNamespace(ns: string): string | InvalidRedisKeyError {
    const result = this.validateKey(ns);
    if (result instanceof InvalidRedisKeyError) return result;
    if (result === GLOBAL) return new InvalidRedisKeyError();
    return result;
  },

  validateKey(key: string | null | undefined): string | InvalidRedisKeyError {
    if (!key?.length) return new InvalidRedisKeyError();
    const valid = /^[a-z][a-z0-9\-_.]*$/.test(key.toLowerCase());
    if (!valid) return new InvalidRedisKeyError();
    return key.toLowerCase();
  },
};

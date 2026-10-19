/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisSMQ } from 'redis-smq';
import { createLogger } from 'redis-smq-common';
import type { IParsedApiConfig } from '../config/index.js';
import type { Deps } from './Deps.js';

/**
 * The composition root.
 *
 * This is the only file in the package that calls `RedisSMQ.createX()`.
 * Everything downstream — the router, every handler — receives the
 * resulting object as an argument. That single rule is what makes the
 * HTTP layer substitutable: swap this function for a test double and
 * the entire `features/` tree runs without Redis.
 *
 * Ordering note: `RedisSMQ.initialize()` must have been called before
 * any of these factories are invoked. The server class guarantees this
 * by calling `createDeps` inside `bootstrap()`, after `initialize()`.
 */
export function createDeps(config: IParsedApiConfig): Deps {
  return {
    // ─── Queues ─────────────────────────────────────────────────────
    queueManager: RedisSMQ.createQueueManager(),

    // ─── Messages ───────────────────────────────────────────────────
    messageManager: RedisSMQ.createMessageManager(),
    producer: RedisSMQ.createProducer(),

    // ─── Exchanges ──────────────────────────────────────────────────
    exchangeManager: RedisSMQ.createExchangeManager(),
    exchangeDirect: RedisSMQ.createDirectExchange(),
    exchangeFanout: RedisSMQ.createFanoutExchange(),
    exchangeTopic: RedisSMQ.createTopicExchange(),

    // ─── Consumer groups ────────────────────────────────────────────
    consumerGroups: RedisSMQ.createConsumerGroupsManager(),

    // ─── Namespaces ─────────────────────────────────────────────────
    namespaceManager: RedisSMQ.createNamespaceManager(),

    // ─── Queue operational state ────────────────────────────────────
    queueState: RedisSMQ.createQueueStateManager(),

    // ─── Rate limiting ──────────────────────────────────────────────
    queueRateLimit: RedisSMQ.createQueueRateLimitManager(),

    // ─── Runtime configuration ──────────────────────────────────────
    configManager: RedisSMQ.createConfigManager(),

    // ─── Per-status message browsers ────────────────────────────────
    queuePublishedMessages: RedisSMQ.createQueuePublishedMessages(),
    queuePendingMessages: RedisSMQ.createQueuePendingMessages(),
    queueAcknowledgedMessages: RedisSMQ.createQueueAcknowledgedMessages(),
    queueDeadLetteredMessages: RedisSMQ.createQueueDeadLetteredMessages(),
    queueScheduledMessages: RedisSMQ.createQueueScheduledMessages(),

    // ─── Cross-cutting ──────────────────────────────────────────────
    logger: createLogger(config.logger, 'RedisSMQRestApi'),
  };
}

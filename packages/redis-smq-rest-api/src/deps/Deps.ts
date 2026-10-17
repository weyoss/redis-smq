/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type {
  IConfigManager,
  IConsumerGroupsManager,
  IExchangeDirect,
  IExchangeFanout,
  IExchangeManager,
  IExchangeTopic,
  IMessageManager,
  INamespaceManager,
  IProducer,
  IQueueAcknowledgedMessages,
  IQueueDeadLetteredMessages,
  IQueueManager,
  IQueuePendingMessages,
  IQueuePublishedMessages,
  IQueueRateLimitManager,
  IQueueScheduledMessages,
  IQueueStateManager,
} from 'redis-smq';
import type { ILogger } from 'redis-smq-common';

/**
 * The redis-smq surface this HTTP adapter exposes, plus a logger.
 *
 * Every field is a redis-smq interface — no custom ports, no wrappers.
 * The package's job is to translate HTTP ↔ these calls; the contracts
 * themselves belong to the library.
 *
 * Handlers receive a `Deps` instance as their first argument. The
 * composition root (`createDeps.ts`) is the only file that constructs
 * one. No `getInstance()`, no container, no service locator.
 */
export interface Deps {
  // ─── Queues ─────────────────────────────────────────────────────────
  queueManager: IQueueManager;

  // ─── Messages ───────────────────────────────────────────────────────
  messageManager: IMessageManager;
  producer: IProducer;

  // ─── Exchanges ──────────────────────────────────────────────────────
  exchangeManager: IExchangeManager;
  exchangeDirect: IExchangeDirect;
  exchangeFanout: IExchangeFanout;
  exchangeTopic: IExchangeTopic;

  // ─── Consumer groups ────────────────────────────────────────────────
  consumerGroups: IConsumerGroupsManager;

  // ─── Namespaces ─────────────────────────────────────────────────────
  namespaceManager: INamespaceManager;

  // ─── Queue operational state ────────────────────────────────────────
  queueState: IQueueStateManager;

  // ─── Rate limiting ──────────────────────────────────────────────────
  queueRateLimit: IQueueRateLimitManager;

  // ─── Runtime configuration ──────────────────────────────────────────
  configManager: IConfigManager;

  // ─── Per-status message browsers ────────────────────────────────────
  queuePublishedMessages: IQueuePublishedMessages;
  queuePendingMessages: IQueuePendingMessages;
  queueAcknowledgedMessages: IQueueAcknowledgedMessages;
  queueDeadLetteredMessages: IQueueDeadLetteredMessages;
  queueScheduledMessages: IQueueScheduledMessages;

  // ─── Cross-cutting ──────────────────────────────────────────────────
  logger: ILogger;
}

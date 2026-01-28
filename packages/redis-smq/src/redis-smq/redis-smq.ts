/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ProducerFactory } from './factories/producer-factory.js';
import { ConsumerFactory } from './factories/consumer-factory.js';
import { MessageManagerFactory } from './factories/message-manager-factory.js';
import { QueueManagerFactory } from './factories/queue-manager-factory.js';
import { QueueMessagesFactory } from './factories/queue-messages-factory.js';
import { ConsumerGroupsFactory } from './factories/consumer-groups-factory.js';
import { ScheduledMessagesFactory } from './factories/scheduled-messages-factory.js';
import { FanoutExchangeFactory } from './factories/fanout-exchange-factory.js';
import { TopicExchangeFactory } from './factories/topic-exchange-factory.js';
import { DirectExchangeFactory } from './factories/direct-exchange-factory.js';
import { NamespaceManagerFactory } from './factories/namespace-manager-factory.js';
import { AcknowledgedMessagesFactory } from './factories/queue-acknowledged-messages-factory.js';
import { DeadLetteredMessagesFactory } from './factories/queue-dead-lettered-messages-factory.js';
import { PendingMessagesFactory } from './factories/queue-pending-messages-factory.js';
import { RateLimitFactory } from './factories/queue-rate-limit-factory.js';
import { LifecycleManager } from './lifecycle-manager.js';

/**
 * Main RedisSMQ class providing a simplified API for Redis-based message queue operations.
 * Handles global Redis connection management and provides factory methods for creating
 * various queue-related components like producers, consumers, and message managers.
 * Must be initialized with Redis configuration before use.
 */
export class RedisSMQ {
  // Factory methods - simple delegation
  static createConsumer = ConsumerFactory.create;
  static createProducer = ProducerFactory.create;
  static createMessageManager = MessageManagerFactory.create;
  static createQueueManager = QueueManagerFactory.create;
  static createNamespaceManager = NamespaceManagerFactory.create;
  static createQueueMessages = QueueMessagesFactory.create;
  static createConsumerGroups = ConsumerGroupsFactory.create;
  static createQueueAcknowledgedMessages = AcknowledgedMessagesFactory.create;
  static createQueueDeadLetteredMessages = DeadLetteredMessagesFactory.create;
  static createQueueScheduledMessages = ScheduledMessagesFactory.create;
  static createQueuePendingMessages = PendingMessagesFactory.create;
  static createQueueRateLimit = RateLimitFactory.create;
  static createFanoutExchange = FanoutExchangeFactory.create;
  static createTopicExchange = TopicExchangeFactory.create;
  static createDirectExchange = DirectExchangeFactory.create;

  // Convenience starter methods
  static startProducer = ProducerFactory.startProducer.bind(ProducerFactory);
  static startConsumer = ConsumerFactory.startConsumer.bind(ConsumerFactory);

  // Lifecycle methods
  static initialize = LifecycleManager.initialize;
  static initializeWithConfig = LifecycleManager.initializeWithConfig;
  static shutdown = LifecycleManager.shutdown;
  static reset = LifecycleManager.reset;
  static isInitialized = LifecycleManager.isInitialized;
}

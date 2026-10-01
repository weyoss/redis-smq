/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  asClass,
  asFunction,
  AwilixContainer,
  createContainer,
  InjectionMode,
} from 'awilix';
import { ConsumerGroupsService } from '../services/ConsumerGroupsService.js';
import { ExchangesService } from '../services/ExchangesService.js';
import { MessagesService } from '../services/MessagesService.js';
import { NamespacesService } from '../services/NamespacesService.js';
import { QueueMessagesService } from '../services/QueueMessagesService.js';
import { QueueRateLimitService } from '../services/QueueRateLimitService.js';
import { QueuesService } from '../services/QueuesService.js';
import { IContainer } from './types/container.js';
import { ConfigurationService } from '../services/ConfigurationService.js';
import { QueueOperationalStateService } from '../services/QueueOperationalStateService.js';
import { RedisSMQ } from 'redis-smq';

export class Container {
  private static instance: AwilixContainer<IContainer> | null = null;

  static registerServices() {
    const instance = this.getInstance();
    instance.register({
      // RedisSMQ classes
      queueManager: asFunction(() => RedisSMQ.createQueueManager()).singleton(),
      queueStateManager: asFunction(() =>
        RedisSMQ.createQueueStateManager(),
      ).singleton(),
      queuePublishedMessages: asFunction(() =>
        RedisSMQ.createQueuePublishedMessages(),
      ).singleton(),
      queuePendingMessages: asFunction(() =>
        RedisSMQ.createQueuePendingMessages(),
      ).singleton(),
      queueAcknowledgedMessages: asFunction(() =>
        RedisSMQ.createQueueAcknowledgedMessages(),
      ).singleton(),
      queueDeadLetteredMessages: asFunction(() =>
        RedisSMQ.createQueueDeadLetteredMessages(),
      ).singleton(),
      queueScheduledMessages: asFunction(() =>
        RedisSMQ.createQueueScheduledMessages(),
      ).singleton(),
      messageManager: asFunction(() =>
        RedisSMQ.createMessageManager(),
      ).singleton(),
      queueRateLimit: asFunction(() =>
        RedisSMQ.createQueueRateLimitManager(),
      ).singleton(),
      namespaceManager: asFunction(() =>
        RedisSMQ.createNamespaceManager(),
      ).singleton(),
      exchangeManager: asFunction(() =>
        RedisSMQ.createExchangeManager(),
      ).singleton(),
      exchangeFanout: asFunction(() =>
        RedisSMQ.createFanoutExchange(),
      ).singleton(),
      exchangeTopic: asFunction(() =>
        RedisSMQ.createTopicExchange(),
      ).singleton(),
      exchangeDirect: asFunction(() =>
        RedisSMQ.createDirectExchange(),
      ).singleton(),
      exchange: asFunction(() => RedisSMQ.createExchangeManager()).singleton(),
      consumerGroups: asFunction(() =>
        RedisSMQ.createConsumerGroupsManager(),
      ).singleton(),
      producer: asFunction(() => RedisSMQ.createProducer())
        .singleton()
        .disposer((i) => new Promise((resolve) => i.shutdown(resolve))),
      configManager: asFunction(() =>
        RedisSMQ.createConfigManager(),
      ).singleton(),

      // Services
      queuesService: asClass(QueuesService),
      queueMessagesService: asClass(QueueMessagesService),
      messagesService: asClass(MessagesService),
      queueRateLimitService: asClass(QueueRateLimitService),
      namespacesService: asClass(NamespacesService),
      exchangesService: asClass(ExchangesService),
      consumerGroupsService: asClass(ConsumerGroupsService),
      configurationService: asClass(ConfigurationService),
      queueOperationalStateService: asClass(QueueOperationalStateService),
    });
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = createContainer<IContainer>({
        injectionMode: InjectionMode.CLASSIC,
      });
    }
    return this.instance;
  }
}

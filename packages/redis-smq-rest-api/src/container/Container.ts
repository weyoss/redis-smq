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
import {
  ConsumerGroups,
  ExchangeFanout,
  MessageManager,
  NamespaceManager,
  Producer,
  QueueManager,
  QueueAcknowledgedMessages,
  QueueDeadLetteredMessages,
  QueueMessages,
  QueuePendingMessages,
  QueueRateLimit,
  QueueScheduledMessages,
  ExchangeTopic,
  ExchangeDirect,
  Exchange,
  Configuration,
} from 'redis-smq';
import { ConsumerGroupsService } from '../services/ConsumerGroupsService.js';
import { ExchangeDirectService } from '../services/ExchangeDirectService.js';
import { ExchangeFanoutService } from '../services/ExchangeFanoutService.js';
import { ExchangesService } from '../services/ExchangesService.js';
import { ExchangeTopicService } from '../services/ExchangeTopicService.js';
import { MessagesService } from '../services/MessagesService.js';
import { NamespacesService } from '../services/NamespacesService.js';
import { QueueAcknowledgedMessagesService } from '../services/QueueAcknowledgedMessagesService.js';
import { QueueDeadLetteredMessagesService } from '../services/QueueDeadLetteredMessagesService.js';
import { QueueMessagesService } from '../services/QueueMessagesService.js';
import { QueuePendingMessagesService } from '../services/QueuePendingMessagesService.js';
import { QueueRateLimitService } from '../services/QueueRateLimitService.js';
import { QueueScheduledMessagesService } from '../services/QueueScheduledMessagesService.js';
import { QueuesService } from '../services/QueuesService.js';
import { IContainer } from './types/container.js';
import { ConfigurationService } from '../services/ConfigurationService.js';

export class Container {
  private static instance: AwilixContainer<IContainer> | null = null;

  static registerServices() {
    const instance = this.getInstance();
    instance.register({
      // RedisSMQ classes
      queueManager: asClass(QueueManager).singleton(),
      queueMessages: asClass(QueueMessages).singleton(),
      queuePendingMessages: asClass(QueuePendingMessages).singleton(),
      queueAcknowledgedMessages: asClass(QueueAcknowledgedMessages).singleton(),
      queueDeadLetteredMessages: asClass(QueueDeadLetteredMessages).singleton(),
      queueScheduledMessages: asClass(QueueScheduledMessages).singleton(),
      messageManager: asClass(MessageManager).singleton(),
      queueRateLimit: asClass(QueueRateLimit).singleton(),
      namespaceManager: asClass(NamespaceManager).singleton(),
      exchangeFanout: asClass(ExchangeFanout).singleton(),
      exchangeTopic: asClass(ExchangeTopic).singleton(),
      exchangeDirect: asClass(ExchangeDirect).singleton(),
      exchange: asClass(Exchange).singleton(),
      consumerGroups: asClass(ConsumerGroups).singleton(),
      producer: asClass(Producer)
        .singleton()
        .disposer((i) => new Promise((resolve) => i.shutdown(resolve))),
      configuration: asFunction(() => Configuration.getInstance()).singleton(),

      // Services
      queuesService: asClass(QueuesService),
      queueMessagesService: asClass(QueueMessagesService),
      queuePendingMessagesService: asClass(QueuePendingMessagesService),
      queueScheduledMessagesService: asClass(QueueScheduledMessagesService),
      queueAcknowledgedMessagesService: asClass(
        QueueAcknowledgedMessagesService,
      ),
      queueDeadLetteredMessagesService: asClass(
        QueueDeadLetteredMessagesService,
      ),
      messagesService: asClass(MessagesService),
      queueRateLimitService: asClass(QueueRateLimitService),
      namespacesService: asClass(NamespacesService),
      exchangeFanoutService: asClass(ExchangeFanoutService),
      exchangeDirectService: asClass(ExchangeDirectService),
      exchangeTopicService: asClass(ExchangeTopicService),
      exchangesService: asClass(ExchangesService),
      consumerGroupsService: asClass(ConsumerGroupsService),
      configurationService: asClass(ConfigurationService),
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

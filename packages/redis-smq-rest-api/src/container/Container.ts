/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
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
  ExchangeFanOut,
  Message,
  Namespace,
  Producer,
  Queue,
  QueueAcknowledgedMessages,
  QueueDeadLetteredMessages,
  QueueMessages,
  QueuePendingMessages,
  QueueRateLimit,
  QueueScheduledMessages,
} from 'redis-smq';
import { logger } from 'redis-smq-common';
import { ConsumerGroupsService } from '../services/ConsumerGroupsService.js';
import { ExchangeFanOutService } from '../services/ExchangeFanOutService.js';
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

export class Container {
  private static instance: AwilixContainer<IContainer> | null = null;

  static registerServices() {
    const instance = this.getInstance();
    instance.register({
      // RedisSMQ classes
      queue: asClass(Queue)
        .singleton()
        .disposer((i) => new Promise((resolve) => i.shutdown(resolve))),
      queueMessages: asClass(QueueMessages)
        .singleton()
        .disposer((i) => new Promise((resolve) => i.shutdown(resolve))),
      queuePendingMessages: asClass(QueuePendingMessages)
        .singleton()
        .disposer((i) => new Promise((resolve) => i.shutdown(resolve))),
      queueAcknowledgedMessages: asClass(QueueAcknowledgedMessages)
        .singleton()
        .disposer((i) => new Promise((resolve) => i.shutdown(resolve))),
      queueDeadLetteredMessages: asClass(QueueDeadLetteredMessages)
        .singleton()
        .disposer((i) => new Promise((resolve) => i.shutdown(resolve))),
      queueScheduledMessages: asClass(QueueScheduledMessages)
        .singleton()
        .disposer((i) => new Promise((resolve) => i.shutdown(resolve))),
      message: asClass(Message)
        .singleton()
        .disposer((i) => new Promise((resolve) => i.shutdown(resolve))),
      queueRateLimit: asClass(QueueRateLimit)
        .singleton()
        .disposer((i) => new Promise((resolve) => i.shutdown(resolve))),
      namespace: asClass(Namespace)
        .singleton()
        .disposer((i) => new Promise((resolve) => i.shutdown(resolve))),
      exchangeFanOut: asClass(ExchangeFanOut)
        .singleton()
        .disposer((i) => new Promise((resolve) => i.shutdown(resolve))),
      consumerGroups: asClass(ConsumerGroups)
        .singleton()
        .disposer((i) => new Promise((resolve) => i.shutdown(resolve))),
      producer: asClass(Producer)
        .singleton()
        .disposer((i) => new Promise((resolve) => i.shutdown(resolve))),
      logger: asFunction(() => {
        const config = instance.resolve('config').logger || {
          enabled: false,
        };
        return logger.getLogger(config);
      }).singleton(),

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
      exchangeFanOutService: asClass(ExchangeFanOutService),
      consumerGroupsService: asClass(ConsumerGroupsService),
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

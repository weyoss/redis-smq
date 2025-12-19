/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

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
  Exchange,
  ExchangeDirect,
  ExchangeTopic,
  Configuration,
} from 'redis-smq';
import { IRedisSMQRestApiParsedConfig } from '../../config/index.js';
import { ConsumerGroupsService } from '../../services/ConsumerGroupsService.js';
import { ExchangeDirectService } from '../../services/ExchangeDirectService.js';
import { ExchangeFanoutService } from '../../services/ExchangeFanoutService.js';
import { ExchangesService } from '../../services/ExchangesService.js';
import { ExchangeTopicService } from '../../services/ExchangeTopicService.js';
import { MessagesService } from '../../services/MessagesService.js';
import { NamespacesService } from '../../services/NamespacesService.js';
import { QueueAcknowledgedMessagesService } from '../../services/QueueAcknowledgedMessagesService.js';
import { QueueDeadLetteredMessagesService } from '../../services/QueueDeadLetteredMessagesService.js';
import { QueueMessagesService } from '../../services/QueueMessagesService.js';
import { QueuePendingMessagesService } from '../../services/QueuePendingMessagesService.js';
import { QueueRateLimitService } from '../../services/QueueRateLimitService.js';
import { QueueScheduledMessagesService } from '../../services/QueueScheduledMessagesService.js';
import { QueuesService } from '../../services/QueuesService.js';
import { ConfigurationService } from '../../services/ConfigurationService.js';

export interface IContainer {
  queueManager: QueueManager;
  queueMessages: QueueMessages;
  queuePendingMessages: QueuePendingMessages;
  queueAcknowledgedMessages: QueueAcknowledgedMessages;
  queueDeadLetteredMessages: QueueDeadLetteredMessages;
  queueScheduledMessages: QueueScheduledMessages;
  messageManager: MessageManager;
  queueRateLimit: QueueRateLimit;
  namespaceManager: NamespaceManager;
  exchange: Exchange;
  exchangeDirect: ExchangeDirect;
  exchangeFanout: ExchangeFanout;
  exchangeTopic: ExchangeTopic;
  consumerGroups: ConsumerGroups;
  producer: Producer;
  configuration: Configuration;
  config: IRedisSMQRestApiParsedConfig;

  queuesService: QueuesService;
  queueScheduledMessagesService: QueueScheduledMessagesService;
  queueMessagesService: QueueMessagesService;
  queuePendingMessagesService: QueuePendingMessagesService;
  queueAcknowledgedMessagesService: QueueAcknowledgedMessagesService;
  queueDeadLetteredMessagesService: QueueDeadLetteredMessagesService;
  messagesService: MessagesService;
  queueRateLimitService: QueueRateLimitService;
  namespacesService: NamespacesService;
  exchangesService: ExchangesService;
  exchangeFanoutService: ExchangeFanoutService;
  exchangeDirectService: ExchangeDirectService;
  exchangeTopicService: ExchangeTopicService;
  consumerGroupsService: ConsumerGroupsService;
  configurationService: ConfigurationService;
}

export interface IContextScope<
  RequestPathDTO,
  RequestQueryDTO,
  RequestBodyDTO,
> {
  requestPathDTO: RequestPathDTO;
  requestQueryDTO: RequestQueryDTO;
  requestBodyDTO: RequestBodyDTO;
}

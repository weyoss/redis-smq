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
  QueuePublishedMessages,
  QueuePendingMessages,
  QueueRateLimit,
  QueueScheduledMessages,
  Exchange,
  ExchangeDirect,
  ExchangeTopic,
  ConfigManager,
  QueueStateManager,
} from 'redis-smq';
import { IRedisSMQRestApiParsedConfig } from '../../config/index.js';
import { ConsumerGroupsService } from '../../services/ConsumerGroupsService.js';
import { ExchangesService } from '../../services/ExchangesService.js';
import { MessagesService } from '../../services/MessagesService.js';
import { NamespacesService } from '../../services/NamespacesService.js';
import { QueueMessagesService } from '../../services/QueueMessagesService.js';
import { QueueRateLimitService } from '../../services/QueueRateLimitService.js';
import { QueuesService } from '../../services/QueuesService.js';
import { ConfigurationService } from '../../services/ConfigurationService.js';
import { QueueOperationalStateService } from '../../services/QueueOperationalStateService.js';

export interface IContainer {
  queueManager: QueueManager;
  queueStateManager: QueueStateManager;
  queuePublishedMessages: QueuePublishedMessages;
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
  configManager: ConfigManager;
  config: IRedisSMQRestApiParsedConfig;

  queuesService: QueuesService;
  queueMessagesService: QueueMessagesService;
  messagesService: MessagesService;
  queueRateLimitService: QueueRateLimitService;
  queueOperationalStateService: QueueOperationalStateService;
  namespacesService: NamespacesService;
  exchangesService: ExchangesService;
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

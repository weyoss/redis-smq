/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

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
import { ILogger } from 'redis-smq-common';
import { IRedisSMQHttpApiParsedConfig } from '../../../config/types/index.js';
import { ConsumerGroupsService } from '../../services/ConsumerGroupsService.js';
import { ExchangeFanOutService } from '../../services/ExchangeFanOutService.js';
import { MessagesService } from '../../services/MessagesService.js';
import { NamespacesService } from '../../services/NamespacesService.js';
import { QueueAcknowledgedMessagesService } from '../../services/QueueAcknowledgedMessagesService.js';
import { QueueDeadLetteredMessagesService } from '../../services/QueueDeadLetteredMessagesService.js';
import { QueueMessagesService } from '../../services/QueueMessagesService.js';
import { QueuePendingMessagesService } from '../../services/QueuePendingMessagesService.js';
import { QueueRateLimitService } from '../../services/QueueRateLimitService.js';
import { QueueScheduledMessagesService } from '../../services/QueueScheduledMessagesService.js';
import { QueuesService } from '../../services/QueuesService.js';

export interface IContainer {
  queue: Queue;
  queueMessages: QueueMessages;
  queuePendingMessages: QueuePendingMessages;
  queueAcknowledgedMessages: QueueAcknowledgedMessages;
  queueDeadLetteredMessages: QueueDeadLetteredMessages;
  queueScheduledMessages: QueueScheduledMessages;
  message: Message;
  queueRateLimit: QueueRateLimit;
  namespace: Namespace;
  exchangeFanOut: ExchangeFanOut;
  consumerGroups: ConsumerGroups;
  producer: Producer;
  logger: ILogger;
  config: IRedisSMQHttpApiParsedConfig;

  queuesService: QueuesService;
  queueScheduledMessagesService: QueueScheduledMessagesService;
  queueMessagesService: QueueMessagesService;
  queuePendingMessagesService: QueuePendingMessagesService;
  queueAcknowledgedMessagesService: QueueAcknowledgedMessagesService;
  queueDeadLetteredMessagesService: QueueDeadLetteredMessagesService;
  messagesService: MessagesService;
  queueRateLimitService: QueueRateLimitService;
  namespacesService: NamespacesService;
  exchangeFanOutService: ExchangeFanOutService;
  consumerGroupsService: ConsumerGroupsService;
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

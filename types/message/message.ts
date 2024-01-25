/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { TExchangeSerialized } from '../index';
import { IQueueParams } from '../queue';
import { MessageEnvelope } from '../../src/lib/message/message-envelope';
import { ProducibleMessage } from '../../src/lib/message/producible-message';

export enum EMessagePriority {
  HIGHEST,
  VERY_HIGH,
  HIGH,
  ABOVE_NORMAL,
  NORMAL,
  LOW,
  VERY_LOW,
  LOWEST,
}

export enum EMessageProperty {
  ID,
  STATUS,
  STATE,
  MESSAGE,
}

export enum EMessagePropertyStatus {
  UNPUBLISHED = -1,
  SCHEDULED,
  PENDING,
  PROCESSING,
  ACKNOWLEDGED,
  UNACK_DELAYING,
  UNACK_REQUEUING,
  DEAD_LETTERED,
}

export interface IMessageSerialized {
  createdAt: number;
  exchange: TExchangeSerialized;
  ttl: number;
  retryThreshold: number;
  retryDelay: number;
  consumeTimeout: number;
  body: unknown;
  priority: number | null;
  scheduledCron: string | null;
  scheduledDelay: number | null;
  scheduledRepeatPeriod: number | null;
  scheduledRepeat: number;
  destinationQueue: IQueueParams;
  consumerGroupId: string | null;
}

export type TMessageConsumeOptions = {
  ttl: number;
  retryThreshold: number;
  retryDelay: number;
  consumeTimeout: number;
};

export interface IConsumableMessage
  extends Omit<
      ProducibleMessage,
      | 'setBody'
      | 'setConsumeTimeout'
      | 'setPriority'
      | 'setTTL'
      | 'setFanOut'
      | 'setQueue'
      | 'setTopic'
      | 'setRetryDelay'
      | 'setRetryThreshold'
      | 'setScheduledRepeatPeriod'
      | 'setScheduledRepeat'
      | 'setScheduledCRON'
      | 'setScheduledDelay'
      | 'disablePriority'
      | 'resetScheduledParams'
      | 'setExchange'
      | 'getExchange'
    >,
    Pick<
      MessageEnvelope,
      | 'getScheduledMessageId'
      | 'getDestinationQueue'
      | 'getStatus'
      | 'getPublishedAt'
      | 'getScheduledAt'
      | 'getId'
      | 'toJSON'
      | 'getExchange'
      | 'getConsumerGroupId'
    > {}

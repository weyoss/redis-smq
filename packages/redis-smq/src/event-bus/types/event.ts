/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  IQueueParams,
  IQueueParsedParams,
  IQueueProperties,
  IRedisSMQParsedConfig,
} from '../../index.js';
import {
  EMessageDeadLetterCause,
  EMessageUnacknowledgementCause,
} from '../../consumer/index.js';
import { IQueueStateTransition } from '../../queue-state-manager/index.js';

export type TConfigurationEvent = {
  'configuration.updated': (
    config: IRedisSMQParsedConfig,
    version: number,
  ) => void;
};

export type TConsumerEvent = {
  'consumer.up': (consumerId: string) => void;
  'consumer.goingDown': (consumerId: string) => void;
  'consumer.down': (consumerId: string) => void;
  'consumer.goingUp': (consumerId: string) => void;

  'consumer.messageReceived': (
    messageId: string,
    queue: IQueueParsedParams,
    consumerId: string,
  ) => void;
  'consumer.messageAcknowledged': (
    messageId: string,
    queue: IQueueParsedParams,
    messageHandlerId: string,
    consumerId: string,
  ) => void;
  'consumer.messageUnacknowledged': (
    messageId: string,
    queue: IQueueParsedParams,
    messageHandlerId: string,
    consumerId: string,
    unacknowledgmentCause: EMessageUnacknowledgementCause,
  ) => void;
  'consumer.messageDeadLettered': (
    messageId: string,
    queue: IQueueParsedParams,
    messageHandlerId: string,
    consumerId: string,
    deadLetterCause: EMessageDeadLetterCause,
  ) => void;
  'consumer.messageRequeued': (
    messageId: string,
    queue: IQueueParsedParams,
    messageHandlerId: string,
    consumerId: string,
  ) => void;
  'consumer.messageDelayed': (
    messageId: string,
    queue: IQueueParsedParams,
    messageHandlerId: string,
    consumerId: string,
  ) => void;
};

export type TProducerEvent = {
  'producer.up': (producerId: string) => void;
  'producer.goingDown': (producerId: string) => void;
  'producer.down': (producerId: string) => void;
  'producer.goingUp': (producerId: string) => void;

  'producer.messagePublished': (
    messageId: string,
    queue: IQueueParsedParams,
    producerId: string,
  ) => void;
};

export type TQueueEvent = {
  'queue.consumerGroupCreated': (queue: IQueueParams, groupId: string) => void;
  'queue.consumerGroupDeleted': (queue: IQueueParams, groupId: string) => void;
  'queue.queueCreated': (
    queue: IQueueParams,
    properties: IQueueProperties,
  ) => void;
  'queue.queueDeleted': (queue: IQueueParams) => void;
  'queue.stateChanged': (
    queue: IQueueParams,
    transition: IQueueStateTransition,
  ) => void;
};

export type TRedisSMQEvent = TConfigurationEvent &
  TConsumerEvent &
  TProducerEvent &
  TQueueEvent;

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
} from '../../index.js';
import { IConsumerHeartbeat } from '../../consumer/consumer-heartbeat/types/index.js';
import {
  EMessageUnacknowledgementDeadLetterReason,
  EMessageUnacknowledgementReason,
} from '../../consumer/message-handler/consume-message/types/index.js';

export type TConsumerHeartbeatEvent = {
  'consumerHeartbeat.heartbeat': (
    consumerId: string,
    timestamp: number,
    heartbeatPayload: IConsumerHeartbeat,
  ) => void;
  'consumerHeartbeat.error': (err: Error) => void;
};

export type TConsumerConsumeMessageEvent = {
  'consumer.consumeMessage.messageAcknowledged': (
    messageId: string,
    queue: IQueueParsedParams,
    messageHandlerId: string,
    consumerId: string,
  ) => void;
  'consumer.consumeMessage.messageUnacknowledged': (
    messageId: string,
    queue: IQueueParsedParams,
    messageHandlerId: string,
    consumerId: string,
    unknowledgmentReason: EMessageUnacknowledgementReason,
  ) => void;
  'consumer.consumeMessage.messageDeadLettered': (
    messageId: string,
    queue: IQueueParsedParams,
    messageHandlerId: string,
    consumerId: string,
    deadLetterReason: EMessageUnacknowledgementDeadLetterReason,
  ) => void;
  'consumer.consumeMessage.messageRequeued': (
    messageId: string,
    queue: IQueueParsedParams,
    messageHandlerId: string,
    consumerId: string,
  ) => void;
  'consumer.consumeMessage.messageDelayed': (
    messageId: string,
    queue: IQueueParsedParams,
    messageHandlerId: string,
    consumerId: string,
  ) => void;
  'consumer.consumeMessage.error': (
    err: Error,
    consumerId: string,
    queue: IQueueParsedParams,
  ) => void;
};

export type TConsumerDequeueMessageEvent = {
  'consumer.dequeueMessage.messageReceived': (
    messageId: string,
    queue: IQueueParsedParams,
    consumerId: string,
  ) => void;
  'consumer.dequeueMessage.nextMessage': () => void;
  'consumer.dequeueMessage.error': (
    err: Error,
    consumerId: string,
    queue: IQueueParsedParams,
  ) => void;
};

export type TConsumerMessageHandlerEvent = {
  'consumer.messageHandler.error': (
    err: Error,
    consumerId: string,
    queue: IQueueParsedParams,
  ) => void;
};

export type TConsumerMessageHandlerRunnerEvent = {
  'consumer.messageHandlerRunner.error': (
    err: Error,
    consumerId: string,
  ) => void;
};

export type TConsumerEvent = {
  'consumer.up': (consumerId: string) => void;
  'consumer.goingDown': (consumerId: string) => void;
  'consumer.down': (consumerId: string) => void;
  'consumer.goingUp': (consumerId: string) => void;
  'consumer.error': (err: Error, consumerId: string) => void;
};

export type TProducerEvent = {
  'producer.messagePublished': (
    messageId: string,
    queue: IQueueParsedParams,
    producerId: string,
  ) => void;
  'producer.up': (producerId: string) => void;
  'producer.goingDown': (producerId: string) => void;
  'producer.down': (producerId: string) => void;
  'producer.goingUp': (producerId: string) => void;
  'producer.error': (err: Error, producerId: string) => void;
};

export type TQueueEvent = {
  'queue.consumerGroupCreated': (queue: IQueueParams, groupId: string) => void;
  'queue.consumerGroupDeleted': (queue: IQueueParams, groupId: string) => void;
  'queue.queueCreated': (
    queue: IQueueParams,
    properties: IQueueProperties,
  ) => void;
  'queue.queueDeleted': (queue: IQueueParams) => void;
};

export type TEventBusEvent = {
  error: (err: Error) => void;
};

export type TRedisSMQEvent = TEventBusEvent &
  TConsumerEvent &
  TConsumerHeartbeatEvent &
  TConsumerMessageHandlerRunnerEvent &
  TConsumerMessageHandlerEvent &
  TConsumerConsumeMessageEvent &
  TConsumerDequeueMessageEvent &
  TProducerEvent &
  TQueueEvent;

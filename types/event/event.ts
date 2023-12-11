/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  EConsumeMessageDeadLetterCause,
  EConsumeMessageUnacknowledgedCause,
  IConsumerHeartbeat,
  IQueueParams,
} from '../index';
import { TEvent } from 'redis-smq-common';

export type TRedisSMQEvent = TEvent & {
  heartbeatTick: (
    timestamp: number,
    consumerId: string,
    heartbeatPayload: IConsumerHeartbeat,
  ) => void;
  messagePublished: (messageId: string, queue: IQueueParams) => void;
  messageAcknowledged: (
    messageId: string,
    queue: IQueueParams,
    messageHandlerId: string,
    consumerId: string,
  ) => void;
  messageUnacknowledged: (
    cause: EConsumeMessageUnacknowledgedCause,
    messageId: string,
    queue: IQueueParams,
    messageHandlerId: string,
    consumerId: string,
  ) => void;
  messageDeadLettered: (
    cause: EConsumeMessageDeadLetterCause,
    messageId: string,
    queue: IQueueParams,
    messageHandlerId: string,
    consumerId: string,
  ) => void;
  messageReceived: (
    messageId: string,
    queue: IQueueParams,
    consumerId: string,
  ) => void;
  messageRequeued: (
    messageId: string,
    queue: IQueueParams,
    messageHandlerId: string,
    consumerId: string,
  ) => void;
  messageDelayed: (
    messageId: string,
    queue: IQueueParams,
    messageHandlerId: string,
    consumerId: string,
  ) => void;
};
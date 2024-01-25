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
  IQueueParsedParams,
} from '../index';
import { TEvent } from 'redis-smq-common';

export type TRedisSMQEvent = TEvent & {
  heartbeatTick: (
    timestamp: number,
    consumerId: string,
    heartbeatPayload: IConsumerHeartbeat,
  ) => void;
  messagePublished: (
    messageId: string,
    queue: IQueueParsedParams,
    producerId: string,
  ) => void;
  messageAcknowledged: (
    messageId: string,
    queue: IQueueParsedParams,
    messageHandlerId: string,
    consumerId: string,
  ) => void;
  messageUnacknowledged: (
    messageId: string,
    queue: IQueueParsedParams,
    messageHandlerId: string,
    consumerId: string,
    cause: EConsumeMessageUnacknowledgedCause,
  ) => void;
  messageDeadLettered: (
    messageId: string,
    queue: IQueueParsedParams,
    messageHandlerId: string,
    consumerId: string,
    cause: EConsumeMessageDeadLetterCause,
  ) => void;
  messageReceived: (
    messageId: string,
    queue: IQueueParsedParams,
    consumerId: string,
  ) => void;
  messageRequeued: (
    messageId: string,
    queue: IQueueParsedParams,
    messageHandlerId: string,
    consumerId: string,
  ) => void;
  messageDelayed: (
    messageId: string,
    queue: IQueueParsedParams,
    messageHandlerId: string,
    consumerId: string,
  ) => void;
};

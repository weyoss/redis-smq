/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

export enum EQueueType {
  LIFO_QUEUE,
  FIFO_QUEUE,
  PRIORITY_QUEUE,
}

export interface IQueueParams {
  name: string;
  ns: string;
}

export interface IQueueRateLimit {
  limit: number;
  interval: number;
}

export interface IQueueProperties {
  queueType: EQueueType;
  rateLimit: IQueueRateLimit | null;
  exchange: string | null;
  messagesCount: number;
}

export enum EQueueProperty {
  QUEUE_TYPE,
  RATE_LIMIT,
  EXCHANGE,
  MESSAGES_COUNT,
}

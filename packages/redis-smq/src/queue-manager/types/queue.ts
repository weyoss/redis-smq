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

export interface IQueueConsumerGroupParams {
  queue: string | IQueueParams;
  groupId: string | null;
}

export type TQueueExtendedParams =
  | string
  | IQueueParams
  | IQueueConsumerGroupParams;

export interface IQueueParsedParams {
  queueParams: IQueueParams;
  groupId: string | null;
}

export interface IQueueRateLimit {
  /**
   * The maximum number of messages that can be processed per unit of time.
   */
  limit: number;

  /**
   * The time window over which the rate limit is applied. In milliseconds.
   */
  interval: number;
}

export enum EQueueDeliveryModel {
  POINT_TO_POINT,
  PUB_SUB,
}

export interface IQueueProperties {
  deliveryModel: EQueueDeliveryModel;
  queueType: EQueueType;
  rateLimit: IQueueRateLimit | null;
  fanoutExchange: string | null;
  messagesCount: number;
  scheduledMessagesCount: number;
  pendingMessagesCount: number;
  processingMessagesCount: number;
  acknowledgedMessagesCount: number;
  deadLetteredMessagesCount: number;
  delayedMessagesCount: number;
  requeuedMessagesCount: number;
}

export enum EQueueProperty {
  QUEUE_TYPE,
  RATE_LIMIT,
  FANOUT_EXCHANGE,
  MESSAGES_COUNT,
  DELIVERY_MODEL,
  SCHEDULED_MESSAGES_COUNT,
  PENDING_MESSAGES_COUNT,
  PROCESSING_MESSAGES_COUNT,
  ACKNOWLEDGED_MESSAGES_COUNT,
  DEAD_LETTERED_MESSAGES_COUNT,
  DELAYED_MESSAGES_COUNT,
  REQUEUED_MESSAGES_COUNT,
}

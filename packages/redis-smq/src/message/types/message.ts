/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { TExchangeTransferable } from '../../exchange/index.js';
import { IQueueParams } from '../../queue-manager/index.js';
import { IMessageStateTransferable } from './message-state.js';

export enum EMessagePriority {
  HIGHEST = 0,
  VERY_HIGH = 1,
  HIGH = 2,
  ABOVE_NORMAL = 3,
  NORMAL = 4,
  LOW = 5,
  VERY_LOW = 6,
  LOWEST = 7,
}

/**
 * The integer values are used as hash field names in Redis for memory efficiency.
 * Assigning explicit values prevents accidental reordering from breaking data compatibility.
 */
export enum EMessageProperty {
  // Core properties
  ID = 0,
  STATUS = 1,
  MESSAGE = 2,

  // Timestamps
  SCHEDULED_AT = 3,
  PUBLISHED_AT = 4,
  PROCESSING_STARTED_AT = 5,
  DEAD_LETTERED_AT = 6,
  ACKNOWLEDGED_AT = 7,
  UNACKNOWLEDGED_AT = 8,
  LAST_UNACKNOWLEDGED_AT = 9,
  LAST_SCHEDULED_AT = 10,

  /**
   * A timestamp that is set only when a message is manually requeued
   * for the first time.
   * This is used for tracking the "clone" action.
   */
  REQUEUED_AT = 11,

  /**
   * A counter for how many times a message has been requeued.
   */
  REQUEUE_COUNT = 12,

  /**
   * A timestamp that is updated each time a message is manually requeued.
   */
  LAST_REQUEUED_AT = 13,

  /**
   * A timestamp that is set only when a message is automatically
   * retried after a processing failure (e.g., from an unacknowledged message).
   */
  LAST_RETRIED_ATTEMPT_AT = 14,

  // Scheduling properties
  SCHEDULED_CRON_FIRED = 15,
  ATTEMPTS = 16,
  SCHEDULED_REPEAT_COUNT = 17,
  EXPIRED = 18,
  EFFECTIVE_SCHEDULED_DELAY = 19,
  SCHEDULED_TIMES = 20,

  // Relational properties for scheduled messages
  SCHEDULED_MESSAGE_PARENT_ID = 21,

  // Relational properties for manually requeued messages
  REQUEUED_MESSAGE_PARENT_ID = 22,
}

export enum EMessagePropertyStatus {
  /**
   * Message has been created but not yet published to the queue-manager.
   * This is the default state of a message before it enters the message queue-manager.
   */
  NEW = 0,

  /**
   * Message is waiting to be consumed.
   */
  PENDING,

  /**
   * Message is being processed by a consumer.
   */
  PROCESSING,

  /**
   * Message is scheduled to be delivered at a later time.
   */
  SCHEDULED,

  /**
   * Message has been successfully consumed and acknowledged.
   */
  ACKNOWLEDGED,

  /**
   * Message has been unacknowledged and is waiting in the requeue list to be moved back to the pending queue-manager.
   */
  UNACK_REQUEUING,

  /**
   * Message has been unacknowledged and is waiting in the delayed queue-manager for a scheduled retry.
   */
  UNACK_DELAYING,

  /**
   * Message has failed processing and has been moved to the dead-letter queue-manager.
   */
  DEAD_LETTERED,
}

export interface IMessageParams<TBody = unknown> {
  createdAt: number;
  exchange: TExchangeTransferable;
  ttl: number;
  retryThreshold: number;
  retryDelay: number;
  consumeTimeout: number;
  body: TBody;
  priority: number | null;
  scheduledCron: string | null;
  scheduledDelay: number | null;
  scheduledRepeatPeriod: number | null;
  scheduledRepeat: number;
  destinationQueue: IQueueParams;
  consumerGroupId: string | null;
}

export interface IMessageTransferable<TBody = unknown>
  extends IMessageParams<TBody> {
  id: string;
  messageState: IMessageStateTransferable;
  status: EMessagePropertyStatus;
}

export type TMessageConsumeOptions = Pick<
  IMessageParams,
  'ttl' | 'retryThreshold' | 'retryDelay' | 'consumeTimeout'
>;

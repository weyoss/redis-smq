/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { EMessageProperty } from './message.js';

export interface IMessageStateTransferable {
  uuid: string;
  publishedAt: number | null;
  scheduledAt: number | null;
  requeuedAt: number | null;
  lastRequeuedAt: number | null;
  acknowledgedAt: number | null;
  unacknowledgedAt: number | null;
  lastUnacknowledgedAt: number | null;
  deadLetteredAt: number | null;
  processingStartedAt: number | null;
  lastScheduledAt: number | null;
  lastRetriedAttemptAt: number | null;
  scheduledCronFired: boolean;
  attempts: number;
  scheduledRepeatCount: number;
  requeueCount: number;
  expired: boolean;
  effectiveScheduledDelay: number;
  scheduledTimes: number;
  scheduledMessageParentId: string | null;
  requeuedMessageParentId: string | null;
}

/**
 * Type aliases for backward compatibility and semantic clarity
 */
export type TMessageStateProperty =
  | EMessageProperty.ID
  | EMessageProperty.SCHEDULED_AT
  | EMessageProperty.PUBLISHED_AT
  | EMessageProperty.REQUEUED_AT
  | EMessageProperty.PROCESSING_STARTED_AT
  | EMessageProperty.DEAD_LETTERED_AT
  | EMessageProperty.ACKNOWLEDGED_AT
  | EMessageProperty.UNACKNOWLEDGED_AT
  | EMessageProperty.LAST_UNACKNOWLEDGED_AT
  | EMessageProperty.LAST_SCHEDULED_AT
  | EMessageProperty.LAST_RETRIED_ATTEMPT_AT
  | EMessageProperty.SCHEDULED_CRON_FIRED
  | EMessageProperty.ATTEMPTS
  | EMessageProperty.SCHEDULED_REPEAT_COUNT
  | EMessageProperty.EXPIRED
  | EMessageProperty.EFFECTIVE_SCHEDULED_DELAY
  | EMessageProperty.SCHEDULED_TIMES
  | EMessageProperty.SCHEDULED_MESSAGE_PARENT_ID
  | EMessageProperty.REQUEUED_MESSAGE_PARENT_ID
  | EMessageProperty.REQUEUE_COUNT
  | EMessageProperty.LAST_REQUEUED_AT;

/**
 * Maps enum members to their corresponding property names in IMessageStateTransferable.
 * This ensures compile-time safety between the enum and interface.
 * Using 'as const' for literal type inference.
 */
export const MessageStatePropertyMap = {
  [EMessageProperty.ID]: 'uuid',
  [EMessageProperty.PUBLISHED_AT]: 'publishedAt',
  [EMessageProperty.SCHEDULED_AT]: 'scheduledAt',
  [EMessageProperty.REQUEUED_AT]: 'requeuedAt',
  [EMessageProperty.ACKNOWLEDGED_AT]: 'acknowledgedAt',
  [EMessageProperty.UNACKNOWLEDGED_AT]: 'unacknowledgedAt',
  [EMessageProperty.LAST_UNACKNOWLEDGED_AT]: 'lastUnacknowledgedAt',
  [EMessageProperty.DEAD_LETTERED_AT]: 'deadLetteredAt',
  [EMessageProperty.PROCESSING_STARTED_AT]: 'processingStartedAt',
  [EMessageProperty.LAST_SCHEDULED_AT]: 'lastScheduledAt',
  [EMessageProperty.LAST_RETRIED_ATTEMPT_AT]: 'lastRetriedAttemptAt',
  [EMessageProperty.SCHEDULED_CRON_FIRED]: 'scheduledCronFired',
  [EMessageProperty.ATTEMPTS]: 'attempts',
  [EMessageProperty.SCHEDULED_REPEAT_COUNT]: 'scheduledRepeatCount',
  [EMessageProperty.EXPIRED]: 'expired',
  [EMessageProperty.EFFECTIVE_SCHEDULED_DELAY]: 'effectiveScheduledDelay',
  [EMessageProperty.SCHEDULED_TIMES]: 'scheduledTimes',
  [EMessageProperty.SCHEDULED_MESSAGE_PARENT_ID]: 'scheduledMessageParentId',
  [EMessageProperty.REQUEUED_MESSAGE_PARENT_ID]: 'requeuedMessageParentId',
  [EMessageProperty.REQUEUE_COUNT]: 'requeueCount',
  [EMessageProperty.LAST_REQUEUED_AT]: 'lastRequeuedAt',
} as const;

/**
 * Utility type: Get the property key for a given enum value.
 */
export type TMessageStatePropertyKey<T extends TMessageStateProperty> =
  (typeof MessageStatePropertyMap)[T];

/**
 * Utility type: Get the value type for a given enum value.
 */
export type TMessageStatePropertyType<T extends TMessageStateProperty> =
  IMessageStateTransferable[TMessageStatePropertyKey<T>];

/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

// ═══════════════════════════════════════════════════════════════════════════
// Redis hash layout
//
// The types in this file describe how a message is stored in Redis.
// They are exported by the current public surface, so they cannot be
// moved to an internal directory without a breaking change. A future
// major release should consider relocating them; doing so would also
// break the type-level dependency between this section and the sections
// above.
// ═══════════════════════════════════════════════════════════════════════════

import { IMessageStateTransferable } from '../../contracts/index.js';

/**
 * Field names for the message hash in Redis.
 *
 * The integer values are hash field keys — the message's property hash
 * stores values keyed by these numbers, and every Lua script that reads
 * or writes a message passes them as ARGV constants.
 *
 * The explicit assignments are intentional. Reordering or renumbering
 * this enum would break every persisted message and every script that
 * consumes them.
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
  LAST_PROCESSED_AT = 11,

  /**
   * Set only when a message is manually requeued for the first time.
   * Used for tracking the "clone" action.
   */
  REQUEUED_AT = 12,

  /** Counter for how many times a message has been requeued. */
  REQUEUE_COUNT = 13,

  /** Updated each time a message is manually requeued. */
  LAST_REQUEUED_AT = 14,

  /**
   * Set only when a message is automatically retried after a processing
   * failure (e.g., from an unacknowledged message).
   */
  LAST_RETRIED_ATTEMPT_AT = 15,

  // Scheduling properties
  SCHEDULED_CRON_FIRED = 16,
  ATTEMPTS = 17,
  SCHEDULED_REPEAT_COUNT = 18,
  EXPIRED = 19,
  EFFECTIVE_SCHEDULED_DELAY = 20,
  SCHEDULED_TIMES = 21,

  /** Relational property for messages created by a scheduled message. */
  SCHEDULED_MESSAGE_PARENT_ID = 22,

  /** Relational property for messages created by a requeue. */
  REQUEUED_MESSAGE_PARENT_ID = 23,
}

/**
 * The subset of `EMessageProperty` values that correspond to fields on
 * `IMessageStateTransferable`.
 *
 * `EMessageProperty` includes three entries that are not state:
 *   - `STATUS` — the message's current status, on `IMessageTransferable`,
 *     not the state.
 *   - `MESSAGE` — the serialized `ProducibleMessage` payload.
 *   - Any future enum members added for hash-layout purposes that don't
 *     map to a state field.
 *
 * This union names the members that do.
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
  | EMessageProperty.LAST_REQUEUED_AT
  | EMessageProperty.LAST_PROCESSED_AT;

/**
 * Maps each state property to the corresponding field name on
 * `IMessageStateTransferable`.
 *
 * Used by the internal parsing utilities to construct a `MessageState`
 * from a Redis hash: read the hash field named by the enum, parse its
 * value, then set the field named here.
 *
 * The `as const` is required for the utility types below to derive
 * literal field names rather than the general `string`.
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
  [EMessageProperty.LAST_PROCESSED_AT]: 'lastProcessedAt',
} as const;

/**
 * Given a state property, the corresponding field name on
 * `IMessageStateTransferable`.
 *
 * @example
 * type AckField = TMessageStatePropertyKey<EMessageProperty.ACKNOWLEDGED_AT>;
 * // 'acknowledgedAt'
 */
export type TMessageStatePropertyKey<T extends TMessageStateProperty> =
  (typeof MessageStatePropertyMap)[T];

/**
 * Given a state property, the type of the corresponding field on
 * `IMessageStateTransferable`.
 *
 * @example
 * type AckType = TMessageStatePropertyType<EMessageProperty.ACKNOWLEDGED_AT>;
 * // number | null
 */
export type TMessageStatePropertyType<T extends TMessageStateProperty> =
  IMessageStateTransferable[TMessageStatePropertyKey<T>];

/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IQueueParsedParams } from '../queue-manager/queue.js';
import {
  EMessageDeadLetterCause,
  EMessageUnacknowledgementAction,
  EMessageUnacknowledgementCause,
} from './message-unacknowledgement.js';

/**
 * One entry in a message's unacknowledgement history.
 *
 * An unacknowledgement history is a per-message log of the reasons a
 * message failed to be processed successfully. Each entry records the
 * cause, the resolution action the library took, and enough context to
 * correlate the entry with the consumer and the queue that produced it.
 *
 * The history is attached to the message's own Redis hash — it is not a
 * queue-level list. A message's history survives alongside the message
 * itself and is deleted when the message is deleted. It is populated
 * only when the `unacknowledgementHistory` audit is enabled in the
 * configuration (see `IMessageAuditHistoryConfig`).
 *
 * Records are stored as JSON in a Redis list. The list is built with
 * `LPUSH`, so it is ordered newest first when read.
 *
 * @see IMessageManager.getMessageUnacknowledgementHistory
 * @see IMessageAuditHistoryConfig
 */
export interface IMessageUnacknowledgementRecord {
  /**
   * The message ID this record describes.
   *
   * Redundant with the enclosing message's ID — the history is stored
   * on the message's own hash — but useful when a record is serialized
   * or passed outside the message context.
   */
  messageId: string;

  /**
   * The queue the message was on when it was unacknowledged.
   *
   * Carries the effective consumer group ID for PUB/SUB queues. A
   * message published to a PUB/SUB queue with multiple consumer groups
   * has one history per (queue, group) pair only if the message was
   * fanned out as separate envelopes — each envelope has its own ID and
   * its own history. A single envelope's history always carries the
   * same `queue` value.
   */
  queue: IQueueParsedParams;

  /**
   * The ID of the consumer that was processing the message when it was
   * unacknowledged.
   *
   * For unacknowledgements triggered by the reaper (offline consumer
   * recovery), this is the ID of the consumer that had registered for
   * the message and then stopped heartbeating.
   */
  consumerId: string;

  /**
   * Why the message was unacknowledged.
   *
   * The cause categorizes the trigger: a handler failure, a queue-state
   * change, an infrastructure event, or a message-level policy (TTL
   * expiry, retry threshold).
   *
   * @see EMessageUnacknowledgementCause
   */
  cause: EMessageUnacknowledgementCause;

  /**
   * What the library did with the message as a result of the
   * unacknowledgement.
   *
   * The action is the outcome, not the intent: a message with cause
   * `TIMEOUT` may resolve to `REQUEUE`, `DELAY`, or `DEAD_LETTER`
   * depending on the message's retry policy and prior attempts. The
   * action recorded here is the one that was actually taken.
   *
   * @see EMessageUnacknowledgementAction
   */
  action: EMessageUnacknowledgementAction;

  /**
   * The specific dead-letter reason, present only when `action` is
   * `DEAD_LETTER`.
   *
   * Distinguishes between the three ways a message reaches the
   * dead-letter list: TTL expiry, retry threshold exhaustion, or
   * periodic-message termination. Absent for every other action.
   *
   * @see EMessageDeadLetterCause
   */
  deadLetterCause?: EMessageDeadLetterCause;

  /**
   * Milliseconds since the Unix epoch, at the moment the
   * unacknowledgement occurred.
   */
  timestamp: number;

  /**
   * The message's attempt count at the moment of unacknowledgement.
   *
   * This is the value of `IMessageStateTransferable.attempts` when the
   * record was written. A record with `retryCount: 3` describes the
   * third unacknowledgement of the message.
   *
   * Named `retryCount` for continuity with the field name used in the
   * source and in serialized history. It is not the same as
   * `IMessageStateTransferable.requeueCount`, which counts *manual*
   * requeues only.
   */
  retryCount: number;
}

/**
 * The full unacknowledgement history of a message.
 *
 * The order of records is newest first — the underlying Redis list is
 * built with `LPUSH`, so index 0 is the most recent entry. Callers that
 * want chronological order reverse the array.
 *
 * An empty array means the message has never been unacknowledged.
 * `IMessageManager.getMessageUnacknowledgementHistory` returns an empty
 * array in that case rather than an error.
 *
 * The list is capped by `IMessageAuditHistoryConfig.maxSize`. When the
 * cap is reached, the oldest entry is trimmed on every new append.
 */
export type TMessageUnacknowledgementHistory =
  IMessageUnacknowledgementRecord[];

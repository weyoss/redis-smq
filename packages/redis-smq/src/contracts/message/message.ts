/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IExchangeParsedParams } from '../exchange/index.js';
import { IQueueParams } from '../queue-manager/queue.js';

// ═══════════════════════════════════════════════════════════════════════════
// Message configuration and lifecycle
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Priority levels for messages in PRIORITY_QUEUE queues.
 *
 * Lower integer values represent higher priority. A message with priority
 * `HIGHEST` (0) is dequeued before any message with priority `HIGH` (2),
 * regardless of arrival order. Within the same priority level, ordering
 * follows the queue type (FIFO or LIFO by insertion order within the
 * level).
 *
 * Priority is only meaningful for PRIORITY_QUEUE queues. Publishing a
 * message with a priority to a non-priority queue is refused at publish
 * time; so is publishing without a priority to a priority queue.
 *
 * The integer values are persisted in Redis (as the score of the pending
 * sorted set) and passed as arguments to several Lua scripts. Reordering
 * or renumbering is a breaking change to persisted data.
 */
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
 * Lifecycle status of a message.
 *
 * A message occupies exactly one status at any moment. The status is
 * authoritative in Redis and is the primary field consumers and managers
 * inspect to decide what to do with a message.
 *
 * The integer values are persisted in Redis (as the `STATUS` hash field)
 * and compared against constants in the Lua scripts. Reordering or
 * renumbering is a breaking change to persisted data.
 *
 * Not every status is observable by every caller. `UNACK_REQUEUING` and
 * `UNACK_DELAYING` are transitional states internal to the
 * unacknowledgement pipeline: a message passes through them between
 * being unacknowledged and being placed in its final destination
 * (requeued list or delayed set). They are visible in
 * `getMessageStatus()` results but are not part of the intended user
 * contract; callers should treat them as "in transit".
 */
export enum EMessagePropertyStatus {
  /**
   * Message has been created but not yet published. This is the default
   * status of a `MessageEnvelope` before it enters the queue.
   */
  NEW = 0,

  /** Message is waiting to be consumed. */
  PENDING,

  /** Message is being processed by a consumer. */
  PROCESSING,

  /** Message is scheduled to be delivered at a future time. */
  SCHEDULED,

  /** Message has been successfully consumed and acknowledged. */
  ACKNOWLEDGED,

  /**
   * Message has been unacknowledged and is waiting in the requeue list
   * to be moved back to the pending queue.
   */
  UNACK_REQUEUING,

  /**
   * Message has been unacknowledged and is waiting in the delayed set
   * for a scheduled retry.
   */
  UNACK_DELAYING,

  /**
   * Message has failed processing and has been moved to the dead-letter
   * list.
   */
  DEAD_LETTERED,
}

/**
 * The serializable form of a message.
 *
 * This is what `MessageEnvelope.toJSON()` produces and what is stored in
 * the message hash's `MESSAGE` field. It captures the message's content
 * and configuration, but not its runtime state — timestamps, attempts,
 * and requeue counters are stored in separate hash fields.
 *
 * `TBody` defaults to `unknown` because messages are opaque to the
 * library: any JSON-serializable payload can be set via
 * `ProducibleMessage.setBody()`. Callers who know the body's shape can
 * parameterize the type at the call site.
 */
export interface IMessageParams<TBody = unknown> {
  /**
   * Milliseconds since the Unix epoch, at the moment the
   * `ProducibleMessage` instance was constructed.
   *
   * Used together with `ttl` to determine whether the message has
   * expired.
   */
  createdAt: number;

  /**
   * The exchange the message was published to, or `null` if it was
   * published directly to a queue.
   *
   * Retained on the message for diagnostics; the actual routing decision
   * is made at publish time. The exchange's `type` is included but not
   * needed after routing — a future major release could narrow this to
   * `IQueueParams` (name + namespace only), shrinking the serialized
   * message. The change would be breaking for persisted data.
   */
  exchange: IExchangeParsedParams | null;

  /**
   * The queue the message was published to, or `null` if it was
   * published to an exchange.
   */
  queue: IQueueParams | null;

  /**
   * Time-to-live in milliseconds. Zero means the message never expires.
   */
  ttl: number;

  /**
   * Maximum number of processing attempts before the message is
   * dead-lettered. Zero means no limit.
   */
  retryThreshold: number;

  /**
   * Delay in milliseconds before a failed message is retried.
   */
  retryDelay: number;

  /**
   * Maximum time in milliseconds a consumer is given to process the
   * message before it is unacknowledged with a timeout. Zero means no
   * timeout.
   */
  consumeTimeout: number;

  /**
   * The message payload. Any JSON-serializable value.
   */
  body: TBody;

  /**
   * Priority level, or `null` for non-priority queues.
   */
  priority: number | null;

  /**
   * CRON expression for scheduled delivery, or `null`.
   */
  scheduledCron: string | null;

  /**
   * Delay before initial delivery, in milliseconds, or `null`.
   */
  scheduledDelay: number | null;

  /**
   * Repeat period for scheduled delivery, in milliseconds, or `null`.
   */
  scheduledRepeatPeriod: number | null;

  /**
   * Number of times a scheduled message repeats after initial delivery.
   */
  scheduledRepeat: number;

  /**
   * The queue the message ended up in after routing. For direct-to-queue
   * publishes, the same as `queue`. For exchange publishes, the queue
   * selected by matching.
   */
  destinationQueue: IQueueParams;

  /**
   * Consumer group ID, or `null` for POINT_TO_POINT queues and for
   * PUB_SUB queues before the target group is resolved.
   */
  consumerGroupId: string | null;
}

/**
 * The subset of message options that affect consumption.
 *
 * Used by `ProducibleMessage.setDefaultConsumeOptions()` and by the
 * internal consumer pipeline to read the message's TTL, retry policy,
 * and consume timeout without importing the whole `IMessageParams`
 * shape.
 *
 * `IMessageParams` is used without a type argument on purpose: none of
 * the four picked fields depends on the body type, so the body parameter
 * is irrelevant to this projection.
 */
export type TMessageConsumeOptions = Pick<
  IMessageParams,
  'ttl' | 'retryThreshold' | 'retryDelay' | 'consumeTimeout'
>;

// ═══════════════════════════════════════════════════════════════════════════
// Message runtime state
// ═══════════════════════════════════════════════════════════════════════════

/**
 * The transferable form of a message's runtime state.
 *
 * This is what `MessageState.toJSON()` produces, what
 * `IMessageTransferable.messageState` carries, and what the message
 * browser returns alongside each message. Every field describes a
 * moment in the message's lifecycle or a counter accumulated over it.
 *
 * Nullable timestamp fields are `null` until the corresponding event
 * occurs. For example, `acknowledgedAt` is `null` until the message is
 * acknowledged; `deadLetteredAt` is `null` unless it has been
 * dead-lettered.
 *
 * The `uuid` field is the message ID. It is named `uuid` here rather
 * than `id` because it is the state's identifier, produced by the state
 * object itself, not assigned by the message envelope. In every
 * user-facing context they are the same string.
 */
export interface IMessageStateTransferable {
  /** The message ID. Same string as `IMessageTransferable.id`. */
  uuid: string;

  // ─── Timestamps of lifecycle events ───────────────────────────────────
  //
  // Each is set once, at the moment the corresponding event occurs, and
  // is never overwritten. A null value means the event has not occurred.

  /** Timestamp when the message was scheduled for delivery. */
  scheduledAt: number | null;

  /** Timestamp when the message was first published. */
  publishedAt: number | null;

  /** Timestamp when the message was manually requeued. */
  requeuedAt: number | null;

  /** Timestamp when message processing started. */
  processingStartedAt: number | null;

  /** Timestamp when the message was acknowledged. */
  acknowledgedAt: number | null;

  /** Timestamp when the message was unacknowledged. */
  unacknowledgedAt: number | null;

  /** Timestamp when the message was dead-lettered. */
  deadLetteredAt: number | null;

  // ─── Timestamps of recurring events ───────────────────────────────────
  //
  // Each is updated every time the corresponding event occurs.

  /** Timestamp of the last requeue. */
  lastRequeuedAt: number | null;

  /** Timestamp of the last unacknowledgement. */
  lastUnacknowledgedAt: number | null;

  /** Timestamp of the last scheduling. */
  lastScheduledAt: number | null;

  /** Timestamp of the last automatic retry attempt. */
  lastRetriedAttemptAt: number | null;

  /** Timestamp of the last completed processing attempt. */
  lastProcessedAt: number | null;

  // ─── Flags and counters ───────────────────────────────────────────────

  /**
   * True once the CRON expression of a scheduled message has fired.
   *
   * Used by the scheduling logic to distinguish "this message has never
   * been delivered" from "this message has been delivered at least
   * once", which affects how the next delivery time is computed for a
   * message with both CRON and repeat configured.
   */
  scheduledCronFired: boolean;

  /**
   * Number of processing attempts made so far.
   *
   * Incremented by the checkout script when a message is claimed by a
   * consumer. Compared against `ProducibleMessage.retryThreshold` to
   * decide whether the message should be dead-lettered on the next
   * failure.
   */
  attempts: number;

  /**
   * Number of times the message has been scheduled and delivered as part
   * of a repeat cycle.
   *
   * Only meaningful for messages with `scheduledRepeat > 0`. Reset to
   * zero when a CRON tick fires (a CRON tick begins a new repeat cycle).
   */
  scheduledRepeatCount: number;

  /**
   * Number of times the message has been manually requeued.
   *
   * Incremented when a user calls `MessageManager.requeueMessageById()`
   * on the message. Does not count automatic retries — those are tracked
   * by `attempts` and `lastRetriedAttemptAt`.
   */
  requeueCount: number;

  /**
   * True once the message's TTL has elapsed relative to its creation
   * time.
   *
   * Set at checkout time by the consumer, which compares
   * `createdAt + ttl` against the current time. An expired message is
   * unacknowledged with cause `TTL_EXPIRED` and moved to the
   * dead-letter list.
   */
  expired: boolean;

  /**
   * The delay in milliseconds currently scheduled for the message's next
   * delivery.
   *
   * Used for a scheduled message whose initial delay has been set via
   * `ProducibleMessage.setScheduledDelay()`. Reset to zero once the
   * delay has been consumed.
   */
  effectiveScheduledDelay: number;

  /**
   * Number of times the message has been scheduled and delivered.
   *
   * Incremented on every scheduling event, regardless of the trigger
   * (initial delay, CRON tick, or repeat cycle). A lifetime counter, not
   * reset between repeat cycles.
   */
  scheduledTimes: number;

  /**
   * The ID of the original scheduled message this message was created
   * from, or null.
   *
   * When a repeating scheduled message is delivered, a *new* message is
   * created for each firing. The new message carries the original's ID
   * in this field, so the two can be correlated. The original remains in
   * the scheduled set for its next firing.
   */
  scheduledMessageParentId: string | null;

  /**
   * The ID of the message this message was requeued from, or null.
   *
   * Set when a message is manually requeued: a new message is created
   * and this field points at the original. The original stays where it
   * was (in the acknowledged or dead-lettered list), its requeue
   * counters updated to reflect the clone.
   */
  requeuedMessageParentId: string | null;
}

/**
 * A message together with its runtime state, as returned by message
 * browsers and `MessageManager`.
 *
 * Extends `IMessageParams` with the message's ID, its full state (all
 * timestamps, attempts, and counters), and its current status.
 *
 * The `messageState` field carries the transferable form of the state.
 * Users who need to inspect a specific timestamp (e.g.,
 * `deadLetteredAt`) or counter (e.g., `attempts`) read it from
 * `messageState`, not from the top level.
 */
export interface IMessageTransferable<
  TBody = unknown,
> extends IMessageParams<TBody> {
  /** Unique message ID. */
  id: string;

  /** Full runtime state — timestamps, attempts, counters. */
  messageState: IMessageStateTransferable;

  /** Current status of the message. */
  status: EMessagePropertyStatus;
}

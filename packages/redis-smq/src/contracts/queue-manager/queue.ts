/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

/**
 * Operational states a queue can be in.
 *
 * States are mutually exclusive. A queue occupies exactly one at any
 * moment. The state is authoritative in Redis (`keyQueueProperties`) and
 * is mirrored locally by consumers; the Redis value wins whenever the
 * two disagree.
 *
 * Transitions between states are validated by a rule table (see
 * `_isAllowedTransition`). Attempting an invalid transition — for
 * example, STOPPED -> PAUSED — fails with a transition error rather than
 * silently moving the queue to the new state.
 *
 * The integer values are part of the Redis wire format. They are used as
 * values of the `OPERATIONAL_STATE` hash field and as arguments to the
 * queue-state Lua scripts. Reordering or renumbering this enum is a
 * breaking change to persisted data.
 */
export enum EQueueOperationalState {
  /**
   * Queue is operating normally.
   *   - Consuming messages
   *   - Accepting new messages
   *   - All operations enabled
   */
  ACTIVE,

  /**
   * Queue processing is temporarily paused.
   *   - NOT consuming messages
   *   - CAN accept new messages (they buffer in pending)
   *   - Message handlers remain subscribed
   *   - In-flight messages complete or time out normally
   *   - Quick to resume
   *
   * Typical use: rolling deployments, downstream service degradation,
   * short maintenance windows, debugging a live queue.
   */
  PAUSED,

  /**
   * Queue is completely shut down.
   *   - NOT consuming messages
   *   - NOT accepting new messages
   *   - Message handlers are disconnected
   *
   * Typical use: prolonged maintenance, resource reclamation,
   * long-term disabling, emergency intervention.
   */
  STOPPED,

  /**
   * Queue is held under an exclusive lock.
   *   - NOT consuming messages (except by the lock holder)
   *   - NOT accepting new messages
   *   - External operations blocked
   *   - The lock holder has exclusive access
   *
   * Typical use: administrative operations, bulk data operations,
   * schema migrations, critical repairs.
   */
  LOCKED,
}

/**
 * Queue ordering model.
 *
 * Determines the Redis data structure used for the pending queue:
 *   - LIFO_QUEUE:     list, newest-first retrieval
 *   - FIFO_QUEUE:     list, oldest-first retrieval
 *   - PRIORITY_QUEUE: sorted set, scored by message priority
 *
 * The integer values are persisted in Redis (the `QUEUE_TYPE` hash
 * field) and passed as arguments to several Lua scripts. Reordering or
 * renumbering is a breaking change.
 */
export enum EQueueType {
  LIFO_QUEUE,
  FIFO_QUEUE,
  PRIORITY_QUEUE,
}

/**
 * Delivery model for a queue.
 *
 *   - POINT_TO_POINT: each message is delivered to exactly one consumer.
 *   - PUB_SUB:        each message is delivered to every consumer group
 *                     subscribed to the queue. Consumers must provide a
 *                     group ID (or the library generates an ephemeral
 *                     one).
 *
 * The integer values are persisted in Redis (the `DELIVERY_MODEL` hash
 * field).
 */
export enum EQueueDeliveryModel {
  POINT_TO_POINT,
  PUB_SUB,
}

/**
 * Identifies a queue.
 *
 * `ns` (namespace) defaults to the configured default namespace when a
 * queue is specified by name only.
 */
export interface IQueueParams {
  name: string;
  ns: string;
}

/**
 * A queue plus an optional consumer group.
 *
 * The `groupId` is `null` for POINT_TO_POINT queues and for PUB_SUB
 * queues where the caller has not yet specified a group. During handler
 * registration the consumer replaces a `null` groupId with the effective
 * group — an explicit one, or an ephemeral `cid-<consumerId>`.
 */
export interface IQueueParsedParams {
  queueParams: IQueueParams;
  groupId: string | null;
}

/**
 * A queue identifier in any of the forms accepted by the public API.
 *
 *   - `string`: a bare queue name, resolved against the default namespace
 *   - `IQueueParams`: `{ name, ns }`
 *   - `IQueueParsedParams`: `{ queueParams, groupId }`
 *
 * Methods that accept this type resolve it via `_parseQueueExtendedParams`
 * before doing any work.
 */
export type TQueueExtendedParams = string | IQueueParams | IQueueParsedParams;

/**
 * Rate limit configuration for a queue.
 *
 * Applies to the consumption path: no more than `limit` messages are
 * dequeued per `interval` milliseconds. Enforced by an atomic Redis
 * check that also decrements a counter, so the limit holds across
 * multiple consumers.
 *
 * The library does not rate-limit publishing; publishing into a
 * rate-limited queue is unbounded and simply buffers.
 */
export interface IQueueRateLimit {
  /**
   * Maximum number of messages that may be processed within `interval`.
   */
  limit: number;

  /**
   * Time window for the limit, in milliseconds. Minimum 1000.
   */
  interval: number;
}

/**
 * Full property set for a queue, as stored in Redis and returned by
 * `IQueueManager.getProperties()`.
 *
 * The message counters are maintained by the Lua scripts and are always
 * consistent with the underlying Redis structures. A counter reaching
 * zero means the corresponding structure is empty; the two never
 * disagree.
 *
 * `rateLimit` and `lockId` are nullable — they are unset for most
 * queues. `lastStateChangeAt` is null only for queues created before the
 * state-tracking schema, which the current release backfills on first
 * write.
 */
export interface IQueueProperties {
  deliveryModel: EQueueDeliveryModel;
  queueType: EQueueType;
  rateLimit: IQueueRateLimit | null;
  messagesCount: number;
  scheduledMessagesCount: number;
  pendingMessagesCount: number;
  processingMessagesCount: number;
  acknowledgedMessagesCount: number;
  deadLetteredMessagesCount: number;
  delayedMessagesCount: number;
  requeuedMessagesCount: number;
  operationalState: EQueueOperationalState;
  lastStateChangeAt: number | null;
  lockId: string | null;
}

/**
 * Field names for the queue properties hash in Redis.
 *
 * The integer values are hash field keys — the queue's property hash
 * stores values keyed by these numbers, and the Lua scripts pass them as
 * ARGV constants. Reordering or renumbering is a breaking change to
 * persisted data.
 *
 * This enum is exported by the current public surface. It is arguably an
 * internal detail (the Redis key layout) rather than a user-facing
 * concept; a future release could move it to an internal directory as a
 * breaking change.
 */
export enum EQueueProperty {
  QUEUE_TYPE,
  RATE_LIMIT,
  MESSAGES_COUNT,
  DELIVERY_MODEL,
  SCHEDULED_MESSAGES_COUNT,
  PENDING_MESSAGES_COUNT,
  PROCESSING_MESSAGES_COUNT,
  ACKNOWLEDGED_MESSAGES_COUNT,
  DEAD_LETTERED_MESSAGES_COUNT,
  DELAYED_MESSAGES_COUNT,
  REQUEUED_MESSAGES_COUNT,
  OPERATIONAL_STATE,
  LAST_STATE_CHANGE_AT,
  LOCK_ID,
}

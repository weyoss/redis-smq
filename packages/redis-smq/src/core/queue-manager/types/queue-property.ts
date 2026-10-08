/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

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

/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

/**
 * What the library did with a message as a result of an
 * unacknowledgement.
 *
 * The action is the outcome, not the intent. A message with cause
 * `TIMEOUT` may resolve to `REQUEUE`, `DELAY`, or `DEAD_LETTER`
 * depending on the message's retry policy and prior attempts. The
 * action recorded on a history record is the one that was actually
 * taken.
 *
 * The integer values are compared inside the unacknowledgement Lua
 * script and passed as positional arguments. They are not persisted to
 * Redis directly — the serialized history record stores the resolution
 * outcome, not the enum value — but reordering them would break the
 * script's argument convention. Treat the ordering as fixed.
 */
export enum EMessageUnacknowledgementAction {
  /**
   * Move the message to the dead-letter list.
   *
   * Chosen when the message's retry policy says it should not be
   * retried: TTL has expired, the retry threshold has been reached, or
   * the message is a periodic scheduled message that has completed its
   * cycle.
   */
  DEAD_LETTER,

  /**
   * Move the message back to the pending list for immediate retry.
   *
   * Chosen for a failed message whose retry policy allows another
   * attempt and whose retry delay is zero.
   */
  REQUEUE,

  /**
   * Move the message to the delayed set for a scheduled retry.
   *
   * Chosen for a failed message whose retry policy allows another
   * attempt and whose retry delay is positive. The message is placed in
   * the delayed sorted set with a score of `now + retryDelay`.
   */
  DELAY,
}

/**
 * The specific reason a message was dead-lettered.
 *
 * Present on an unacknowledgement history record only when the
 * resolution action is `DEAD_LETTER`. Distinguishes the three paths that
 * lead to the dead-letter list, so a caller can tell whether the
 * message failed because of a message-level policy (TTL, retry
 * threshold) or because of the message's scheduling nature (periodic
 * completion).
 *
 * The integer values are passed as positional arguments to the
 * unacknowledgement Lua script. Treat the ordering as fixed.
 */
export enum EMessageDeadLetterCause {
  /**
   * The message's TTL elapsed before it was successfully processed.
   *
   * The TTL is evaluated at checkout: the consumer compares
   * `createdAt + ttl` against the current time. An expired message is
   * not handed to the handler; it is dead-lettered directly.
   */
  TTL_EXPIRED,

  /**
   * The message failed processing more times than its retry threshold
   * allows.
   *
   * The threshold is a per-message configuration
   * (`ProducibleMessage.setRetryThreshold`). A message with
   * `retryThreshold: 3` is dead-lettered after its third failed attempt.
   */
  RETRY_THRESHOLD_EXCEEDED,

  /**
   * The message is a periodic scheduled message that has completed its
   * configured number of firings.
   *
   * Periodic messages are delivered on a CRON schedule or a fixed repeat
   * count. A failure that occurs after the schedule has ended is not
   * retried — retrying would restart the cycle, which is not what the
   * caller asked for. Instead, the message is dead-lettered with this
   * cause.
   */
  PERIODIC_MESSAGE,
}

/**
 * Why a message was unacknowledged.
 *
 * The cause categorizes the trigger:
 *
 *   - Consumer-side: the handler threw, rejected, timed out, or
 *     returned an invalid signature.
 *   - Queue-side: the queue was in a state (STOPPED, LOCKED, invalid)
 *     that prevented processing.
 *   - Infrastructure-side: the consumer went offline and its in-flight
 *     messages needed recovery, or the message was not found.
 *   - Library-side: the message expired (TTL), or the consumer was
 *     shutting down.
 *
 * The cause is recorded on the message's unacknowledgement history. It
 * is the primary field a caller inspects when diagnosing a failed
 * message.
 *
 * The integer values are persisted indirectly — they are stored as part
 * of the serialized history record, and the mapping from
 * `EQueueStateLockOwner`-style stored values to enum members is by
 * ordinal position, so reordering breaks persisted history. Treat the
 * ordering as fixed.
 */
export enum EMessageUnacknowledgementCause {
  /**
   * The handler did not complete within the message's `consumeTimeout`.
   *
   * The handler may still be running; its eventual result is discarded.
   * The message is requeued or dead-lettered according to its retry
   * policy.
   */
  TIMEOUT,

  /**
   * The handler threw synchronously, rejected its promise, or the
   * invocation failed before reaching the handler (for example,
   * `message.transfer()` threw because the message hash was malformed).
   *
   * This is the general "handler-side failure" cause.
   */
  CONSUME_ERROR,

  /**
   * The handler called its completion callback with an error, or an
   * unexpected error occurred inside the consumer pipeline.
   *
   * Semantically close to `CONSUME_ERROR`. The distinction is
   * historical: `CONSUME_ERROR` was introduced for synchronous
   * exceptions, `UNACKNOWLEDGED` for callback-reported failures.
   */
  UNACKNOWLEDGED,

  /**
   * The consumer that was processing the message stopped heartbeating,
   * and another consumer's reaper recovered the message.
   *
   * Set by `ReapConsumersWorker` when it unacknowledges the in-flight
   * messages of a peer that has gone offline.
   */
  OFFLINE_CONSUMER,

  /**
   * The consumer is shutting down and is unacknowledging its in-flight
   * messages as part of the graceful shutdown sequence.
   *
   * Set by `MessageUnacknowledger.goingDown`.
   */
  SHUTTING_DOWN,

  /**
   * The message's TTL elapsed before it was successfully processed.
   *
   * Distinct from `UNACKNOWLEDGED`: the message did not fail in the
   * handler, it aged out. Always resolves to `DEAD_LETTER` with
   * `deadLetterCause: TTL_EXPIRED`.
   */
  TTL_EXPIRED,

  /**
   * The queue was in the STOPPED state when the message was checked
   * out.
   *
   * The checkout script refuses to hand the message to the consumer.
   * The handler emits `shutdownRequired` and the runner removes the
   * instance; on resume, a fresh handler is created.
   */
  QUEUE_STOPPED,

  /**
   * The queue was in an unknown state, or the checkout script returned
   * a state marker it does not recognize.
   *
   * This is a defensive cause. It indicates a version mismatch between
   * the deployed library and the Lua scripts installed in Redis, or
   * corruption of the queue's properties hash.
   */
  QUEUE_INVALID_STATE,

  /**
   * The queue was in the LOCKED state when the message was checked out.
   *
   * Same behavior as `QUEUE_STOPPED` — the handler stops and the runner
   * removes the instance.
   */
  QUEUE_LOCKED,

  /**
   * The message ID referenced by the dequeue did not correspond to any
   * message hash in Redis.
   *
   * Typically indicates a race: the message was deleted by another
   * process between the dequeue and the checkout. The consumer advances
   * to the next message without recording an outcome for this one.
   */
  MESSAGE_NOT_FOUND,

  /**
   * The queue's operational state changed between the dequeue and the
   * checkout.
   *
   * Rare. Distinguished from the per-state causes (QUEUE_STOPPED,
   * QUEUE_LOCKED) because the state observed at checkout differs from
   * the state the consumer's local mirror expected.
   */
  QUEUE_STATE_CHANGED,

  /**
   * The queue does not exist.
   *
   * Occurs when a message was produced to a queue that has since been
   * deleted, and the dequeue finds the queue's properties hash missing.
   */
  QUEUE_NOT_FOUND,

  /**
   * An error occurred inside the consumer machinery that does not fit
   * any other category.
   *
   * Used as a fallback when the consumer wants to unacknowledge a
   * message but has no more specific classification.
   */
  UNEXPECTED_ERROR,

  /**
   * The handler's signature was invalid — arity 0, arity greater than 2,
   * a module path that does not exist, or a module that does not
   * export a function.
   *
   * Rejection happens at startup (`validateHandler`) for most invalid
   * shapes; this cause is reachable only if validation was bypassed or
   * if the handler was swapped at runtime.
   */
  INVALID_HANDLER_SIGNATURE,
}

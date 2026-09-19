/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback } from 'redis-smq-common';
import { IQueueParams } from '../queue-manager/queue.js';

// ═══════════════════════════════════════════════════════════════════════════
// Operations and their bitmask
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Operations that can be performed on a queue.
 *
 * Each operation is authorized or refused based on the queue's
 * operational state. The mapping from state to allowed operations lives
 * in the operation registry, not in this enum. This enum names the
 * operations; the registry decides which are permitted.
 *
 * The integer values are used as bit positions. `OperationBitmask` maps
 * each member to `1 << member`, and the registry stores a combined mask
 * per state. Reordering or renumbering this enum would silently
 * reassign bit positions and change which operations are allowed under
 * which state.
 *
 * The values are not persisted in Redis — the bitmask is computed at
 * runtime from the static registry table. Reordering therefore would
 * not corrupt stored data, but it would change behavior in a way that
 * no test would necessarily catch. Treat the ordering as fixed.
 */
export enum EQueueOperation {
  /** Dequeuing and processing messages. */
  CONSUME,

  /** Enqueueing new messages. */
  PRODUCE,

  /** Deleting the queue itself. */
  DELETE,

  /** Removing all messages from the queue. */
  PURGE,

  /** Deleting a single message by ID. */
  DELETE_MESSAGE,

  /** Requeuing a failed message for another attempt. */
  REQUEUE_MESSAGE,

  /** Setting a rate limit on the queue. */
  SET_RATE_LIMIT,

  /** Removing the queue's rate limit. */
  CLEAR_RATE_LIMIT,

  /** Creating a consumer group on the queue (PUB/SUB only). */
  CREATE_CONSUMER_GROUP,

  /** Deleting a consumer group from the queue (PUB/SUB only). */
  DELETE_CONSUMER_GROUP,

  /** Binding an exchange to the queue. */
  BIND_EXCHANGE,

  /** Unbinding an exchange from the queue. */
  UNBIND_EXCHANGE,
}

/**
 * The bit position of each operation.
 *
 * `OperationBitmask[op]` is `1 << op`. The registry combines these with
 * bitwise OR to represent the set of operations allowed under a given
 * queue state, and tests membership with bitwise AND.
 *
 * The map is a plain object rather than a computed expression so that
 * TypeScript can infer `Record<EQueueOperation, number>` precisely. An
 * alternative construction would be:
 *
 *   const OperationBitmask = Object.fromEntries(
 *     Object.values(EQueueOperation)
 *       .filter((v) => typeof v === 'number')
 *       .map((v) => [v, 1 << v]),
 *   ) as Record<EQueueOperation, number>;
 *
 * which is what the source does NOT do; it spells each entry out. The
 * explicit form is preserved here.
 */
export const OperationBitmask: Record<EQueueOperation, number> = {
  [EQueueOperation.CONSUME]: 1 << EQueueOperation.CONSUME,
  [EQueueOperation.PRODUCE]: 1 << EQueueOperation.PRODUCE,
  [EQueueOperation.PURGE]: 1 << EQueueOperation.PURGE,
  [EQueueOperation.DELETE]: 1 << EQueueOperation.DELETE,
  [EQueueOperation.DELETE_MESSAGE]: 1 << EQueueOperation.DELETE_MESSAGE,
  [EQueueOperation.REQUEUE_MESSAGE]: 1 << EQueueOperation.REQUEUE_MESSAGE,
  [EQueueOperation.SET_RATE_LIMIT]: 1 << EQueueOperation.SET_RATE_LIMIT,
  [EQueueOperation.CLEAR_RATE_LIMIT]: 1 << EQueueOperation.CLEAR_RATE_LIMIT,
  [EQueueOperation.CREATE_CONSUMER_GROUP]:
    1 << EQueueOperation.CREATE_CONSUMER_GROUP,
  [EQueueOperation.DELETE_CONSUMER_GROUP]:
    1 << EQueueOperation.DELETE_CONSUMER_GROUP,
  [EQueueOperation.BIND_EXCHANGE]: 1 << EQueueOperation.BIND_EXCHANGE,
  [EQueueOperation.UNBIND_EXCHANGE]: 1 << EQueueOperation.UNBIND_EXCHANGE,
};

/**
 * A combined mask of operations.
 *
 * The value is the bitwise OR of the `OperationBitmask` entries for a
 * set of allowed operations. Testing whether an operation is allowed
 * reduces to `(mask & OperationBitmask[op]) !== 0`.
 */
export type TOperationBitmask = number;

// ═══════════════════════════════════════════════════════════════════════════
// Static-side interface
// ═══════════════════════════════════════════════════════════════════════════

/**
 * The static surface of the `QueueOperationValidator` class.
 *
 * `QueueOperationValidator` is a static-only class — every method is
 * static, and no caller ever instantiates it. TypeScript interfaces
 * cannot describe static members, and a class cannot `implements` a
 * static-side interface. So this interface is documentation, not a
 * compile-time constraint.
 *
 * The class itself is where the constraint lives: `QueueOperationValidator`
 * is a concrete class whose static methods are checked against the
 * signatures here only by reviewer attention, not by the compiler. If
 * this matters more than the readability of a single contract file, the
 * alternative is to write each static method's JSDoc directly on the
 * class and skip the interface entirely.
 *
 * The interface is included because it documents the public surface in
 * one place, which is what every other contract file in this directory
 * does. Consistency across the contract tree is worth more than the
 * small risk of an unverified static signature.
 */
export interface IQueueOperationValidatorStatic {
  /**
   * Checks whether messages can be consumed from a queue.
   *
   * Consuming requires the queue to be `ACTIVE`. It is refused under
   * `PAUSED`, `STOPPED`, and `LOCKED`.
   */
  canConsume(queue: string | IQueueParams): Promise<boolean>;
  canConsume(queue: string | IQueueParams, cb: ICallback<boolean>): void;

  /**
   * Checks whether messages can be produced to a queue.
   *
   * Producing is allowed under `ACTIVE` and `PAUSED`. It is refused
   * under `STOPPED` and `LOCKED`. A paused queue buffers incoming
   * messages without consuming them, which is why publishing remains
   * permitted.
   */
  canProduce(queue: string | IQueueParams): Promise<boolean>;
  canProduce(queue: string | IQueueParams, cb: ICallback<boolean>): void;

  /**
   * Checks whether the queue can be deleted.
   *
   * Queue deletion is permitted under `ACTIVE`, `PAUSED`, and `STOPPED`.
   * It is refused under `LOCKED` — a locked queue is being operated on
   * by its lock holder, and deletion would destroy the operation's
   * target.
   *
   * The permission checked here is orthogonal to the runtime
   * preconditions that `IQueueManager.delete()` enforces: a queue that
   * passes this check may still fail deletion if it has pending
   * messages, active consumers, or bound exchanges.
   */
  canDelete(queue: string | IQueueParams): Promise<boolean>;
  canDelete(queue: string | IQueueParams, cb: ICallback<boolean>): void;

  /**
   * Checks whether individual messages can be deleted from the queue.
   *
   * Message deletion is permitted under `ACTIVE`, `PAUSED`, and
   * `STOPPED`. It is refused under `LOCKED`. The permission mirrors
   * `canDelete`: message-level deletion is a management operation that
   * a lock holder may need to perform.
   *
   * A message in the `PROCESSING` state cannot be deleted regardless of
   * the queue's state — this is a message-level precondition enforced by
   * `IMessageManager.deleteMessageById`, not by the validator.
   */
  canDeleteMessage(queue: string | IQueueParams): Promise<boolean>;
  canDeleteMessage(queue: string | IQueueParams, cb: ICallback<boolean>): void;

  /**
   * Checks whether the queue can be purged.
   *
   * Purging is permitted under `ACTIVE`, `PAUSED`, and `STOPPED`. It is
   * refused under `LOCKED` — the lock holder is already operating on the
   * queue, and a concurrent purge would race with that operation.
   *
   * As with `canDelete`, the permission is separate from the runtime
   * conditions enforced by `IQueueMessages.purge()`: a purge may fail
   * even when permitted here (for example, if the queue is already
   * locked by an in-progress purge job).
   */
  canPurge(queue: string | IQueueParams): Promise<boolean>;
  canPurge(queue: string | IQueueParams, cb: ICallback<boolean>): void;

  /**
   * Checks whether a failed message can be requeued.
   *
   * Requeuing is permitted under `ACTIVE`, `PAUSED`, and `STOPPED`. It
   * is refused under `LOCKED`. The requeue operation creates a new
   * message from an acknowledged or dead-lettered one, which is a
   * management operation independent of the queue's processing state.
   */
  canRequeue(queue: string | IQueueParams): Promise<boolean>;
  canRequeue(queue: string | IQueueParams, cb: ICallback<boolean>): void;

  /**
   * Checks whether a rate limit can be set on the queue.
   *
   * Rate-limit modification is permitted under `ACTIVE`, `PAUSED`, and
   * `STOPPED`. It is refused under `LOCKED` — a locked queue's rate
   * limit is frozen for the duration of the lock.
   */
  canSetRateLimit(queue: string | IQueueParams): Promise<boolean>;
  canSetRateLimit(queue: string | IQueueParams, cb: ICallback<boolean>): void;

  /**
   * Checks whether the queue's rate limit can be cleared.
   *
   * Same permission profile as `canSetRateLimit`.
   */
  canClearRateLimit(queue: string | IQueueParams): Promise<boolean>;
  canClearRateLimit(queue: string | IQueueParams, cb: ICallback<boolean>): void;

  /**
   * Checks whether a consumer group can be created on the queue.
   *
   * Consumer-group creation is permitted under `ACTIVE`, `PAUSED`, and
   * `STOPPED`. It is refused under `LOCKED`. The permission is checked
   * in addition to the delivery-model precondition (the queue must be
   * PUB/SUB), which is enforced by `IConsumerGroups.saveConsumerGroup`.
   */
  canCreateConsumerGroup(queue: string | IQueueParams): Promise<boolean>;
  canCreateConsumerGroup(
    queue: string | IQueueParams,
    cb: ICallback<boolean>,
  ): void;

  /**
   * Checks whether a consumer group can be deleted from the queue.
   *
   * Same permission profile as `canCreateConsumerGroup`.
   */
  canDeleteConsumerGroup(queue: string | IQueueParams): Promise<boolean>;
  canDeleteConsumerGroup(
    queue: string | IQueueParams,
    cb: ICallback<boolean>,
  ): void;

  /**
   * Checks whether an exchange can be bound to the queue.
   *
   * Exchange binding is permitted under `ACTIVE`, `PAUSED`, and
   * `STOPPED`. It is refused under `LOCKED`.
   */
  canBindExchange(queue: string | IQueueParams): Promise<boolean>;
  canBindExchange(queue: string | IQueueParams, cb: ICallback<boolean>): void;

  /**
   * Checks whether an exchange can be unbound from the queue.
   *
   * Same permission profile as `canBindExchange`.
   */
  canUnbindExchange(queue: string | IQueueParams): Promise<boolean>;
  canUnbindExchange(queue: string | IQueueParams, cb: ICallback<boolean>): void;
}

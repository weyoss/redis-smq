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
import {
  IQueueStateTransition,
  TQueueStateTransitionUserOptions,
} from './queue-state.js';

/**
 * Manages the operational state of queues.
 *
 * A queue occupies exactly one of four states — ACTIVE, PAUSED, STOPPED,
 * or LOCKED — at any moment. This interface exposes the operations that
 * move a queue between states, plus the queries that inspect its current
 * state and its transition history.
 *
 * State transitions are validated against a rule table. Attempting an
 * invalid transition (for example, STOPPED to PAUSED) fails with a
 * transition error rather than silently applying. The rules are
 * documented on the concrete class; the interface only describes the
 * operations.
 *
 * Every mutating operation records a transition in the queue's history,
 * carrying a reason, a timestamp, an optional description, and optional
 * metadata. The history is capped (50 entries by default); older entries
 * are dropped as new ones arrive.
 *
 * Both the promise and callback forms are declared for every
 * asynchronous method, matching the concrete class.
 *
 * @example
 * const stateManager = new QueueStateManager();
 *
 * // Pause a queue for maintenance
 * await stateManager.pause('orders', {
 *   reason: EStateTransitionReason.MANUAL,
 *   description: 'Deploying v2 of the order processor',
 * });
 *
 * // Inspect the transition history
 * const history = await stateManager.getStateHistory('orders');
 */
export interface IQueueStateManager {
  /**
   * Returns the current operational state of a queue.
   *
   * The returned object carries the state the queue is currently in
   * (`to`), the state it came from (`from`, or `null` for the initial
   * state), the reason and timestamp of the most recent transition, and
   * (for LOCKED queues) the lock ID and owner.
   *
   * Fails with `QueueNotFoundError` if the queue does not exist.
   *
   * @example
   * // Promise
   * const state = await stateManager.getState('orders');
   * console.log(EQueueOperationalState[state.to]);
   *
   * // Callback
   * stateManager.getState('orders', (err, state) => {
   *   if (err) throw err;
   *   console.log(state.to);
   * });
   */
  getState(queue: string | IQueueParams): Promise<IQueueStateTransition>;
  getState(
    queue: string | IQueueParams,
    cb: ICallback<IQueueStateTransition>,
  ): void;

  /**
   * Pauses message processing for a queue.
   *
   * The queue continues to accept new messages; they buffer in the
   * pending list. Consumers remain subscribed but stop dequeuing. On
   * resume, buffered messages are consumed normally.
   *
   * A pause is a no-op if the queue is already PAUSED. Pausing a STOPPED
   * or LOCKED queue fails with a transition error — those states must
   * transition to ACTIVE first, then to PAUSED.
   *
   * Fails with `QueueNotFoundError` if the queue does not exist.
   *
   * @param options - Optional transition metadata. `null` is accepted and
   *   treated as "no additional context". When `options.reason` is
   *   omitted, the reason defaults to `EStateTransitionReason.MANUAL`.
   */
  pause(
    queue: string | IQueueParams,
    options: TQueueStateTransitionUserOptions | null,
  ): Promise<IQueueStateTransition>;
  pause(
    queue: string | IQueueParams,
    options: TQueueStateTransitionUserOptions | null,
    cb: ICallback<IQueueStateTransition>,
  ): void;

  /**
   * Resumes message processing for a queue.
   *
   * Moves the queue to ACTIVE. Valid from PAUSED and STOPPED. Valid from
   * LOCKED only if the caller supplies the matching lock ID via the
   * transition options — see the concrete class for the lock protocol.
   *
   * A resume is a no-op if the queue is already ACTIVE. Attempting to
   * resume a LOCKED queue without the matching lock ID fails with a
   * lock-mismatch error.
   *
   * Fails with `QueueNotFoundError` if the queue does not exist.
   *
   * @param options - Optional transition metadata. When `options.reason`
   *   is omitted, the reason defaults to `EStateTransitionReason.MANUAL`.
   */
  resume(
    queue: string | IQueueParams,
    options: TQueueStateTransitionUserOptions | null,
  ): Promise<IQueueStateTransition>;
  resume(
    queue: string | IQueueParams,
    options: TQueueStateTransitionUserOptions | null,
    cb: ICallback<IQueueStateTransition>,
  ): void;

  /**
   * Stops a queue completely.
   *
   * The queue stops accepting new messages and stops processing existing
   * ones. Consumers are disconnected. To resume consumption, transition
   * the queue back to ACTIVE (which is always allowed from STOPPED).
   *
   * A stop is a no-op if the queue is already STOPPED. Valid from
   * ACTIVE, PAUSED, and (with a matching lock ID) LOCKED.
   *
   * Fails with `QueueNotFoundError` if the queue does not exist.
   *
   * @param options - Optional transition metadata. When `options.reason`
   *   is omitted, the reason defaults to `EStateTransitionReason.MANUAL`.
   */
  stop(
    queue: string | IQueueParams,
    options: TQueueStateTransitionUserOptions | null,
  ): Promise<IQueueStateTransition>;
  stop(
    queue: string | IQueueParams,
    options: TQueueStateTransitionUserOptions | null,
    cb: ICallback<IQueueStateTransition>,
  ): void;

  /**
   * Returns the full state-transition history for a queue.
   *
   * The history is a list of `IQueueStateTransition` records, ordered
   * **newest first** — the most recent transition is at index 0. This
   * matches the underlying Redis list layout (`LPUSH` + `LRANGE 0 -1`).
   *
   * The list is capped at 50 entries (see `maxQueueStateHistorySize` in
   * the concrete implementation). Older entries are dropped as new
   * transitions occur.
   *
   * A queue with a single recorded transition (its creation) returns a
   * one-element list. A queue with no history at all returns an empty
   * list — but a queue that exists always has at least its initial
   * transition recorded at creation time, so the empty case is
   * effectively unreachable in normal operation.
   *
   * Fails with `QueueNotFoundError` if the queue does not exist.
   *
   * @example
   * // Promise
   * const history = await stateManager.getStateHistory('orders');
   * history.forEach((t) => console.log(t.to, t.reason, t.timestamp));
   *
   * // Callback
   * stateManager.getStateHistory('orders', (err, history) => {
   *   if (err) throw err;
   *   console.log(history.length);
   * });
   */
  getStateHistory(
    queue: string | IQueueParams,
  ): Promise<IQueueStateTransition[]>;
  getStateHistory(
    queue: string | IQueueParams,
    cb: ICallback<IQueueStateTransition[]>,
  ): void;
}

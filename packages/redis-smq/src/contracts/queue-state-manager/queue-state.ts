/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { EQueueOperationalState } from '../queue-manager/queue.js';

/**
 * Reasons for a state transition that only the system produces.
 *
 * These reasons are recorded automatically by internal machinery — the
 * initial state on queue creation, the recovery of an orphaned lock, and
 * the lifecycle of a purge job. They are never supplied by a caller
 * through the public API.
 *
 * The values are persisted in the queue's state history list (as part of
 * the JSON-serialized transition records). Renaming a member is a
 * breaking change to persisted history.
 */
export enum ESystemStateTransitionReason {
  /**
   * Recorded when a queue is created. The transition is from `null` (no
   * prior state) to `ACTIVE`, and it is the first entry in every queue's
   * history.
   */
  SYSTEM_INIT = 'SYSTEM_INIT',

  /**
   * Recorded when an internal worker recovers a queue from a state that
   * was left by a crashed or timed-out process. Currently used to
   * recover from an orphaned LOCKED state whose owner is no longer
   * running.
   */
  RECOVERY = 'RECOVERY',

  /**
   * Recorded when a purge job starts. The queue transitions to LOCKED,
   * and the lock ID is the purge job ID.
   */
  PURGE_QUEUE_START = 'PURGE_QUEUE_START',

  /**
   * Recorded when a purge job is cancelled by the caller. The queue
   * transitions back to ACTIVE and the lock is released.
   */
  PURGE_QUEUE_CANCEL = 'PURGE_QUEUE_CANCEL',

  /**
   * Recorded when a purge job fails. The queue transitions back to
   * ACTIVE and the lock is released.
   */
  PURGE_QUEUE_FAIL = 'PURGE_QUEUE_FAIL',

  /**
   * Recorded when a purge job completes successfully. The queue
   * transitions back to ACTIVE and the lock is released.
   */
  PURGE_QUEUE_COMPLETE = 'PURGE_QUEUE_COMPLETE',
}

/**
 * Reasons for a state transition that a caller may supply.
 *
 * These are the values accepted in `TQueueStateTransitionUserOptions`
 * and passed to `IQueueStateManager.pause` / `resume` / `stop`. A caller
 * who omits the reason defaults to `MANUAL`.
 *
 * The values are persisted in the queue's state history list (as part of
 * the JSON-serialized transition records). Renaming a member is a
 * breaking change to persisted history.
 */
export enum EStateTransitionReason {
  /**
   * The transition was made explicitly by an operator or an application
   * through the public API. This is the default when no reason is
   * supplied.
   */
  MANUAL = 'MANUAL',

  /**
   * The transition was scheduled — for example, a periodic maintenance
   * window that pauses a queue at a known time. The library does not
   * currently schedule transitions itself; this reason exists for
   * callers that implement their own scheduling and want the transition
   * history to reflect the intent.
   */
  SCHEDULED = 'SCHEDULED',

  /**
   * The transition was made in response to an emergency — a failing
   * downstream service, a data integrity issue, or similar. Semantically
   * distinct from MANUAL so that post-incident reviews can filter to
   * transitions that were reactive.
   */
  EMERGENCY = 'EMERGENCY',

  /**
   * The transition was made to protect or recover performance — for
   * example, pausing a queue to shed load while a downstream service
   * catches up.
   */
  PERFORMANCE = 'PERFORMANCE',

  /**
   * The transition was made automatically in response to an error. The
   * library does not currently perform automatic error-driven
   * transitions; this reason exists for callers that pause or stop a
   * queue from within an error handler and want the history to reflect
   * the trigger.
   */
  ERROR = 'ERROR',

  /**
   * The transition was made because configuration changed — for example,
   * a queue's rate limit was raised and the queue was temporarily
   * stopped to apply the new value.
   */
  CONFIG_CHANGE = 'CONFIG_CHANGE',

  /**
   * The transition was made by a test harness. Kept distinct from MANUAL
   * so that test-generated transitions can be filtered out of production
   * audits.
   */
  TESTING = 'TESTING',

  /**
   * The transition was made for a reason that does not fit any other
   * category. Prefer a specific reason when one applies.
   */
  OTHER = 'OTHER',
}

/**
 * Any reason a transition may carry, whether produced by the system or
 * supplied by a caller.
 *
 * This is the type of `IQueueStateTransition.reason`. Callers who
 * receive a transition and inspect its reason see this union; they
 * cannot tell from the type alone whether the reason came from the
 * system or from a caller, but the enum values are disjoint, so a
 * switch on specific members works as expected.
 */
export type EQueueStateTransitionReason =
  ESystemStateTransitionReason | EStateTransitionReason;

/**
 * All optional fields of a state transition.
 *
 * Used internally by the transition machinery to construct the option
 * bag that becomes a transition record. Includes lock-related fields
 * (`lockId`, `lockOwner`) that only the internal machinery sets.
 *
 * Callers who supply transition options through the public API use
 * `TQueueStateTransitionUserOptions` instead, which excludes the
 * lock-related fields.
 *
 * This type is exported by the current public surface. It is arguably
 * an internal detail (a projection of `IQueueStateTransition` minus the
 * fields that are set positionally by the transition code). A future
 * major release could move it to an internal directory.
 */
export type TQueueStateTransitionOptions = Partial<
  Omit<IQueueStateTransition, 'from' | 'to' | 'timestamp'>
>;

/**
 * Transition options a caller may supply.
 *
 * The same shape as `TQueueStateTransitionOptions`, minus the
 * lock-related fields (`lockId`, `lockOwner`) that callers must not set.
 * The `reason` field is narrowed to `EStateTransitionReason` so that a
 * caller cannot accidentally record a system-only reason.
 *
 * Passing `null` instead of an options object is allowed and is treated
 * as "no options". A caller who supplies an options object with no
 * `reason` gets the `MANUAL` default.
 *
 * @example
 * // Minimal — reason defaults to MANUAL, no description
 * await stateManager.pause('orders', null);
 *
 * // Explicit reason and description
 * await stateManager.pause('orders', {
 *   reason: EStateTransitionReason.EMERGENCY,
 *   description: 'Downstream service unavailable',
 *   metadata: { incidentId: 'INC-1234' },
 * });
 */
export type TQueueStateTransitionUserOptions = Omit<
  TQueueStateTransitionOptions,
  'lockId' | 'lockOwner'
> & {
  reason?: EStateTransitionReason;
};

/**
 * Who owns a LOCKED state.
 *
 * The lock owner identifies the subsystem that acquired the lock. Today
 * there is exactly one owner — the purge-queue job — but the enum exists
 * so that a future lock-acquiring subsystem can be added without
 * changing the transition schema.
 *
 * The value is persisted in the transition record's `lockOwner` field.
 * Renaming a member is a breaking change to persisted history.
 *
 * This type is exported by the current public surface. It is arguably
 * an internal detail (callers cannot acquire locks themselves). A future
 * major release could move it to an internal directory.
 */
export enum EQueueStateLockOwner {
  /**
   * The lock is held by a purge-queue job. The lock ID equals the job's
   * ID, so the lock can be correlated with the job in the queue's
   * background-job registry.
   */
  PURGE_JOB,
}

/**
 * A record of one transition of a queue's operational state.
 *
 * Every transition — from `ACTIVE` to `PAUSED`, from `PAUSED` back to
 * `ACTIVE`, from `ACTIVE` to `LOCKED`, and so on — produces one of these
 * objects. The queue's history is a list of them, capped at 50 entries
 * (older entries are dropped as new ones arrive).
 *
 * The object is persisted in Redis as JSON, one entry per list element.
 * Renaming any field is a breaking change to persisted history.
 *
 * The `from` field is `null` only for the initial transition
 * (`SYSTEM_INIT`) recorded when the queue is created. Every subsequent
 * transition has a non-null `from` and `to`.
 */
export interface IQueueStateTransition {
  /**
   * The operational state the queue was in before this transition.
   *
   * `null` only for the initial transition recorded at queue creation,
   * which has no prior state.
   */
  from: EQueueOperationalState | null;

  /**
   * The operational state the queue moved to.
   */
  to: EQueueOperationalState;

  /**
   * Why the transition occurred.
   *
   * For transitions the caller triggered through the public API, this is
   * one of the `EStateTransitionReason` values. For transitions the
   * system triggered on its own (queue creation, lock recovery, purge
   * job lifecycle), it is one of the `ESystemStateTransitionReason`
   * values.
   */
  reason: EQueueStateTransitionReason;

  /**
   * Milliseconds since the Unix epoch, at the moment the transition was
   * recorded.
   */
  timestamp: number;

  /**
   * Human-readable description of the transition.
   *
   * Filled in by the caller when options include a description. When no
   * description is supplied, the transition is given a default that
   * summarizes the transition (e.g., "Manual transition from active to
   * paused").
   */
  description?: string;

  /**
   * The lock ID for transitions into or out of the `LOCKED` state.
   *
   * Present only when the transition involves a lock. For a transition
   * into `LOCKED`, this is the ID of the lock that was acquired. For a
   * transition out of `LOCKED`, this is the ID of the lock that was
   * released. Absent for all other transitions.
   */
  lockId?: string;

  /**
   * The owner of the lock for transitions into or out of the `LOCKED`
   * state.
   *
   * Present only when the transition involves a lock. Identifies which
   * subsystem held the lock. Absent for all other transitions.
   */
  lockOwner?: EQueueStateLockOwner;

  /**
   * Additional context supplied by the caller or the system.
   *
   * For caller-supplied transitions, this is whatever was passed in the
   * options. For system transitions, the metadata typically identifies
   * the trigger (e.g., the job ID for a purge-queue transition).
   */
  metadata?: Record<string, unknown>;
}

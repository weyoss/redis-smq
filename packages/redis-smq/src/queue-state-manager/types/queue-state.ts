/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { EQueueOperationalState } from '../../queue-manager/index.js';

/**
 * System-only reasons - used internally by the system
 */
export enum ESystemStateTransitionReason {
  SYSTEM_INIT = 'SYSTEM_INIT',
  RECOVERY = 'RECOVERY',
  PURGE_QUEUE_START = 'PURGE_QUEUE_START',
  PURGE_QUEUE_CANCEL = 'PURGE_QUEUE_CANCEL',
  PURGE_QUEUE_FAIL = 'PURGE_QUEUE_FAIL',
  PURGE_QUEUE_COMPLETE = 'PURGE_QUEUE_COMPLETE',
}

/**
 * User-facing reasons - can be specified via public API
 */
export enum EStateTransitionReason {
  MANUAL = 'MANUAL',
  SCHEDULED = 'SCHEDULED',
  EMERGENCY = 'EMERGENCY',
  PERFORMANCE = 'PERFORMANCE',
  ERROR = 'ERROR',
  CONFIG_CHANGE = 'CONFIG_CHANGE',
  TESTING = 'TESTING',
  OTHER = 'OTHER',
}

/**
 * Combined type for internal use
 */
export type EQueueStateTransitionReason =
  | ESystemStateTransitionReason
  | EStateTransitionReason;

export type TQueueStateTransitionOptions = Partial<
  Omit<IQueueStateTransition, 'from' | 'to' | 'timestamp'>
>;

/**
 * User-facing options should only include user reasons
 */
export type TQueueStateTransitionUserOptions = Omit<
  TQueueStateTransitionOptions,
  'lockId' | 'lockOwner'
> & {
  reason?: EStateTransitionReason; // Override to restrict to user reasons
};

export enum EQueueStateLockOwner {
  PURGE_JOB,
}

/**
 * Queue state transition information
 */
export interface IQueueStateTransition {
  /** State transitioning from */
  from: EQueueOperationalState | null;

  /** State transitioning to */
  to: EQueueOperationalState;

  /** Reason for the transition */
  reason: EQueueStateTransitionReason;

  /** When the transition occurred */
  timestamp: number;

  /** Human-readable description */
  description?: string;

  /** Lock ID (if applicable for LOCKED state) */
  lockId?: string;

  /** Lock owner (if applicable) */
  lockOwner?: EQueueStateLockOwner;

  /** Additional context/metadata */
  metadata?: Record<string, unknown>;
}

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
 * Minimal set of queue state transition reasons covering most common cases
 */
export enum EQueueStateTransitionReason {
  /**
   * System initialization - default state when queue is created
   */
  SYSTEM_INIT = 'SYSTEM_INIT',

  /**
   *
   */
  PURGE_QUEUE_START = 'PURGE_QUEUE_START',

  /**
   *
   */
  PURGE_QUEUE_CANCEL = 'PURGE_QUEUE_CANCEL',

  /**
   *
   */
  PURGE_QUEUE_FAIL = 'PURGE_QUEUE_FAIL',

  /**
   *
   */
  PURGE_QUEUE_COMPLETE = 'PURGE_QUEUE_COMPLETE',

  /**
   * Manual user action via API, CLI, or UI
   */
  MANUAL = 'MANUAL',

  /**
   * Scheduled operation (maintenance, deployment, etc.)
   */
  SCHEDULED = 'SCHEDULED',

  /**
   * Emergency situation requiring immediate action
   */
  EMERGENCY = 'EMERGENCY',

  /**
   * Performance issue (high latency, resource exhaustion, etc.)
   */
  PERFORMANCE = 'PERFORMANCE',

  /**
   * Error condition requiring intervention
   */
  ERROR = 'ERROR',

  /**
   * Recovery from a failed or degraded state
   */
  RECOVERY = 'RECOVERY',

  /**
   * Configuration change requiring state transition
   */
  CONFIG_CHANGE = 'CONFIG_CHANGE',

  /**
   * Testing or debugging activity
   */
  TESTING = 'TESTING',

  /**
   * Unknown or unspecified reason
   */
  UNKNOWN = 'UNKNOWN',
}

export enum EQueueStateLockOwner {
  PURGE_JOB,
}

export type TQueueStateFullOptions = Partial<
  Omit<IQueueStateTransition, 'from' | 'to' | 'timestamp'>
>;

export type TQueueStateCommonOptions = Omit<
  TQueueStateFullOptions,
  'lockId' | 'lockOwner'
>;

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

/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { EQueueOperationalState } from '../../queue-manager/index.js';
import {
  EQueueStateTransitionReason,
  EStateTransitionReason,
  ESystemStateTransitionReason,
  IQueueStateTransition,
  TQueueStateTransitionOptions,
} from '../types/index.js';

/**
 * Helper to create a state transition object
 */
export function _createQueueStateTransition(
  from: EQueueOperationalState,
  to: EQueueOperationalState,
  reason: EQueueStateTransitionReason,
  options?: TQueueStateTransitionOptions,
): IQueueStateTransition {
  const transition: IQueueStateTransition = {
    from,
    to,
    reason,
    description:
      options?.description || getDefaultDescription(reason, from, to),
    timestamp: Date.now(),
    metadata: options?.metadata,
  };
  if (to === EQueueOperationalState.LOCKED) {
    // using == instead of === to catch both null and undefined
    if (options?.lockId == null || options?.lockOwner == null)
      throw new Error(`lockId and lockOwner are required`);
    transition.lockOwner = options.lockOwner;
    transition.lockId = options.lockId;
  }
  return transition;
}

/**
 * Helper to get default description for a transition
 */
function getDefaultDescription(
  reason: EQueueStateTransitionReason,
  from: EQueueOperationalState,
  to: EQueueOperationalState,
): string {
  const fromState = EQueueOperationalState[from].toLowerCase();
  const toState = EQueueOperationalState[to].toLowerCase();

  switch (reason) {
    case ESystemStateTransitionReason.SYSTEM_INIT:
      return `System initialized queue from ${fromState} to ${toState}`;

    case ESystemStateTransitionReason.RECOVERY:
      return `Recovery transition from ${fromState} to ${toState}`;

    case EStateTransitionReason.MANUAL:
      return `Manual transition from ${fromState} to ${toState}`;

    case EStateTransitionReason.SCHEDULED:
      return `Scheduled transition from ${fromState} to ${toState}`;

    case EStateTransitionReason.EMERGENCY:
      return `Emergency transition from ${fromState} to ${toState}`;

    case EStateTransitionReason.PERFORMANCE:
      return `Performance-related transition from ${fromState} to ${toState}`;

    case EStateTransitionReason.ERROR:
      return `Error-triggered transition from ${fromState} to ${toState}`;

    case EStateTransitionReason.CONFIG_CHANGE:
      return `Configuration change triggered transition from ${fromState} to ${toState}`;

    case EStateTransitionReason.TESTING:
      return `Testing transition from ${fromState} to ${toState}`;

    case EStateTransitionReason.OTHER:
      return `Unknown reason for transition from ${fromState} to ${toState}`;

    default:
      return `Transition from ${fromState} to ${toState}`;
  }
}

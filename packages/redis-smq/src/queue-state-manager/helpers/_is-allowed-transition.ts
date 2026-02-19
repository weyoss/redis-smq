/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { EQueueOperationalState } from '../../queue-manager/index.js';
import { STATE_TRANSITION_RULES } from '../state-transition-rules.js';

/**
 * Validates if a state transition is allowed
 */
export function _isAllowedTransition(
  from: EQueueOperationalState,
  to: EQueueOperationalState,
): boolean {
  return STATE_TRANSITION_RULES[from]?.includes(to) ?? false;
}

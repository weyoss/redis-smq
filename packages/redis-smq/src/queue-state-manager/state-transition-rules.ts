/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { EQueueOperationalState } from '../queue-manager/index.js';

/**
 * Queue state transition rules
 */
export const STATE_TRANSITION_RULES: Record<
  EQueueOperationalState,
  EQueueOperationalState[]
> = {
  [EQueueOperationalState.ACTIVE]: [
    EQueueOperationalState.PAUSED,
    EQueueOperationalState.LOCKED,
    EQueueOperationalState.STOPPED,
  ],
  [EQueueOperationalState.PAUSED]: [
    EQueueOperationalState.ACTIVE,
    EQueueOperationalState.STOPPED,
    EQueueOperationalState.LOCKED,
  ],
  [EQueueOperationalState.STOPPED]: [EQueueOperationalState.ACTIVE],
  [EQueueOperationalState.LOCKED]: [
    EQueueOperationalState.ACTIVE,
    EQueueOperationalState.STOPPED,
  ],
};

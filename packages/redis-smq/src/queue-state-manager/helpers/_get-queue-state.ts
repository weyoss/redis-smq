/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback, IRedisClient } from 'redis-smq-common';
import {
  EQueueOperationalState,
  EQueueProperty,
  IQueueParams,
} from '../../queue-manager/index.js';
import {
  EQueueStateTransitionReason,
  IQueueStateTransition,
} from '../types/index.js';
import { redisKeys } from '../../common/redis/redis-keys/redis-keys.js';
import { _createQueueStateTransition } from './_create-queue-state-transition.js';

export function _getQueueState(
  client: IRedisClient,
  queueParams: IQueueParams,
  cb: ICallback<IQueueStateTransition>,
): void {
  const { keyQueueProperties } = redisKeys.getQueueKeys(
    queueParams.ns,
    queueParams.name,
    null,
  );

  // Get current state from queue properties
  client.hget(
    keyQueueProperties,
    String(EQueueProperty.OPERATIONAL_STATE),
    (err, stateValue) => {
      if (err) return cb(err);

      // Default to ACTIVE if not set
      const currentState: EQueueOperationalState = stateValue
        ? Number(stateValue)
        : EQueueOperationalState.ACTIVE;

      // Get latest state transition
      const { keyQueueStateHistory } = redisKeys.getQueueKeys(
        queueParams.ns,
        queueParams.name,
        null,
      );

      client.lindex(keyQueueStateHistory, 0, (err, latestTransition) => {
        if (err) return cb(err);

        let transition: IQueueStateTransition;
        if (latestTransition) {
          transition = JSON.parse(latestTransition);
        } else {
          // Create initial transition
          transition = _createQueueStateTransition(
            EQueueOperationalState.ACTIVE,
            currentState,
            EQueueStateTransitionReason.SYSTEM_INIT,
          );
        }

        cb(null, transition);
      });
    },
  );
}

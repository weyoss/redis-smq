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
import { ERedisScriptName } from '../../common/redis/scripts.js';
import { QueueNotFoundError } from '../../errors/index.js';

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

  client.runScript(
    ERedisScriptName.GET_QUEUE_STATE,
    [keyQueueProperties],
    [EQueueProperty.OPERATIONAL_STATE],
    (err, reply) => {
      if (err) return cb(err);
      if (reply === 'QUEUE_NOT_FOUND') {
        return cb(new QueueNotFoundError());
      }

      // Default to ACTIVE if not set
      const currentState: EQueueOperationalState = reply
        ? Number(reply)
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

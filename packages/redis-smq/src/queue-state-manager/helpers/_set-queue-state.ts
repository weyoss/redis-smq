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
  TQueueStateFullOptions,
} from '../types/index.js';
import { redisKeys } from '../../common/redis/redis-keys/redis-keys.js';
import { _createQueueStateTransition } from './_create-queue-state-transition.js';
import { ERedisScriptName } from '../../common/redis/scripts.js';
import {
  QueueNotFoundError,
  QueueStateTransitionError,
  UnexpectedScriptReplyError,
} from '../../errors/index.js';

export const maxQueueStateHistorySize = 50;

export function _setQueueState(
  client: IRedisClient,
  queueParams: IQueueParams,
  from: EQueueOperationalState,
  to: EQueueOperationalState,
  reason: EQueueStateTransitionReason,
  options: TQueueStateFullOptions | null,
  cb: ICallback<IQueueStateTransition>,
): void {
  const { keyQueueProperties, keyQueueStateHistory } = redisKeys.getQueueKeys(
    queueParams.ns,
    queueParams.name,
    null,
  );

  const lockId = options?.lockId ?? '';

  // Create the transition object
  const transition = _createQueueStateTransition(
    from,
    to,
    reason,
    options ?? {},
  );

  // Update queue properties and state history in a transaction
  const keys = [keyQueueProperties, keyQueueStateHistory];
  const args = [
    EQueueProperty.OPERATIONAL_STATE,
    to,
    JSON.stringify(transition),
    from, // expectedPreviousState
    EQueueOperationalState.ACTIVE,
    maxQueueStateHistorySize,
    EQueueOperationalState.LOCKED,
    lockId,
    EQueueProperty.LAST_STATE_CHANGE_AT, // field name for timestamp
    transition.timestamp, // timestamp value
    EQueueProperty.LOCK_ID, // field name for lock ID
  ];

  client.runScript(
    ERedisScriptName.SET_QUEUE_STATE,
    keys,
    args,
    (err, reply) => {
      if (err) return cb(err);
      if (reply !== 'OK') {
        if (reply === 'QUEUE_NOT_FOUND') {
          return cb(new QueueNotFoundError());
        }
        if (reply === 'INVALID_STATE_TRANSITION') {
          return cb(
            new QueueStateTransitionError({
              message: `Invalid state transition: queue state changed since validation`,
              metadata: {
                from,
                to,
              },
            }),
          );
        }
        if (reply === 'INVALID_LOCK') {
          return cb(
            new QueueStateTransitionError({
              message: `Invalid lock ID provided`,
              metadata: {
                from,
                to,
              },
            }),
          );
        }

        return cb(
          new UnexpectedScriptReplyError({
            metadata: { reply },
          }),
        );
      }
      cb(null, transition);
    },
  );
}

/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  CallbackEmptyReplyError,
  ICallback,
  IRedisClient,
} from 'redis-smq-common';
import {
  EQueueOperationalState,
  IQueueParams,
} from '../../queue-manager/index.js';
import { EQueueOperation } from '../types/index.js';
import {
  QueueLockedError,
  QueueOperationForbiddenError,
  QueuePausedError,
  QueueStoppedError,
} from '../../errors/index.js';
import { _checkOperation } from './_check-operation.js';

export function _validateOperation(
  client: IRedisClient,
  queueParams: IQueueParams,
  operation: EQueueOperation,
  cb: ICallback,
): void {
  _checkOperation(client, queueParams, operation, (err, reply) => {
    if (err) return cb(err);
    if (!reply) return cb(new CallbackEmptyReplyError());
    const { allowed, currentQueueState } = reply;
    if (!allowed) {
      if (currentQueueState === EQueueOperationalState.PAUSED) {
        return cb(
          new QueuePausedError({
            metadata: {
              queue: queueParams,
            },
          }),
        );
      }
      if (currentQueueState === EQueueOperationalState.STOPPED) {
        return cb(
          new QueueStoppedError({
            metadata: {
              queue: queueParams,
            },
          }),
        );
      }
      if (currentQueueState === EQueueOperationalState.LOCKED) {
        return cb(
          new QueueLockedError({
            metadata: {
              queue: queueParams,
            },
          }),
        );
      }
      return cb(
        new QueueOperationForbiddenError({
          metadata: { operation, queue: queueParams },
        }),
      );
    }
    cb();
  });
}

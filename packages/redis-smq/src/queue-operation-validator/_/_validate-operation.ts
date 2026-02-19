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
import { IQueueParams } from '../../queue-manager/index.js';
import { EQueueOperation, OperationBitmask } from '../types/index.js';
import { _getQueueState } from '../../queue-state-manager/helpers/_get-queue-state.js';
import { operationRegistry } from '../operation-registery.js';
import { QueueOperationForbiddenError } from '../../errors/index.js';

export function _validateOperation(
  client: IRedisClient,
  queueParams: IQueueParams,
  operation: EQueueOperation,
  cb: ICallback,
): void {
  _getQueueState(client, queueParams, (err, queueState) => {
    if (err) return cb(err);
    if (!queueState) return cb(new CallbackEmptyReplyError());

    const bitmask = operationRegistry[queueState.to] ?? 0;
    const allowed = (bitmask & OperationBitmask[operation]) !== 0;
    if (!allowed) {
      return cb(
        new QueueOperationForbiddenError({
          metadata: { operation, queue: queueParams },
        }),
      );
    }
    cb();
  });
}

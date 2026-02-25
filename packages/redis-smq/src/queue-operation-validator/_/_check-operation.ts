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
import { EQueueOperation, OperationBitmask } from '../types/index.js';
import { _getQueueState } from '../../queue-state-manager/helpers/_get-queue-state.js';
import { operationRegistry } from '../operation-registery.js';

export function _checkOperation(
  client: IRedisClient,
  queueParams: IQueueParams,
  operation: EQueueOperation,
  cb: ICallback<{
    allowed: boolean;
    currentQueueState: EQueueOperationalState;
  }>,
): void {
  _getQueueState(client, queueParams, (err, queueState) => {
    if (err) return cb(err);
    if (!queueState) return cb(new CallbackEmptyReplyError());

    const bitmask = operationRegistry[queueState.to] ?? 0;
    const allowed = (bitmask & OperationBitmask[operation]) !== 0;
    cb(null, { allowed, currentQueueState: queueState.to });
  });
}

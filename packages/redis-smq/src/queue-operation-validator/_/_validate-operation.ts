/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback, IRedisClient } from 'redis-smq-common';
import { IQueueParams } from '../../queue-manager/index.js';
import { EQueueOperation } from '../types/index.js';
import { QueueOperationForbiddenError } from '../../errors/index.js';
import { _checkOperation } from './_check-operation.js';

export function _validateOperation(
  client: IRedisClient,
  queueParams: IQueueParams,
  operation: EQueueOperation,
  cb: ICallback,
): void {
  _checkOperation(client, queueParams, operation, (err, allowed) => {
    if (err) return cb(err);
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

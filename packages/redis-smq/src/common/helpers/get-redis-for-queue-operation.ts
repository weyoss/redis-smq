/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { EQueueOperation } from '../../queue-operation-validator/index.js';
import { ICallback, IRedisClient } from 'redis-smq-common';
import { withSharedPoolConnection } from '../redis/redis-connection-pool/with-shared-pool-connection.js';
import { _validateOperation } from '../../queue-operation-validator/_/_validate-operation.js';
import { IQueueParams } from '../../queue-manager/index.js';
import { _parseQueueParams } from '../../queue-manager/_/_parse-queue-params.js';

export function getRedisForQueueOperation<T>(
  queue: string | IQueueParams,
  operation: EQueueOperation,
  queueOperationFn: (client: IRedisClient, cb: ICallback<T>) => void,
  callback: ICallback<T>,
) {
  withSharedPoolConnection((client, cb) => {
    const queueParams = _parseQueueParams(queue);
    if (queueParams instanceof Error) return cb(queueParams);
    _validateOperation(client, queueParams, operation, (err) => {
      if (err) return cb(err);
      queueOperationFn(client, cb);
    });
  }, callback);
}

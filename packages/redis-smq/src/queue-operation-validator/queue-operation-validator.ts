/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback } from 'redis-smq-common';
import { IQueueParams } from '../queue-manager/index.js';
import { EQueueOperation } from './types/index.js';
import { withSharedPoolConnection } from '../common/redis/redis-connection-pool/with-shared-pool-connection.js';
import { _validateOperation } from './_/_validate-operation.js';
import { _checkOperations } from './_/_check-operations.js';

export class QueueOperationValidator {
  static validateOperation(
    queueParams: IQueueParams,
    operation: EQueueOperation,
    cb: ICallback,
  ): void {
    withSharedPoolConnection((client, cb) => {
      _validateOperation(client, queueParams, operation, cb);
    }, cb);
  }

  static checkOperations(
    queueParams: IQueueParams,
    operations: EQueueOperation[],
    cb: ICallback<boolean[]>,
  ): void {
    withSharedPoolConnection((client, cb) => {
      _checkOperations(client, queueParams, operations, cb);
    }, cb);
  }
}

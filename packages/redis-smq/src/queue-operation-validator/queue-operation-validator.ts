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
import { _checkOperationList } from './_/_check-operation-list.js';
import { _parseQueueParams } from '../queue-manager/_/_parse-queue-params.js';
import { _checkOperation } from './_/_check-operation.js';

export class QueueOperationValidator {
  protected static validateOperation(
    queue: string | IQueueParams,
    operation: EQueueOperation,
    cb: ICallback,
  ): void {
    const queueParams = _parseQueueParams(queue);
    if (queueParams instanceof Error) return cb(queueParams);

    withSharedPoolConnection((client, cb) => {
      _validateOperation(client, queueParams, operation, cb);
    }, cb);
  }

  protected static checkOperation(
    queue: string | IQueueParams,
    operation: EQueueOperation,
    cb: ICallback<boolean>,
  ): void {
    const queueParams = _parseQueueParams(queue);
    if (queueParams instanceof Error) return cb(queueParams);

    withSharedPoolConnection((client, cb) => {
      _checkOperation(client, queueParams, operation, cb);
    }, cb);
  }

  protected static checkOperations(
    queue: string | IQueueParams,
    operations: EQueueOperation[],
    cb: ICallback<boolean[]>,
  ): void {
    const queueParams = _parseQueueParams(queue);
    if (queueParams instanceof Error) return cb(queueParams);

    withSharedPoolConnection((client, cb) => {
      _checkOperationList(client, queueParams, operations, cb);
    }, cb);
  }

  static canConsume(queue: string | IQueueParams, cb: ICallback<boolean>) {
    this.checkOperation(queue, EQueueOperation.CONSUME, cb);
  }

  static canProduce(queue: string | IQueueParams, cb: ICallback<boolean>) {
    this.checkOperation(queue, EQueueOperation.PRODUCE, cb);
  }

  static canDelete(queue: string | IQueueParams, cb: ICallback<boolean>) {
    this.checkOperation(queue, EQueueOperation.DELETE, cb);
  }

  static canDeleteMessage(
    queue: string | IQueueParams,
    cb: ICallback<boolean>,
  ) {
    this.checkOperation(queue, EQueueOperation.DELETE_MESSAGE, cb);
  }

  static canPurge(queue: string | IQueueParams, cb: ICallback<boolean>) {
    this.checkOperation(queue, EQueueOperation.PURGE, cb);
  }

  static canRequeue(queue: string | IQueueParams, cb: ICallback<boolean>) {
    this.checkOperation(queue, EQueueOperation.REQUEUE_MESSAGE, cb);
  }

  static canSetRateLimit(queue: string | IQueueParams, cb: ICallback<boolean>) {
    this.checkOperation(queue, EQueueOperation.SET_RATE_LIMIT, cb);
  }

  static canClearRateLimit(
    queue: string | IQueueParams,
    cb: ICallback<boolean>,
  ) {
    this.checkOperation(queue, EQueueOperation.CLEAR_RATE_LIMIT, cb);
  }

  static canCreateConsumerGroup(
    queue: string | IQueueParams,
    cb: ICallback<boolean>,
  ) {
    this.checkOperation(queue, EQueueOperation.CREATE_CONSUMER_GROUP, cb);
  }

  static canDeleteConsumerGroup(
    queue: string | IQueueParams,
    cb: ICallback<boolean>,
  ) {
    this.checkOperation(queue, EQueueOperation.DELETE_CONSUMER_GROUP, cb);
  }

  static canBindExchange(queue: string | IQueueParams, cb: ICallback<boolean>) {
    this.checkOperation(queue, EQueueOperation.BIND_EXCHANGE, cb);
  }

  static canUnbindExchange(
    queue: string | IQueueParams,
    cb: ICallback<boolean>,
  ) {
    this.checkOperation(queue, EQueueOperation.UNBIND_EXCHANGE, cb);
  }
}

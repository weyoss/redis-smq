/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

export enum EQueueOperation {
  CONSUME,
  PRODUCE,
  DELETE,
  PURGE,
  DELETE_MESSAGE,
  REQUEUE_MESSAGE,
  SET_RATE_LIMIT,
  CLEAR_RATE_LIMIT,
  CREATE_CONSUMER_GROUP,
  DELETE_CONSUMER_GROUP,
  BIND_EXCHANGE,
  UNBIND_EXCHANGE,
}

// Fast bitmask operations
export const OperationBitmask: Record<EQueueOperation, number> = {
  [EQueueOperation.CONSUME]: 1 << EQueueOperation.CONSUME,
  [EQueueOperation.PRODUCE]: 1 << EQueueOperation.PRODUCE,
  [EQueueOperation.PURGE]: 1 << EQueueOperation.PURGE,
  [EQueueOperation.DELETE]: 1 << EQueueOperation.DELETE,
  [EQueueOperation.DELETE_MESSAGE]: 1 << EQueueOperation.DELETE_MESSAGE,
  [EQueueOperation.REQUEUE_MESSAGE]: 1 << EQueueOperation.REQUEUE_MESSAGE,
  [EQueueOperation.SET_RATE_LIMIT]: 1 << EQueueOperation.SET_RATE_LIMIT,
  [EQueueOperation.CLEAR_RATE_LIMIT]: 1 << EQueueOperation.CLEAR_RATE_LIMIT,
  [EQueueOperation.CREATE_CONSUMER_GROUP]:
    1 << EQueueOperation.CREATE_CONSUMER_GROUP,
  [EQueueOperation.DELETE_CONSUMER_GROUP]:
    1 << EQueueOperation.DELETE_CONSUMER_GROUP,
  [EQueueOperation.BIND_EXCHANGE]: 1 << EQueueOperation.BIND_EXCHANGE,
  [EQueueOperation.UNBIND_EXCHANGE]: 1 << EQueueOperation.UNBIND_EXCHANGE,
};

export type TOperationBitmask = number;

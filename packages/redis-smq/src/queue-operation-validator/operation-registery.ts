/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { EQueueOperationalState } from '../queue-manager/index.js';
import {
  EQueueOperation,
  OperationBitmask,
  TOperationBitmask,
} from './types/index.js';

export const operationRegistry: Record<
  EQueueOperationalState,
  TOperationBitmask
> = {
  [EQueueOperationalState.ACTIVE]:
    OperationBitmask[EQueueOperation.CONSUME] |
    OperationBitmask[EQueueOperation.PRODUCE] |
    OperationBitmask[EQueueOperation.PURGE] |
    OperationBitmask[EQueueOperation.DELETE] |
    OperationBitmask[EQueueOperation.DELETE_MESSAGE] |
    OperationBitmask[EQueueOperation.REQUEUE_MESSAGE] |
    OperationBitmask[EQueueOperation.SET_RATE_LIMIT] |
    OperationBitmask[EQueueOperation.CLEAR_RATE_LIMIT] |
    OperationBitmask[EQueueOperation.CREATE_CONSUMER_GROUP] |
    OperationBitmask[EQueueOperation.DELETE_CONSUMER_GROUP] |
    OperationBitmask[EQueueOperation.BIND_EXCHANGE] |
    OperationBitmask[EQueueOperation.UNBIND_EXCHANGE],

  [EQueueOperationalState.PAUSED]:
    OperationBitmask[EQueueOperation.PRODUCE] |
    OperationBitmask[EQueueOperation.PURGE] |
    OperationBitmask[EQueueOperation.DELETE] |
    OperationBitmask[EQueueOperation.DELETE_MESSAGE] |
    OperationBitmask[EQueueOperation.REQUEUE_MESSAGE] |
    OperationBitmask[EQueueOperation.SET_RATE_LIMIT] |
    OperationBitmask[EQueueOperation.CLEAR_RATE_LIMIT] |
    OperationBitmask[EQueueOperation.CREATE_CONSUMER_GROUP] |
    OperationBitmask[EQueueOperation.DELETE_CONSUMER_GROUP] |
    OperationBitmask[EQueueOperation.BIND_EXCHANGE] |
    OperationBitmask[EQueueOperation.UNBIND_EXCHANGE],

  [EQueueOperationalState.STOPPED]:
    OperationBitmask[EQueueOperation.PURGE] |
    OperationBitmask[EQueueOperation.DELETE] |
    OperationBitmask[EQueueOperation.DELETE_MESSAGE] |
    OperationBitmask[EQueueOperation.REQUEUE_MESSAGE] |
    OperationBitmask[EQueueOperation.SET_RATE_LIMIT] |
    OperationBitmask[EQueueOperation.CLEAR_RATE_LIMIT] |
    OperationBitmask[EQueueOperation.CREATE_CONSUMER_GROUP] |
    OperationBitmask[EQueueOperation.DELETE_CONSUMER_GROUP] |
    OperationBitmask[EQueueOperation.BIND_EXCHANGE] |
    OperationBitmask[EQueueOperation.UNBIND_EXCHANGE],

  [EQueueOperationalState.LOCKED]: 0,
};

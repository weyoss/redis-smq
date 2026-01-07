/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback } from 'redis-smq-common';
import {
  EQueueDeliveryModel,
  EQueueType,
  IQueueParams,
  RedisSMQ,
} from 'redis-smq';

export function ensureQueue(queue: IQueueParams, cb: ICallback<void>) {
  const qm = RedisSMQ.createQueueManager();
  qm.save(
    queue,
    EQueueType.FIFO_QUEUE,
    EQueueDeliveryModel.POINT_TO_POINT,
    (err) => {
      if (err && err.name !== 'QueueAlreadyExistsError') return cb(err);
      cb();
    },
  );
}

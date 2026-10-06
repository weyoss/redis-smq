/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  EQueueDeliveryModel,
  EQueueType,
  IQueueParams,
  RedisSMQ,
} from 'redis-smq';

export async function createQueue(
  queue: string | IQueueParams,
  queueType: EQueueType = EQueueType.LIFO_QUEUE,
  deliveryModel: EQueueDeliveryModel = EQueueDeliveryModel.POINT_TO_POINT,
) {
  const queueInstance = RedisSMQ.createQueueManager();
  return queueInstance.save(queue, queueType, deliveryModel);
}

/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import {
  EQueueDeliveryModel,
  EQueueType,
  IQueueParams,
  Queue,
} from 'redis-smq';

const { promisifyAll } = bluebird;

export async function createQueue(
  queue: string | IQueueParams,
  queueType: EQueueType = EQueueType.LIFO_QUEUE,
  deliveryModel: EQueueDeliveryModel = EQueueDeliveryModel.POINT_TO_POINT,
) {
  const queueInstance = promisifyAll(new Queue());
  const r = await queueInstance.saveAsync(queue, queueType, deliveryModel);
  await queueInstance.shutdownAsync();
  return r;
}

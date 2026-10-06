/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { EMessagePriority, IQueueParams, RedisSMQ } from 'redis-smq';

export async function publishMessage(
  queue: string | IQueueParams,
  priorityQueue = false,
) {
  const producer = await RedisSMQ.startProducer();

  const message = RedisSMQ.newProducibleMessage();
  message.setBody({ hello: 'world' }).setQueue(queue);
  if (priorityQueue) message.setPriority(EMessagePriority.HIGHEST);
  const ids = await producer.produce(message);

  await producer.shutdown();
  return ids;
}

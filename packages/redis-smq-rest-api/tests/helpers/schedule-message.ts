/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IQueueParams, RedisSMQ } from 'redis-smq';

export async function scheduleMessage(queue: string | IQueueParams) {
  const producer = await RedisSMQ.startProducer();

  const message = RedisSMQ.newProducibleMessage();
  message.setBody({ hello: 'world' }).setQueue(queue).setScheduledDelay(15000);
  const ids = await producer.produce(message);

  await producer.shutdown();
  return ids;
}

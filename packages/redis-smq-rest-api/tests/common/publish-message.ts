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
  EMessagePriority,
  IQueueParams,
  Producer,
  ProducibleMessage,
} from 'redis-smq';

const { promisifyAll } = bluebird;

export async function publishMessage(
  queue: string | IQueueParams,
  priorityQueue = false,
) {
  const producer = promisifyAll(new Producer());
  await producer.runAsync();

  const message = new ProducibleMessage();
  message.setBody({ hello: 'world' }).setQueue(queue);
  if (priorityQueue) message.setPriority(EMessagePriority.HIGHEST);
  const ids = await producer.produceAsync(message);

  await producer.shutdownAsync();
  return ids;
}

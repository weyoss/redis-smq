/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import {
  Consumer,
  EventBus,
  IQueueParams,
  Producer,
  ProducibleMessage,
} from 'redis-smq';
import { ICallback } from 'redis-smq-common';

const { promisifyAll, delay } = bluebird;

export async function publishAndAcknowledgeMessage(
  queue: string | IQueueParams,
) {
  const producer = promisifyAll(new Producer());
  await producer.runAsync();

  const consumer = promisifyAll(new Consumer());
  await consumer.runAsync();

  const message = new ProducibleMessage();
  message.setBody({ hello: 'world' }).setQueue(queue);
  const ids = await producer.produceAsync(message);

  const acknowledgedMessages: string[] = [];
  const eventBusInstance = EventBus.getInstance();
  eventBusInstance.on(
    'consumer.consumeMessage.messageAcknowledged',
    (messageId) => {
      acknowledgedMessages.push(messageId);
    },
  );

  await consumer.consumeAsync(queue, (msg, cb: ICallback<void>) => {
    cb();
  });

  while (
    JSON.stringify(ids.sort()) !== JSON.stringify(acknowledgedMessages.sort())
  ) {
    await delay(1000);
  }

  await producer.shutdownAsync();
  await consumer.shutdownAsync();
  return ids;
}

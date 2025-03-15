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
  Consumer,
  EventBus,
  IQueueParams,
  Producer,
  ProducibleMessage,
} from 'redis-smq';
import { ICallback } from 'redis-smq-common';

const { delay, promisifyAll } = bluebird;

export async function publishAndDeadLetterMessage(
  queue: string | IQueueParams,
) {
  const producer = promisifyAll(new Producer());
  await producer.runAsync();

  const consumer = promisifyAll(new Consumer());
  await consumer.runAsync();

  const message = new ProducibleMessage();
  message.setBody({ hello: 'world' }).setQueue(queue).setRetryThreshold(0);
  const ids = await producer.produceAsync(message);

  const deadLetteredMessages: string[] = [];
  const eventBus = promisifyAll(new EventBus());
  const eventBusInstance = await eventBus.getSetInstanceAsync();
  eventBusInstance.on(
    'consumer.consumeMessage.messageDeadLettered',
    (messageId) => {
      deadLetteredMessages.push(messageId);
    },
  );

  await consumer.consumeAsync(queue, (msg, cb: ICallback<void>) => {
    cb(new Error());
  });

  while (
    JSON.stringify(ids.sort()) !== JSON.stringify(deadLetteredMessages.sort())
  ) {
    await delay(1000);
  }

  await producer.shutdownAsync();
  await consumer.shutdownAsync();
  await eventBus.shutdownAsync();
  return ids;
}

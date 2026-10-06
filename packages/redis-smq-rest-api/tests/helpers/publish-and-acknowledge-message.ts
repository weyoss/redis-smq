/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { IQueueParams, RedisSMQ } from 'redis-smq';
import { ICallback } from 'redis-smq-common';

const { delay } = bluebird;

export async function publishAndAcknowledgeMessage(
  queue: string | IQueueParams,
) {
  const producer = await RedisSMQ.startProducer();

  const consumer = await RedisSMQ.startConsumer();

  const message = RedisSMQ.newProducibleMessage();
  message.setBody({ hello: 'world' }).setQueue(queue);
  const ids = await producer.produce(message);

  const acknowledgedMessages: string[] = [];
  const eventBusInstance = RedisSMQ.getEventBus();
  eventBusInstance.on('consumer.messageAcknowledged', (messageId) => {
    acknowledgedMessages.push(messageId);
  });

  await consumer.consume(queue, (msg, cb: ICallback<void>) => {
    cb();
  });

  while (
    JSON.stringify(ids.sort()) !== JSON.stringify(acknowledgedMessages.sort())
  ) {
    await delay(1000);
  }

  await producer.shutdown();
  await consumer.shutdown();
  return ids;
}

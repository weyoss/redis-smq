/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { delay, promisifyAll } from 'bluebird';
import { Consumer } from '../../../src/lib/consumer/consumer';
import { ProducibleMessage } from '../../../src/lib/message/producible-message';
import { getProducer } from '../../common/producer';
import {
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming';
import { shutDownBaseInstance } from '../../common/base-instance';
import { getQueueRateLimit } from '../../common/queue-rate-limit';
import { IConsumableMessage } from '../../../types';

test('Consume message from different queues using a single consumer instance: case 5', async () => {
  await createQueue(defaultQueue, false);

  const queueRateLimit = await getQueueRateLimit();
  await queueRateLimit.setAsync(defaultQueue, {
    limit: 3,
    interval: 5000,
  });

  const messages: IConsumableMessage[] = [];
  const consumer = promisifyAll(new Consumer(true));

  await consumer.consumeAsync(defaultQueue, (msg, cb) => {
    messages.push(msg);
    cb();
  });

  await consumer.runAsync();

  const producer = getProducer();
  await producer.runAsync();

  for (let i = 0; i < 5; i += 1) {
    await producer.produceAsync(
      new ProducibleMessage().setQueue(defaultQueue).setBody(`body ${i + 1}`),
    );
  }

  await delay(10000);
  expect(messages.length).toBe(5);
  expect(messages.map((i) => i.getBody()).sort()).toEqual([
    'body 1',
    'body 2',
    'body 3',
    'body 4',
    'body 5',
  ]);

  await shutDownBaseInstance(consumer);
});

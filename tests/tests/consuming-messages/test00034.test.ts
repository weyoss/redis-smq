/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from '@jest/globals';
import bluebird from 'bluebird';
import { ICallback } from 'redis-smq-common';
import {
  Consumer,
  IMessageParams,
  IMessageTransferable,
  ProducibleMessage,
} from '../../../src/lib/index.js';
import { shutDownBaseInstance } from '../../common/base-instance.js';
import {
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming.js';
import { getProducer } from '../../common/producer.js';
import { getQueueRateLimit } from '../../common/queue-rate-limit.js';

test('Consume message from different queues using a single consumer instance: case 5', async () => {
  await createQueue(defaultQueue, false);

  const queueRateLimit = await getQueueRateLimit();
  await queueRateLimit.setAsync(defaultQueue, {
    limit: 3,
    interval: 5000,
  });

  const messages: IMessageParams[] = [];
  const consumer = bluebird.promisifyAll(new Consumer(true));

  await consumer.consumeAsync(
    defaultQueue,
    (msg: IMessageTransferable, cb: ICallback<void>) => {
      messages.push(msg);
      cb();
    },
  );

  await consumer.runAsync();

  const producer = getProducer();
  await producer.runAsync();

  for (let i = 0; i < 5; i += 1) {
    await producer.produceAsync(
      new ProducibleMessage().setQueue(defaultQueue).setBody(`body ${i + 1}`),
    );
  }

  await bluebird.delay(15000);
  expect(messages.length).toBe(5);
  expect(messages.map((i) => i.body).sort()).toEqual([
    'body 1',
    'body 2',
    'body 3',
    'body 4',
    'body 5',
  ]);

  await shutDownBaseInstance(consumer);
});

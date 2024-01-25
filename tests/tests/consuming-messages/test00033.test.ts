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
import { createQueue } from '../../common/message-producing-consuming';
import { shutDownBaseInstance } from '../../common/base-instance';
import { IConsumableMessage } from '../../../types';

test('Consume message from different queues using a single consumer instance: case 4', async () => {
  await createQueue('test1', false);
  await createQueue('test2', false);
  await createQueue('test3', false);
  await createQueue('test4', false);
  await createQueue('test5', false);
  await createQueue('test6', false);

  const messages: IConsumableMessage[] = [];
  const consumer = promisifyAll(new Consumer(true));

  await consumer.consumeAsync('test1', (msg, cb) => {
    messages.push(msg);
    cb();
  });
  await consumer.consumeAsync('test2', (msg, cb) => {
    messages.push(msg);
    cb();
  });
  await consumer.consumeAsync('test3', (msg, cb) => {
    messages.push(msg);
    cb();
  });

  await consumer.runAsync();

  await consumer.consumeAsync('test4', (msg, cb) => {
    messages.push(msg);
    cb();
  });
  await consumer.consumeAsync('test5', (msg, cb) => {
    messages.push(msg);
    cb();
  });

  const queues = consumer.getQueues();
  expect(queues.map((i) => i.queueParams.name)).toEqual([
    'test1',
    'test2',
    'test3',
    'test4',
    'test5',
  ]);

  const producer = getProducer();
  await producer.runAsync();

  for (let i = 0; i < 5; i += 1) {
    await producer.produceAsync(
      new ProducibleMessage().setQueue(`test${i + 1}`).setBody(`body ${i + 1}`),
    );
  }

  await delay(10000);
  expect(messages.length).toBe(5);
  expect(messages.map((i) => i.getDestinationQueue().name).sort()).toEqual([
    'test1',
    'test2',
    'test3',
    'test4',
    'test5',
  ]);
  expect(messages.map((i) => i.getBody()).sort()).toEqual([
    'body 1',
    'body 2',
    'body 3',
    'body 4',
    'body 5',
  ]);

  await consumer.cancelAsync('test4');
  expect(consumer.getQueues().map((i) => i.queueParams.name)).toEqual([
    'test1',
    'test2',
    'test3',
    'test5',
  ]);

  await consumer.consumeAsync('test6', (msg, cb) => {
    messages.push(msg);
    cb();
  });
  await producer.produceAsync(
    new ProducibleMessage().setQueue(`test6`).setBody(`body 6`),
  );
  await delay(10000);
  expect(messages.map((i) => i.getDestinationQueue().name).sort()).toEqual([
    'test1',
    'test2',
    'test3',
    'test4',
    'test5',
    'test6',
  ]);
  expect(consumer.getQueues().map((i) => i.queueParams.name)).toEqual([
    'test1',
    'test2',
    'test3',
    'test5',
    'test6',
  ]);

  await shutDownBaseInstance(consumer);
});

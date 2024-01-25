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
import { shutDownBaseInstance } from '../../common/base-instance';
import {
  EQueueDeliveryModel,
  EQueueType,
  IConsumableMessage,
} from '../../../types';
import { getQueue } from '../../common/queue';

test('Consume message from different queues using a single consumer instance: case 6', async () => {
  const messages: IConsumableMessage[] = [];
  const consumer = promisifyAll(new Consumer(true));
  await consumer.runAsync();

  // running without message handlers
  await delay(5000);

  const queue = await getQueue();
  await queue.saveAsync(
    'test0',
    EQueueType.LIFO_QUEUE,
    EQueueDeliveryModel.POINT_TO_POINT,
  );
  await consumer.consumeAsync('test0', () => void 0);

  consumer.once('messageReceived', () => {
    setTimeout(() => {
      // cancelling a queue when a message handler is active
      consumer.cancelAsync('test0').catch((e: unknown) => {
        console.log(e);
      });
    }, 1000);
  });

  const producer = getProducer();
  await producer.runAsync();

  await producer.produceAsync(
    new ProducibleMessage().setQueue('test0').setBody('body'),
  );

  await delay(10000);
  expect(consumer.getQueues()).toEqual([]);

  await queue.saveAsync(
    'test1',
    EQueueType.PRIORITY_QUEUE,
    EQueueDeliveryModel.POINT_TO_POINT,
  );
  await consumer.consumeAsync('test1', (msg, cb) => {
    messages.push(msg);
    cb();
  });

  await queue.saveAsync(
    'test2',
    EQueueType.PRIORITY_QUEUE,
    EQueueDeliveryModel.POINT_TO_POINT,
  );
  await consumer.consumeAsync('test2', (msg, cb) => {
    messages.push(msg);
    cb();
  });

  await queue.saveAsync(
    'test3',
    EQueueType.PRIORITY_QUEUE,
    EQueueDeliveryModel.POINT_TO_POINT,
  );
  await consumer.consumeAsync('test3', (msg, cb) => {
    messages.push(msg);
    cb();
  });

  await queue.saveAsync(
    'test4',
    EQueueType.PRIORITY_QUEUE,
    EQueueDeliveryModel.POINT_TO_POINT,
  );
  await consumer.consumeAsync('test4', (msg, cb) => {
    messages.push(msg);
    cb();
  });

  await queue.saveAsync(
    'test5',
    EQueueType.PRIORITY_QUEUE,
    EQueueDeliveryModel.POINT_TO_POINT,
  );
  await consumer.consumeAsync('test5', (msg, cb) => {
    messages.push(msg);
    cb();
  });

  for (let i = 0; i < 5; i += 1) {
    await producer.produceAsync(
      new ProducibleMessage()
        .setQueue(`test${i + 1}`)
        .setBody(`body ${i + 1}`)
        .setPriority(i),
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

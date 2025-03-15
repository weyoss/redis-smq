/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from 'vitest';
import bluebird from 'bluebird';
import path from 'path';
import { getDirname } from 'redis-smq-common';
import { Consumer, ProducibleMessage } from '../../../src/lib/index.js';
import { shutDownBaseInstance } from '../../common/base-instance.js';
import { getEventBus } from '../../common/event-bus-redis.js';
import { createQueue } from '../../common/message-producing-consuming.js';
import { getProducer } from '../../common/producer.js';

test('ConsumeMessageWorker: case 3', async () => {
  const eventBus = await getEventBus();

  await createQueue('test1', false);
  await createQueue('test2', false);
  await createQueue('test3', false);
  await createQueue('test4', false);
  await createQueue('test5', false);
  await createQueue('test6', false);
  await createQueue('test7', false);

  const messages: string[] = [];
  const consumer = bluebird.promisifyAll(new Consumer(true));

  await consumer.consumeAsync('test1', (msg, cb) => {
    messages.push(msg.destinationQueue.name);
    cb();
  });
  await consumer.consumeAsync('test2', (msg, cb) => {
    messages.push(msg.destinationQueue.name);
    cb();
  });
  const handlerFilename1 = path.resolve(
    getDirname(),
    '../../common/message-handler-worker-acks.js',
  );
  await consumer.consumeAsync('test3', handlerFilename1);

  await consumer.runAsync();

  await consumer.consumeAsync('test4', (msg, cb) => {
    messages.push(msg.destinationQueue.name);
    cb();
  });
  await consumer.consumeAsync('test5', (msg, cb) => {
    messages.push(msg.destinationQueue.name);
    cb();
  });

  const handlerFilename2 = path.resolve(
    getDirname(),
    '../../common/message-handler-worker-acks.js',
  );
  await consumer.consumeAsync('test6', handlerFilename2);

  const queues = consumer.getQueues();
  expect(queues.map((i) => i.queueParams.name)).toEqual([
    'test1',
    'test2',
    'test3',
    'test4',
    'test5',
    'test6',
  ]);

  eventBus.on('consumer.consumeMessage.messageAcknowledged', (...args) => {
    if (['test3', 'test6'].includes(args[1].queueParams.name)) {
      messages.push(args[1].queueParams.name);
    }
  });

  const producer = getProducer();
  await producer.runAsync();

  for (let i = 0; i < 6; i += 1) {
    await producer.produceAsync(
      new ProducibleMessage().setQueue(`test${i + 1}`).setBody(`body ${i + 1}`),
    );
  }

  await bluebird.delay(10000);
  expect(messages.length).toBe(6);
  expect(messages.sort()).toEqual([
    'test1',
    'test2',
    'test3',
    'test4',
    'test5',
    'test6',
  ]);

  await consumer.cancelAsync('test4');
  expect(consumer.getQueues().map((i) => i.queueParams.name)).toEqual([
    'test1',
    'test2',
    'test3',
    'test5',
    'test6',
  ]);

  await consumer.consumeAsync('test7', (msg, cb) => {
    messages.push(msg.destinationQueue.name);
    cb();
  });
  await producer.produceAsync(
    new ProducibleMessage().setQueue(`test7`).setBody(`body 7`),
  );
  await bluebird.delay(10000);
  expect(messages.sort()).toEqual([
    'test1',
    'test2',
    'test3',
    'test4',
    'test5',
    'test6',
    'test7',
  ]);
  expect(consumer.getQueues().map((i) => i.queueParams.name)).toEqual([
    'test1',
    'test2',
    'test3',
    'test5',
    'test6',
    'test7',
  ]);

  await consumer.cancelAsync('test6');
  expect(consumer.getQueues().map((i) => i.queueParams.name)).toEqual([
    'test1',
    'test2',
    'test3',
    'test5',
    'test7',
  ]);

  await shutDownBaseInstance(consumer);
});

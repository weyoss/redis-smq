/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from 'vitest';
import bluebird from 'bluebird';
import { ICallback } from 'redis-smq-common';
import {
  Consumer,
  IMessageParams,
  IMessageTransferable,
  ProducibleMessage,
} from '../../../src/index.js';
import { shutDownBaseInstance } from '../../common/base-instance.js';
import { createQueue } from '../../common/message-producing-consuming.js';
import { getProducer } from '../../common/producer.js';

test('Consume message from different queues using a single consumer instance: case 4', async () => {
  await createQueue('test1', false);
  await createQueue('test2', false);
  await createQueue('test3', false);
  await createQueue('test4', false);
  await createQueue('test5', false);
  await createQueue('test6', false);

  const messages: IMessageParams[] = [];
  const consumer = bluebird.promisifyAll(new Consumer(true));

  await consumer.consumeAsync(
    'test1',
    (msg: IMessageTransferable, cb: ICallback<void>) => {
      messages.push(msg);
      cb();
    },
  );
  await consumer.consumeAsync(
    'test2',
    (msg: IMessageTransferable, cb: ICallback<void>) => {
      messages.push(msg);
      cb();
    },
  );
  await consumer.consumeAsync(
    'test3',
    (msg: IMessageTransferable, cb: ICallback<void>) => {
      messages.push(msg);
      cb();
    },
  );

  await consumer.runAsync();

  await consumer.consumeAsync(
    'test4',
    (msg: IMessageTransferable, cb: ICallback<void>) => {
      messages.push(msg);
      cb();
    },
  );
  await consumer.consumeAsync(
    'test5',
    (msg: IMessageTransferable, cb: ICallback<void>) => {
      messages.push(msg);
      cb();
    },
  );

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

  await bluebird.delay(10000);
  expect(messages.length).toBe(5);
  expect(messages.map((i) => i.destinationQueue.name).sort()).toEqual([
    'test1',
    'test2',
    'test3',
    'test4',
    'test5',
  ]);
  expect(messages.map((i) => i.body).sort()).toEqual([
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

  await consumer.consumeAsync(
    'test6',
    (msg: IMessageTransferable, cb: ICallback<void>) => {
      messages.push(msg);
      cb();
    },
  );
  await producer.produceAsync(
    new ProducibleMessage().setQueue(`test6`).setBody(`body 6`),
  );
  await bluebird.delay(10000);
  expect(messages.map((i) => i.destinationQueue.name).sort()).toEqual([
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

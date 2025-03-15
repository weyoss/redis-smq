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
import { ICallback } from 'redis-smq-common';
import {
  Consumer,
  ConsumerConsumeMessageHandlerAlreadyExistsError,
  EQueueDeliveryModel,
  EQueueType,
  IMessageTransferable,
} from '../../../src/lib/index.js';
import { shutDownBaseInstance } from '../../common/base-instance.js';
import { getQueue } from '../../common/queue.js';

test('Consume message from different queues using a single consumer instance: case 1', async () => {
  const queueInstance = await getQueue();
  const consumer = bluebird.promisifyAll(new Consumer());

  expect(consumer.getQueues()).toEqual([]);

  await queueInstance.saveAsync(
    'test_queue',
    EQueueType.LIFO_QUEUE,
    EQueueDeliveryModel.POINT_TO_POINT,
  );
  await consumer.consumeAsync(
    'test_queue',
    (msg: IMessageTransferable, cb: ICallback<void>) => cb(),
  );

  await queueInstance.saveAsync(
    'another_queue',
    EQueueType.LIFO_QUEUE,
    EQueueDeliveryModel.POINT_TO_POINT,
  );
  await consumer.consumeAsync(
    'another_queue',
    (msg: IMessageTransferable, cb: ICallback<void>) => cb(),
  );

  expect(
    consumer.consumeAsync(
      'another_queue',
      (msg: IMessageTransferable, cb: ICallback<void>) => cb(),
    ),
  ).rejects.toThrow(ConsumerConsumeMessageHandlerAlreadyExistsError);

  expect(consumer.getQueues()).toEqual([
    { queueParams: { name: 'test_queue', ns: 'testing' }, groupId: null },
    { queueParams: { name: 'another_queue', ns: 'testing' }, groupId: null },
  ]);

  await consumer.cancelAsync('another_queue');

  expect(consumer.getQueues()).toEqual([
    { queueParams: { name: 'test_queue', ns: 'testing' }, groupId: null },
  ]);

  await consumer.consumeAsync(
    'another_queue',
    (msg: IMessageTransferable, cb: ICallback<void>) => cb(),
  );

  expect(consumer.getQueues()).toEqual([
    { queueParams: { name: 'test_queue', ns: 'testing' }, groupId: null },
    { queueParams: { name: 'another_queue', ns: 'testing' }, groupId: null },
  ]);

  const res = await consumer.runAsync();
  expect(res).toBe(true);

  expect(
    consumer.consumeAsync(
      'another_queue',
      (msg: IMessageTransferable, cb: ICallback<void>) => cb(),
    ),
  ).rejects.toThrow(ConsumerConsumeMessageHandlerAlreadyExistsError);

  await consumer.cancelAsync('another_queue');

  // does not throw an error
  await consumer.cancelAsync('another_queue');

  expect(consumer.getQueues()).toEqual([
    { queueParams: { name: 'test_queue', ns: 'testing' }, groupId: null },
  ]);

  await consumer.consumeAsync(
    'another_queue',
    (msg: IMessageTransferable, cb: ICallback<void>) => cb(),
  );

  expect(consumer.getQueues()).toEqual([
    { queueParams: { name: 'test_queue', ns: 'testing' }, groupId: null },
    { queueParams: { name: 'another_queue', ns: 'testing' }, groupId: null },
  ]);

  await queueInstance.saveAsync(
    'queue_a',
    EQueueType.PRIORITY_QUEUE,
    EQueueDeliveryModel.POINT_TO_POINT,
  );
  await consumer.consumeAsync(
    'queue_a',
    (msg: IMessageTransferable, cb: ICallback<void>) => cb(),
  );

  expect(
    consumer.consumeAsync(
      'queue_a',
      (msg: IMessageTransferable, cb: ICallback<void>) => cb(),
    ),
  ).rejects.toThrow(ConsumerConsumeMessageHandlerAlreadyExistsError);

  expect(consumer.getQueues()).toEqual([
    { queueParams: { name: 'test_queue', ns: 'testing' }, groupId: null },
    { queueParams: { name: 'another_queue', ns: 'testing' }, groupId: null },
    { queueParams: { name: 'queue_a', ns: 'testing' }, groupId: null },
  ]);

  await shutDownBaseInstance(consumer);
});

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
  EQueueDeliveryModel,
  EQueueType,
  IMessageParams,
  IMessageTransferable,
  ProducibleMessage,
} from '../../../src/index.js';
import { shutDownBaseInstance } from '../../common/base-instance.js';
import { getEventBus } from '../../common/event-bus-redis.js';
import { getProducer } from '../../common/producer.js';
import { getQueueManager } from '../../common/queue-manager.js';

test('Consume message from different queues using a single consumer instance: case 6', async () => {
  const eventBus = await getEventBus();

  const messages: IMessageParams[] = [];
  const consumer = bluebird.promisifyAll(
    new Consumer({ enableMultiplexing: true }),
  );
  await consumer.run();

  // running without message handlers
  await bluebird.delay(5000);

  const queue = await getQueueManager();
  await queue.save(
    'test0',
    EQueueType.LIFO_QUEUE,
    EQueueDeliveryModel.POINT_TO_POINT,
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  await consumer.consume('test0', (msg, cb) => void 0);

  eventBus.once('consumer.dequeueMessage.messageReceived', () => {
    setTimeout(() => {
      // cancelling a queue when a message handler is active
      consumer.cancel('test0').catch((e: unknown) => {
        console.log(e);
      });
    }, 1000);
  });

  const producer = getProducer();
  await producer.run();

  await producer.produce(
    new ProducibleMessage().setQueue('test0').setBody('body'),
  );

  await bluebird.delay(10000);
  expect(consumer.getQueues()).toEqual([]);

  await queue.save(
    'test1',
    EQueueType.PRIORITY_QUEUE,
    EQueueDeliveryModel.POINT_TO_POINT,
  );
  await consumer.consume(
    'test1',
    (msg: IMessageTransferable, cb: ICallback<void>) => {
      messages.push(msg);
      cb();
    },
  );

  await queue.save(
    'test2',
    EQueueType.PRIORITY_QUEUE,
    EQueueDeliveryModel.POINT_TO_POINT,
  );
  await consumer.consume(
    'test2',
    (msg: IMessageTransferable, cb: ICallback<void>) => {
      messages.push(msg);
      cb();
    },
  );

  await queue.save(
    'test3',
    EQueueType.PRIORITY_QUEUE,
    EQueueDeliveryModel.POINT_TO_POINT,
  );
  await consumer.consume(
    'test3',
    (msg: IMessageTransferable, cb: ICallback<void>) => {
      messages.push(msg);
      cb();
    },
  );

  await queue.save(
    'test4',
    EQueueType.PRIORITY_QUEUE,
    EQueueDeliveryModel.POINT_TO_POINT,
  );
  await consumer.consume(
    'test4',
    (msg: IMessageTransferable, cb: ICallback<void>) => {
      messages.push(msg);
      cb();
    },
  );

  await queue.save(
    'test5',
    EQueueType.PRIORITY_QUEUE,
    EQueueDeliveryModel.POINT_TO_POINT,
  );
  await consumer.consume(
    'test5',
    (msg: IMessageTransferable, cb: ICallback<void>) => {
      messages.push(msg);
      cb();
    },
  );

  for (let i = 0; i < 5; i += 1) {
    await producer.produce(
      new ProducibleMessage()
        .setQueue(`test${i + 1}`)
        .setBody(`body ${i + 1}`)
        .setPriority(i),
    );
  }

  await bluebird.delay(10000);
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

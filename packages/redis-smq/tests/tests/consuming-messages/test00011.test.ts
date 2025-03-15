/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, vitest, test } from 'vitest';
import bluebird from 'bluebird';
import { ICallback } from 'redis-smq-common';
import {
  IMessageTransferable,
  ProducibleMessage,
} from '../../../src/lib/index.js';
import { getConsumer } from '../../common/consumer.js';
import { getEventBus } from '../../common/event-bus-redis.js';
import {
  createQueue,
  getDefaultQueue,
} from '../../common/message-producing-consuming.js';
import { getProducer } from '../../common/producer.js';

test('Given many consumers, a message is delivered only to one consumer', async () => {
  const eventBus = await getEventBus();
  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, false);

  const consumer1 = getConsumer({
    messageHandler: vitest.fn(
      (msg: IMessageTransferable, cb: ICallback<void>) => {
        cb();
      },
    ),
  });
  let unacks1 = 0;
  let acks1 = 0;
  eventBus
    .on('consumer.consumeMessage.messageUnacknowledged', (...args) => {
      if (args[3] === consumer1.getId()) unacks1 += 1;
    })
    .on('consumer.consumeMessage.messageAcknowledged', (...args) => {
      if (args[3] === consumer1.getId()) acks1 += 1;
    });

  /**
   *
   */
  const consumer2 = getConsumer({
    messageHandler: vitest.fn(
      (msg: IMessageTransferable, cb: ICallback<void>) => {
        cb();
      },
    ),
  });
  let unacks2 = 0;
  let acks2 = 0;
  eventBus
    .on('consumer.consumeMessage.messageUnacknowledged', (...args) => {
      if (args[3] === consumer2.getId()) unacks2 += 1;
    })
    .on('consumer.consumeMessage.messageAcknowledged', (...args) => {
      if (args[3] === consumer2.getId()) acks2 += 1;
    });

  await consumer1.runAsync();
  await consumer2.runAsync();

  /**
   *
   */
  const msg = new ProducibleMessage();
  msg.setBody({ hello: 'world' }).setQueue(getDefaultQueue());

  const producer = getProducer();
  await producer.runAsync();

  await producer.produceAsync(msg);

  /**
   *
   */
  await bluebird.delay(20000);

  /**
   *
   */
  expect(unacks1).toBe(0);
  expect(unacks2).toBe(0);
  expect(acks1 + acks2).toBe(1);
});

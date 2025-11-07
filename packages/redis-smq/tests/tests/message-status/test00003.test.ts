/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from 'vitest';
import { EMessagePropertyStatus, ProducibleMessage } from '../../../index.js';
import { EQueueType } from '../../../src/index.js';
import { getConsumer } from '../../common/consumer.js';
import {
  untilMessageAcknowledged,
  untilMessageUnacknowledged,
} from '../../common/events.js';
import {
  createQueue,
  getDefaultQueue,
} from '../../common/message-producing-consuming.js';
import { getMessageManager } from '../../common/message-manager.js';
import { getProducer } from '../../common/producer.js';

test('Message status: UNPUBLISHED -> PENDING -> PROCESSING -> UNACK_REQUEUING -> UNACK_DELAYING -> ACKNOWLEDGED', async () => {
  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, EQueueType.FIFO_QUEUE);

  const producer = getProducer();
  await producer.runAsync();
  const msg = new ProducibleMessage();

  msg
    .setBody({ hello: 'world' })
    .setQueue(getDefaultQueue())
    .setRetryThreshold(2)
    .setRetryDelay(10000);
  const [id] = await producer.produceAsync(msg);

  const message = await getMessageManager();
  const msg0 = await message.getMessageStatusAsync(id);
  expect(msg0).toBe(EMessagePropertyStatus.PENDING);

  const consumer = getConsumer(false);
  const msg1: EMessagePropertyStatus[] = [];
  await consumer.consumeAsync(defaultQueue, (msg, cb) => {
    if (!msg1.length) {
      msg1.push(msg.status);
      cb(new Error());
    } else cb();
  });

  consumer.run(() => void 0);

  await untilMessageUnacknowledged(consumer);
  expect(msg1[0]).toBe(EMessagePropertyStatus.PROCESSING);
  const status = await message.getMessageStatusAsync(id);
  expect(status).toBe(EMessagePropertyStatus.UNACK_REQUEUING);

  await new Promise((resolve) => setTimeout(resolve, 3000));

  const status1 = await message.getMessageStatusAsync(id);
  expect(status1).toBe(EMessagePropertyStatus.UNACK_DELAYING);

  await untilMessageAcknowledged(consumer);
  const msg3 = await message.getMessageStatusAsync(id);
  expect(msg3).toBe(EMessagePropertyStatus.ACKNOWLEDGED);
});

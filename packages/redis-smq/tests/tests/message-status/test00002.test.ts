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
import { untilMessageDeadLettered } from '../../common/events.js';
import {
  createQueue,
  getDefaultQueue,
} from '../../common/message-producing-consuming.js';
import { getMessageManager } from '../../common/message-manager.js';
import { getProducer } from '../../common/producer.js';

test('Message status: UNPUBLISHED -> PENDING -> PROCESSING -> DEAD_LETTERED', async () => {
  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, EQueueType.FIFO_QUEUE);

  const producer = getProducer();
  await producer.runAsync();
  const msg = new ProducibleMessage();

  msg
    .setBody({ hello: 'world' })
    .setQueue(getDefaultQueue())
    .setRetryThreshold(0);
  const [id] = await producer.produceAsync(msg);

  const message = await getMessageManager();
  const msg0 = await message.getMessageStatusAsync(id);
  expect(msg0).toBe(EMessagePropertyStatus.PENDING);

  const consumer = getConsumer(false);
  const msg1: EMessagePropertyStatus[] = [];
  await consumer.consumeAsync(defaultQueue, (msg, cb) => {
    msg1.push(msg.status);
    cb(new Error());
  });

  consumer.run(() => void 0);
  await untilMessageDeadLettered(consumer);
  expect(msg1[0]).toBe(EMessagePropertyStatus.PROCESSING);

  const msg2 = await message.getMessageStatusAsync(id);
  expect(msg2).toBe(EMessagePropertyStatus.DEAD_LETTERED);
});

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
import { EQueueType } from '../../../src/lib/index.js';
import { getConsumer } from '../../common/consumer.js';
import { untilMessageAcknowledged } from '../../common/events.js';
import {
  createQueue,
  getDefaultQueue,
} from '../../common/message-producing-consuming.js';
import { getMessage } from '../../common/message.js';
import { getProducer } from '../../common/producer.js';

test('Message status: UNPUBLISHED -> PENDING -> PROCESSING -> ACKNOWLEDGED', async () => {
  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, EQueueType.FIFO_QUEUE);

  const producer = getProducer();
  await producer.runAsync();
  const msg = new ProducibleMessage();

  msg.setBody({ hello: 'world' }).setQueue(getDefaultQueue());
  const [id] = await producer.produceAsync(msg);

  const message = await getMessage();
  const status0 = await message.getMessageStatusAsync(id);
  expect(status0).toBe(EMessagePropertyStatus.PENDING);

  const consumer = getConsumer({ consumeDefaultQueue: false });
  const statuses: EMessagePropertyStatus[] = [];
  await consumer.consumeAsync(defaultQueue, (msg, cb) => {
    statuses.push(msg.status);
    message.getMessageStatus(msg.id, (err, status) => {
      if (err) cb(err);
      else {
        statuses.push(Number(status));
        cb();
      }
    });
  });

  consumer.run(() => void 0);
  await untilMessageAcknowledged(consumer);

  expect(statuses[0]).toBe(EMessagePropertyStatus.PROCESSING);
  expect(statuses[1]).toBe(EMessagePropertyStatus.PROCESSING);

  const status1 = await message.getMessageStatusAsync(id);
  expect(status1).toBe(EMessagePropertyStatus.ACKNOWLEDGED);
});

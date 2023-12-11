/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { EMessagePropertyStatus, MessageEnvelope } from '../../../index';
import { getProducer } from '../../common/producer';
import {
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming';
import { EQueueType } from '../../../types';
import { getConsumer } from '../../common/consumer';
import { untilMessageAcknowledged } from '../../common/events';
import { promisifyAll } from 'bluebird';
import { Message } from '../../../src/lib/message/message';

test('MessageEnvelope status: UNPUBLISHED -> PENDING -> PROCESSING -> ACKNOWLEDGED', async () => {
  await createQueue(defaultQueue, EQueueType.FIFO_QUEUE);

  const producer = getProducer();
  await producer.runAsync();
  const msg = new MessageEnvelope();
  expect(msg.getStatus()).toBe(EMessagePropertyStatus.UNPUBLISHED);

  msg.setBody({ hello: 'world' }).setQueue(defaultQueue);
  const { messages } = await producer.produceAsync(msg);

  const message = promisifyAll(new Message());
  const status0 = await message.getMessageStatusAsync(messages[0]);
  expect(status0).toBe(EMessagePropertyStatus.PENDING);

  const consumer = getConsumer({ consumeDefaultQueue: false });
  const statuses: EMessagePropertyStatus[] = [];
  await consumer.consumeAsync(defaultQueue, (msg, cb) => {
    statuses.push(msg.getStatus());
    message.getMessageStatus(msg.getRequiredId(), (err, status) => {
      if (err) cb(err);
      else {
        statuses.push(Number(status));
        cb();
      }
    });
  });

  consumer.run();
  await untilMessageAcknowledged(consumer);

  expect(statuses[0]).toBe(EMessagePropertyStatus.PROCESSING);
  expect(statuses[1]).toBe(EMessagePropertyStatus.PROCESSING);

  const status1 = await message.getMessageStatusAsync(messages[0]);
  expect(status1).toBe(EMessagePropertyStatus.ACKNOWLEDGED);
});

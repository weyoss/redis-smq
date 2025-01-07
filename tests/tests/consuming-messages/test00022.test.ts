/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, jest, test } from '@jest/globals';
import { ProducibleMessage } from '../../../src/lib/index.js';
import { getConsumer } from '../../common/consumer.js';
import { untilConsumerDown } from '../../common/events.js';
import {
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming.js';
import { getProducer } from '../../common/producer.js';
import { getQueueDeadLetteredMessages } from '../../common/queue-dead-lettered-messages.js';

test('Shutdown a consumer when consuming a message with retryThreshold = 0: expect the message to be dead-lettered', async () => {
  await createQueue(defaultQueue, false);

  const consumer = getConsumer({
    messageHandler: jest.fn(() => {
      setTimeout(() => consumer.shutdown(() => void 0), 5000);
    }),
  });

  const msg = new ProducibleMessage()
    .setRetryThreshold(0)
    .setBody('message body')
    .setQueue(defaultQueue);
  const producer = getProducer();
  await producer.runAsync();
  const [id] = await producer.produceAsync(msg);

  consumer.run(() => void 0);
  await untilConsumerDown(consumer);
  const deadLetteredMessages = await getQueueDeadLetteredMessages();
  const res = await deadLetteredMessages.getMessagesAsync(defaultQueue, 0, 100);
  expect(res.totalItems).toBe(1);
  expect(typeof res.items[0].id).toBe('string');
  expect(res.items[0].id).toBe(id);
});

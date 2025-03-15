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
import { ProducibleMessage } from '../../../src/lib/index.js';
import { getConsumer } from '../../common/consumer.js';
import { getEventBus } from '../../common/event-bus-redis.js';
import {
  createQueue,
  getDefaultQueue,
} from '../../common/message-producing-consuming.js';
import { getProducer } from '../../common/producer.js';
import { getQueueDeadLetteredMessages } from '../../common/queue-dead-lettered-messages.js';

test('A message is dead-lettered when messageRetryThreshold is exceeded', async () => {
  const eventBus = await getEventBus();
  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, false);
  const producer = getProducer();
  await producer.runAsync();

  const consumer = getConsumer({
    messageHandler: vitest.fn(() => {
      throw new Error('Explicit error');
    }),
  });

  let unacknowledged = 0;
  eventBus.on('consumer.consumeMessage.messageUnacknowledged', () => {
    unacknowledged += 1;
  });

  const msg = new ProducibleMessage();
  msg.setBody({ hello: 'world' }).setQueue(getDefaultQueue());

  const [id] = await producer.produceAsync(msg);
  consumer.run(() => void 0);

  await bluebird.delay(30000);
  expect(unacknowledged).toBe(3);
  const deadLetteredMessages = await getQueueDeadLetteredMessages();
  const list = await deadLetteredMessages.getMessagesAsync(
    defaultQueue,
    0,
    100,
  );
  expect(list.totalItems).toBe(1);
  expect(list.items[0].id).toBe(id);
});

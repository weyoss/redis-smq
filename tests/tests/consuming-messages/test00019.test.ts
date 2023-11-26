/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { Message } from '../../../index';
import { untilConsumerEvent } from '../../common/events';
import { getConsumer } from '../../common/consumer';
import { getProducer } from '../../common/producer';
import {
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming';
import { getQueueDeadLetteredMessages } from '../../common/queue-dead-lettered-messages';

test('An unacknowledged message is dead-lettered and not delivered again, given retryThreshold is 0', async () => {
  await createQueue(defaultQueue, false);

  const producer = getProducer();
  await producer.runAsync();

  const consumer = getConsumer({
    messageHandler: () => {
      throw new Error();
    },
  });

  const msg = new Message();
  msg.setBody({ hello: 'world' }).setQueue(defaultQueue).setRetryThreshold(0);

  expect(msg.getMessageState()).toBe(null);
  expect(msg.getId()).toBe(null);
  await producer.produceAsync(msg);

  consumer.run();
  await untilConsumerEvent(consumer, 'messageDeadLettered');
  const deadLetteredMessages = await getQueueDeadLetteredMessages();
  const r = await deadLetteredMessages.getMessagesAsync(defaultQueue, 0, 100);
  expect(r.items.length).toBe(1);
  expect(r.items[0].getMessageState()?.getAttempts()).toBe(0);
});

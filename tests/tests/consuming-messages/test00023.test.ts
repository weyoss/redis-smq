/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { getConsumer } from '../../common/consumer';
import { getProducer } from '../../common/producer';
import {
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming';
import { getQueueDeadLetteredMessages } from '../../common/queue-dead-lettered-messages';
import { untilConsumerEvent } from '../../common/events';
import { ProducibleMessage } from '../../../src/lib/message/producible-message';
import { promisifyAll } from 'bluebird';
import { Message } from '../../../src/lib/message/message';

test('Messages produced from scheduled message are processed like normal message upon consume failures (retry, delay, requeue, etc)', async () => {
  await createQueue(defaultQueue, false);

  const consumer = getConsumer({
    messageHandler: jest.fn(() => {
      throw new Error();
    }),
  });

  const msg = new ProducibleMessage()
    .setScheduledRepeat(10)
    .setScheduledRepeatPeriod(60000)
    .setBody('message body')
    .setRetryThreshold(5)
    .setQueue(defaultQueue);
  const producer = getProducer();
  await producer.runAsync();

  const [id] = await producer.produceAsync(msg);

  consumer.run();
  await untilConsumerEvent(consumer, 'messageDeadLettered');
  const deadLetteredMessages = await getQueueDeadLetteredMessages();
  const res = await deadLetteredMessages.getMessagesAsync(defaultQueue, 0, 100);
  expect(res.totalItems).toBe(1);
  expect(typeof res.items[0].id).toBe('string');

  const m = promisifyAll(new Message());
  const mState = await m.getMessageStateAsync(res.items[0].id);
  expect(mState.scheduledMessageId).toBe(id);
  expect(mState.attempts).toBe(4);
});

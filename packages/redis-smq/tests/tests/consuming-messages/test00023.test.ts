/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test, vitest } from 'vitest';
import { ProducibleMessage } from '../../../src/index.js';
import { getConsumer } from '../../common/consumer.js';
import { untilMessageDeadLettered } from '../../common/events.js';
import {
  createQueue,
  getDefaultQueue,
} from '../../common/message-producing-consuming.js';
import { getMessageManager } from '../../common/message-manager.js';
import { getProducer } from '../../common/producer.js';
import { getQueueDeadLetteredMessages } from '../../common/queue-dead-lettered-messages.js';

test('MessageList produced from scheduled message are processed like normal message upon consume failures (retry, delay, requeue, etc)', async () => {
  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, false);

  const consumer = getConsumer({
    messageHandler: vitest.fn(() => {
      throw new Error();
    }),
  });

  const msg = new ProducibleMessage()
    .setScheduledRepeat(3)
    .setScheduledRepeatPeriod(30000)
    .setBody('message body')
    .setRetryThreshold(2)
    .setRetryDelay(0)
    .setQueue(getDefaultQueue());
  const producer = getProducer();
  await producer.runAsync();

  const [id] = await producer.produceAsync(msg);

  consumer.run(() => void 0);
  await untilMessageDeadLettered(consumer);
  const deadLetteredMessages = await getQueueDeadLetteredMessages();
  const res = await deadLetteredMessages.getMessagesAsync(defaultQueue, 0, 100);
  expect(res.totalItems).toBe(1);
  expect(typeof res.items[0].id).toBe('string');

  const m = await getMessageManager();
  const mState = await m.getMessageStateAsync(res.items[0].id);
  expect(mState.scheduledMessageParentId).toBe(id);
  expect(mState.attempts).toBe(2);
});

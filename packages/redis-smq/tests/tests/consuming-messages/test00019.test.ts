/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from 'vitest';
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

test('An unacknowledged message is dead-lettered and not delivered again, given retryThreshold is 0', async () => {
  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, false);

  const producer = getProducer();
  await producer.runAsync();

  const consumer = getConsumer({
    messageHandler: () => {
      throw new Error();
    },
  });

  const msg = new ProducibleMessage();
  msg
    .setBody({ hello: 'world' })
    .setQueue(getDefaultQueue())
    .setRetryThreshold(0);
  await producer.produceAsync(msg);

  consumer.run(() => void 0);
  await untilMessageDeadLettered(consumer);
  const deadLetteredMessages = await getQueueDeadLetteredMessages();
  const r = await deadLetteredMessages.getMessagesAsync(defaultQueue, 0, 100);
  expect(r.items.length).toBe(1);

  const m = await getMessageManager();
  const mState = await m.getMessageStateAsync(r.items[0].id);
  expect(mState.attempts).toBe(1);
});

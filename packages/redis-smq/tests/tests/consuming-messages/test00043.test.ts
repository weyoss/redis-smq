/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from 'vitest';
import { MessageManager, ProducibleMessage } from '../../../index.js';
import { getConsumer } from '../../common/consumer.js';
import { untilMessageAcknowledged } from '../../common/events.js';
import {
  createQueue,
  getDefaultQueue,
} from '../../common/message-producing-consuming.js';
import { getProducer } from '../../common/producer.js';

test('MessageState: processingStartedAt and lastProcessedAt', async () => {
  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, false);
  const producer = getProducer();
  await producer.run();

  const consumer = getConsumer({
    messageHandler: (msg1, cb) => cb(),
  });

  const msg = new ProducibleMessage();
  msg.setBody({ hello: 'world' }).setQueue(getDefaultQueue());

  const [messageId] = await producer.produce(msg);
  consumer.run(() => void 0);

  await untilMessageAcknowledged(consumer, messageId);

  const messageManager = new MessageManager();
  const m = await messageManager.getMessageState(messageId);
  expect(m.processingStartedAt).toEqual(m.lastProcessedAt);
  expect(m.processingStartedAt).toBeGreaterThan(0);
});

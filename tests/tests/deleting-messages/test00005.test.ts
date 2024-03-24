/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { test, expect } from '@jest/globals';
import bluebird from 'bluebird';
import { MessageNotFoundError } from '../../../src/lib/index.js';
import { getConsumer } from '../../common/consumer.js';
import { getMessage } from '../../common/message.js';
import {
  createQueue,
  defaultQueue,
  produceMessage,
} from '../../common/message-producing-consuming.js';
import { getQueueMessages } from '../../common/queue-messages.js';

test('Combined test: Delete a message being in process. Check pending, acknowledged, and dead-letter message. Check queue metrics.', async () => {
  await createQueue(defaultQueue, false);

  const { queue, messageId } = await produceMessage();

  const queueMessages = await getQueueMessages();
  const count = await queueMessages.countMessagesByStatusAsync(queue);
  expect(count.pending).toBe(1);
  expect(count.acknowledged).toBe(0);

  const consumer = getConsumer({
    messageHandler: (msg1, cb) => {
      setTimeout(() => cb(), 20000); // 20s
    },
  });
  await consumer.runAsync();

  await bluebird.delay(5000);

  const message = await getMessage();
  await expect(message.deleteMessageByIdAsync(messageId)).rejects.toThrow(
    'MESSAGE_IN_PROCESS',
  );

  await bluebird.delay(20000);

  const count2 = await queueMessages.countMessagesByStatusAsync(queue);
  expect(count2.pending).toBe(0);
  expect(count2.acknowledged).toBe(1);

  await message.deleteMessageByIdAsync(messageId);

  const count3 = await queueMessages.countMessagesByStatusAsync(queue);
  expect(count3.pending).toBe(0);
  expect(count3.acknowledged).toBe(0);

  await expect(message.deleteMessageByIdAsync(messageId)).rejects.toThrow(
    MessageNotFoundError,
  );

  await message.shutdownAsync();
});

/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { test, expect } from '@jest/globals';
import { MessageNotFoundError } from '../../../src/lib/index.js';
import { getMessage } from '../../common/message.js';
import {
  createQueue,
  defaultQueue,
  produceAndDeadLetterMessage,
} from '../../common/message-producing-consuming.js';
import { getQueueAcknowledgedMessages } from '../../common/queue-acknowledged-messages.js';
import { getQueueDeadLetteredMessages } from '../../common/queue-dead-lettered-messages.js';
import { getQueueMessages } from '../../common/queue-messages.js';
import { getQueuePendingMessages } from '../../common/queue-pending-messages.js';

test('Combined test: Delete a dead-letter message. Check pending, acknowledged, and dead-letter message. Check queue metrics.', async () => {
  await createQueue(defaultQueue, false);
  const { queue, messageId } = await produceAndDeadLetterMessage();

  const deadLetteredMessages = await getQueueDeadLetteredMessages();
  const res0 = await deadLetteredMessages.countMessagesAsync(queue);
  expect(res0).toBe(1);

  const pendingMessages = await getQueuePendingMessages();
  const res1 = await pendingMessages.countMessagesAsync(queue);
  expect(res1).toBe(0);

  const acknowledgedMessages = await getQueueAcknowledgedMessages();

  const res2 = await acknowledgedMessages.countMessagesAsync(queue);
  expect(res2).toBe(0);

  const res3 = await deadLetteredMessages.getMessagesAsync(queue, 0, 100);
  expect(res3.totalItems).toBe(1);
  expect(res3.items.length).toBe(1);
  expect(res3.items[0].id).toEqual(messageId);

  const queueMessages = await getQueueMessages();
  const count = await queueMessages.countMessagesByStatusAsync(queue);
  expect(count.pending).toBe(0);
  expect(count.acknowledged).toBe(0);
  expect(count.deadLettered).toBe(1);

  const message = await getMessage();
  await message.deleteMessageByIdAsync(messageId);

  const res4 = await acknowledgedMessages.getMessagesAsync(queue, 0, 100);
  expect(res4.totalItems).toBe(0);
  expect(res4.items.length).toBe(0);

  const res5 = await pendingMessages.getMessagesAsync(queue, 0, 100);
  expect(res5.totalItems).toBe(0);
  expect(res5.items.length).toBe(0);

  const res6 = await deadLetteredMessages.getMessagesAsync(queue, 0, 100);
  expect(res6.totalItems).toBe(0);
  expect(res6.items.length).toBe(0);

  const count1 = await queueMessages.countMessagesByStatusAsync(queue);
  expect(count1.acknowledged).toBe(0);
  expect(count1.pending).toBe(0);
  expect(count1.deadLettered).toBe(0);

  await expect(message.deleteMessageByIdAsync(messageId)).rejects.toThrow(
    MessageNotFoundError,
  );
});

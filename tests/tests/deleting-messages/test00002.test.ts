/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { test, expect } from '@jest/globals';
import { getMessage } from '../../common/message.js';
import {
  createQueue,
  defaultQueue,
  produceMessageWithPriority,
} from '../../common/message-producing-consuming.js';
import { getQueueMessages } from '../../common/queue-messages.js';
import { getQueuePendingMessages } from '../../common/queue-pending-messages.js';

test('Combined test: Delete a pending message with priority. Check pending message. Check queue metrics.', async () => {
  await createQueue(defaultQueue, true);
  const { messageId, queue } = await produceMessageWithPriority();
  const pendingMessages = await getQueuePendingMessages();
  const res1 = await pendingMessages.getMessagesAsync(queue, 0, 100);

  expect(res1.totalItems).toBe(1);
  expect(res1.items[0].id).toBe(messageId);

  const queueMessages = await getQueueMessages();
  const count = await queueMessages.countMessagesByStatusAsync(queue);
  expect(count.pending).toBe(1);

  const message = await getMessage();
  await message.deleteMessageByIdAsync(messageId);

  const res2 = await pendingMessages.getMessagesAsync(queue, 0, 100);
  expect(res2.totalItems).toBe(0);
  expect(res2.items.length).toBe(0);

  const count2 = await queueMessages.countMessagesByStatusAsync(queue);
  expect(count2.pending).toBe(0);
});

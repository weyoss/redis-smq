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
  produceMessage,
} from '../../common/message-producing-consuming.js';
import { getQueuePendingMessages } from '../../common/queue-pending-messages.js';

test('Combined test: Delete a pending message. Check pending message. Check queue metrics.', async () => {
  await createQueue(defaultQueue, false);

  const { queue, messageId } = await produceMessage();

  const pendingMessages = await getQueuePendingMessages();
  const res1 = await pendingMessages.getMessagesAsync(queue, 0, 100);

  expect(res1.totalItems).toBe(1);
  expect(res1.items[0].id).toBe(messageId);

  const count = await pendingMessages.countMessagesAsync(queue);
  expect(count).toBe(1);

  const message = await getMessage();
  await message.deleteMessageByIdAsync(messageId);

  const res2 = await pendingMessages.getMessagesAsync(queue, 0, 100);
  expect(res2.totalItems).toBe(0);
  expect(res2.items.length).toBe(0);

  const count2 = await pendingMessages.countMessagesAsync(queue);
  expect(count2).toBe(0);
});

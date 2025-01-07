/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from '@jest/globals';
import {
  createQueue,
  defaultQueue,
  produceMessage,
} from '../../common/message-producing-consuming.js';
import { getMessage } from '../../common/message.js';
import { getQueuePendingMessages } from '../../common/queue-pending-messages.js';

test('Combined test: Delete pending messages by IDs. Check pending messages. Check queue metrics.', async () => {
  await createQueue(defaultQueue, false);
  const { messageId: msg1 } = await produceMessage();
  const { messageId: msg2 } = await produceMessage();
  const ids = [msg1, msg2].sort((a, b) => (a > b ? 1 : -1));

  const pendingMessages = await getQueuePendingMessages();

  const res1 = await pendingMessages.getMessagesAsync(defaultQueue, 0, 100);
  expect(res1.totalItems).toBe(2);
  const items = res1.items.map((i) => i.id).sort((a, b) => (a > b ? 1 : -1));
  expect(items).toEqual(ids);

  const count = await pendingMessages.countMessagesAsync(defaultQueue);
  expect(count).toBe(2);

  const message = await getMessage();
  await message.deleteMessagesByIdsAsync([msg1, msg2]);

  const res2 = await pendingMessages.getMessagesAsync(defaultQueue, 0, 100);
  expect(res2.totalItems).toBe(0);
  expect(res2.items.length).toBe(0);

  const count2 = await pendingMessages.countMessagesAsync(defaultQueue);
  expect(count2).toBe(0);
});

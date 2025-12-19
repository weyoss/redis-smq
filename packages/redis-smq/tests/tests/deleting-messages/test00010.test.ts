/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from 'vitest';
import { EQueueType } from '../../../src/index.js';
import {
  createQueue,
  getDefaultQueue,
  produceMessageWithPriority,
} from '../../common/message-producing-consuming.js';
import { getMessageManager } from '../../common/message-manager.js';
import { getQueuePendingMessages } from '../../common/queue-pending-messages.js';

test('Combined test: Delete pending priority messages by IDs. Check pending priority messages. Check queue metrics.', async () => {
  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, EQueueType.PRIORITY_QUEUE);
  const { messageId: msg1 } = await produceMessageWithPriority();
  const { messageId: msg2 } = await produceMessageWithPriority();
  const ids = [msg1, msg2].sort((a, b) => (a > b ? 1 : -1));

  const pendingMessages = await getQueuePendingMessages();

  const res1 = await pendingMessages.getMessagesAsync(defaultQueue, 0, 100);
  expect(res1.totalItems).toBe(2);
  const items = res1.items.map((i) => i.id).sort((a, b) => (a > b ? 1 : -1));
  expect(items).toEqual(ids);
  const count = await pendingMessages.countMessagesAsync(getDefaultQueue());
  expect(count).toBe(2);

  const message = await getMessageManager();
  const reply = await message.deleteMessagesByIdsAsync([msg1, msg2]);
  expect(reply.status).toBe('OK');
  expect(reply.stats).toEqual({
    processed: 2,
    success: 2,
    notFound: 0,
    inProcess: 0,
  });

  const res2 = await pendingMessages.getMessagesAsync(defaultQueue, 0, 100);
  expect(res2.totalItems).toBe(0);
  expect(res2.items.length).toBe(0);

  const count2 = await pendingMessages.countMessagesAsync(getDefaultQueue());
  expect(count2).toBe(0);
});

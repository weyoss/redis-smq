/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from 'vitest';
import {
  createQueue,
  getDefaultQueue,
  produceAndAcknowledgeMessage,
} from '../../common/message-producing-consuming.js';
import { getMessageManager } from '../../common/message-manager.js';
import { getQueueAcknowledgedMessages } from '../../common/queue-acknowledged-messages.js';

test('Combined test: Delete acknowledged messages by IDs which include a non-existent message ID', async () => {
  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, false);
  const { messageId: msg1 } = await produceAndAcknowledgeMessage(
    defaultQueue,
    true,
  );
  const { messageId: msg2 } = await produceAndAcknowledgeMessage(
    defaultQueue,
    true,
  );
  const ids = [msg1, msg2].sort((a, b) => (a > b ? 1 : -1));

  const acknowledgedMessages = await getQueueAcknowledgedMessages();

  const res1 = await acknowledgedMessages.getMessagesAsync(
    defaultQueue,
    0,
    100,
  );
  expect(res1.totalItems).toBe(2);
  const items = res1.items.map((i) => i.id).sort((a, b) => (a > b ? 1 : -1));
  expect(items).toEqual(ids);

  const count = await acknowledgedMessages.countMessagesAsync(defaultQueue);
  expect(count).toBe(2);

  const message = await getMessageManager();
  const reply = await message.deleteMessagesByIdsAsync([msg1]);
  expect(reply.status).toBe('OK');
  expect(reply.stats).toEqual({
    processed: 1,
    success: 1,
    notFound: 0,
    inProcess: 0,
  });

  const count1 = await acknowledgedMessages.countMessagesAsync(defaultQueue);
  expect(count1).toBe(1);

  const reply2 = await message.deleteMessagesByIdsAsync([msg1, msg2]);
  expect(reply2.status).toBe('PARTIAL_SUCCESS');
  expect(reply2.stats).toEqual({
    processed: 2,
    success: 1,
    notFound: 1,
    inProcess: 0,
  });

  const count2 = await acknowledgedMessages.countMessagesAsync(defaultQueue);
  expect(count2).toBe(0);
});

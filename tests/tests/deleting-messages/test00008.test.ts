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
  produceAndDeadLetterMessage,
} from '../../common/message-producing-consuming.js';
import { getQueueDeadLetteredMessages } from '../../common/queue-dead-lettered-messages.js';

test('Combined test: Delete dead-lettered messages by IDs. Check dead-lettered messages. Check queue metrics.', async () => {
  await createQueue(defaultQueue, false);
  const { messageId: msg1 } = await produceAndDeadLetterMessage(
    defaultQueue,
    true,
  );
  const { messageId: msg2 } = await produceAndDeadLetterMessage(
    defaultQueue,
    true,
  );
  const ids = [msg1, msg2].sort((a, b) => (a > b ? 1 : -1));

  const deadLetteredMessages = await getQueueDeadLetteredMessages();

  const res1 = await deadLetteredMessages.getMessagesAsync(
    defaultQueue,
    0,
    100,
  );
  expect(res1.totalItems).toBe(2);
  const items = res1.items.map((i) => i.id).sort((a, b) => (a > b ? 1 : -1));
  expect(items).toEqual(ids);

  const count = await deadLetteredMessages.countMessagesAsync(defaultQueue);
  expect(count).toBe(2);

  const message = await getMessage();
  await message.deleteMessagesByIdsAsync([msg1, msg2]);

  const res2 = await deadLetteredMessages.getMessagesAsync(
    defaultQueue,
    0,
    100,
  );
  expect(res2.totalItems).toBe(0);
  expect(res2.items.length).toBe(0);

  const count2 = await deadLetteredMessages.countMessagesAsync(defaultQueue);
  expect(count2).toBe(0);
});

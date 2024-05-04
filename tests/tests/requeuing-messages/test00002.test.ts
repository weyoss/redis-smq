/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { test, expect } from '@jest/globals';
import { MessageMessageNotRequeuableError } from '../../../src/lib/message/errors/message-message-not-requeuable.error.js';
import { shutDownBaseInstance } from '../../common/base-instance.js';
import {
  createQueue,
  defaultQueue,
  produceAndAcknowledgeMessage,
} from '../../common/message-producing-consuming.js';
import { getMessage } from '../../common/message.js';
import { getQueueAcknowledgedMessages } from '../../common/queue-acknowledged-messages.js';
import { getQueueMessages } from '../../common/queue-messages.js';
import { getQueuePendingMessages } from '../../common/queue-pending-messages.js';

test('Combined test. Requeue a message from acknowledged queue. Check queue metrics.', async () => {
  await createQueue(defaultQueue, false);
  const { messageId, queue, consumer } = await produceAndAcknowledgeMessage();
  await shutDownBaseInstance(consumer);

  const message = await getMessage();
  await message.requeueMessageByIdAsync(messageId);

  const acknowledgedMessages = await getQueueAcknowledgedMessages();
  const pendingMessages = await getQueuePendingMessages();
  const res2 = await pendingMessages.getMessagesAsync(queue, 0, 100);
  expect(res2.totalItems).toBe(1);
  expect(res2.items.length).toBe(1);
  expect(res2.items[0].id).toEqual(messageId);

  const res3 = await acknowledgedMessages.getMessagesAsync(queue, 0, 100);
  expect(res3.totalItems).toBe(0);
  expect(res3.items.length).toBe(0);

  const queueMessages = await getQueueMessages();
  const count = await queueMessages.countMessagesByStatusAsync(queue);
  expect(count.acknowledged).toBe(0);
  expect(count.pending).toBe(1);

  await expect(message.requeueMessageByIdAsync(messageId)).rejects.toThrow(
    MessageMessageNotRequeuableError,
  );
});

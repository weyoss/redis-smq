/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  createQueue,
  defaultQueue,
  produceAndAcknowledgeMessage,
} from '../../common/message-producing-consuming';
import { shutDownBaseInstance } from '../../common/base-instance';
import { getQueuePendingMessages } from '../../common/queue-pending-messages';
import { getQueueMessages } from '../../common/queue-messages';
import { getQueueAcknowledgedMessages } from '../../common/queue-acknowledged-messages';

test('Combined test. Requeue a message from acknowledged queue. Check queue metrics.', async () => {
  await createQueue(defaultQueue, false);
  const { message, queue, consumer } = await produceAndAcknowledgeMessage();
  await shutDownBaseInstance(consumer);

  const acknowledgedMessages = await getQueueAcknowledgedMessages();
  await acknowledgedMessages.requeueMessageAsync(
    queue,
    message.getRequiredId(),
  );

  const pendingMessages = await getQueuePendingMessages();
  const res2 = await pendingMessages.getMessagesAsync(queue, 0, 100);
  expect(res2.totalItems).toBe(1);
  expect(res2.items.length).toBe(1);
  expect(res2.items[0].getId()).toEqual(message.getRequiredId());

  const res3 = await acknowledgedMessages.getMessagesAsync(queue, 0, 100);
  expect(res3.totalItems).toBe(0);
  expect(res3.items.length).toBe(0);

  const queueMessages = await getQueueMessages();
  const count = await queueMessages.countMessagesByStatusAsync(queue);
  expect(count.acknowledged).toBe(0);
  expect(count.pending).toBe(1);

  await expect(async () => {
    await acknowledgedMessages.requeueMessageAsync(
      queue,
      message.getRequiredId(),
    );
  }).not.toThrow();
});

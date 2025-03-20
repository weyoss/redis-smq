/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from 'vitest';
import {
  QueueQueueHasRunningConsumersError,
  QueueQueueNotEmptyError,
  QueueQueueNotFoundError,
} from '../../../src/lib/index.js';
import { shutDownBaseInstance } from '../../common/base-instance.js';
import {
  createQueue,
  getDefaultQueue,
  produceAndAcknowledgeMessage,
} from '../../common/message-producing-consuming.js';
import { getQueueMessages } from '../../common/queue-messages.js';
import { getQueue } from '../../common/queue.js';

test('Deleting a message queue with all of its data', async () => {
  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, false);
  const { consumer, queue } = await produceAndAcknowledgeMessage();

  const queueMessages = await getQueueMessages();

  const m = await queueMessages.countMessagesByStatusAsync(getDefaultQueue());
  expect(m.acknowledged).toBe(1);

  const q = await getQueue();

  await expect(q.deleteAsync(queue)).rejects.toThrow(QueueQueueNotEmptyError);

  await queueMessages.purgeAsync(getDefaultQueue());

  await expect(q.deleteAsync(queue)).rejects.toThrow(
    QueueQueueHasRunningConsumersError,
  );

  await shutDownBaseInstance(consumer);
  await q.deleteAsync(queue);

  await expect(queueMessages.countMessagesByStatusAsync(queue)).rejects.toThrow(
    QueueQueueNotFoundError,
  );

  await expect(q.deleteAsync(queue)).rejects.toThrow(QueueQueueNotFoundError);
});

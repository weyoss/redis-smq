/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { test, expect } from '@jest/globals';
import {
  QueueHasRunningConsumersError,
  QueueNotEmptyError,
  QueueNotFoundError,
} from '../../../src/lib/index.js';
import { shutDownBaseInstance } from '../../common/base-instance.js';
import {
  createQueue,
  defaultQueue,
  produceAndAcknowledgeMessage,
} from '../../common/message-producing-consuming.js';
import { getQueue } from '../../common/queue.js';
import { getQueueMessages } from '../../common/queue-messages.js';

test('Deleting a message queue with all of its data', async () => {
  await createQueue(defaultQueue, false);
  const { consumer, queue } = await produceAndAcknowledgeMessage();

  const queueMessages = await getQueueMessages();

  const m = await queueMessages.countMessagesByStatusAsync(defaultQueue);
  expect(m.acknowledged).toBe(1);

  const q = await getQueue();

  await expect(q.deleteAsync(queue)).rejects.toThrow(QueueNotEmptyError);

  await queueMessages.purgeAsync(defaultQueue);

  await expect(q.deleteAsync(queue)).rejects.toThrow(
    QueueHasRunningConsumersError,
  );

  await shutDownBaseInstance(consumer);
  await q.deleteAsync(queue);

  await expect(queueMessages.countMessagesByStatusAsync(queue)).rejects.toThrow(
    QueueNotFoundError,
  );

  await expect(q.deleteAsync(queue)).rejects.toThrow(QueueNotFoundError);
});

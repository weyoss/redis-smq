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
  QueueManagerActiveConsumersError,
  QueueNotEmptyError,
  QueueNotFoundError,
} from '../../../src/errors/index.js';
import { shutDownBaseInstance } from '../../common/base-instance.js';
import {
  createQueue,
  getDefaultQueue,
  produceAndAcknowledgeMessage,
} from '../../common/message-producing-consuming.js';
import { getQueueMessages } from '../../common/queue-messages.js';
import { getQueueManager } from '../../common/queue-manager.js';

test('Deleting a message queue with all of its data', async () => {
  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, false);
  const { consumer, queue } = await produceAndAcknowledgeMessage();

  const queueMessages = await getQueueMessages();

  const m = await queueMessages.countMessagesByStatusAsync(getDefaultQueue());
  expect(m.acknowledged).toBe(1);

  const q = await getQueueManager();

  await expect(q.deleteAsync(queue)).rejects.toThrow(QueueNotEmptyError);

  await queueMessages.purgeAsync(getDefaultQueue());

  await expect(q.deleteAsync(queue)).rejects.toThrow(
    QueueManagerActiveConsumersError,
  );

  await shutDownBaseInstance(consumer);
  await q.deleteAsync(queue);

  await expect(queueMessages.countMessagesByStatusAsync(queue)).rejects.toThrow(
    QueueNotFoundError,
  );

  await expect(q.deleteAsync(queue)).rejects.toThrow(QueueNotFoundError);
});

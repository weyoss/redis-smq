/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from 'vitest';
import { QueueNotEmptyError } from '../../../src/errors/index.js';
import {
  createQueue,
  getDefaultQueue,
  produceAndAcknowledgeMessage,
} from '../../common/message-producing-consuming.js';
import { getQueueManager } from '../../common/queue-manager.js';
import { getQueueMessages } from '../../common/queue-messages.js';

test('Deleting a message queue having messages', async () => {
  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, false);

  const { consumer: c1 } = await produceAndAcknowledgeMessage(defaultQueue);
  await c1.shutdownAsync();

  const q = await getQueueManager();
  await expect(q.deleteAsync(defaultQueue)).rejects.toThrow(QueueNotEmptyError);

  const qm = await getQueueMessages();
  await qm.purgeAsync(defaultQueue);

  // should succeed
  await q.deleteAsync(defaultQueue);
});

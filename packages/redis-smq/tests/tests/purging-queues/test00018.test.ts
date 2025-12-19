/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from 'vitest';
import { QueueManagerActiveConsumersError } from '../../../src/errors/index.js';
import {
  createQueue,
  getDefaultQueue,
} from '../../common/message-producing-consuming.js';
import { getQueueManager } from '../../common/queue-manager.js';
import { getConsumer } from '../../common/consumer.js';

test('Deleting a message queue having live consumers', async () => {
  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, false);

  const consumer = getConsumer();
  await consumer.runAsync();

  const q = await getQueueManager();
  await expect(q.deleteAsync(defaultQueue)).rejects.toThrow(
    QueueManagerActiveConsumersError,
  );

  await consumer.shutdownAsync();

  // should succeed
  await q.deleteAsync(defaultQueue);
});

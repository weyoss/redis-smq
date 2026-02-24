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
import bluebird from 'bluebird';

test('Deleting a message queue having live consumers', async () => {
  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, false);

  const consumer = getConsumer();
  await consumer.runAsync();

  await bluebird.delay(5000);

  const q = await getQueueManager();
  await expect(q.deleteAsync(defaultQueue)).rejects.toThrow(
    QueueManagerActiveConsumersError,
  );

  await consumer.shutdownAsync();

  await bluebird.delay(5000);

  // should succeed
  await q.deleteAsync(defaultQueue);
});

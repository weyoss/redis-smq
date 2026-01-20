/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from 'vitest';
import { shutDownBaseInstance } from '../../common/base-instance.js';
import {
  createQueue,
  getDefaultQueue,
  produceAndDeadLetterMessage,
} from '../../common/message-producing-consuming.js';
import { getQueueMessages } from '../../common/queue-messages.js';
import bluebird from 'bluebird';

test('Purging dead letter queue', async () => {
  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, false);
  const { queue, consumer } = await produceAndDeadLetterMessage();
  await shutDownBaseInstance(consumer);

  const queueMessages = await getQueueMessages();
  const m = await queueMessages.countMessagesByStatusAsync(queue);
  expect(m.deadLettered).toBe(1);

  await queueMessages.purgeAsync(queue);

  await bluebird.delay(5000);

  const m1 = await queueMessages.countMessagesByStatusAsync(queue);
  expect(m1.deadLettered).toBe(0);
});

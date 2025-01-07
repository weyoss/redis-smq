/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from '@jest/globals';
import { shutDownBaseInstance } from '../../common/base-instance.js';
import {
  createQueue,
  defaultQueue,
  produceAndDeadLetterMessage,
} from '../../common/message-producing-consuming.js';
import { getQueueMessages } from '../../common/queue-messages.js';

test('Purging dead letter queue', async () => {
  await createQueue(defaultQueue, false);
  const { queue, consumer } = await produceAndDeadLetterMessage();
  await shutDownBaseInstance(consumer);

  const queueMessages = await getQueueMessages();
  const m = await queueMessages.countMessagesByStatusAsync(queue);
  expect(m.deadLettered).toBe(1);

  await queueMessages.purgeAsync(queue);

  const m1 = await queueMessages.countMessagesByStatusAsync(queue);
  expect(m1.deadLettered).toBe(0);
});

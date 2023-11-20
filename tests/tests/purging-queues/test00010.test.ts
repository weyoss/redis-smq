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
  produceMessageWithPriority,
} from '../../common/message-producing-consuming';
import { getQueueMessages } from '../../common/queue-messages';
import { getQueuePendingMessages } from '../../common/queue-pending-messages';

test('Purging priority queue', async () => {
  await createQueue(defaultQueue, true);
  const { queue } = await produceMessageWithPriority();
  const queueMessages = await getQueueMessages();

  const m2 = await queueMessages.countMessagesByStatusAsync(queue);
  expect(m2.pending).toBe(1);

  const pm = await getQueuePendingMessages();
  await pm.purgeAsync(queue);

  const m3 = await queueMessages.countMessagesByStatusAsync(queue);
  expect(m3.pending).toBe(0);
});

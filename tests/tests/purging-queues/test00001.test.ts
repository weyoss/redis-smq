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
  produceMessage,
} from '../../common/message-producing-consuming';
import { getQueueMessages } from '../../common/queue-messages';

test('Purging pending queue', async () => {
  await createQueue(defaultQueue, false);
  const { queue } = await produceMessage();
  const queueMessages = await getQueueMessages();

  const m2 = await queueMessages.countMessagesByStatusAsync(queue);
  expect(m2.pending).toBe(1);
  await queueMessages.purgeAsync(queue);

  const m3 = await queueMessages.countMessagesByStatusAsync(queue);
  expect(m3.pending).toBe(0);
});

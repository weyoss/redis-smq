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
  scheduleMessage,
} from '../../common/message-producing-consuming';
import { getQueueMessages } from '../../common/queue-messages';

test('Purging scheduled message queue', async () => {
  await createQueue(defaultQueue, false);
  await scheduleMessage();

  const queueMessages = await getQueueMessages();
  const m = await queueMessages.countMessagesByStatusAsync(defaultQueue);
  expect(m.scheduled).toBe(1);

  await queueMessages.purgeAsync(defaultQueue);

  const m1 = await queueMessages.countMessagesByStatusAsync(defaultQueue);
  expect(m1.scheduled).toBe(0);
});

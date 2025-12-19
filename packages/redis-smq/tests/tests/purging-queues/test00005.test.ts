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
  createQueue,
  getDefaultQueue,
  scheduleMessage,
} from '../../common/message-producing-consuming.js';
import { getQueueMessages } from '../../common/queue-messages.js';

test('Purging scheduled message queue', async () => {
  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, false);
  await scheduleMessage();

  const queueMessages = await getQueueMessages();
  const m = await queueMessages.countMessagesByStatusAsync(getDefaultQueue());
  expect(m.scheduled).toBe(1);

  await queueMessages.purgeAsync(getDefaultQueue());

  const m1 = await queueMessages.countMessagesByStatusAsync(getDefaultQueue());
  expect(m1.scheduled).toBe(0);
});

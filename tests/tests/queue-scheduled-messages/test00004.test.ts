/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { MessageEnvelope } from '../../../src/lib/message/message-envelope';
import { delay } from 'bluebird';
import {
  startScheduleWorker,
  stopScheduleWorker,
} from '../../common/schedule-worker';
import { getProducer } from '../../common/producer';
import {
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming';
import { validateTime } from '../../common/validate-time';
import { getQueuePendingMessages } from '../../common/queue-pending-messages';
import { getQueueMessages } from '../../common/queue-messages';

test('Schedule a message: CRON', async () => {
  await createQueue(defaultQueue, false);

  const msg = new MessageEnvelope();
  msg
    .setScheduledCRON('*/6 * * * * *')
    .setBody({ hello: 'world' })
    .setQueue(defaultQueue);

  const producer = getProducer();
  await producer.runAsync();

  await producer.produceAsync(msg);

  await startScheduleWorker();
  await delay(60000);
  await stopScheduleWorker();

  const pendingMessages = await getQueuePendingMessages();
  const r = await pendingMessages.getMessagesAsync(defaultQueue, 0, 100);

  expect(r.totalItems).toBeGreaterThan(8);
  for (let i = 0; i < r.items.length; i += 1) {
    const diff =
      (r.items[i].getPublishedAt() ?? 0) - (r.items[0].getPublishedAt() ?? 0);
    expect(validateTime(diff, 6000 * i)).toBe(true);
  }

  const queueMessages = await getQueueMessages();
  const count = await queueMessages.countMessagesAsync(defaultQueue);
  expect(count).toBe(r.totalItems + 1);

  const count2 = await queueMessages.countMessagesByStatusAsync(defaultQueue);
  expect(count2).toEqual({
    pending: r.totalItems,
    acknowledged: 0,
    deadLettered: 0,
    scheduled: 1,
  });
});

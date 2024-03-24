/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { test, expect } from '@jest/globals';
import bluebird from 'bluebird';
import { ProducibleMessage } from '../../../src/lib/index.js';
import {
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming.js';
import { getProducer } from '../../common/producer.js';
import { getQueueMessages } from '../../common/queue-messages.js';
import { getQueuePendingMessages } from '../../common/queue-pending-messages.js';
import {
  startScheduleWorker,
  stopScheduleWorker,
} from '../../common/schedule-worker.js';
import { validateTime } from '../../common/validate-time.js';

test('Schedule a message: CRON', async () => {
  await createQueue(defaultQueue, false);

  const msg = new ProducibleMessage();
  msg
    .setScheduledCRON('*/6 * * * * *')
    .setBody({ hello: 'world' })
    .setQueue(defaultQueue);

  const producer = getProducer();
  await producer.runAsync();

  await producer.produceAsync(msg);

  await startScheduleWorker();
  await bluebird.delay(60000);
  await stopScheduleWorker();

  const pendingMessages = await getQueuePendingMessages();
  const r = await pendingMessages.getMessagesAsync(defaultQueue, 0, 100);

  expect(r.totalItems).toBeGreaterThan(8);
  for (let i = 0; i < r.items.length; i += 1) {
    const diff =
      (r.items[i].messageState.publishedAt ?? 0) -
      (r.items[0].messageState.publishedAt ?? 0);
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

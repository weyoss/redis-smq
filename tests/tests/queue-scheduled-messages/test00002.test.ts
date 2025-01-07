/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from '@jest/globals';
import bluebird from 'bluebird';
import { ProducibleMessage } from '../../../src/lib/index.js';
import {
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming.js';
import { getProducer } from '../../common/producer.js';
import { getQueueMessages } from '../../common/queue-messages.js';
import { getQueuePendingMessages } from '../../common/queue-pending-messages.js';
import { startScheduleWorker } from '../../common/schedule-worker.js';
import { validateTime } from '../../common/validate-time.js';

test('Schedule a message: DELAY', async () => {
  await createQueue(defaultQueue, false);

  const msg = new ProducibleMessage();
  msg
    .setScheduledDelay(10000) // ms
    .setBody({ hello: 'world' })
    .setQueue(defaultQueue);

  const producer = getProducer();
  await producer.runAsync();

  await producer.produceAsync(msg);
  const producedAt = Date.now();

  const queueMessages = await getQueueMessages();

  const count = await queueMessages.countMessagesAsync(defaultQueue);
  expect(count).toEqual(1);

  const count1 = await queueMessages.countMessagesByStatusAsync(defaultQueue);
  expect(count1).toEqual({
    pending: 0,
    acknowledged: 0,
    deadLettered: 0,
    scheduled: 1,
  });

  await startScheduleWorker(defaultQueue);
  await bluebird.delay(30000);

  const pendingMessages = await getQueuePendingMessages();
  const r = await pendingMessages.getMessagesAsync(defaultQueue, 0, 100);
  expect(r.items.length).toBe(1);

  const diff = (r.items[0].messageState.publishedAt ?? 0) - producedAt;
  expect(validateTime(diff, 10000)).toBe(true);

  const count2 = await queueMessages.countMessagesByStatusAsync(defaultQueue);
  expect(count2).toEqual({
    pending: 1,
    acknowledged: 0,
    deadLettered: 0,
    scheduled: 0,
  });

  const count3 = await queueMessages.countMessagesAsync(defaultQueue);
  expect(count3).toEqual(1);
});

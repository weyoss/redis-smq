/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from 'vitest';
import bluebird from 'bluebird';
import { ProducibleMessage } from '../../../src/lib/index.js';
import {
  createQueue,
  getDefaultQueue,
} from '../../common/message-producing-consuming.js';
import { getProducer } from '../../common/producer.js';
import { getQueuePendingMessages } from '../../common/queue-pending-messages.js';
import { startScheduleWorker } from '../../common/schedule-worker.js';
import { validateTime } from '../../common/validate-time.js';

test('Schedule a message: combine REPEAT, REPEAT PERIOD, DELAY. Case 1', async () => {
  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, false);

  const msg = new ProducibleMessage();
  msg
    .setScheduledDelay(10000)
    .setScheduledRepeat(3)
    .setScheduledRepeatPeriod(3000)
    .setBody({ hello: 'world' })
    .setQueue(getDefaultQueue());

  const producer = getProducer();
  await producer.runAsync();

  await producer.produceAsync(msg);
  const producedAt = Date.now();

  await startScheduleWorker(getDefaultQueue());
  await bluebird.delay(30000);

  const pendingMessages = await getQueuePendingMessages();
  const r = await pendingMessages.getMessagesAsync(defaultQueue, 0, 100);
  expect(r.items.length).toBe(4);

  const diff1 = (r.items[0].messageState.publishedAt ?? 0) - producedAt;
  expect(validateTime(diff1, 10000)).toBe(true);

  const diff2 = (r.items[1].messageState.publishedAt ?? 0) - producedAt;
  expect(validateTime(diff2, 13000)).toBe(true);

  const diff3 = (r.items[2].messageState.publishedAt ?? 0) - producedAt;
  expect(validateTime(diff3, 16000)).toBe(true);

  const diff4 = (r.items[3].messageState.publishedAt ?? 0) - producedAt;
  expect(validateTime(diff4, 19000)).toBe(true);
});

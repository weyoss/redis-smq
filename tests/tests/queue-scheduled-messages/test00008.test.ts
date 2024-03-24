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
import { getQueuePendingMessages } from '../../common/queue-pending-messages.js';
import { startScheduleWorker } from '../../common/schedule-worker.js';
import { validateTime } from '../../common/validate-time.js';

test('Schedule a message: combine REPEAT, REPEAT PERIOD, DELAY. Case 2', async () => {
  await createQueue(defaultQueue, false);

  const msg = new ProducibleMessage();
  msg
    .setScheduledDelay(10000)
    .setScheduledRepeat(0) // should not be repeated
    .setScheduledRepeatPeriod(3000)
    .setBody({ hello: 'world' })
    .setQueue(defaultQueue);

  const producer = getProducer();
  await producer.runAsync();

  await producer.produceAsync(msg);
  const producedAt = Date.now();

  await startScheduleWorker();
  await bluebird.delay(30000);

  const pendingMessages = await getQueuePendingMessages();
  const r = await pendingMessages.getMessagesAsync(defaultQueue, 0, 100);
  expect(r.items.length).toBe(1);

  const diff = (r.items[0].messageState.publishedAt ?? 0) - producedAt;
  expect(validateTime(diff, 10000)).toBe(true);
});

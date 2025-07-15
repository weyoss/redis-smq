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
import { ProducibleMessage } from '../../../src/index.js';
import {
  createQueue,
  getDefaultQueue,
} from '../../common/message-producing-consuming.js';
import { getProducer } from '../../common/producer.js';
import { getQueuePendingMessages } from '../../common/queue-pending-messages.js';
import { startScheduleWorker } from '../../common/schedule-worker.js';
import { validateTime } from '../../common/validate-time.js';

test('Schedule a message: combine CRON, REPEAT, REPEAT PERIOD', async () => {
  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, false);

  const msg = new ProducibleMessage();
  msg.setScheduledCRON('*/20 * * * * *'); // Schedule message for each 20 seconds
  msg.setScheduledRepeat(2); // repeat 2 times
  msg.setScheduledRepeatPeriod(5000); // 5 secs between each repeat
  msg.setQueue(getDefaultQueue());
  const producer = getProducer();
  await producer.runAsync();

  await producer.produceAsync(msg);

  await startScheduleWorker(getDefaultQueue());
  await bluebird.delay(60000);

  const pendingMessages = await getQueuePendingMessages();
  const r = await pendingMessages.getMessagesAsync(defaultQueue, 0, 100);
  expect(r.items.length > 5).toBe(true);

  for (let i = 0; i < r.items.length; i += 1) {
    const diff =
      (r.items[i].messageState.publishedAt ?? 0) -
      (r.items[0].messageState.publishedAt ?? 0);
    if (i === 0) {
      expect(validateTime(diff, 0)).toBe(true);
    } else if (i === 1) {
      expect(validateTime(diff, 5000)).toBe(true); // first repeat
    } else if (i === 2) {
      expect(validateTime(diff, 10000)).toBe(true); // second repeat
    } else if (i === 3) {
      expect(validateTime(diff, 20000)).toBe(true); // cron
    } else if (i === 4) {
      expect(validateTime(diff, 25000)).toBe(true); // first repeat
    } else if (i === 5) {
      expect(validateTime(diff, 30000)).toBe(true); // second repeat
    } else if (i === 6) {
      expect(validateTime(diff, 40000)).toBe(true); // con
    } else if (i === 7) {
      expect(validateTime(diff, 45000)).toBe(true); // first repeat
    } else if (i === 8) {
      expect(validateTime(diff, 50000)).toBe(true); // second repeat
    }
  }
});

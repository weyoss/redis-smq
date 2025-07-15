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

test('Schedule a message: combine CRON, REPEAT, REPEAT PERIOD, DELAY', async () => {
  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, false);

  const msg = new ProducibleMessage();
  msg.setScheduledCRON('*/20 * * * * *'); // Schedule message for each 20 seconds
  msg.setScheduledRepeat(2); // repeat 2 times
  msg.setScheduledRepeatPeriod(5000); // 5 secs between each repeat
  msg.setScheduledDelay(15000); // this will first delay the message for 15 secs before cron/repeat scheduling
  msg.setBody({ hello: 'world' }).setQueue(getDefaultQueue());

  const producer = getProducer();
  await producer.runAsync();

  await producer.produceAsync(msg);
  const producedAt = Date.now();

  await startScheduleWorker(getDefaultQueue());
  await bluebird.delay(60000);

  const pendingMessages = await getQueuePendingMessages();
  const r = await pendingMessages.getMessagesAsync(defaultQueue, 0, 100);
  expect(r.items.length > 4).toBe(true);

  for (let i = 0; i < r.items.length; i += 1) {
    if (i === 0) {
      // verify that the message was first delayed
      const diff = (r.items[i].messageState.publishedAt ?? 0) - producedAt;
      expect(validateTime(diff, 15000)).toBe(true);
      continue;
    }

    if (i === 1) {
      // we can't predict the diff
      // considering that the first message was delayed
      continue;
    }

    const diff =
      (r.items[i].messageState.publishedAt ?? 0) -
      (r.items[1].messageState.publishedAt ?? 0);

    if (i === 2) {
      expect(validateTime(diff, 5000)).toBe(true);
    } else if (i === 3) {
      expect(validateTime(diff, 10000)).toBe(true);
    } else if (i === 4) {
      expect(validateTime(diff, 20000)).toBe(true);
    } else if (i === 5) {
      expect(validateTime(diff, 25000)).toBe(true);
    } else if (i === 6) {
      expect(validateTime(diff, 30000)).toBe(true);
    } else if (i === 7) {
      expect(validateTime(diff, 40000)).toBe(true);
    }
  }
});

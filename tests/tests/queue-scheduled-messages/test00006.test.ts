/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ProducibleMessage } from '../../../src/lib/message/producible-message';
import { delay } from 'bluebird';
import { startScheduleWorker } from '../../common/schedule-worker';
import { getProducer } from '../../common/producer';
import {
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming';
import { validateTime } from '../../common/validate-time';
import { getQueuePendingMessages } from '../../common/queue-pending-messages';

test('Schedule a message: combine CRON, REPEAT, REPEAT PERIOD, DELAY', async () => {
  await createQueue(defaultQueue, false);

  const msg = new ProducibleMessage();
  msg.setScheduledCRON('*/20 * * * * *'); // Schedule message for each 20 seconds
  msg.setScheduledRepeat(2); // repeat 2 times
  msg.setScheduledRepeatPeriod(5000); // 5 secs between each repeat
  msg.setScheduledDelay(15000); // this will first delay the message for 15 secs before cron/repeat scheduling
  msg.setBody({ hello: 'world' }).setQueue(defaultQueue);

  const producer = getProducer();
  await producer.runAsync();

  await producer.produceAsync(msg);
  const producedAt = Date.now();

  await startScheduleWorker();
  await delay(60000);

  const pendingMessages = await getQueuePendingMessages();
  const r = await pendingMessages.getMessagesAsync(defaultQueue, 0, 100);
  expect(r.items.length > 4).toBe(true);

  for (let i = 0; i < r.items.length; i += 1) {
    if (i === 0) {
      // verify that the message was first delayed
      const diff = (r.items[i].getPublishedAt() ?? 0) - producedAt;
      expect(validateTime(diff, 15000)).toBe(true);
      continue;
    }

    if (i === 1) {
      // we can't predict the diff
      // considering that the first message was delayed
      continue;
    }

    const diff =
      (r.items[i].getPublishedAt() ?? 0) - (r.items[1].getPublishedAt() ?? 0);

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

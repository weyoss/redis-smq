/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { Message } from '../../../src/lib/message/message';
import { delay } from 'bluebird';
import { startScheduleWorker } from '../../common/schedule-worker';
import { getProducer } from '../../common/producer';
import {
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming';
import { validateTime } from '../../common/validate-time';
import { getQueuePendingMessages } from '../../common/queue-pending-messages';

test('Schedule a message: combine REPEAT, REPEAT PERIOD, DELAY. Case 1', async () => {
  await createQueue(defaultQueue, false);

  const msg = new Message();
  msg
    .setScheduledDelay(10000)
    .setScheduledRepeat(3)
    .setScheduledRepeatPeriod(3000)
    .setBody({ hello: 'world' })
    .setQueue(defaultQueue);

  const producer = getProducer();
  await producer.runAsync();

  await producer.produceAsync(msg);
  const producedAt = Date.now();

  await startScheduleWorker();
  await delay(30000);

  const pendingMessages = await getQueuePendingMessages();
  const r = await pendingMessages.getMessagesAsync(defaultQueue, 0, 100);
  expect(r.items.length).toBe(4);

  const diff1 = (r.items[0].getPublishedAt() ?? 0) - producedAt;
  expect(validateTime(diff1, 10000)).toBe(true);

  const diff2 = (r.items[1].getPublishedAt() ?? 0) - producedAt;
  expect(validateTime(diff2, 13000)).toBe(true);

  const diff3 = (r.items[2].getPublishedAt() ?? 0) - producedAt;
  expect(validateTime(diff3, 16000)).toBe(true);

  const diff4 = (r.items[3].getPublishedAt() ?? 0) - producedAt;
  expect(validateTime(diff4, 19000)).toBe(true);
});
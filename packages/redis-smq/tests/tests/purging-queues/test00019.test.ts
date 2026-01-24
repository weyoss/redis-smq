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
} from '../../common/message-producing-consuming.js';
import bluebird from 'bluebird';
import { getProducer } from '../../common/producer.js';
import {
  EBackgroundJobStatus,
  IBackgroundJob,
  ProducibleMessage,
  TPurgeQueueJobTarget,
} from '../../../src/index.js';
import { getQueuePendingMessages } from '../../common/queue-pending-messages.js';

test('PurgeQueueWorker', async () => {
  const totalMessages = 3007;
  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, false);

  const producer = getProducer();
  await producer.runAsync();

  for (let i = 0; i < totalMessages; i++) {
    await producer.produceAsync(
      new ProducibleMessage().setBody(`m${i}`).setQueue(defaultQueue),
    );
  }

  const queueMessages = await getQueuePendingMessages();

  const m1 = await queueMessages.countMessagesAsync(defaultQueue);
  expect(m1).toBe(totalMessages);

  //
  const jobs: IBackgroundJob<TPurgeQueueJobTarget>[] = [];
  const jobId = await queueMessages.purgeAsync(defaultQueue);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const job = await queueMessages.getPurgeJobAsync(defaultQueue, jobId);
    jobs.push(job);
    if (job.status === EBackgroundJobStatus.COMPLETED) break;
    await bluebird.delay(1000);
  }

  expect(
    jobs.find((i) => i.status === EBackgroundJobStatus.PENDING),
  ).toBeDefined();
  expect(
    jobs.find((i) => i.status === EBackgroundJobStatus.PROCESSING),
  ).toBeDefined();
  expect(
    jobs.find((i) => i.status === EBackgroundJobStatus.COMPLETED),
  ).toBeDefined();
  expect(jobs.find((i) => i.purged === 1000)).toBeDefined();
  expect(jobs.find((i) => i.purged === 2000)).toBeDefined();
  expect(jobs.find((i) => i.purged === 3000)).toBeDefined();
  expect(jobs.find((i) => i.purged === 3007)).toBeDefined();

  const m2 = await queueMessages.countMessagesAsync(defaultQueue);
  expect(m2).toBe(0);
});

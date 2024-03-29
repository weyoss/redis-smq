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
import { Configuration } from '../../../src/config/index.js';
import RequeueUnacknowledgedWorker from '../../../src/lib/consumer/workers/requeue-unacknowledged.worker.js';
import WatchConsumersWorker from '../../../src/lib/consumer/workers/watch-consumers.worker.js';
import {
  crashAConsumerConsumingAMessage,
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming.js';
import { getQueuePendingMessages } from '../../common/queue-pending-messages.js';

test('WatchdogWorker', async () => {
  await createQueue(defaultQueue, false);
  await crashAConsumerConsumingAMessage();

  const watchdogWorker = await bluebird.promisifyAll(
    WatchConsumersWorker(Configuration.getSetConfig()),
  );
  await watchdogWorker.runAsync();

  const requeueWorker = await bluebird.promisifyAll(
    RequeueUnacknowledgedWorker(Configuration.getSetConfig()),
  );
  await requeueWorker.runAsync();
  await bluebird.delay(20000);

  const pendingMessages = await getQueuePendingMessages();
  const res3 = await pendingMessages.getMessagesAsync(defaultQueue, 0, 100);
  expect(res3.totalItems).toBe(1);

  await requeueWorker.shutdownAsync();
  await watchdogWorker.shutdownAsync();
});

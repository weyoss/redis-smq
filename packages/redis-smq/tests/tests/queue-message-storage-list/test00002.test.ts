/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { expect, it } from 'vitest';
import { redisKeys } from '../../../src/common/redis-keys/redis-keys.js';
import { EQueueType } from '../../../src/index.js';
import { QueueStorageList } from '../../../src/common/queue-messages/queue-storage/queue-storage-list.js';
import {
  createQueue,
  getDefaultQueue,
  produceMessage,
} from '../../common/message-producing-consuming.js';

const { promisifyAll } = bluebird;

it('QueueStorageList: should return 0 for an empty list', async () => {
  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, EQueueType.FIFO_QUEUE);
  const queueMessagesStorageList = promisifyAll(new QueueStorageList());

  const { keyQueuePending } = redisKeys.getQueueKeys(defaultQueue, null);
  const count = await queueMessagesStorageList.countAsync(keyQueuePending);
  expect(count).toBe(0);
});

it('should return the correct count after adding items', async () => {
  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, EQueueType.FIFO_QUEUE);
  const queueMessagesStorageList = promisifyAll(new QueueStorageList());
  await produceMessage(defaultQueue);
  const { keyQueuePending } = redisKeys.getQueueKeys(defaultQueue, null);
  const count = await queueMessagesStorageList.countAsync(keyQueuePending);
  expect(count).toBe(1);
});

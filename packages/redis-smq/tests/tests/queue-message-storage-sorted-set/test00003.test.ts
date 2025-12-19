/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { expect, it } from 'vitest';
import { redisKeys } from '../../../src/common/redis/redis-keys/redis-keys.js';
import {
  EMessagePriority,
  EQueueType,
  ProducibleMessage,
} from '../../../src/index.js';
import { BrowserStorageSortedSet } from '../../../src/common/message-browser/browser-storage/browser-storage-sorted-set.js';

import {
  createQueue,
  getDefaultQueue,
} from '../../common/message-producing-consuming.js';
import { getProducer } from '../../common/producer.js';

const { promisifyAll } = bluebird;

it('QueueStorageSortedSet: should fetch all items for a large list (chunking test)', async () => {
  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, EQueueType.PRIORITY_QUEUE);
  const queueMessagesStorageSortedSet = promisifyAll(
    new BrowserStorageSortedSet(),
  );

  const ids: string[] = [];
  const producer = getProducer();
  await producer.runAsync();
  for (let i = 0; i < 1000; i++) {
    const [id] = await producer.produceAsync(
      new ProducibleMessage()
        .setBody(`msg-${i}`)
        .setQueue(defaultQueue)
        .setPriority(EMessagePriority.HIGHEST),
    );
    ids.push(id);
  }

  const { keyQueuePriorityPending } = redisKeys.getQueueKeys(
    defaultQueue.ns,
    defaultQueue.name,
    null,
  );
  const items = await queueMessagesStorageSortedSet.fetchAllItemsAsync(
    keyQueuePriorityPending,
  );
  expect(items.sort()).toEqual(ids.sort());
});

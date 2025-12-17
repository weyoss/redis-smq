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
import { RedisClient } from '../../../src/common/redis/redis-client/redis-client.js';
import { redisKeys } from '../../../src/common/redis/redis-keys/redis-keys.js';
import {
  EMessagePriority,
  EQueueType,
  ProducibleMessage,
} from '../../../src/index.js';
import {
  createQueue,
  getDefaultQueue,
} from '../../common/message-producing-consuming.js';
import { BrowserStorageSortedSet } from '../../../src/common/message-browser/browser-storage/browser-storage-sorted-set.js';

import { getProducer } from '../../common/producer.js';

const { promisifyAll } = bluebird;

it('QueueStorageSortedSet: should fetch items with correct pagination', async () => {
  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, EQueueType.PRIORITY_QUEUE);
  const redisClient = promisifyAll(new RedisClient());
  const queueMessagesStorageSortedSet = promisifyAll(
    new BrowserStorageSortedSet(),
  );

  let ids: string[] = [];
  const producer = getProducer();
  await producer.runAsync();
  for (let i = 0; i < 500; i++) {
    const [id] = await producer.produceAsync(
      new ProducibleMessage()
        .setBody(`msg-${i}`)
        .setQueue(defaultQueue)
        .setPriority(EMessagePriority.HIGHEST),
    );
    ids.push(id);
  }

  // Sort the ids by lexicographic order as the elements in sorted sets are
  // sorted lexicographically when having the same score
  ids = ids.sort();

  const pageSize = 30;
  const { keyQueuePriorityPending } = redisKeys.getQueueKeys(
    defaultQueue.ns,
    defaultQueue.name,
    null,
  );
  for (let i = 0; i < 17; i++) {
    const offsetStart = i * pageSize;
    const offsetEnd = offsetStart + pageSize - 1;
    const p = await queueMessagesStorageSortedSet.fetchItemsAsync(
      keyQueuePriorityPending,
      {
        offsetStart,
        offsetEnd,
      },
    );

    // slice: the rightmost item is not included
    expect(p).toEqual(ids.slice(offsetStart, offsetEnd + 1));
  }

  // Test out of bounds
  const outOfBounds = await queueMessagesStorageSortedSet.fetchItemsAsync(
    keyQueuePriorityPending,
    {
      offsetStart: 17 * pageSize,
      offsetEnd: 17 * pageSize - 1,
    },
  );
  expect(outOfBounds).toEqual([]);

  await redisClient.shutdownAsync();
});

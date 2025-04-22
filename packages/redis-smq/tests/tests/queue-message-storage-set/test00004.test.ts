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
import { RedisClient } from '../../../src/common/redis-client/redis-client.js';
import { redisKeys } from '../../../src/common/redis-keys/redis-keys.js';
import { EQueueType, ProducibleMessage } from '../../../src/lib/index.js';
import {
  createQueue,
  getDefaultQueue,
} from '../../common/message-producing-consuming.js';
import { getProducer } from '../../common/producer.js';
import { QueueMessagesStorageSet } from '../../../src/lib/queue-messages/queue-messages-storage/queue-messages-storage-set.js';

const { promisifyAll } = bluebird;

it('QueueMessagesStorageSet: should fetch items with correct pagination', async () => {
  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, EQueueType.FIFO_QUEUE);
  const redisClient = promisifyAll(new RedisClient());
  const queueMessagesStorageSet = promisifyAll(
    new QueueMessagesStorageSet(redisClient),
  );

  const ids: string[] = [];
  const producer = getProducer();
  await producer.runAsync();
  for (let i = 0; i < 500; i++) {
    const [id] = await producer.produceAsync(
      new ProducibleMessage().setBody(`msg-${i}`).setQueue(defaultQueue),
    );
    ids.unshift(id);
  }

  const { keyQueueMessages } = redisKeys.getQueueKeys(defaultQueue, null);

  const allPages = new Set<string>();
  for (let i = 0; i < 17; i++) {
    const p = await queueMessagesStorageSet.fetchItemsAsync(keyQueueMessages, {
      page: i + 1,
      pageSize: 30,
    });
    p.map((i) => allPages.add(i));
  }

  // Test out of bounds
  const outOfBounds = await queueMessagesStorageSet.fetchItemsAsync(
    keyQueueMessages,
    {
      page: 18,
      pageSize: 30,
    },
  );
  expect(outOfBounds).toEqual([]);

  expect([...allPages.values()].sort()).toEqual(ids.sort());
  await redisClient.shutdownAsync();
});

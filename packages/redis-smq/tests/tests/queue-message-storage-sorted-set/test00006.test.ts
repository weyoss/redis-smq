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
import {
  EMessagePriority,
  EQueueType,
  ProducibleMessage,
} from '../../../src/lib/index.js';
import { QueueMessagesStorageSortedSet } from '../../../src/lib/queue-messages/queue-messages-storage/queue-messages-storage-sorted-set.js';

import {
  createQueue,
  getDefaultQueue,
} from '../../common/message-producing-consuming.js';
import { getProducer } from '../../common/producer.js';

const { promisifyAll } = bluebird;

it('QueueMessagesStorageSortedSet: should fetch all items for a small list', async () => {
  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, EQueueType.PRIORITY_QUEUE);
  const redisClient = promisifyAll(new RedisClient());
  const queueMessagesStorageSortedSet = promisifyAll(
    new QueueMessagesStorageSortedSet(redisClient),
  );

  const ids: string[] = [];
  const producer = getProducer();
  await producer.runAsync();
  for (let i = 0; i < 20; i++) {
    const [id] = await producer.produceAsync(
      new ProducibleMessage()
        .setBody(`msg-${i}`)
        .setQueue(defaultQueue)
        .setPriority(EMessagePriority.HIGHEST),
    );
    ids.push(id);
  }

  const { keyQueuePriorityPending } = redisKeys.getQueueKeys(
    defaultQueue,
    null,
  );
  const items = await queueMessagesStorageSortedSet.fetchAllItemsAsync(
    keyQueuePriorityPending,
  );
  expect(items.sort()).toEqual(ids.sort());
  await redisClient.shutdownAsync();
});

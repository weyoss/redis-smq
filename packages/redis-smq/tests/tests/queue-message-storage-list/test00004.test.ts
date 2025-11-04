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
import { EQueueType, ProducibleMessage } from '../../../src/index.js';
import {
  createQueue,
  getDefaultQueue,
} from '../../common/message-producing-consuming.js';
import { QueueStorageList } from '../../../src/common/queue-messages/queue-storage/queue-storage-list.js';
import { getProducer } from '../../common/producer.js';

const { promisifyAll } = bluebird;

it('QueueStorageList: should fetch items with correct pagination', async () => {
  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, EQueueType.FIFO_QUEUE);
  const queueMessagesStorageList = promisifyAll(new QueueStorageList());

  const ids: string[] = [];
  const producer = getProducer();
  await producer.runAsync();
  for (let i = 0; i < 500; i++) {
    const [id] = await producer.produceAsync(
      new ProducibleMessage().setBody(`msg-${i}`).setQueue(defaultQueue),
    );
    ids.unshift(id);
  }

  const pageSize = 30;
  const { keyQueuePending } = redisKeys.getQueueKeys(defaultQueue, null);
  for (let i = 0; i < 17; i++) {
    const offsetStart = i * pageSize;
    const offsetEnd = offsetStart + pageSize - 1;
    const p = await queueMessagesStorageList.fetchItemsAsync(keyQueuePending, {
      offsetStart,
      offsetEnd,
    });

    // slice: the rightmost item is not included
    expect(p).toEqual(ids.slice(offsetStart, offsetEnd + 1));
  }

  // Test out of bounds
  const outOfBounds = await queueMessagesStorageList.fetchItemsAsync(
    keyQueuePending,
    {
      offsetStart: 17 * pageSize,
      offsetEnd: 17 * pageSize - 1,
    },
  );
  expect(outOfBounds).toEqual([]);
});

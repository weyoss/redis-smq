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
import { QueueStorageList } from '../../../src/common/queue-explorer/queue-storage/queue-storage-list.js';
import {
  createQueue,
  getDefaultQueue,
} from '../../common/message-producing-consuming.js';
import { getProducer } from '../../common/producer.js';

const { promisifyAll } = bluebird;

it('QueueStorageList: should fetch all items for a small list', async () => {
  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, EQueueType.FIFO_QUEUE);
  const queueMessagesStorageList = promisifyAll(new QueueStorageList());

  const ids: string[] = [];
  const producer = getProducer();
  await producer.runAsync();
  for (let i = 0; i < 20; i++) {
    const [id] = await producer.produceAsync(
      new ProducibleMessage().setBody(`msg-${i}`).setQueue(defaultQueue),
    );
    ids.unshift(id);
  }

  const { keyQueuePending } = redisKeys.getQueueKeys(defaultQueue, null);
  const items =
    await queueMessagesStorageList.fetchAllItemsAsync(keyQueuePending);
  expect(items).toEqual(ids);
});

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
import { redisKeys } from '../../../src/common/redis/redis-keys/redis-keys.js';
import { EQueueType, ProducibleMessage } from '../../../src/index.js';
import { BrowserStorageSet } from '../../../src/common/message-browser/browser-storage/browser-storage-set.js';
import {
  createQueue,
  getDefaultQueue,
} from '../../common/message-producing-consuming.js';
import { getProducer } from '../../common/producer.js';

const { promisifyAll } = bluebird;

it('QueueStorageSet: should fetch all items for a large list (chunking test)', async () => {
  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, EQueueType.FIFO_QUEUE);
  const queueMessagesStorageSet = promisifyAll(new BrowserStorageSet());

  const ids: string[] = [];
  const producer = getProducer();
  await producer.runAsync();
  for (let i = 0; i < 1003; i++) {
    const [id] = await producer.produceAsync(
      new ProducibleMessage().setBody(`msg-${i}`).setQueue(defaultQueue),
    );
    ids.unshift(id);
  }

  const { keyQueueMessages } = redisKeys.getQueueKeys(defaultQueue, null);
  const items =
    await queueMessagesStorageSet.fetchAllItemsAsync(keyQueueMessages);
  expect(items.sort()).toEqual(ids.sort());
});

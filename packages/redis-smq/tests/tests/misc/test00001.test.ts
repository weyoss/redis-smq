/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from 'vitest';
import bluebird from 'bluebird';
import { getConsumer } from '../../common/consumer.js';
import {
  createQueue,
  getDefaultQueue,
} from '../../common/message-producing-consuming.js';
import { getRedisInstance } from '../../common/redis.js';
import { _isConsumerAlive } from '../../../src/consumer/_/_is-consumer-alive.js';

test('Consumer heartbeat: check online/offline consumers', async () => {
  const defaultQueue = getDefaultQueue();
  const redisClient = await getRedisInstance();
  const isConsumerAliveAsync = bluebird.promisify(_isConsumerAlive);
  await createQueue(defaultQueue, false);
  const consumer = getConsumer();
  await consumer.run();

  //
  const isAlive = await isConsumerAliveAsync(redisClient, consumer.getId());
  expect(isAlive).toBe(true);

  await consumer.shutdown();

  const isAlive2 = await isConsumerAliveAsync(redisClient, consumer.getId());
  expect(isAlive2).toBe(false);
});

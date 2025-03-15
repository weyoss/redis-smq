/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from 'vitest';
import bluebird from 'bluebird';
import { ConsumerHeartbeat } from '../../../src/lib/consumer/consumer-heartbeat/consumer-heartbeat.js';
import { shutDownBaseInstance } from '../../common/base-instance.js';
import { getConsumer } from '../../common/consumer.js';
import {
  createQueue,
  getDefaultQueue,
} from '../../common/message-producing-consuming.js';
import { getRedisInstance } from '../../common/redis.js';

test('Consumer heartbeat: check online/offline consumers', async () => {
  const defaultQueue = getDefaultQueue();
  const redisClient = await getRedisInstance();
  const HeartbeatAsync = bluebird.promisifyAll(ConsumerHeartbeat);
  await createQueue(defaultQueue, false);
  const consumer = getConsumer();
  await consumer.runAsync();

  //
  const isAlive = await HeartbeatAsync.isConsumerAliveAsync(
    redisClient,
    consumer.getId(),
  );
  expect(isAlive).toBe(true);

  await shutDownBaseInstance(consumer);

  const isAlive2 = await HeartbeatAsync.isConsumerAliveAsync(
    redisClient,
    consumer.getId(),
  );
  expect(isAlive2).toBe(false);
});

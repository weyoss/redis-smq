/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { test, expect } from '@jest/globals';
import bluebird from 'bluebird';
import { ConsumerHeartbeat } from '../../../src/lib/consumer/consumer-heartbeat/consumer-heartbeat.js';
import { shutDownBaseInstance } from '../../common/base-instance.js';
import { getConsumer } from '../../common/consumer.js';
import {
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming.js';
import { getRedisInstance } from '../../common/redis.js';

test('Consumer heartbeat: check online/offline consumers', async () => {
  const redisClient = await getRedisInstance();
  const HeartbeatAsync = bluebird.promisifyAll(ConsumerHeartbeat);
  await createQueue(defaultQueue, false);
  const consumer = getConsumer();
  await consumer.runAsync();

  //
  const consumersHeartbeats = await HeartbeatAsync.getConsumersHeartbeatsAsync(
    redisClient,
    [consumer.getId()],
  );
  expect(Object.keys(consumersHeartbeats).length).toBe(1);
  expect(consumersHeartbeats[consumer.getId()]).not.toBe(false);
  expect(Object.keys(consumersHeartbeats[consumer.getId()])).toEqual(
    expect.arrayContaining(['timestamp', 'data']),
  );

  //
  const expiredHeartbeatKeys = await HeartbeatAsync.getExpiredHeartbeatIdsAsync(
    redisClient,
    0,
    100,
  );
  expect(expiredHeartbeatKeys.length).toBe(0);

  await shutDownBaseInstance(consumer);

  //
  const validHeartbeatKeys2 = await HeartbeatAsync.getConsumersHeartbeatsAsync(
    redisClient,
    [consumer.getId()],
  );
  expect(Object.keys(validHeartbeatKeys2).length).toBe(1);
  expect(validHeartbeatKeys2[consumer.getId()]).toBe(false);

  //
  const expiredHeartbeatKeys2 =
    await HeartbeatAsync.getExpiredHeartbeatIdsAsync(redisClient, 0, 100);
  expect(expiredHeartbeatKeys2.length).toBe(0);
});

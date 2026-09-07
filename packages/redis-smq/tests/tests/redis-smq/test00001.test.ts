/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisSMQ } from '../../../src/index.js';
import { expect, it } from 'vitest';
import { ERedisConfigClient } from 'redis-smq-common';
import { redisConfig } from '../../common/config.js';

it('should allow re-initialization after a failed attempt', async () => {
  await RedisSMQ.shutdown();

  // Force the pool initialization to fail on first call
  await expect(
    RedisSMQ.initialize({
      client: ERedisConfigClient.IOREDIS,
      options: {
        host: 'nope',
        connectTimeout: 500, // fail fast on connect
        maxRetriesPerRequest: 0, // don't retry commands
        retryStrategy: () => null, // don't reconnect
        enableOfflineQueue: false, // reject immediately when offline
      },
    }),
  ).rejects.toThrow();

  // The state machine should be reset
  expect(RedisSMQ.isRunning()).toBe(false);

  // A second call must not throw "Already initialized"
  await expect(RedisSMQ.initialize(redisConfig)).resolves.toBeUndefined();

  expect(RedisSMQ.isRunning()).toBe(true);
  await RedisSMQ.shutdown();
});

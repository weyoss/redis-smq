/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  ERedisConfigClient,
  IRedisConfig,
} from '../../src/redis-client/index.js';

export const redisConfig: IRedisConfig = {
  client: ERedisConfigClient.IOREDIS,
  options: {
    host: process.env.REDIS_HOST ?? '127.0.0.1',
    port: 0,
    db: 0,
    showFriendlyErrorStack: true,
  },
};

/**
 * Update the port used by every Redis client created from `redisConfig`.
 *
 * Called once by `initializeRedis()` after the ephemeral Redis server
 * comes up. Mutating `options` (not the whole config) preserves
 * `host` / `db` / driver options.
 */
export function setRedisPort(port: number): void {
  redisConfig.options = { ...redisConfig.options, port };
}

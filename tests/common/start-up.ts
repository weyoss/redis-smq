/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { logger } from 'redis-smq-common';
import { Configuration } from '../../src/config/index.js';
import { ProducibleMessage } from '../../src/lib/index.js';
import { config } from './config.js';
import { getRedisInstance } from './redis.js';

export async function startUp(): Promise<void> {
  Configuration.reset();
  Configuration.getSetConfig(config);
  ProducibleMessage.setDefaultConsumeOptions({
    ttl: 0,
    retryThreshold: 3,
    retryDelay: 0,
    consumeTimeout: 0,
  });
  const redisClient = await getRedisInstance();
  await redisClient.flushallAsync();
  logger.destroy();
  logger.setLogger(console);
}

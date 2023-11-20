/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { getRedisInstance } from './redis';
import { logger } from 'redis-smq-common';
import { Configuration } from '../../src/config/configuration';
import { config } from './config';
import { Message } from '../../src/lib/message/message';

export async function startUp(): Promise<void> {
  Configuration.reset();
  Configuration.getSetConfig(config);
  Message.setDefaultConsumeOptions({
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

/*
 * packages/redis-smq-common/tests/helpers/config.ts
 */

import {
  ERedisConfigClient,
  IRedisConfig,
} from '../../src/redis-client/index.js';

const redisHost = process.env.REDIS_HOST || '127.0.0.1';

export const redisConfig: IRedisConfig = {
  client: ERedisConfigClient.IOREDIS,
  options: {
    host: redisHost,
    port: 0,
    db: 0,
    showFriendlyErrorStack: true,
  },
};

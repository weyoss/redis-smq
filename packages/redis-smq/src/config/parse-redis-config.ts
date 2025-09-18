import _ from 'lodash';
import { defaultConfig } from './default-config.js';
import { IRedisConfig } from 'redis-smq-common';

export function parseRedisConfig(redisConfig?: IRedisConfig): IRedisConfig {
  const defaultRedis = defaultConfig.redis;

  // If the user provides a redis client that is different from the default one,
  // we do not merge the default options. This is to avoid mixing options from
  // different clients (e.g. ioredis vs node-redis).
  if (redisConfig?.client && redisConfig.client !== defaultRedis.client) {
    return {
      client: redisConfig.client,
      options: redisConfig.options ?? {},
    };
  }

  // For the default client, or if no client is specified, merge user options
  // with the default options.
  return _.merge({}, defaultRedis, redisConfig ?? {});
}

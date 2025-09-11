import _ from 'lodash';
import { IRedisSMQConfig, IRedisSMQParsedConfig } from './types/index.js';
import { defaultConfig } from './default-config.js';

export function parseRedisConfig(
  userConfig: IRedisSMQConfig,
): IRedisSMQParsedConfig['redis'] {
  const userRedis = userConfig.redis;
  const defaultRedis = defaultConfig.redis;

  // If the user provides a redis client that is different from the default one,
  // we do not merge the default options. This is to avoid mixing options from
  // different clients (e.g. ioredis vs node-redis).
  if (userRedis?.client && userRedis.client !== defaultRedis.client) {
    return {
      client: userRedis.client,
      options: userRedis.options ?? {},
    };
  }

  // For the default client, or if no client is specified, merge user options
  // with the default options.
  return _.merge({}, defaultRedis, userRedis ?? {});
}

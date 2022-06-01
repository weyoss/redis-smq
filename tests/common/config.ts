import { IConfig } from '../../types';
import { RedisClientName } from 'redis-smq-common/dist/types';
import * as configuration from '../../src/config/configuration';

const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = Number(process.env.REDIS_PORT) || 6379;

export const config: IConfig = {
  namespace: 'testing',
  redis: {
    client: RedisClientName.IOREDIS,
    options: {
      host: redisHost,
      port: redisPort,
      showFriendlyErrorStack: true,
    },
  },
  logger: {
    enabled: false,
  },
  messages: {
    store: true,
  },
};
export const requiredConfig = configuration.getConfiguration(config);

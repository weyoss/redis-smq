import { IConfig, RedisClientName } from '../types';

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
    consumeOptions: {
      retryDelay: 0,
    },
    store: true,
  },
};

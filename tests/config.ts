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
  log: {
    enabled: false,
  },
  monitor: {
    enabled: true,
    host: '127.0.0.1',
    port: 3000,
  },
  message: {
    retryDelay: 0,
  },
};

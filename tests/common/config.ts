import { IRedisSMQConfig } from '../../types';
import { ERedisConfigClient } from 'redis-smq-common';

const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = Number(process.env.REDIS_PORT) || 6379;

export const config: IRedisSMQConfig = {
  namespace: 'testing',
  redis: {
    client: ERedisConfigClient.IOREDIS,
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

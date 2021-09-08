import { IConfig, RedisClientName } from '../types';

export const config: IConfig = {
  namespace: 'testing',
  redis: {
    client: RedisClientName.IOREDIS,
    options: {
      host: '127.0.0.1',
      port: 6379,
    },
  },
  monitor: {
    enabled: true,
    host: '127.0.0.1',
    port: 3000,
  },
};

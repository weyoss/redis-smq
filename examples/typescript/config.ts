import { IConfig, RedisClientName } from '../../types'; // from 'redis-smq/types';

export const config: IConfig = {
  namespace: 'ns1',
  redis: {
    client: RedisClientName.IOREDIS,
    options: {
      host: '127.0.0.1',
      port: 6379,
    },
  },
  log: {
    enabled: true,
    options: {
      name: 'qqqq',
      level: 'trace',
      // streams: [
      //   {
      //     path: path.normalize(`${__dirname}/logs/redis-smq.log`),
      //   },
      // ],
    },
  },
  monitor: {
    enabled: true,
    port: 3000,
    host: '127.0.0.1',
  },
};

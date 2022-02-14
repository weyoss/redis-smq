import { RedisClientName, IRequiredConfig } from '../../../../types';

export const defaultConfiguration: IRequiredConfig = {
  namespace: 'default',
  redis: {
    client: RedisClientName.IOREDIS,
  },
  logger: {
    enabled: false,
  },
  monitor: {
    enabled: false,
  },
  message: {
    consumeTimeout: 0,
    retryThreshold: 3,
    retryDelay: 60000,
    ttl: 0,
  },
  storeMessages: {
    acknowledged: {
      store: false,
      expire: 0,
      queueSize: 0,
    },
    deadLettered: {
      store: false,
      expire: 0,
      queueSize: 0,
    },
  },
};

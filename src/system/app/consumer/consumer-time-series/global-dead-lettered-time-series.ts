import { RedisClient } from '../../../common/redis-client/redis-client';
import { redisKeys } from '../../../common/redis-keys/redis-keys';
import { HashTimeSeries } from '../../../common/time-series/hash-time-series';

export const GlobalDeadLetteredTimeSeries = (redisClient: RedisClient) => {
  const { keyRateGlobalDeadLettered, keyRateGlobalDeadLetteredIndex } =
    redisKeys.getMainKeys();
  return new HashTimeSeries(redisClient, {
    key: keyRateGlobalDeadLettered,
    indexKey: keyRateGlobalDeadLetteredIndex,
  });
};

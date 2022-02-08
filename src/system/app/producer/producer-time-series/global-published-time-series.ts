import { RedisClient } from '../../../common/redis-client/redis-client';
import { redisKeys } from '../../../common/redis-keys/redis-keys';
import { HashTimeSeries } from '../../../common/time-series/hash-time-series';

export const GlobalPublishedTimeSeries = (redisClient: RedisClient) => {
  const { keyRateGlobalPublished, keyRateGlobalInputIndex } =
    redisKeys.getMainKeys();
  return new HashTimeSeries(redisClient, {
    key: keyRateGlobalPublished,
    indexKey: keyRateGlobalInputIndex,
  });
};

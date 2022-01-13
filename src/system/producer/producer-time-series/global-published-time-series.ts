import { RedisClient } from '../../common/redis-client/redis-client';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { HashTimeSeries } from '../../common/time-series/hash-time-series';

export const GlobalPublishedTimeSeries = (
  redisClient: RedisClient,
  isMaster?: boolean,
) => {
  const {
    keyRateGlobalPublished,
    keyRateGlobalInputIndex,
    keyLockRateGlobalPublished,
  } = redisKeys.getGlobalKeys();
  return new HashTimeSeries(
    redisClient,
    keyRateGlobalPublished,
    keyRateGlobalInputIndex,
    keyLockRateGlobalPublished,
    undefined,
    undefined,
    undefined,
    isMaster,
  );
};

import { RedisClient } from '../../../redis-client/redis-client';
import { redisKeys } from '../../../common/redis-keys/redis-keys';
import { HashTimeSeries } from '../../../common/time-series/hash-time-series';

export const GlobalPublishedRateTimeSeries = (
  redisClient: RedisClient,
  readOnly?: boolean,
) => {
  const {
    keyRateGlobalPublished,
    keyRateGlobalInputIndex,
    keyRateGlobalPublishedLock,
  } = redisKeys.getGlobalKeys();
  return new HashTimeSeries(
    redisClient,
    keyRateGlobalPublished,
    keyRateGlobalInputIndex,
    keyRateGlobalPublishedLock,
    undefined,
    undefined,
    undefined,
    readOnly,
  );
};

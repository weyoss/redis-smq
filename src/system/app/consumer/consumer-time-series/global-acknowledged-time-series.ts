import { RedisClient } from '../../../common/redis-client/redis-client';
import { redisKeys } from '../../../common/redis-keys/redis-keys';
import { HashTimeSeries } from '../../../common/time-series/hash-time-series';

export const GlobalAcknowledgedTimeSeries = (redisClient: RedisClient) => {
  const { keyRateGlobalAcknowledged, keyRateGlobalAcknowledgedIndex } =
    redisKeys.getMainKeys();
  return new HashTimeSeries(redisClient, {
    key: keyRateGlobalAcknowledged,
    indexKey: keyRateGlobalAcknowledgedIndex,
  });
};

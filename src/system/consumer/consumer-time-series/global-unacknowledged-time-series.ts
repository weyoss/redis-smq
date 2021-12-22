import { RedisClient } from '../../redis-client/redis-client';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { HashTimeSeries } from '../../common/time-series/hash-time-series';

export const GlobalUnacknowledgedTimeSeries = (
  redisClient: RedisClient,
  readOnly?: boolean,
) => {
  const {
    keyRateGlobalUnacknowledged,
    keyRateGlobalUnacknowledgedIndex,
    keyRateGlobalUnacknowledgedLock,
  } = redisKeys.getGlobalKeys();
  return new HashTimeSeries(
    redisClient,
    keyRateGlobalUnacknowledged,
    keyRateGlobalUnacknowledgedIndex,
    keyRateGlobalUnacknowledgedLock,
    undefined,
    undefined,
    undefined,
    readOnly,
  );
};

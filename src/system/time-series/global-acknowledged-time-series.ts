import { RedisClient } from '../redis-client/redis-client';
import { redisKeys } from '../common/redis-keys/redis-keys';
import { HashTimeSeries } from '../common/time-series/hash-time-series';

export const GlobalAcknowledgedTimeSeries = (
  redisClient: RedisClient,
  isMaster?: boolean,
) => {
  const {
    keyRateGlobalAcknowledged,
    keyRateGlobalAcknowledgedIndex,
    keyLockRateGlobalAcknowledged,
  } = redisKeys.getGlobalKeys();
  return new HashTimeSeries(
    redisClient,
    keyRateGlobalAcknowledged,
    keyRateGlobalAcknowledgedIndex,
    keyLockRateGlobalAcknowledged,
    undefined,
    undefined,
    undefined,
    isMaster,
  );
};

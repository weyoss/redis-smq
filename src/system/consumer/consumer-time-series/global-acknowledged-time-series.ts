import { RedisClient } from '../../redis-client/redis-client';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { HashTimeSeries } from '../../common/time-series/hash-time-series';

export const GlobalAcknowledgedTimeSeries = (
  redisClient: RedisClient,
  readOnly?: boolean,
) => {
  const {
    keyRateGlobalAcknowledged,
    keyRateGlobalAcknowledgedIndex,
    keyRateGlobalAcknowledgedLock,
  } = redisKeys.getGlobalKeys();
  return new HashTimeSeries(
    redisClient,
    keyRateGlobalAcknowledged,
    keyRateGlobalAcknowledgedIndex,
    keyRateGlobalAcknowledgedLock,
    undefined,
    undefined,
    undefined,
    readOnly,
  );
};

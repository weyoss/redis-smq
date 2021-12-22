import { RedisClient } from '../../redis-client/redis-client';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { HashTimeSeries } from '../../common/time-series/hash-time-series';

export const GlobalProcessingTimeSeries = (
  redisClient: RedisClient,
  readOnly?: boolean,
) => {
  const {
    keyRateGlobalProcessing,
    keyRateGlobalProcessingIndex,
    keyRateGlobalProcessingLock,
  } = redisKeys.getGlobalKeys();
  return new HashTimeSeries(
    redisClient,
    keyRateGlobalProcessing,
    keyRateGlobalProcessingIndex,
    keyRateGlobalProcessingLock,
    undefined,
    undefined,
    undefined,
    readOnly,
  );
};

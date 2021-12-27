import { RedisClient } from '../../redis-client/redis-client';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { HashTimeSeries } from '../../common/time-series/hash-time-series';

export const GlobalDeadLetteredTimeSeries = (
  redisClient: RedisClient,
  isMaster?: boolean,
) => {
  const {
    keyRateGlobalDeadLettered,
    keyRateGlobalDeadLetteredIndex,
    keyRateGlobalDeadLetteredLock,
  } = redisKeys.getGlobalKeys();
  return new HashTimeSeries(
    redisClient,
    keyRateGlobalDeadLettered,
    keyRateGlobalDeadLetteredIndex,
    keyRateGlobalDeadLetteredLock,
    undefined,
    undefined,
    undefined,
    isMaster,
  );
};

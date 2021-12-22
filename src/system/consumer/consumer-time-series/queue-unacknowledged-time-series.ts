import { RedisClient } from '../../redis-client/redis-client';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { HashTimeSeries } from '../../common/time-series/hash-time-series';

export const QueueUnacknowledgedTimeSeries = (
  redisClient: RedisClient,
  queueName: string,
  ns?: string,
  readOnly?: boolean,
) => {
  const {
    keyRateQueueUnacknowledged,
    keyRateQueueUnacknowledgedIndex,
    keyRateQueueUnacknowledgedLock,
  } = redisKeys.getKeys(queueName, ns);
  return new HashTimeSeries(
    redisClient,
    keyRateQueueUnacknowledged,
    keyRateQueueUnacknowledgedIndex,
    keyRateQueueUnacknowledgedLock,
    undefined,
    undefined,
    undefined,
    readOnly,
  );
};

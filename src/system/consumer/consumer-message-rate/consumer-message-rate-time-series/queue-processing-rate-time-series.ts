import { RedisClient } from '../../../redis-client/redis-client';
import { redisKeys } from '../../../common/redis-keys/redis-keys';
import { HashTimeSeries } from '../../../common/time-series/hash-time-series';

export const QueueProcessingRateTimeSeries = (
  redisClient: RedisClient,
  queueName: string,
  ns?: string,
  readOnly?: boolean,
) => {
  const {
    keyRateQueueProcessing,
    keyRateQueueProcessingIndex,
    keyRateQueueProcessingLock,
  } = redisKeys.getKeys(queueName, ns);
  return new HashTimeSeries(
    redisClient,
    keyRateQueueProcessing,
    keyRateQueueProcessingIndex,
    keyRateQueueProcessingLock,
    undefined,
    undefined,
    undefined,
    readOnly,
  );
};

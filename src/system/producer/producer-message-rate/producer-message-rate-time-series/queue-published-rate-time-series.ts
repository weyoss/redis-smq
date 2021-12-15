import { RedisClient } from '../../../redis-client/redis-client';
import { redisKeys } from '../../../common/redis-keys/redis-keys';
import { HashTimeSeries } from '../../../common/time-series/hash-time-series';

export const QueuePublishedRateTimeSeries = (
  redisClient: RedisClient,
  queueName: string,
  ns?: string,
  readOnly?: boolean,
) => {
  const {
    keyRateQueueInput,
    keyRateQueuePublishedIndex,
    keyRateQueuePublishedLock,
  } = redisKeys.getKeys(queueName, ns);
  return new HashTimeSeries(
    redisClient,
    keyRateQueueInput,
    keyRateQueuePublishedIndex,
    keyRateQueuePublishedLock,
    undefined,
    undefined,
    undefined,
    readOnly,
  );
};

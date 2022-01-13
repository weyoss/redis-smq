import { RedisClient } from '../../common/redis-client/redis-client';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { SortedSetTimeSeries } from '../../common/time-series/sorted-set-time-series';

export const MultiQueueProducerPublishedTimeSeries = (
  redisClient: RedisClient,
  producerId: string,
  isMaster?: boolean,
) => {
  const { keyRateMultiQueueProducerPublished } =
    redisKeys.getMultiQueueProducerKeys(producerId);
  return new SortedSetTimeSeries(
    redisClient,
    keyRateMultiQueueProducerPublished,
    30,
    undefined,
    undefined,
    isMaster,
  );
};
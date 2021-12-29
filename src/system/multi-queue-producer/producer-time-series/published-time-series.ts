import { RedisClient } from '../../redis-client/redis-client';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { SortedSetTimeSeries } from '../../common/time-series/sorted-set-time-series';

export const PublishedTimeSeries = (
  redisClient: RedisClient,
  producerId: string,
  isMaster?: boolean,
) => {
  const { keyRateMultiQueueProducerPublished } =
    redisKeys.getMultiQueueProducerKeys(producerId);
  return new SortedSetTimeSeries(
    redisClient,
    keyRateMultiQueueProducerPublished,
    undefined,
    undefined,
    undefined,
    isMaster,
  );
};

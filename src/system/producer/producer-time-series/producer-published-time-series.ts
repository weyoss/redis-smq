import { RedisClient } from '../../redis-client/redis-client';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { SortedSetTimeSeries } from '../../common/time-series/sorted-set-time-series';
import { TQueueParams } from '../../../../types';

export const ProducerPublishedTimeSeries = (
  redisClient: RedisClient,
  producerId: string,
  queue: TQueueParams,
  isMaster?: boolean,
) => {
  const { keyRateProducerPublished } = redisKeys.getProducerKeys(
    queue.name,
    producerId,
    queue.ns,
  );
  return new SortedSetTimeSeries(
    redisClient,
    keyRateProducerPublished,
    30,
    undefined,
    undefined,
    isMaster,
  );
};

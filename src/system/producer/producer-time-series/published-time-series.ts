import { RedisClient } from '../../redis-client/redis-client';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { SortedSetTimeSeries } from '../../common/time-series/sorted-set-time-series';

export const PublishedTimeSeries = (
  redisClient: RedisClient,
  producerId: string,
  queueName: string,
  ns?: string,
  readOnly?: boolean,
) => {
  const { keyRateProducerInput } = redisKeys.getProducerKeys(
    queueName,
    producerId,
    ns,
  );
  return new SortedSetTimeSeries(
    redisClient,
    keyRateProducerInput,
    undefined,
    undefined,
    undefined,
    readOnly,
  );
};

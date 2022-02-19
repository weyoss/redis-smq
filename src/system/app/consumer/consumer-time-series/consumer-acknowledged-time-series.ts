import { RedisClient } from '../../../common/redis-client/redis-client';
import { redisKeys } from '../../../common/redis-keys/redis-keys';
import { SortedSetTimeSeries } from '../../../common/time-series/sorted-set-time-series';
import { TRedisClientMulti } from '../../../../../types';

export const ConsumerAcknowledgedTimeSeries = (
  redisClient: RedisClient,
  consumerId: string,
) => {
  const { keyRateConsumerAcknowledged } = redisKeys.getConsumerKeys(consumerId);
  return new SortedSetTimeSeries(redisClient, {
    key: keyRateConsumerAcknowledged,
  });
};

export const deleteConsumerAcknowledgedTimeSeries = (
  multi: TRedisClientMulti,
  consumerId: string,
) => {
  const { keyRateConsumerAcknowledged } = redisKeys.getConsumerKeys(consumerId);
  multi.del(keyRateConsumerAcknowledged);
};

import { RedisClient } from '../../../common/redis-client/redis-client';
import { redisKeys } from '../../../common/redis-keys/redis-keys';
import { SortedSetTimeSeries } from '../../../common/time-series/sorted-set-time-series';
import { TRedisClientMulti } from '../../../../../types';

export const ConsumerDeadLetteredTimeSeries = (
  redisClient: RedisClient,
  consumerId: string,
) => {
  const { keyRateConsumerDeadLettered } = redisKeys.getConsumerKeys(consumerId);
  return new SortedSetTimeSeries(redisClient, {
    key: keyRateConsumerDeadLettered,
  });
};

export const deleteConsumerDeadLetteredTimeSeries = (
  multi: TRedisClientMulti,
  consumerId: string,
) => {
  const { keyRateConsumerDeadLettered } = redisKeys.getConsumerKeys(consumerId);
  multi.del(keyRateConsumerDeadLettered);
};

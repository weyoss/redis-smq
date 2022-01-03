import { RedisClient } from '../redis-client/redis-client';
import { redisKeys } from '../common/redis-keys/redis-keys';
import { SortedSetTimeSeries } from '../common/time-series/sorted-set-time-series';
import { TQueueParams } from '../../../types';

export const ConsumerAcknowledgedTimeSeries = (
  redisClient: RedisClient,
  consumerId: string,
  queue: TQueueParams,
  isMaster?: boolean,
) => {
  const { keyRateConsumerAcknowledged } = redisKeys.getConsumerKeys(
    queue.name,
    consumerId,
    queue.ns,
  );
  return new SortedSetTimeSeries(
    redisClient,
    keyRateConsumerAcknowledged,
    10000,
    undefined,
    undefined,
    isMaster,
  );
};

import { RedisClient } from '../../../common/redis-client/redis-client';
import { redisKeys } from '../../../common/redis-keys/redis-keys';
import { SortedSetTimeSeries } from '../../../common/time-series/sorted-set-time-series';
import { TQueueParams } from '../../../../../types';

export const ConsumerDeadLetteredTimeSeries = (
  redisClient: RedisClient,
  consumerId: string,
  queue: TQueueParams,
) => {
  const { keyRateConsumerDeadLettered } = redisKeys.getQueueConsumerKeys(
    queue,
    consumerId,
  );
  return new SortedSetTimeSeries(redisClient, {
    key: keyRateConsumerDeadLettered,
    expireAfterInSeconds: 30,
  });
};

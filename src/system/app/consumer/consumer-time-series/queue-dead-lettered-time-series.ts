import { RedisClient } from '../../../common/redis-client/redis-client';
import { redisKeys } from '../../../common/redis-keys/redis-keys';
import { HashTimeSeries } from '../../../common/time-series/hash-time-series';
import { TQueueParams } from '../../../../../types';

export const QueueDeadLetteredTimeSeries = (
  redisClient: RedisClient,
  queue: TQueueParams,
) => {
  const { keyRateQueueDeadLettered, keyRateQueueDeadLetteredIndex } =
    redisKeys.getQueueKeys(queue);
  return new HashTimeSeries(redisClient, {
    key: keyRateQueueDeadLettered,
    indexKey: keyRateQueueDeadLetteredIndex,
  });
};

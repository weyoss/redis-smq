import { RedisClient } from '../../../common/redis-client/redis-client';
import { redisKeys } from '../../../common/redis-keys/redis-keys';
import { HashTimeSeries } from '../../../common/time-series/hash-time-series';
import { TQueueParams } from '../../../../../types';

export const QueuePublishedTimeSeries = (
  redisClient: RedisClient,
  queue: TQueueParams,
) => {
  const { keyRateQueuePublished, keyRateQueuePublishedIndex } =
    redisKeys.getQueueKeys(queue);
  return new HashTimeSeries(redisClient, {
    key: keyRateQueuePublished,
    indexKey: keyRateQueuePublishedIndex,
  });
};

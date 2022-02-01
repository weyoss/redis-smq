import { RedisClient } from '../../../common/redis-client/redis-client';
import { redisKeys } from '../../../common/redis-keys/redis-keys';
import { HashTimeSeries } from '../../../common/time-series/hash-time-series';
import { TQueueParams } from '../../../../../types';

export const QueuePublishedTimeSeries = (
  redisClient: RedisClient,
  queue: TQueueParams,
  isMaster?: boolean,
) => {
  const {
    keyRateQueuePublished,
    keyRateQueuePublishedIndex,
    keyLockRateQueuePublished,
  } = redisKeys.getQueueKeys(queue.name, queue.ns);
  return new HashTimeSeries(
    redisClient,
    keyRateQueuePublished,
    keyRateQueuePublishedIndex,
    keyLockRateQueuePublished,
    undefined,
    undefined,
    undefined,
    isMaster,
  );
};

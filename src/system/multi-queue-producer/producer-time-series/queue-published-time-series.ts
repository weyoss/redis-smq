import { TQueueParams } from '../../../../types';
import { RedisClient } from '../../redis-client/redis-client';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { HashTimeSeries } from '../../common/time-series/hash-time-series';

export const QueuePublishedTimeSeries = (
  redisClient: RedisClient,
  queue: TQueueParams,
  isMaster?: boolean,
) => {
  const {
    keyRateQueuePublished,
    keyRateQueuePublishedIndex,
    keyRateQueuePublishedLock,
  } = redisKeys.getKeys(queue.name, queue.ns);
  return new HashTimeSeries(
    redisClient,
    keyRateQueuePublished,
    keyRateQueuePublishedIndex,
    keyRateQueuePublishedLock,
    undefined,
    undefined,
    undefined,
    isMaster,
  );
};

import { RedisClient } from '../../common/redis-client/redis-client';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { HashTimeSeries } from '../../common/time-series/hash-time-series';
import { TQueueParams } from '../../../../types';

export const QueueAcknowledgedTimeSeries = (
  redisClient: RedisClient,
  queue: TQueueParams,
  isMaster?: boolean,
) => {
  const {
    keyRateQueueAcknowledged,
    keyRateQueueAcknowledgedIndex,
    keyLockRateQueueAcknowledged,
  } = redisKeys.getKeys(queue.name, queue.ns);
  return new HashTimeSeries(
    redisClient,
    keyRateQueueAcknowledged,
    keyRateQueueAcknowledgedIndex,
    keyLockRateQueueAcknowledged,
    undefined,
    undefined,
    undefined,
    isMaster,
  );
};

import { RedisClient } from '../../../redis-client/redis-client';
import { redisKeys } from '../../../common/redis-keys/redis-keys';
import { HashTimeSeries } from '../../../common/time-series/hash-time-series';

export const QueueAcknowledgedRateTimeSeries = (
  redisClient: RedisClient,
  queueName: string,
  ns?: string,
  readOnly?: boolean,
) => {
  const {
    keyRateQueueAcknowledged,
    keyRateQueueAcknowledgedIndex,
    keyRateQueueAcknowledgedLock,
  } = redisKeys.getKeys(queueName, ns);
  return new HashTimeSeries(
    redisClient,
    keyRateQueueAcknowledged,
    keyRateQueueAcknowledgedIndex,
    keyRateQueueAcknowledgedLock,
    undefined,
    undefined,
    undefined,
    readOnly,
  );
};

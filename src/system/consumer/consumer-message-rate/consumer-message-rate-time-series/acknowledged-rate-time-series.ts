import { RedisClient } from '../../../redis-client/redis-client';
import { redisKeys } from '../../../common/redis-keys/redis-keys';
import { SortedSetTimeSeries } from '../../../common/time-series/sorted-set-time-series';

export const AcknowledgedRateTimeSeries = (
  redisClient: RedisClient,
  consumerId: string,
  queueName: string,
  ns?: string,
  readOnly?: boolean,
) => {
  const { keyRateConsumerAcknowledged } = redisKeys.getConsumerKeys(
    queueName,
    consumerId,
    ns,
  );
  return new SortedSetTimeSeries(
    redisClient,
    keyRateConsumerAcknowledged,
    undefined,
    undefined,
    undefined,
    readOnly,
  );
};

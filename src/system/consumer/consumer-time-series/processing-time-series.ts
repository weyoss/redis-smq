import { RedisClient } from '../../redis-client/redis-client';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { SortedSetTimeSeries } from '../../common/time-series/sorted-set-time-series';

export const ProcessingTimeSeries = (
  redisClient: RedisClient,
  consumerId: string,
  queueName: string,
  ns?: string,
  readOnly?: boolean,
) => {
  const { keyRateConsumerProcessing } = redisKeys.getConsumerKeys(
    queueName,
    consumerId,
    ns,
  );
  return new SortedSetTimeSeries(
    redisClient,
    keyRateConsumerProcessing,
    undefined,
    undefined,
    undefined,
    readOnly,
  );
};

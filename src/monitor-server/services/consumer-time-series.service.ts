import { RedisClient } from '../../system/redis-client/redis-client';
import {
  AcknowledgedTimeSeries,
  DeadLetteredTimeSeries,
} from '../../system/consumer/consumer-time-series';
import { promisifyAll } from 'bluebird';
import { AcknowledgedRequestDTO } from '../controllers/consumer-time-series/actions/acknowledged/acknowledged-request.DTO';
import { DeadLetteredRequestDTO } from '../controllers/consumer-time-series/actions/dead-lettered/dead-lettered-request.DTO';

export class ConsumerTimeSeriesService {
  protected redisClient: RedisClient;
  constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;
  }

  async acknowledged(args: AcknowledgedRequestDTO) {
    const { ns, queueName, from, to, consumerId } = args;
    const timeSeries = promisifyAll(
      AcknowledgedTimeSeries(this.redisClient, consumerId, {
        name: queueName,
        ns,
      }),
    );
    return timeSeries.getRangeAsync(from, to);
  }

  async deadLettered(args: DeadLetteredRequestDTO) {
    const { ns, queueName, from, to, consumerId } = args;
    const timeSeries = promisifyAll(
      DeadLetteredTimeSeries(this.redisClient, consumerId, {
        name: queueName,
        ns,
      }),
    );
    return timeSeries.getRangeAsync(from, to);
  }
}

import { RedisClient } from '../../system/redis-client/redis-client';
import {
  AcknowledgedTimeSeries,
  ProcessingTimeSeries,
  UnacknowledgedTimeSeries,
} from '../../system/consumer/consumer-time-series';
import { promisifyAll } from 'bluebird';

import { AcknowledgedRequestDTO } from '../controllers/consumer-time-series/actions/acknowledged/acknowledged-request.DTO';
import { UnacknowledgedRequestDTO } from '../controllers/consumer-time-series/actions/unacknowledged/unacknowledged-request.DTO';
import { ProcessingRequestDTO } from '../controllers/consumer-time-series/actions/processing/processing-request.DTO';

export class ConsumerTimeSeriesService {
  protected redisClient: RedisClient;
  constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;
  }

  async acknowledged(args: AcknowledgedRequestDTO) {
    const { ns, queueName, from, to, consumerId } = args;
    const timeSeries = promisifyAll(
      AcknowledgedTimeSeries(this.redisClient, consumerId, queueName, ns, true),
    );
    return timeSeries.getRangeAsync(from, to);
  }

  async processing(args: ProcessingRequestDTO) {
    const { ns, queueName, from, to, consumerId } = args;
    const timeSeries = promisifyAll(
      ProcessingTimeSeries(this.redisClient, consumerId, queueName, ns, true),
    );
    return timeSeries.getRangeAsync(from, to);
  }

  async unacknowledged(args: UnacknowledgedRequestDTO) {
    const { ns, queueName, from, to, consumerId } = args;
    const timeSeries = promisifyAll(
      UnacknowledgedTimeSeries(
        this.redisClient,
        consumerId,
        queueName,
        ns,
        true,
      ),
    );
    return timeSeries.getRangeAsync(from, to);
  }
}

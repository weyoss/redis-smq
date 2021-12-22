import { QueueTimeSeriesRequestDTO } from '../controllers/queue-time-series/common/queue-time-series-request.DTO';
import { RedisClient } from '../../system/redis-client/redis-client';
import {
  QueueAcknowledgedTimeSeries,
  QueueProcessingTimeSeries,
  QueueUnacknowledgedTimeSeries,
} from '../../system/consumer/consumer-time-series';
import { promisifyAll } from 'bluebird';
import { QueuePublishedTimeSeries } from '../../system/producer/producer-time-series';

export class QueueTimeSeriesService {
  protected redisClient: RedisClient;
  constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;
  }

  async acknowledged(args: QueueTimeSeriesRequestDTO) {
    const { ns, queueName, from, to } = args;
    const timeSeries = promisifyAll(
      QueueAcknowledgedTimeSeries(this.redisClient, queueName, ns, true),
    );
    return timeSeries.getRangeAsync(from, to);
  }

  async processing(args: QueueTimeSeriesRequestDTO) {
    const { ns, queueName, from, to } = args;
    const timeSeries = promisifyAll(
      QueueProcessingTimeSeries(this.redisClient, queueName, ns, true),
    );
    return timeSeries.getRangeAsync(from, to);
  }

  async unacknowledged(args: QueueTimeSeriesRequestDTO) {
    const { ns, queueName, from, to } = args;
    const timeSeries = promisifyAll(
      QueueUnacknowledgedTimeSeries(this.redisClient, queueName, ns, true),
    );
    return timeSeries.getRangeAsync(from, to);
  }

  async published(args: QueueTimeSeriesRequestDTO) {
    const { ns, queueName, from, to } = args;
    const timeSeries = promisifyAll(
      QueuePublishedTimeSeries(this.redisClient, queueName, ns, true),
    );
    return timeSeries.getRangeAsync(from, to);
  }
}

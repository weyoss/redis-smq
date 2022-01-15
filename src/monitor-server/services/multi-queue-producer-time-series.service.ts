import { RedisClient } from '../../system/common/redis-client/redis-client';
import { promisifyAll } from 'bluebird';
import { MultiQueueProducerPublishedTimeSeries } from '../../system/multi-queue-producer/multi-queue-producer-time-series/multi-queue-producer-published-time-series';
import { MultiQueueProducerTimeSeriesRequestDTO } from '../controllers/common/dto/time-series/multi-queue-producer-time-series-request.DTO';

export class MultiQueueProducerTimeSeriesService {
  protected redisClient: RedisClient;
  constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;
  }

  async published(args: MultiQueueProducerTimeSeriesRequestDTO) {
    const { from, to, producerId } = args;
    const timeSeries = promisifyAll(
      MultiQueueProducerPublishedTimeSeries(this.redisClient, producerId),
    );
    return timeSeries.getRangeAsync(from, to);
  }
}

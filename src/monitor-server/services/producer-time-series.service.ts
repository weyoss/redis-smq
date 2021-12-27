import { RedisClient } from '../../system/redis-client/redis-client';
import { promisifyAll } from 'bluebird';
import { PublishedTimeSeries } from '../../system/producer/producer-time-series';
import { PublishedRequestDTO } from '../controllers/producer-time-series/actions/published/published-request.DTO';

export class ProducerTimeSeriesService {
  protected redisClient: RedisClient;
  constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;
  }

  async published(args: PublishedRequestDTO) {
    const { ns, queueName, from, to, producerId } = args;
    const timeSeries = promisifyAll(
      PublishedTimeSeries(this.redisClient, producerId, {
        name: queueName,
        ns,
      }),
    );
    return timeSeries.getRangeAsync(from, to);
  }
}

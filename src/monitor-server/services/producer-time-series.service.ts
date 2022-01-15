import { RedisClient } from '../../system/common/redis-client/redis-client';
import { promisifyAll } from 'bluebird';
import { ProducerPublishedTimeSeries } from '../../system/producer/producer-time-series/producer-published-time-series';
import { GetProducerPublishedRequestDTO } from '../controllers/api/queues/queue/producer/time-series/get-producer-published/get-producer-published.request.DTO';

export class ProducerTimeSeriesService {
  protected redisClient: RedisClient;
  constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;
  }

  async published(args: GetProducerPublishedRequestDTO) {
    const { ns, queueName, from, to, producerId } = args;
    const timeSeries = promisifyAll(
      ProducerPublishedTimeSeries(this.redisClient, producerId, {
        name: queueName,
        ns,
      }),
    );
    return timeSeries.getRangeAsync(from, to);
  }
}

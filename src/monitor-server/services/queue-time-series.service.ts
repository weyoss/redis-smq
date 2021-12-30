import { QueueTimeSeriesRequestDTO } from '../controllers/queue-time-series/common/queue-time-series-request.DTO';
import { RedisClient } from '../../system/redis-client/redis-client';
import { QueueAcknowledgedTimeSeries } from '../../system/time-series/queue-acknowledged-time-series';
import { QueueDeadLetteredTimeSeries } from '../../system/time-series/queue-dead-lettered-time-series';
import { QueuePublishedTimeSeries } from '../../system/time-series/queue-published-time-series';
import { promisifyAll } from 'bluebird';

export class QueueTimeSeriesService {
  protected redisClient: RedisClient;
  constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;
  }

  async acknowledged(args: QueueTimeSeriesRequestDTO) {
    const { ns, queueName, from, to } = args;
    const timeSeries = promisifyAll(
      QueueAcknowledgedTimeSeries(this.redisClient, {
        name: queueName,
        ns,
      }),
    );
    return timeSeries.getRangeAsync(from, to);
  }

  async deadLettered(args: QueueTimeSeriesRequestDTO) {
    const { ns, queueName, from, to } = args;
    const timeSeries = promisifyAll(
      QueueDeadLetteredTimeSeries(this.redisClient, {
        name: queueName,
        ns,
      }),
    );
    return timeSeries.getRangeAsync(from, to);
  }

  async published(args: QueueTimeSeriesRequestDTO) {
    const { ns, queueName, from, to } = args;
    const timeSeries = promisifyAll(
      QueuePublishedTimeSeries(this.redisClient, {
        name: queueName,
        ns,
      }),
    );
    return timeSeries.getRangeAsync(from, to);
  }
}

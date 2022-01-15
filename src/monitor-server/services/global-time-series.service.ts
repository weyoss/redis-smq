import { RedisClient } from '../../system/common/redis-client/redis-client';
import { promisifyAll } from 'bluebird';
import { TimeSeriesRequestDTO } from '../controllers/common/dto/time-series/time-series-request.DTO';
import { GlobalDeadLetteredTimeSeries } from '../../system/consumer/consumer-time-series/global-dead-lettered-time-series';
import { GlobalPublishedTimeSeries } from '../../system/producer/producer-time-series/global-published-time-series';
import { GlobalAcknowledgedTimeSeries } from '../../system/consumer/consumer-time-series/global-acknowledged-time-series';

export class GlobalTimeSeriesService {
  protected redisClient: RedisClient;
  constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;
  }

  async acknowledged(args: TimeSeriesRequestDTO) {
    const { from, to } = args;
    const timeSeries = promisifyAll(
      GlobalAcknowledgedTimeSeries(this.redisClient),
    );
    return timeSeries.getRangeAsync(from, to);
  }

  async deadLettered(args: TimeSeriesRequestDTO) {
    const { from, to } = args;
    const timeSeries = promisifyAll(
      GlobalDeadLetteredTimeSeries(this.redisClient),
    );
    return timeSeries.getRangeAsync(from, to);
  }

  async published(args: TimeSeriesRequestDTO) {
    const { from, to } = args;
    const timeSeries = promisifyAll(
      GlobalPublishedTimeSeries(this.redisClient),
    );
    return timeSeries.getRangeAsync(from, to);
  }
}

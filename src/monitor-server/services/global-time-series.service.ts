import { RedisClient } from '../../system/redis-client/redis-client';
import { promisifyAll } from 'bluebird';
import { TimeSeriesRequestDTO } from '../controllers/common/time-series/time-series-request.DTO';
import {
  GlobalAcknowledgedTimeSeries,
  GlobalProcessingTimeSeries,
  GlobalUnacknowledgedTimeSeries,
} from '../../system/consumer/consumer-time-series';
import { GlobalPublishedTimeSeries } from '../../system/producer/producer-time-series';

export class GlobalTimeSeriesService {
  protected redisClient: RedisClient;
  constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;
  }

  async acknowledged(args: TimeSeriesRequestDTO) {
    const { from, to } = args;
    const timeSeries = promisifyAll(
      GlobalAcknowledgedTimeSeries(this.redisClient, true),
    );
    return timeSeries.getRangeAsync(from, to);
  }

  async processing(args: TimeSeriesRequestDTO) {
    const { from, to } = args;
    const timeSeries = promisifyAll(
      GlobalProcessingTimeSeries(this.redisClient, true),
    );
    return timeSeries.getRangeAsync(from, to);
  }

  async unacknowledged(args: TimeSeriesRequestDTO) {
    const { from, to } = args;
    const timeSeries = promisifyAll(
      GlobalUnacknowledgedTimeSeries(this.redisClient, true),
    );
    return timeSeries.getRangeAsync(from, to);
  }

  async published(args: TimeSeriesRequestDTO) {
    const { from, to } = args;
    const timeSeries = promisifyAll(
      GlobalPublishedTimeSeries(this.redisClient, true),
    );
    return timeSeries.getRangeAsync(from, to);
  }
}

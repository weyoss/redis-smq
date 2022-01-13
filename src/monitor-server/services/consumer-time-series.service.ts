import { RedisClient } from '../../system/common/redis-client/redis-client';
import { ConsumerDeadLetteredTimeSeries } from '../../system/consumer/consumer-time-series/consumer-dead-lettered-time-series';
import { ConsumerAcknowledgedTimeSeries } from '../../system/consumer/consumer-time-series/consumer-acknowledged-time-series';
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
      ConsumerAcknowledgedTimeSeries(this.redisClient, consumerId, {
        name: queueName,
        ns,
      }),
    );
    return timeSeries.getRangeAsync(from, to);
  }

  async deadLettered(args: DeadLetteredRequestDTO) {
    const { ns, queueName, from, to, consumerId } = args;
    const timeSeries = promisifyAll(
      ConsumerDeadLetteredTimeSeries(this.redisClient, consumerId, {
        name: queueName,
        ns,
      }),
    );
    return timeSeries.getRangeAsync(from, to);
  }
}

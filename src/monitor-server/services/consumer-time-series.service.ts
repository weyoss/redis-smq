import { RedisClient } from '../../system/common/redis-client/redis-client';
import { ConsumerDeadLetteredTimeSeries } from '../../system/consumer/consumer-time-series/consumer-dead-lettered-time-series';
import { ConsumerAcknowledgedTimeSeries } from '../../system/consumer/consumer-time-series/consumer-acknowledged-time-series';
import { promisifyAll } from 'bluebird';
import { GetConsumerAcknowledgedRequestDTO } from '../controllers/api/queues/queue/consumer/time-series/get-consumer-acknowledged/get-consumer-acknowledged.request.DTO';
import { GetConsumerDeadLetteredRequestDTO } from '../controllers/api/queues/queue/consumer/time-series/get-consumer-dead-lettered/get-consumer-dead-lettered.request.DTO';

export class ConsumerTimeSeriesService {
  protected redisClient: RedisClient;
  constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;
  }

  async acknowledged(args: GetConsumerAcknowledgedRequestDTO) {
    const { ns, queueName, from, to, consumerId } = args;
    const timeSeries = promisifyAll(
      ConsumerAcknowledgedTimeSeries(this.redisClient, consumerId, {
        name: queueName,
        ns,
      }),
    );
    return timeSeries.getRangeAsync(from, to);
  }

  async deadLettered(args: GetConsumerDeadLetteredRequestDTO) {
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

import { ConsumerHeartbeat } from '../lib/consumer/consumer-heartbeat';
import { RedisClient, Worker, ICallback, ILogger } from 'redis-smq-common';
import { EConsumeMessageUnacknowledgedCause } from '../../types';
import { processingQueue } from '../lib/consumer/message-handler/processing-queue';

export class WatchConsumersWorker extends Worker {
  protected redisClient: RedisClient;
  protected logger: ILogger;

  constructor(redisClient: RedisClient, managed: boolean, logger: ILogger) {
    super(managed);
    this.redisClient = redisClient;
    this.logger = logger;
  }

  work = (cb: ICallback<void>): void => {
    ConsumerHeartbeat.getExpiredHeartbeatIds(
      this.redisClient,
      0,
      10,
      (err, reply) => {
        if (err) cb(err);
        else
          processingQueue.handleProcessingQueue(
            this.redisClient,
            reply ?? [],
            [],
            this.logger,
            EConsumeMessageUnacknowledgedCause.OFFLINE_CONSUMER,
            (err) => cb(err),
          );
      },
    );
  };
}

export default WatchConsumersWorker;

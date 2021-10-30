import { ICallback, IConfig, IQueueMetrics } from '../../../types';
import { RedisClient } from '../redis-client/redis-client';
import { QueueManager } from './queue-manager';

export class QueueManagerFrontend {
  private static instance: QueueManagerFrontend | null = null;
  private redisClient: RedisClient;
  private queueManager: QueueManager;

  private constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;
    this.queueManager = new QueueManager(redisClient);
  }

  ///

  purgeDeadLetterQueue(queueName: string, cb: ICallback<void>): void {
    this.queueManager.purgeDeadLetterQueue(queueName, cb);
  }

  purgeAcknowledgedMessagesQueue(queueName: string, cb: ICallback<void>): void {
    this.queueManager.purgeAcknowledgedMessagesQueue(queueName, cb);
  }

  purgeQueue(queueName: string, cb: ICallback<void>): void {
    this.queueManager.purgeQueue(queueName, cb);
  }

  purgePriorityQueue(queueName: string, cb: ICallback<void>): void {
    this.queueManager.purgePriorityQueue(queueName, cb);
  }

  purgeScheduledMessagesQueue(cb: ICallback<void>): void {
    this.queueManager.purgeScheduledMessagesQueue(cb);
  }

  ///

  getQueueMetrics(queueName: string, cb: ICallback<IQueueMetrics>): void {
    this.queueManager.getQueueMetrics(queueName, cb);
  }

  ///

  quit(cb: ICallback<void>): void {
    this.queueManager.quit(() => {
      this.redisClient.halt(() => {
        QueueManagerFrontend.instance = null;
        cb();
      });
    });
  }

  ///

  static getSingletonInstance(
    config: IConfig,
    cb: ICallback<QueueManagerFrontend>,
  ): void {
    if (!QueueManagerFrontend.instance) {
      RedisClient.getNewInstance(config, (err, client) => {
        if (err) cb(err);
        else if (!client) cb(new Error(`Expected an instance of RedisClient`));
        else {
          const instance = new QueueManagerFrontend(client);
          QueueManagerFrontend.instance = instance;
          cb(null, instance);
        }
      });
    } else cb(null, QueueManagerFrontend.instance);
  }
}

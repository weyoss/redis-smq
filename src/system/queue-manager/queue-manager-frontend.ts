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

  purgeDeadLetterQueue(
    ns: string,
    queueName: string,
    cb: ICallback<void>,
  ): void {
    this.queueManager.purgeDeadLetterQueue(ns, queueName, cb);
  }

  purgeAcknowledgedMessagesQueue(
    ns: string,
    queueName: string,
    cb: ICallback<void>,
  ): void {
    this.queueManager.purgeAcknowledgedMessagesQueue(ns, queueName, cb);
  }

  purgeQueue(ns: string, queueName: string, cb: ICallback<void>): void {
    this.queueManager.purgeQueue(ns, queueName, cb);
  }

  purgePriorityQueue(ns: string, queueName: string, cb: ICallback<void>): void {
    this.queueManager.purgePriorityQueue(ns, queueName, cb);
  }

  purgeScheduledMessagesQueue(cb: ICallback<void>): void {
    this.queueManager.purgeScheduledMessagesQueue(cb);
  }

  ///

  getQueueMetrics(
    ns: string,
    queueName: string,
    cb: ICallback<IQueueMetrics>,
  ): void {
    this.queueManager.getQueueMetrics(ns, queueName, cb);
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

import { RedisClient } from './system/redis-client';
import { ICallback, IConfig, TQueueMetadata } from '../types';
import { redisKeys } from './system/redis-keys';
import { Metadata } from './system/metadata';

export class QueueManager {
  protected static instance: QueueManager | null = null;
  protected redisClient: RedisClient;

  protected constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;
  }

  getProcessingQueues(queueName: string, cb: ICallback<string[]>): void {
    const { keyIndexQueueMessageProcessingQueues } =
      redisKeys.getKeys(queueName);
    this.redisClient.hkeys(keyIndexQueueMessageProcessingQueues, cb);
  }

  getMessageQueues(cb: ICallback<string[]>): void {
    const { keyIndexQueue } = redisKeys.getGlobalKeys();
    this.redisClient.smembers(keyIndexQueue, cb);
  }

  getDeadLetterQueues(cb: ICallback<string[]>): void {
    const { keyIndexDLQueues } = redisKeys.getGlobalKeys();
    this.redisClient.smembers(keyIndexDLQueues, cb);
  }

  getQueueMetadata(queueName: string, cb: ICallback<TQueueMetadata>): void {
    Metadata.getQueueMetadata(this.redisClient, queueName, cb);
  }

  quit(cb: ICallback<void>): void {
    this.redisClient.halt(() => {
      QueueManager.instance = null;
      cb();
    });
  }

  static getSingletonInstance(
    config: IConfig,
    cb: ICallback<QueueManager>,
  ): void {
    if (!QueueManager.instance) {
      RedisClient.getNewInstance(config, (redisClient) => {
        const instance = new QueueManager(redisClient);
        QueueManager.instance = instance;
        cb(null, instance);
      });
    } else cb(null, QueueManager.instance);
  }
}

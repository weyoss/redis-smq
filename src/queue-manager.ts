import { RedisClient } from './system/redis-client/redis-client';
import { ICallback, IConfig, TQueueMetadata } from '../types';
import { redisKeys } from './system/redis-keys';
import { metadata } from './system/metadata';

export class QueueManager {
  protected static instance: QueueManager | null = null;
  protected redisClient: RedisClient;

  protected constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;
  }

  ///

  purgeDeadLetterQueue(queueName: string, cb: ICallback<void>): void {
    const { keyQueueDL } = redisKeys.getKeys(queueName);
    const multi = this.redisClient.multi();
    metadata.preQueueDeadLetterPurge(queueName, multi);
    multi.del(keyQueueDL);
    this.redisClient.execMulti(multi, (err) => cb(err));
  }

  purgeAcknowledgedMessagesQueue(queueName: string, cb: ICallback<void>): void {
    const { keyQueueAcknowledgedMessages } = redisKeys.getKeys(queueName);
    const multi = this.redisClient.multi();
    metadata.prePurgeAcknowledgedMessagesQueue(queueName, multi);
    multi.del(keyQueueAcknowledgedMessages);
    this.redisClient.execMulti(multi, (err) => cb(err));
  }

  purgeQueue(queueName: string, cb: ICallback<void>): void {
    const { keyQueue } = redisKeys.getKeys(queueName);
    const multi = this.redisClient.multi();
    metadata.preQueuePurge(queueName, multi);
    multi.del(keyQueue);
    this.redisClient.execMulti(multi, (err) => cb(err));
  }

  purgePriorityQueue(queueName: string, cb: ICallback<void>): void {
    const { keyQueuePriority } = redisKeys.getKeys(queueName);
    const multi = this.redisClient.multi();
    metadata.prePriorityQueuePurge(queueName, multi);
    multi.del(keyQueuePriority);
    this.redisClient.execMulti(multi, (err) => cb(err));
  }

  ///

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
    metadata.getQueueMetadata(this.redisClient, queueName, cb);
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

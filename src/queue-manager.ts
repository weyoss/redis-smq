import { RedisClient } from './redis-client';
import { ICallback, IConfig, TRedisClientMulti } from '../types';
import { Consumer } from './consumer';
import { Broker } from './broker';
import { redisKeys } from './redis-keys';
import { Instance } from './instance';

export class QueueManager {
  protected static instance: QueueManager | null = null;
  protected redisClient: RedisClient;

  constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;
  }

  bootstrap(instance: Instance, cb: ICallback<void>): void {
    const multi = this.redisClient.multi();
    const { keyIndexQueue, keyQueue, keyQueueDL, keyIndexDLQueues } =
      instance.getInstanceRedisKeys();
    multi.sadd(keyIndexDLQueues, keyQueueDL);
    multi.sadd(keyIndexQueue, keyQueue);
    if (instance instanceof Consumer) {
      const {
        keyQueueProcessing,
        keyIndexMessageProcessingQueues,
        keyIndexQueueMessageProcessingQueues,
      } = instance.getInstanceRedisKeys();
      multi.hset(
        keyIndexQueueMessageProcessingQueues,
        keyQueueProcessing,
        instance.getId(),
      );
      multi.sadd(keyIndexMessageProcessingQueues, keyQueueProcessing);
    }
    this.redisClient.execMulti(multi, (err) => cb(err));
  }

  deleteProcessingQueue(
    broker: Broker,
    processingQueueName: string,
    cb: ICallback<void>,
  ): void {
    const instance = broker.getInstance();
    const multi = this.redisClient.multi();
    const {
      keyIndexMessageProcessingQueues,
      keyIndexQueueMessageProcessingQueues,
    } = instance.getInstanceRedisKeys();
    multi.srem(keyIndexMessageProcessingQueues, processingQueueName);
    multi.hdel(keyIndexQueueMessageProcessingQueues, processingQueueName);
    multi.del(processingQueueName);
    multi.exec((err) => cb(err));
  }

  cleanProcessingQueue(
    processingQueue: string,
    multi: TRedisClientMulti,
  ): void {
    multi.rpop(processingQueue);
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

  getDLQQueues(cb: ICallback<string[]>): void {
    const { keyIndexDLQueues } = redisKeys.getGlobalKeys();
    this.redisClient.smembers(keyIndexDLQueues, cb);
  }

  quit(cb: ICallback<void>): void {
    if (this === QueueManager.instance) {
      this.redisClient.halt(() => {
        QueueManager.instance = null;
        cb();
      });
    } else cb();
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

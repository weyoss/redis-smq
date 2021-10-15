import { QueueManager as BaseQueueManager } from '../queue-manager';
import { RedisClient } from './redis-client';
import { Instance } from './instance';
import { ICallback, TRedisClientMulti } from '../../types';
import { Consumer } from '../consumer';
import { Broker } from './broker';

export class QueueManager extends BaseQueueManager {
  constructor(redisClient: RedisClient) {
    super(redisClient);
  }

  bootstrap(instance: Instance, cb: ICallback<void>): void {
    const multi = this.redisClient.multi();
    const { keyIndexQueue, keyQueue, keyQueueDL, keyIndexDLQueues } =
      instance.getRedisKeys();
    multi.sadd(keyIndexDLQueues, keyQueueDL);
    multi.sadd(keyIndexQueue, keyQueue);
    if (instance instanceof Consumer) {
      const {
        keyQueueProcessing,
        keyIndexMessageProcessingQueues,
        keyIndexQueueMessageProcessingQueues,
      } = instance.getRedisKeys();
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
    } = instance.getRedisKeys();
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

  quit(cb: ICallback<void>): void {
    if (this === QueueManager.instance) {
      this.redisClient.halt(() => {
        QueueManager.instance = null;
        cb();
      });
    } else cb();
  }
}

import { QueueManager as BaseQueueManager } from '../queue-manager';
import { RedisClient } from './redis-client';
import { Instance } from './instance';
import { ICallback, TRedisClientMulti } from '../../types';
import { Consumer } from '../consumer';
import { redisKeys } from './redis-keys';

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
    queueName: string,
    processingQueueName: string,
    cb: ICallback<void>,
  ): void {
    const multi = this.redisClient.multi();
    const {
      keyIndexMessageProcessingQueues,
      keyIndexQueueMessageProcessingQueues,
    } = redisKeys.getKeys(queueName);
    multi.srem(keyIndexMessageProcessingQueues, processingQueueName);
    multi.hdel(keyIndexQueueMessageProcessingQueues, processingQueueName);
    multi.del(processingQueueName);
    multi.exec((err) => cb(err));
  }

  purgeProcessingQueue(
    processingQueue: string,
    multi: TRedisClientMulti,
  ): void {
    multi.del(processingQueue);
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

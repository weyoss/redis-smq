import { RedisClient } from './system/redis-client/redis-client';
import { ICallback, IConfig, IQueueMetrics, TRedisClientMulti } from '../types';
import { redisKeys } from './system/redis-keys';
import { Instance } from './system/instance';
import { Consumer } from './consumer';
import * as async from 'async';

export class QueueManager {
  protected static instance: QueueManager | null = null;
  protected redisClient: RedisClient;

  constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;
  }

  ///

  bootstrap(instance: Instance, cb: ICallback<void>): void {
    const multi = this.redisClient.multi();
    const { keyIndexQueue, keyQueue, keyQueueDL, keyIndexDLQueues } =
      instance.getRedisKeys();
    multi.sadd(keyIndexDLQueues, keyQueueDL);
    multi.sadd(keyIndexQueue, keyQueue);
    if (instance instanceof Consumer) {
      const {
        keyQueueProcessing,
        keyIndexProcessingQueues,
        keyIndexQueueMessageProcessingQueues,
      } = instance.getRedisKeys();
      multi.hset(
        keyIndexQueueMessageProcessingQueues,
        keyQueueProcessing,
        instance.getId(),
      );
      multi.sadd(keyIndexProcessingQueues, keyQueueProcessing);
    }
    this.redisClient.execMulti(multi, (err) => cb(err));
  }

  deleteProcessingQueue(
    queueName: string,
    processingQueueName: string,
    cb: ICallback<void>,
  ): void {
    const multi = this.redisClient.multi();
    const { keyIndexProcessingQueues, keyIndexQueueMessageProcessingQueues } =
      redisKeys.getKeys(queueName);
    multi.srem(keyIndexProcessingQueues, processingQueueName);
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

  ///

  /*
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
   */

  ///

  getProcessingQueues(cb: ICallback<string[]>): void {
    const { keyIndexProcessingQueues } = redisKeys.getGlobalKeys();
    this.redisClient.smembers(keyIndexProcessingQueues, cb);
  }

  getMessageQueues(cb: ICallback<string[]>): void {
    const { keyIndexQueue } = redisKeys.getGlobalKeys();
    this.redisClient.smembers(keyIndexQueue, cb);
  }

  getDeadLetterQueues(cb: ICallback<string[]>): void {
    const { keyIndexDLQueues } = redisKeys.getGlobalKeys();
    this.redisClient.smembers(keyIndexDLQueues, cb);
  }

  getQueueMetrics(queueName: string, cb: ICallback<IQueueMetrics>): void {
    const queueMetrics: IQueueMetrics = {
      acknowledged: 0,
      pendingWithPriority: 0,
      deadLettered: 0,
      pending: 0,
    };
    const {
      keyQueue,
      keyQueuePriority,
      keyQueueDL,
      keyQueueAcknowledgedMessages,
    } = redisKeys.getKeys(queueName);
    async.waterfall(
      [
        (cb: ICallback<void>) => {
          this.redisClient.llen(keyQueue, (err, reply) => {
            if (err) cb(err);
            else {
              queueMetrics.pending = reply ?? 0;
              cb();
            }
          });
        },
        (cb: ICallback<void>) => {
          this.redisClient.llen(keyQueueDL, (err, reply) => {
            if (err) cb(err);
            else {
              queueMetrics.deadLettered = reply ?? 0;
              cb();
            }
          });
        },
        (cb: ICallback<void>) => {
          this.redisClient.llen(keyQueueAcknowledgedMessages, (err, reply) => {
            if (err) cb(err);
            else {
              queueMetrics.acknowledged = reply ?? 0;
              cb();
            }
          });
        },
        (cb: ICallback<void>) => {
          this.redisClient.zcard(keyQueuePriority, (err, reply) => {
            if (err) cb(err);
            else {
              queueMetrics.pendingWithPriority = reply ?? 0;
              cb();
            }
          });
        },
      ],
      (err) => {
        if (err) cb(err);
        else cb(null, queueMetrics);
      },
    );
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

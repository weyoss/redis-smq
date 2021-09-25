import { RedisClient } from './redis-client';
import { TCallback } from '../types';
import { redisKeys } from './redis-keys';
import * as async from 'neo-async';
import { events } from './events';
import { EventEmitter } from 'events';

export class Queue extends EventEmitter {
  protected redisClientInstance: RedisClient;

  constructor(redisClient: RedisClient) {
    super();
    this.redisClientInstance = redisClient;
  }

  getMessageQueues(cb: TCallback<string[]>): void {
    const { keyIndexQueue } = redisKeys.getGlobalKeys();
    this.redisClientInstance.smembers(keyIndexQueue, cb);
  }

  getDLQQueues(cb: TCallback<string[]>): void {
    const { keyIndexQueueDLQ } = redisKeys.getGlobalKeys();
    this.redisClientInstance.smembers(keyIndexQueueDLQ, cb);
  }

  setupQueues(queueName: string): void {
    const { keyIndexQueue, keyQueue, keyQueueDLQ, keyIndexQueueDLQ } =
      redisKeys.getKeys(queueName);
    const rememberDLQ = (cb: TCallback<void>) => {
      this.redisClientInstance.sadd(
        keyIndexQueueDLQ,
        keyQueueDLQ,
        (err?: Error | null) => {
          if (err) cb(err);
          else cb();
        },
      );
    };
    const rememberQueue = (cb: TCallback<void>) => {
      this.redisClientInstance.sadd(
        keyIndexQueue,
        keyQueue,
        (err?: Error | null) => {
          if (err) cb(err);
          else cb();
        },
      );
    };
    async.parallel([rememberQueue, rememberDLQ], (err?: Error | null) => {
      if (err) throw err;
      else this.emit(events.SYSTEM_QUEUES_CREATED);
    });
  }

  setupConsumerQueues(
    queueName: string,
    consumerId: string,
    cb: TCallback<any[]>,
  ): void {
    const {
      keyConsumerProcessingQueue,
      keyIndexQueueProcessing,
      keyIndexQueueQueuesProcessing,
    } = redisKeys.getInstanceKeys(queueName, consumerId);
    const multi = this.redisClientInstance.multi();
    multi.hset(
      keyIndexQueueQueuesProcessing,
      keyConsumerProcessingQueue,
      consumerId,
    );
    multi.sadd(keyIndexQueueProcessing, keyConsumerProcessingQueue);
    this.redisClientInstance.execMulti(multi, cb);
  }

  deleteProcessingQueue(
    queueName: string,
    processingQueueName: string,
    cb: TCallback<void>,
  ): void {
    const multi = this.redisClientInstance.multi();
    const { keyIndexQueueProcessing, keyIndexQueueQueuesProcessing } =
      redisKeys.getKeys(queueName);
    multi.srem(keyIndexQueueProcessing, processingQueueName);
    multi.hdel(keyIndexQueueQueuesProcessing, processingQueueName);
    multi.del(processingQueueName);
    multi.exec((err) => cb(err));
  }

  getProcessingQueues(queueName: string, cb: TCallback<string[]>): void {
    const { keyIndexQueueQueuesProcessing } = redisKeys.getKeys(queueName);
    this.redisClientInstance.hkeys(keyIndexQueueQueuesProcessing, cb);
  }
}

import { RedisClient } from './redis-client';
import { ICallback } from '../types';
import { redisKeys } from './redis-keys';
import * as async from 'async';

export const queueHelpers = {
  getMessageQueues(redisClient: RedisClient, cb: ICallback<string[]>): void {
    const { keyIndexQueue } = redisKeys.getGlobalKeys();
    redisClient.smembers(keyIndexQueue, cb);
  },

  getDLQQueues(redisClient: RedisClient, cb: ICallback<string[]>): void {
    const { keyIndexQueueDLQ } = redisKeys.getGlobalKeys();
    redisClient.smembers(keyIndexQueueDLQ, cb);
  },

  setupQueues(
    redisClient: RedisClient,
    queueName: string,
    cb: ICallback<void>,
  ): void {
    const { keyIndexQueue, keyQueue, keyQueueDLQ, keyIndexQueueDLQ } =
      redisKeys.getKeys(queueName);
    const rememberDLQ = (cb: ICallback<unknown>) => {
      redisClient.sadd(keyIndexQueueDLQ, keyQueueDLQ, cb);
    };
    const rememberQueue = (cb: ICallback<unknown>) => {
      redisClient.sadd(keyIndexQueue, keyQueue, cb);
    };
    async.parallel([rememberQueue, rememberDLQ], (err?: Error | null) =>
      cb(err),
    );
  },

  setupConsumerQueues(
    redisClient: RedisClient,
    queueName: string,
    consumerId: string,
    cb: ICallback<void>,
  ): void {
    const {
      keyConsumerProcessingQueue,
      keyIndexQueueProcessing,
      keyIndexQueueQueuesProcessing,
    } = redisKeys.getInstanceKeys(queueName, consumerId);
    const multi = redisClient.multi();
    multi.hset(
      keyIndexQueueQueuesProcessing,
      keyConsumerProcessingQueue,
      consumerId,
    );
    multi.sadd(keyIndexQueueProcessing, keyConsumerProcessingQueue);
    redisClient.execMulti(multi, (err) => cb(err));
  },

  deleteProcessingQueue(
    redisClient: RedisClient,
    queueName: string,
    processingQueueName: string,
    cb: ICallback<void>,
  ): void {
    const multi = redisClient.multi();
    const { keyIndexQueueProcessing, keyIndexQueueQueuesProcessing } =
      redisKeys.getKeys(queueName);
    multi.srem(keyIndexQueueProcessing, processingQueueName);
    multi.hdel(keyIndexQueueQueuesProcessing, processingQueueName);
    multi.del(processingQueueName);
    multi.exec((err) => cb(err));
  },

  getProcessingQueues(
    redisClient: RedisClient,
    queueName: string,
    cb: ICallback<string[]>,
  ): void {
    const { keyIndexQueueQueuesProcessing } = redisKeys.getKeys(queueName);
    redisClient.hkeys(keyIndexQueueQueuesProcessing, cb);
  },
};

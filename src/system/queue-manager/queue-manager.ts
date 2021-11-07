import { RedisClient } from '../redis-client/redis-client';
import { ICallback, IQueueMetrics, TMessageQueue } from '../../../types';
import { redisKeys } from '../common/redis-keys';
import { Base } from '../base';
import { Consumer } from '../consumer/consumer';
import * as async from 'async';

export class QueueManager {
  protected redisClient: RedisClient;

  constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;
  }

  ///

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

  quit(cb: ICallback<void>): void {
    // No work is needed for now
    // Keeping this method for convention and maybe later use
    cb();
  }

  ///

  purgeDeadLetterQueue(
    queueName: string,
    ns: string | undefined,
    cb: ICallback<void>,
  ): void {
    const { keyQueueDL } = redisKeys.getKeys(queueName, ns);
    this.redisClient.del(keyQueueDL, (err) => cb(err));
  }

  purgeAcknowledgedMessagesQueue(
    queueName: string,
    ns: string | undefined,
    cb: ICallback<void>,
  ): void {
    const { keyQueueAcknowledgedMessages } = redisKeys.getKeys(queueName, ns);
    this.redisClient.del(keyQueueAcknowledgedMessages, (err) => cb(err));
  }

  purgeQueue(
    queueName: string,
    ns: string | undefined,
    cb: ICallback<void>,
  ): void {
    const { keyQueue } = redisKeys.getKeys(queueName, ns);
    this.redisClient.del(keyQueue, (err) => cb(err));
  }

  purgePriorityQueue(
    queueName: string,
    ns: string | undefined,
    cb: ICallback<void>,
  ): void {
    const { keyQueuePriority } = redisKeys.getKeys(queueName, ns);
    this.redisClient.del(keyQueuePriority, (err) => cb(err));
  }

  purgeScheduledMessagesQueue(cb: ICallback<void>): void {
    const { keyQueueScheduled } = redisKeys.getGlobalKeys();
    this.redisClient.del(keyQueueScheduled, (err) => cb(err));
  }
  ///

  getProcessingQueues(cb: ICallback<string[]>): void {
    const { keyIndexProcessingQueues } = redisKeys.getGlobalKeys();
    this.redisClient.smembers(keyIndexProcessingQueues, cb);
  }

  getMessageQueues(cb: ICallback<TMessageQueue[]>): void {
    const { keyIndexQueue } = redisKeys.getGlobalKeys();
    this.redisClient.smembers(keyIndexQueue, (err, reply) => {
      if (err) cb(err);
      else if (!reply) cb(new Error('Expected an array reply'));
      else {
        const messageQueues: TMessageQueue[] = reply.map((i) => JSON.parse(i));
        cb(null, messageQueues);
      }
    });
  }

  getQueueMetrics(
    queueName: string,
    ns: string | undefined,
    cb: ICallback<IQueueMetrics>,
  ): void {
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
    } = redisKeys.getKeys(queueName, ns);
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

  static registerQueues(
    instance: Base,
    redisClient: RedisClient,
    cb: ICallback<void>,
  ): void {
    const multi = redisClient.multi();
    const { keyIndexQueue } = instance.getRedisKeys();
    const queue: TMessageQueue = {
      name: instance.getQueueName(),
      ns: redisKeys.getNamespace(),
    };
    multi.sadd(keyIndexQueue, JSON.stringify(queue));
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
    redisClient.execMulti(multi, (err) => cb(err));
  }
}

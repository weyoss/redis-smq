import { RedisClient } from '../common/redis-client/redis-client';
import { ICallback, IQueueMetrics, TQueueParams } from '../../../types';
import { redisKeys } from '../common/redis-keys/redis-keys';
import * as async from 'async';
import { EmptyCallbackReplyError } from '../common/errors/empty-callback-reply.error';
import { GenericError } from '../common/errors/generic.error';
import { ConsumerMessageHandler } from '../consumer/consumer-message-handler';
import {
  checkQueueLock,
  lockQueue,
  validateMessageQueueDeletion,
} from './common';

export const queueManager = {
  queueExists(
    redisClient: RedisClient,
    queue: TQueueParams,
    cb: ICallback<void>,
  ): void {
    const { keyQueues } = redisKeys.getMainKeys();
    redisClient.sismember(keyQueues, JSON.stringify(queue), (err, reply) => {
      if (err) cb(err);
      else if (!reply) cb(new GenericError(`Queue does not exist`));
      else cb();
    });
  },

  /**
   * When deleting a message queue, all queue's related queues and data will be deleted from the system. If the given
   * queue has an online consumer/producer, an error will be returned. For determining if consumer/producer is online,
   * an additional heartbeat check is performed, so that crushed consumers/producers would not block queue deletion.
   */
  deleteMessageQueue(
    redisClient: RedisClient,
    queue: TQueueParams,
    cb: ICallback<void>,
  ): void {
    lockQueue(redisClient, queue, (err, lockManager) => {
      if (err) cb(err);
      else if (!lockManager) cb(new EmptyCallbackReplyError());
      else {
        const {
          keyQueuePending,
          keyQueueDL,
          keyQueueProcessingQueues,
          keyQueuePendingPriorityMessageIds,
          keyQueueAcknowledged,
          keyQueuePendingPriorityMessages,
          keyRateQueueDeadLettered,
          keyRateQueueAcknowledged,
          keyRateQueuePublished,
          keyRateQueueDeadLetteredIndex,
          keyRateQueueAcknowledgedIndex,
          keyRateQueuePublishedIndex,
          keyLockRateQueuePublished,
          keyLockRateQueueAcknowledged,
          keyLockRateQueueDeadLettered,
          keyQueueConsumers,
          keyProcessingQueues,
          keyQueues,
        } = redisKeys.getQueueKeys(queue.name, queue.ns);
        const keys: string[] = [
          keyQueuePending,
          keyQueueDL,
          keyQueueProcessingQueues,
          keyQueuePendingPriorityMessageIds,
          keyQueueAcknowledged,
          keyQueuePendingPriorityMessages,
          keyRateQueueDeadLettered,
          keyRateQueueAcknowledged,
          keyRateQueuePublished,
          keyRateQueueDeadLetteredIndex,
          keyRateQueueAcknowledgedIndex,
          keyRateQueuePublishedIndex,
          keyLockRateQueuePublished,
          keyLockRateQueueAcknowledged,
          keyLockRateQueueDeadLettered,
          keyQueueConsumers,
        ];
        const multi = redisClient.multi();
        multi.srem(keyQueues, JSON.stringify(queue));
        const handleProcessingQueues = (cb: ICallback<void>): void => {
          this.getQueueProcessingQueues(redisClient, queue, (err, reply) => {
            if (err) cb(err);
            else {
              const pQueues = Object.keys(reply ?? {});
              if (pQueues.length) {
                keys.push(...pQueues);
                multi.srem(keyProcessingQueues, ...pQueues);
              }
              cb();
            }
          });
        };
        async.waterfall(
          [
            (cb: ICallback<void>): void =>
              this.queueExists(redisClient, queue, cb),
            (cb: ICallback<void>): void =>
              validateMessageQueueDeletion(redisClient, queue, cb),
            handleProcessingQueues,
            (cb: ICallback<void>): void => {
              multi.del(...keys);
              cb();
            },
            (cb: ICallback<void>): void => {
              redisClient.execMulti(multi, (err) => cb(err));
            },
          ],
          (err) => {
            lockManager.releaseLock(() => cb(err)); // ignore lock errors
          },
        );
      }
    });
  },

  deleteProcessingQueue(
    redisClient: RedisClient,
    queue: TQueueParams,
    processingQueue: string,
    cb: ICallback<void>,
  ): void {
    const multi = redisClient.multi();
    const { keyProcessingQueues, keyQueueProcessingQueues } =
      redisKeys.getQueueKeys(queue.name, queue.ns);
    multi.srem(keyProcessingQueues, processingQueue);
    multi.hdel(keyQueueProcessingQueues, processingQueue);
    multi.del(processingQueue);
    multi.exec((err) => cb(err));
  },

  ///

  getQueueProcessingQueues(
    redisClient: RedisClient,
    queue: TQueueParams,
    cb: ICallback<Record<string, string>>,
  ): void {
    const { keyQueueProcessingQueues } = redisKeys.getQueueKeys(
      queue.name,
      queue.ns,
    );
    redisClient.hgetall(keyQueueProcessingQueues, cb);
  },

  getQueueMetrics(
    redisClient: RedisClient,
    queue: TQueueParams,
    cb: ICallback<IQueueMetrics>,
  ): void {
    const queueMetrics: IQueueMetrics = {
      acknowledged: 0,
      pendingWithPriority: 0,
      deadLettered: 0,
      pending: 0,
    };
    const {
      keyQueuePending,
      keyQueuePendingPriorityMessageIds,
      keyQueueDL,
      keyQueueAcknowledged,
    } = redisKeys.getQueueKeys(queue.name, queue.ns);
    async.waterfall(
      [
        (cb: ICallback<void>) => {
          redisClient.llen(keyQueuePending, (err, reply) => {
            if (err) cb(err);
            else {
              queueMetrics.pending = reply ?? 0;
              cb();
            }
          });
        },
        (cb: ICallback<void>) => {
          redisClient.llen(keyQueueDL, (err, reply) => {
            if (err) cb(err);
            else {
              queueMetrics.deadLettered = reply ?? 0;
              cb();
            }
          });
        },
        (cb: ICallback<void>) => {
          redisClient.llen(keyQueueAcknowledged, (err, reply) => {
            if (err) cb(err);
            else {
              queueMetrics.acknowledged = reply ?? 0;
              cb();
            }
          });
        },
        (cb: ICallback<void>) => {
          redisClient.zcard(keyQueuePendingPriorityMessageIds, (err, reply) => {
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
  },

  getMessageQueues(
    redisClient: RedisClient,
    cb: ICallback<TQueueParams[]>,
  ): void {
    const { keyQueues } = redisKeys.getMainKeys();
    redisClient.smembers(keyQueues, (err, reply) => {
      if (err) cb(err);
      else if (!reply) cb(new EmptyCallbackReplyError());
      else {
        const messageQueues: TQueueParams[] = reply.map((i) => JSON.parse(i));
        cb(null, messageQueues);
      }
    });
  },

  getProcessingQueues(redisClient: RedisClient, cb: ICallback<string[]>): void {
    const { keyProcessingQueues } = redisKeys.getMainKeys();
    redisClient.smembers(keyProcessingQueues, cb);
  },

  setUpProcessingQueue(
    consumerHandler: ConsumerMessageHandler,
    redisClient: RedisClient,
    cb: ICallback<void>,
  ): void {
    const queue = consumerHandler.getQueue();
    checkQueueLock(redisClient, queue, (err) => {
      if (err) cb(err);
      else {
        const {
          keyQueueProcessing,
          keyProcessingQueues,
          keyQueueProcessingQueues,
        } = consumerHandler.getRedisKeys();
        const multi = redisClient.multi();
        multi.hset(
          keyQueueProcessingQueues,
          keyQueueProcessing,
          consumerHandler.getConsumerId(),
        );
        multi.sadd(keyProcessingQueues, keyQueueProcessing);
        redisClient.execMulti(multi, (err) => cb(err));
      }
    });
  },

  setUpMessageQueue(
    redisClient: RedisClient,
    queue: TQueueParams,
    cb: ICallback<void>,
  ): void {
    checkQueueLock(redisClient, queue, (err) => {
      if (err) cb(err);
      else {
        const { keyQueues } = redisKeys.getQueueKeys(queue.name, queue.ns);
        const str = JSON.stringify(queue);
        redisClient.sadd(keyQueues, str, (err) => cb(err));
      }
    });
  },

  getQueueParams(queue: string | TQueueParams): TQueueParams {
    const queueParams: TQueueParams =
      typeof queue === 'string'
        ? {
            name: queue,
            ns: redisKeys.getNamespace(),
          }
        : queue;
    const name = redisKeys.validateRedisKey(queueParams.name);
    const ns = redisKeys.validateRedisKey(queueParams.ns);
    return {
      name,
      ns,
    };
  },
};

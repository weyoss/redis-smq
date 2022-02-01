import { RedisClient } from '../../common/redis-client/redis-client';
import {
  ICallback,
  IQueueMetrics,
  TQueueParams,
  TRedisClientMulti,
} from '../../../../types';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { EmptyCallbackReplyError } from '../../common/errors/empty-callback-reply.error';
import { GenericError } from '../../common/errors/generic.error';
import { ConsumerMessageHandler } from '../consumer/consumer-message-handler';
import { validateMessageQueueDeletion } from './common';
import { waterfall } from '../../lib/async';

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
   * queue has an online consumer, an error will be returned. To make sure that a consumer is online,
   * an additional heartbeat check is performed, so that crushed consumers would not block queue deletion for a certain
   * time.
   */
  deleteMessageQueue(
    redisClient: RedisClient,
    queue: TQueueParams,
    cb: ICallback<void>,
  ): void {
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
    redisClient.watch(
      [keyQueues, keyQueueConsumers, keyQueueProcessingQueues],
      (err) => {
        if (err) cb(err);
        else {
          waterfall(
            [
              (cb: ICallback<void>): void =>
                this.queueExists(redisClient, queue, cb),
              (cb: ICallback<void>): void =>
                validateMessageQueueDeletion(redisClient, queue, cb),
              (cb: ICallback<string[]>) => {
                this.getQueueProcessingQueues(
                  redisClient,
                  queue,
                  (err, reply) => {
                    if (err) cb(err);
                    else {
                      const pQueues = Object.keys(reply ?? {});
                      cb(null, pQueues);
                    }
                  },
                );
              },
            ],
            (err?: Error | null, processingQueues?: string[] | null) => {
              if (err) redisClient.unwatch(() => cb(err));
              else {
                const multi = redisClient.multi();
                multi.srem(keyQueues, JSON.stringify(queue));
                const pQueues = processingQueues ?? [];
                if (pQueues.length) {
                  keys.push(...pQueues);
                  multi.srem(keyProcessingQueues, ...pQueues);
                }
                multi.del(...keys);
                redisClient.execMulti(multi, (err) => cb(err));
              }
            },
          );
        }
      },
    );
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
    waterfall(
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
    multi: TRedisClientMulti,
    consumerHandler: ConsumerMessageHandler,
  ): void {
    const {
      keyQueueProcessing,
      keyProcessingQueues,
      keyQueueProcessingQueues,
    } = consumerHandler.getRedisKeys();
    multi.hset(
      keyQueueProcessingQueues,
      keyQueueProcessing,
      consumerHandler.getConsumerId(),
    );
    multi.sadd(keyProcessingQueues, keyQueueProcessing);
  },

  setUpMessageQueue(multi: TRedisClientMulti, queue: TQueueParams): void {
    const { keyQueues } = redisKeys.getQueueKeys(queue.name, queue.ns);
    const str = JSON.stringify(queue);
    multi.sadd(keyQueues, str);
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

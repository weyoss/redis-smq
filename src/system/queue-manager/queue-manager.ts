import { RedisClient } from '../common/redis-client/redis-client';
import { ICallback, IQueueMetrics, TQueueParams } from '../../../types';
import { redisKeys } from '../common/redis-keys/redis-keys';
import { Consumer } from '../consumer/consumer';
import * as async from 'async';
import BLogger from 'bunyan';
import { EmptyCallbackReplyError } from '../common/errors/empty-callback-reply.error';
import { Producer } from '../producer/producer';
import { Heartbeat } from '../common/heartbeat/heartbeat';
import { GenericError } from '../common/errors/generic.error';
import { LockManager } from '../common/lock-manager/lock-manager';

export class QueueManager {
  protected redisClient: RedisClient;
  protected logger: BLogger;

  constructor(redisClient: RedisClient, logger: BLogger) {
    this.redisClient = redisClient;
    this.logger = logger.child({ child: QueueManager.name });
  }

  ///

  protected validateMessageQueueDeletion = (
    queue: TQueueParams,
    cb: ICallback<void>,
  ): void => {
    const verifyHeartbeats = (heartbeatKeys: string[], cb: ICallback<void>) => {
      if (heartbeatKeys.length) {
        Heartbeat.validateHeartbeatsOf(
          this.redisClient,
          heartbeatKeys,
          (err, reply) => {
            if (err) cb(err);
            else {
              const r = reply ?? {};
              const onlineArr = Object.keys(r).filter((id) => r[id]);
              if (onlineArr.length)
                cb(
                  new GenericError(
                    `The queue is currently in use. Before deleting a queue, shutdown all its consumers and producers.`,
                  ),
                );
            }
          },
        );
      } else cb();
    };
    const getOnlineConsumers = (cb: ICallback<string[]>): void => {
      Consumer.getOnlineConsumerIds(this.redisClient, queue, (err, reply) => {
        if (err) cb(err);
        else {
          const heartbeatKeys = (reply ?? []).map((id) => {
            const { keyHeartbeatConsumer } = redisKeys.getConsumerKeys(
              queue.name,
              id,
              queue.ns,
            );
            return keyHeartbeatConsumer;
          });
          cb(null, heartbeatKeys);
        }
      });
    };
    const getOnlineProducers = (cb: ICallback<string[]>): void => {
      Producer.getOnlineProducerIds(this.redisClient, queue, (err, reply) => {
        if (err) cb(err);
        else {
          const heartbeatKeys = (reply ?? []).map((id) => {
            const { keyHeartbeatProducer } = redisKeys.getProducerKeys(
              queue.name,
              id,
              queue.ns,
            );
            return keyHeartbeatProducer;
          });
          cb(null, heartbeatKeys);
        }
      });
    };
    async.waterfall(
      [
        getOnlineConsumers,
        verifyHeartbeats,
        getOnlineProducers,
        verifyHeartbeats,
      ],
      (err) => cb(err),
    );
  };

  protected lockQueue = (
    queue: TQueueParams,
    cb: ICallback<LockManager>,
  ): void => {
    const { keyLockQueue } = redisKeys.getKeys(queue.name, queue.ns);
    const lockManager = new LockManager(
      this.redisClient,
      keyLockQueue,
      30000,
      false,
    );
    lockManager.acquireLock((err, locked) => {
      if (err) cb(err);
      else if (!locked)
        cb(new GenericError(`Could not acquire a lock. Try again later.`));
      else cb(null, lockManager);
    });
  };

  protected queueExists = (queue: TQueueParams, cb: ICallback<void>): void => {
    const { keyQueues } = redisKeys.getGlobalKeys();
    this.redisClient.sismember(
      keyQueues,
      JSON.stringify(queue),
      (err, reply) => {
        if (err) cb(err);
        else if (!reply) cb(new GenericError(`Queue does not exist`));
        else cb();
      },
    );
  };

  /**
   * When deleting a message queue, all queue's related queues and data will be deleted from the system. If the given
   * queue has an online consumer/producer, an error will be returned. For determining if consumer/producer is online,
   * an additional heartbeat check is performed, so that crushed consumers/producers would not block queue deletion.
   */
  deleteMessageQueue(queue: TQueueParams, cb: ICallback<void>): void {
    this.lockQueue(queue, (err, lockManager) => {
      if (err) cb(err);
      else if (!lockManager) cb(new EmptyCallbackReplyError());
      else {
        const {
          keyQueuePending,
          keyQueueDL,
          keyQueueProcessingQueues,
          keyQueuePriority,
          keyQueueAcknowledged,
          keyQueuePendingWithPriority,
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
          keyQueueProducers,
          keyProcessingQueues,
          keyQueues,
        } = redisKeys.getKeys(queue.name, queue.ns);
        const keys: string[] = [
          keyQueuePending,
          keyQueueDL,
          keyQueueProcessingQueues,
          keyQueuePriority,
          keyQueueAcknowledged,
          keyQueuePendingWithPriority,
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
          keyQueueProducers,
        ];
        const multi = this.redisClient.multi();
        multi.srem(keyQueues, JSON.stringify(queue));
        const handleProcessingQueues = (cb: ICallback<void>): void =>
          this.getQueueProcessingQueues(queue, (err, reply) => {
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
        async.waterfall(
          [
            (cb: ICallback<void>): void => this.queueExists(queue, cb),
            (cb: ICallback<void>): void =>
              this.validateMessageQueueDeletion(queue, cb),
            handleProcessingQueues,
            (cb: ICallback<void>): void => {
              multi.del(...keys);
              cb();
            },
            (cb: ICallback<void>): void => {
              this.redisClient.execMulti(multi, (err) => cb(err));
            },
          ],
          (err) => {
            lockManager.releaseLock(() => cb(err)); // ignore lock errors
          },
        );
      }
    });
  }

  deleteProcessingQueue(
    queue: TQueueParams,
    processingQueue: string,
    cb: ICallback<void>,
  ): void {
    this.logger.debug(
      `Deleting processing queue (${processingQueue}) of (${queue.name} from ${queue.ns} namespace)...`,
    );
    const multi = this.redisClient.multi();
    const { keyProcessingQueues, keyQueueProcessingQueues } = redisKeys.getKeys(
      queue.name,
      queue.ns,
    );
    multi.srem(keyProcessingQueues, processingQueue);
    multi.hdel(keyQueueProcessingQueues, processingQueue);
    multi.del(processingQueue);
    multi.exec((err) => cb(err));
  }

  quit(cb: ICallback<void>): void {
    // No work is needed for now
    // Keeping this method for convention and maybe later use
    cb();
  }

  ///

  purgeDeadLetteredQueue(queue: TQueueParams, cb: ICallback<void>): void {
    this.logger.debug(
      `Purging dead-letter queue of (${queue.name}, ${queue.ns})...`,
    );
    const { keyQueueDL } = redisKeys.getKeys(queue.name, queue.ns);
    this.redisClient.del(keyQueueDL, (err) => cb(err));
  }

  purgeAcknowledgedQueue(queue: TQueueParams, cb: ICallback<void>): void {
    this.logger.debug(
      `Purging dead-letter queue of (${queue.name}, ${queue.ns})...`,
    );
    const { keyQueueAcknowledged } = redisKeys.getKeys(queue.name, queue.ns);
    this.redisClient.del(keyQueueAcknowledged, (err) => cb(err));
  }

  purgePendingQueue(queue: TQueueParams, cb: ICallback<void>): void {
    this.logger.debug(
      `Purging pending queue of (${queue.name}, ${queue.ns})...`,
    );
    const { keyQueuePending } = redisKeys.getKeys(queue.name, queue.ns);
    this.redisClient.del(keyQueuePending, (err) => cb(err));
  }

  purgePriorityQueue(queue: TQueueParams, cb: ICallback<void>): void {
    this.logger.debug(
      `Purging priority queue of (${queue.name}, ${queue.ns})...`,
    );
    const { keyQueuePriority } = redisKeys.getKeys(queue.name, queue.ns);
    this.redisClient.del(keyQueuePriority, (err) => cb(err));
  }

  purgeScheduledQueue(cb: ICallback<void>): void {
    this.logger.debug(`Purging scheduled messages queue...`);
    const { keyScheduledMessages } = redisKeys.getGlobalKeys();
    this.redisClient.del(keyScheduledMessages, (err) => cb(err));
  }

  ///

  getQueueProcessingQueues(
    queue: TQueueParams,
    cb: ICallback<Record<string, string>>,
  ): void {
    const { keyQueueProcessingQueues } = redisKeys.getKeys(
      queue.name,
      queue.ns,
    );
    this.redisClient.hgetall(keyQueueProcessingQueues, cb);
  }

  getProcessingQueues(cb: ICallback<string[]>): void {
    const { keyProcessingQueues } = redisKeys.getGlobalKeys();
    this.redisClient.smembers(keyProcessingQueues, cb);
  }

  getMessageQueues(cb: ICallback<TQueueParams[]>): void {
    const { keyQueues } = redisKeys.getGlobalKeys();
    this.redisClient.smembers(keyQueues, (err, reply) => {
      if (err) cb(err);
      else if (!reply) cb(new EmptyCallbackReplyError());
      else {
        const messageQueues: TQueueParams[] = reply.map((i) => JSON.parse(i));
        cb(null, messageQueues);
      }
    });
  }

  getQueueMetrics(queue: TQueueParams, cb: ICallback<IQueueMetrics>): void {
    const queueMetrics: IQueueMetrics = {
      acknowledged: 0,
      pendingWithPriority: 0,
      deadLettered: 0,
      pending: 0,
    };
    const {
      keyQueuePending,
      keyQueuePriority,
      keyQueueDL,
      keyQueueAcknowledged,
    } = redisKeys.getKeys(queue.name, queue.ns);
    async.waterfall(
      [
        (cb: ICallback<void>) => {
          this.redisClient.llen(keyQueuePending, (err, reply) => {
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
          this.redisClient.llen(keyQueueAcknowledged, (err, reply) => {
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

  protected static checkQueueLock = (
    redisClient: RedisClient,
    queue: TQueueParams,
    cb: ICallback<boolean>,
  ): void => {
    const { keyLockQueue } = redisKeys.getKeys(queue.name, queue.ns);
    redisClient.exists(keyLockQueue, (err, reply) => {
      if (err) cb(err);
      else if (reply) cb(new GenericError(`Queue is currently locked`));
      else cb();
    });
  };

  static setUpProcessingQueue(
    consumer: Consumer,
    redisClient: RedisClient,
    cb: ICallback<void>,
  ): void {
    const queue = consumer.getQueue();
    QueueManager.checkQueueLock(redisClient, queue, (err) => {
      if (err) cb(err);
      else {
        const {
          keyQueueProcessing,
          keyProcessingQueues,
          keyQueueProcessingQueues,
        } = consumer.getRedisKeys();
        const multi = redisClient.multi();
        multi.hset(
          keyQueueProcessingQueues,
          keyQueueProcessing,
          consumer.getId(),
        );
        multi.sadd(keyProcessingQueues, keyQueueProcessing);
        redisClient.execMulti(multi, (err) => cb(err));
      }
    });
  }

  static setUpMessageQueue(
    queue: TQueueParams,
    redisClient: RedisClient,
    cb: ICallback<void>,
  ): void {
    QueueManager.checkQueueLock(redisClient, queue, (err) => {
      if (err) cb(err);
      else {
        const { keyQueues } = redisKeys.getKeys(queue.name, queue.ns);
        const str = JSON.stringify(queue);
        redisClient.sadd(keyQueues, str, (err) => cb(err));
      }
    });
  }
}

import { RedisClient } from '../redis-client/redis-client';
import { ICallback, IQueueMetrics, TQueueParams } from '../../../types';
import { redisKeys } from '../common/redis-keys/redis-keys';
import { Consumer } from '../consumer/consumer';
import * as async from 'async';
import BLogger from 'bunyan';
import { EmptyCallbackReplyError } from '../common/errors/empty-callback-reply.error';

export class QueueManager {
  protected redisClient: RedisClient;
  protected logger: BLogger;

  constructor(redisClient: RedisClient, logger: BLogger) {
    this.redisClient = redisClient;
    this.logger = logger.child({ child: QueueManager.name });
  }

  ///

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

  purgeDeadLetterQueue(queue: TQueueParams, cb: ICallback<void>): void {
    this.logger.debug(
      `Purging dead-letter queue of (${queue.name}, ${queue.ns})...`,
    );
    const { keyQueueDL } = redisKeys.getKeys(queue.name, queue.ns);
    this.redisClient.del(keyQueueDL, (err) => cb(err));
  }

  purgeAcknowledgedMessagesQueue(
    queue: TQueueParams,
    cb: ICallback<void>,
  ): void {
    this.logger.debug(
      `Purging dead-letter queue of (${queue.name}, ${queue.ns})...`,
    );
    const { keyQueueAcknowledged } = redisKeys.getKeys(queue.name, queue.ns);
    this.redisClient.del(keyQueueAcknowledged, (err) => cb(err));
  }

  purgeQueue(queue: TQueueParams, cb: ICallback<void>): void {
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

  purgeScheduledMessagesQueue(cb: ICallback<void>): void {
    this.logger.debug(`Purging scheduled messages queue...`);
    const { keyQueueScheduled } = redisKeys.getGlobalKeys();
    this.redisClient.del(keyQueueScheduled, (err) => cb(err));
  }
  ///

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

  static setUpProcessingQueue(
    consumer: Consumer,
    redisClient: RedisClient,
    cb: ICallback<void>,
  ): void {
    const {
      keyQueueProcessing,
      keyProcessingQueues,
      keyQueueProcessingQueues,
    } = consumer.getRedisKeys();
    const multi = redisClient.multi();
    multi.hset(keyQueueProcessingQueues, keyQueueProcessing, consumer.getId());
    multi.sadd(keyProcessingQueues, keyQueueProcessing);
    redisClient.execMulti(multi, (err) => cb(err));
  }

  static setUpMessageQueue(
    queue: TQueueParams,
    redisClient: RedisClient,
    cb: ICallback<void>,
  ): void {
    const { keyQueues } = redisKeys.getKeys(queue.name, queue.ns);
    const str = JSON.stringify(queue);
    redisClient.sadd(keyQueues, str, (err) => cb(err));
  }
}

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
    const { keyIndexProcessingQueues, keyIndexQueueMessageProcessingQueues } =
      redisKeys.getKeys(queue.name, queue.ns);
    multi.srem(keyIndexProcessingQueues, processingQueue);
    multi.hdel(keyIndexQueueMessageProcessingQueues, processingQueue);
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
    const { keyQueueAcknowledgedMessages } = redisKeys.getKeys(
      queue.name,
      queue.ns,
    );
    this.redisClient.del(keyQueueAcknowledgedMessages, (err) => cb(err));
  }

  purgeQueue(queue: TQueueParams, cb: ICallback<void>): void {
    this.logger.debug(
      `Purging pending queue of (${queue.name}, ${queue.ns})...`,
    );
    const { keyQueue } = redisKeys.getKeys(queue.name, queue.ns);
    this.redisClient.del(keyQueue, (err) => cb(err));
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
    const { keyIndexProcessingQueues } = redisKeys.getGlobalKeys();
    this.redisClient.smembers(keyIndexProcessingQueues, cb);
  }

  getMessageQueues(cb: ICallback<TQueueParams[]>): void {
    const { keyIndexQueue } = redisKeys.getGlobalKeys();
    this.redisClient.smembers(keyIndexQueue, (err, reply) => {
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
      keyQueue,
      keyQueuePriority,
      keyQueueDL,
      keyQueueAcknowledgedMessages,
    } = redisKeys.getKeys(queue.name, queue.ns);
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

  static setUpProcessingQueue(
    consumer: Consumer,
    redisClient: RedisClient,
    cb: ICallback<void>,
  ): void {
    const {
      keyQueueProcessing,
      keyIndexProcessingQueues,
      keyIndexQueueMessageProcessingQueues,
    } = consumer.getRedisKeys();
    const multi = redisClient.multi();
    multi.hset(
      keyIndexQueueMessageProcessingQueues,
      keyQueueProcessing,
      consumer.getId(),
    );
    multi.sadd(keyIndexProcessingQueues, keyQueueProcessing);
    redisClient.execMulti(multi, (err) => cb(err));
  }

  static setUpMessageQueue(
    queue: TQueueParams,
    redisClient: RedisClient,
    cb: ICallback<void>,
  ): void {
    const { keyIndexQueue } = redisKeys.getKeys(queue.name, queue.ns);
    const str = JSON.stringify(queue);
    redisClient.sadd(keyIndexQueue, str, (err) => cb(err));
  }
}

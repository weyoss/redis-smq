import {
  ICallback,
  IConfig,
  IQueueMetrics,
  TQueueParams,
} from '../../../types';
import { RedisClient } from '../common/redis-client/redis-client';
import { QueueManager } from './queue-manager';
import BLogger from 'bunyan';
import { Logger } from '../common/logger';
import { EmptyCallbackReplyError } from '../common/errors/empty-callback-reply.error';
import { redisKeys } from '../common/redis-keys/redis-keys';

export class QueueManagerFrontend {
  private static instance: QueueManagerFrontend | null = null;
  private redisClient: RedisClient;
  private queueManager: QueueManager;

  private constructor(redisClient: RedisClient, logger: BLogger) {
    this.redisClient = redisClient;
    this.queueManager = new QueueManager(redisClient, logger);
  }

  ///

  deleteMessageQueue(queue: string | TQueueParams, cb: ICallback<void>): void {
    const queueParams: TQueueParams =
      typeof queue === 'string'
        ? {
            name: queue,
            ns: redisKeys.getNamespace(),
          }
        : queue;
    this.queueManager.deleteMessageQueue(queueParams, cb);
  }

  purgeDeadLetterQueue(
    queue: string | TQueueParams,
    cb: ICallback<void>,
  ): void {
    const queueParams: TQueueParams =
      typeof queue === 'string'
        ? {
            name: queue,
            ns: redisKeys.getNamespace(),
          }
        : queue;
    this.queueManager.purgeDeadLetterQueue(queueParams, cb);
  }

  purgeAcknowledgedMessagesQueue(
    queue: string | TQueueParams,
    cb: ICallback<void>,
  ): void {
    const queueParams: TQueueParams =
      typeof queue === 'string'
        ? {
            name: queue,
            ns: redisKeys.getNamespace(),
          }
        : queue;
    this.queueManager.purgeAcknowledgedMessagesQueue(queueParams, cb);
  }

  purgeQueue(queue: string | TQueueParams, cb: ICallback<void>): void {
    const queueParams: TQueueParams =
      typeof queue === 'string'
        ? {
            name: queue,
            ns: redisKeys.getNamespace(),
          }
        : queue;
    this.queueManager.purgeQueue(queueParams, cb);
  }

  purgePriorityQueue(queue: string | TQueueParams, cb: ICallback<void>): void {
    const queueParams: TQueueParams =
      typeof queue === 'string'
        ? {
            name: queue,
            ns: redisKeys.getNamespace(),
          }
        : queue;
    this.queueManager.purgePriorityQueue(queueParams, cb);
  }

  purgeScheduledMessagesQueue(cb: ICallback<void>): void {
    this.queueManager.purgeScheduledMessagesQueue(cb);
  }

  ///

  getQueueMetrics(
    queue: string | TQueueParams,
    cb: ICallback<IQueueMetrics>,
  ): void {
    const queueParams: TQueueParams =
      typeof queue === 'string'
        ? {
            name: queue,
            ns: redisKeys.getNamespace(),
          }
        : queue;
    this.queueManager.getQueueMetrics(queueParams, cb);
  }

  getMessageQueues(cb: ICallback<TQueueParams[]>): void {
    this.queueManager.getMessageQueues(cb);
  }

  ///

  quit(cb: ICallback<void>): void {
    this.queueManager.quit(() => {
      this.redisClient.halt(() => {
        QueueManagerFrontend.instance = null;
        cb();
      });
    });
  }

  ///

  static getSingletonInstance(
    config: IConfig,
    cb: ICallback<QueueManagerFrontend>,
  ): void {
    if (!QueueManagerFrontend.instance) {
      RedisClient.getNewInstance(config, (err, client) => {
        if (err) cb(err);
        else if (!client) cb(new EmptyCallbackReplyError());
        else {
          const logger = Logger(QueueManagerFrontend.name, config.log);
          const instance = new QueueManagerFrontend(client, logger);
          QueueManagerFrontend.instance = instance;
          cb(null, instance);
        }
      });
    } else cb(null, QueueManagerFrontend.instance);
  }
}

import {
  ICallback,
  ICompatibleLogger,
  IQueueMetrics,
  TQueueParams,
  TQueueRateLimit,
} from '../../../../types';
import { RedisClient } from '../../common/redis-client/redis-client';
import { EmptyCallbackReplyError } from '../../common/errors/empty-callback-reply.error';
import { getNamespacedLogger } from '../../common/logger';
import {
  clearQueueRateLimit,
  setQueueRateLimit,
  getQueueRateLimit,
} from './queue-rate-limit';
import { createQueue, deleteQueue, getQueueParams, listQueues } from './queue';
import {
  deleteNamespace,
  getNamespaceQueues,
  getNamespaces,
} from './namespace';
import { getQueueMetrics } from './queue-metrics';

export class QueueManager {
  private static instance: QueueManager | null = null;
  private redisClient: RedisClient;
  private logger: ICompatibleLogger;

  constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;
    this.logger = getNamespacedLogger('QueueManager');
  }

  createQueue(
    queue: string | TQueueParams,
    priorityQueuing: boolean,
    cb: ICallback<void>,
  ): void {
    const queueParams = getQueueParams(queue);
    createQueue(this.redisClient, queueParams, priorityQueuing, cb);
  }

  deleteQueue(queue: string | TQueueParams, cb: ICallback<void>): void {
    const queueParams = getQueueParams(queue);
    deleteQueue(this.redisClient, queueParams, (err) => {
      if (err) cb(err);
      else {
        this.logger.info(
          `Message queue (${JSON.stringify(
            queue,
          )}) has been deleted alongside with its data and messages`,
        );
        cb();
      }
    });
  }

  clearQueueRateLimit(queue: string | TQueueParams, cb: ICallback<void>): void {
    const queueParams = getQueueParams(queue);
    clearQueueRateLimit(this.redisClient, queueParams, cb);
  }

  setQueueRateLimit(
    queue: string | TQueueParams,
    rateLimit: TQueueRateLimit,
    cb: ICallback<void>,
  ): void {
    const queueParams = getQueueParams(queue);
    setQueueRateLimit(this.redisClient, queueParams, rateLimit, cb);
  }

  getQueueRateLimit(
    queue: string | TQueueParams,
    cb: ICallback<TQueueRateLimit>,
  ): void {
    const queueParams = getQueueParams(queue);
    getQueueRateLimit(this.redisClient, queueParams, cb);
  }

  getNamespaceQueues(ns: string, cb: ICallback<TQueueParams[]>): void {
    getNamespaceQueues(this.redisClient, ns, cb);
  }

  deleteNamespace(ns: string, cb: ICallback<void>): void {
    deleteNamespace(this.redisClient, ns, (err) => {
      if (err) cb(err);
      else {
        this.logger.info(
          `The namespace (${ns}) alongside with its message queues has been successfully deleted.`,
        );
        cb();
      }
    });
  }

  getNamespaces(cb: ICallback<string[]>): void {
    getNamespaces(this.redisClient, cb);
  }

  getQueueMetrics(
    queue: string | TQueueParams,
    cb: ICallback<IQueueMetrics>,
  ): void {
    const queueParams = getQueueParams(queue);
    getQueueMetrics(this.redisClient, queueParams, cb);
  }

  getQueues(cb: ICallback<TQueueParams[]>): void {
    listQueues(this.redisClient, cb);
  }

  quit(cb: ICallback<void>): void {
    this.redisClient.halt(() => {
      if (QueueManager.instance === this) {
        QueueManager.instance = null;
      }
      cb();
    });
  }

  ///

  static getSingletonInstance(cb: ICallback<QueueManager>): void {
    if (!QueueManager.instance) {
      RedisClient.getNewInstance((err, client) => {
        if (err) cb(err);
        else if (!client) cb(new EmptyCallbackReplyError());
        else {
          const instance = new QueueManager(client);
          QueueManager.instance = instance;
          cb(null, instance);
        }
      });
    } else cb(null, QueueManager.instance);
  }
}

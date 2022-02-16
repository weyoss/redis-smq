import {
  ICallback,
  ICompatibleLogger,
  IQueueMetrics,
  TQueueParams,
  TQueueRateLimit,
} from '../../../../types';
import { RedisClient } from '../../common/redis-client/redis-client';
import { EmptyCallbackReplyError } from '../../common/errors/empty-callback-reply.error';
import { queueManager } from './queue-manager';
import { setConfigurationIfNotExists } from '../../common/configuration/configuration';
import { getNamespacedLogger } from '../../common/logger';

export class QueueManagerFrontend {
  private static instance: QueueManagerFrontend | null = null;
  private redisClient: RedisClient;
  private logger: ICompatibleLogger;

  constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;
    this.logger = getNamespacedLogger('QueueManager');
  }

  clearQueueRateLimit(queue: TQueueParams, cb: ICallback<void>): void {
    queueManager.clearQueueRateLimit(this.redisClient, queue, cb);
  }

  setQueueRateLimit(
    queue: TQueueParams,
    rateLimit: TQueueRateLimit,
    cb: ICallback<void>,
  ): void {
    queueManager.setQueueRateLimit(this.redisClient, queue, rateLimit, cb);
  }

  getQueueRateLimit(queue: TQueueParams, cb: ICallback<TQueueRateLimit>): void {
    queueManager.getQueueRateLimit(this.redisClient, queue, cb);
  }

  deleteQueue(queue: string | TQueueParams, cb: ICallback<void>): void {
    const queueParams = queueManager.getQueueParams(queue);
    queueManager.deleteQueue(this.redisClient, queueParams, (err) => {
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

  getNamespaceQueues(ns: string, cb: ICallback<TQueueParams[]>): void {
    queueManager.getNamespaceQueues(this.redisClient, ns, cb);
  }

  deleteNamespace(ns: string, cb: ICallback<void>): void {
    queueManager.deleteNamespace(this.redisClient, ns, (err) => {
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
    queueManager.getNamespaces(this.redisClient, cb);
  }

  getQueueMetrics(
    queue: string | TQueueParams,
    cb: ICallback<IQueueMetrics>,
  ): void {
    const queueParams = queueManager.getQueueParams(queue);
    queueManager.getQueueMetrics(this.redisClient, queueParams, cb);
  }

  getQueues(cb: ICallback<TQueueParams[]>): void {
    queueManager.getQueues(this.redisClient, cb);
  }

  quit(cb: ICallback<void>): void {
    this.redisClient.halt(() => {
      if (QueueManagerFrontend.instance === this) {
        QueueManagerFrontend.instance = null;
      }
      cb();
    });
  }

  ///

  static getSingletonInstance(cb: ICallback<QueueManagerFrontend>): void {
    if (!QueueManagerFrontend.instance) {
      setConfigurationIfNotExists();
      RedisClient.getNewInstance((err, client) => {
        if (err) cb(err);
        else if (!client) cb(new EmptyCallbackReplyError());
        else {
          const instance = new QueueManagerFrontend(client);
          QueueManagerFrontend.instance = instance;
          cb(null, instance);
        }
      });
    } else cb(null, QueueManagerFrontend.instance);
  }
}

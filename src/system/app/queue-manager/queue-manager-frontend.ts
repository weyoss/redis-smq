import {
  ICallback,
  ICompatibleLogger,
  IQueueMetrics,
  TQueueParams,
} from '../../../../types';
import { RedisClient } from '../../common/redis-client/redis-client';
import { EmptyCallbackReplyError } from '../../common/errors/empty-callback-reply.error';
import { queueManager } from './queue-manager';
import { setConfigurationIfNotExists } from '../../common/configuration';
import { getNamespacedLogger } from '../../common/logger';

export class QueueManagerFrontend {
  private static instance: QueueManagerFrontend | null = null;
  private redisClient: RedisClient;
  private logger: ICompatibleLogger;

  constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;
    this.logger = getNamespacedLogger('QueueManager');
  }

  deleteMessageQueue(queue: string | TQueueParams, cb: ICallback<void>): void {
    const queueParams = queueManager.getQueueParams(queue);
    queueManager.deleteMessageQueue(this.redisClient, queueParams, (err) => {
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

  getQueueMetrics(
    queue: string | TQueueParams,
    cb: ICallback<IQueueMetrics>,
  ): void {
    const queueParams = queueManager.getQueueParams(queue);
    queueManager.getQueueMetrics(this.redisClient, queueParams, cb);
  }

  getMessageQueues(cb: ICallback<TQueueParams[]>): void {
    queueManager.getMessageQueues(this.redisClient, cb);
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

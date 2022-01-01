import {
  ICallback,
  IConfig,
  IQueueMetrics,
  TQueueParams,
} from '../../../types';
import { RedisClient } from '../redis-client/redis-client';
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

  purgeDeadLetterQueue(
    queueName: string,
    namespace: string | undefined,
    cb: ICallback<void>,
  ): void {
    const queue: TQueueParams = {
      name: queueName,
      ns: namespace ?? redisKeys.getNamespace(),
    };
    this.queueManager.purgeDeadLetterQueue(queue, cb);
  }

  purgeAcknowledgedMessagesQueue(
    queueName: string,
    namespace: string | undefined,
    cb: ICallback<void>,
  ): void {
    const queue: TQueueParams = {
      name: queueName,
      ns: namespace ?? redisKeys.getNamespace(),
    };
    this.queueManager.purgeAcknowledgedMessagesQueue(queue, cb);
  }

  purgeQueue(
    queueName: string,
    namespace: string | undefined,
    cb: ICallback<void>,
  ): void {
    const queue: TQueueParams = {
      name: queueName,
      ns: namespace ?? redisKeys.getNamespace(),
    };
    this.queueManager.purgeQueue(queue, cb);
  }

  purgePriorityQueue(
    queueName: string,
    namespace: string | undefined,
    cb: ICallback<void>,
  ): void {
    const queue: TQueueParams = {
      name: queueName,
      ns: namespace ?? redisKeys.getNamespace(),
    };
    this.queueManager.purgePriorityQueue(queue, cb);
  }

  purgeScheduledMessagesQueue(cb: ICallback<void>): void {
    this.queueManager.purgeScheduledMessagesQueue(cb);
  }

  ///

  getQueueMetrics(
    queueName: string,
    namespace: string | undefined,
    cb: ICallback<IQueueMetrics>,
  ): void {
    const queue: TQueueParams = {
      name: queueName,
      ns: namespace ?? redisKeys.getNamespace(),
    };
    this.queueManager.getQueueMetrics(queue, cb);
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

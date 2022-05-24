import { QueueRateLimit } from './queue-rate-limit';
import { Namespace } from './namespace';
import { QueueMetrics } from './queue-metrics';
import { Queue } from './queue';
import { errors, logger, RedisClient } from 'redis-smq-common';
import { ICallback } from 'redis-smq-common/dist/types';
import { getConfiguration } from '../../config/configuration';

export class QueueManager {
  private static instance: QueueManager | null = null;
  private readonly redisClient: RedisClient;
  public readonly namespace: Namespace;
  public readonly queue: Queue;
  public readonly queueRateLimit: QueueRateLimit;
  public readonly queueMetrics: QueueMetrics;

  private constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;
    const loggerCfg = getConfiguration().logger;
    const nsLogger = logger.getNamespacedLogger(loggerCfg, 'queue-manager');
    this.namespace = new Namespace(redisClient, nsLogger);
    this.queue = new Queue(redisClient, nsLogger);
    this.queueRateLimit = new QueueRateLimit(redisClient, nsLogger);
    this.queueMetrics = new QueueMetrics(redisClient, nsLogger);
  }

  quit(cb: ICallback<void>): void {
    this.redisClient.halt(() => {
      if (QueueManager.instance === this) {
        QueueManager.instance = null;
      }
      cb();
    });
  }

  static getSingletonInstance(cb: ICallback<QueueManager>): void {
    if (!QueueManager.instance) {
      const redis = getConfiguration().redis;
      RedisClient.getNewInstance(redis, (err, client) => {
        if (err) cb(err);
        else if (!client) cb(new errors.EmptyCallbackReplyError());
        else {
          const instance = new QueueManager(client);
          QueueManager.instance = instance;
          cb(null, instance);
        }
      });
    } else cb(null, QueueManager.instance);
  }
}

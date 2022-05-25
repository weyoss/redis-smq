import { QueueRateLimit } from './queue-rate-limit';
import { Namespace } from './namespace';
import { QueueMetrics } from './queue-metrics';
import { Queue } from './queue';
import { errors, logger, RedisClient } from 'redis-smq-common';
import { ICallback } from 'redis-smq-common/dist/types';
import { getConfiguration } from '../../config/configuration';
import { IConfig } from '../../../types';

export class QueueManager {
  private readonly redisClient: RedisClient;
  public readonly namespace: Namespace;
  public readonly queue: Queue;
  public readonly queueRateLimit: QueueRateLimit;
  public readonly queueMetrics: QueueMetrics;

  private constructor(
    redisClient: RedisClient,
    namespace: Namespace,
    queue: Queue,
    queueRateLimit: QueueRateLimit,
    queueMetrics: QueueMetrics,
  ) {
    this.redisClient = redisClient;
    this.namespace = namespace;
    this.queue = queue;
    this.queueRateLimit = queueRateLimit;
    this.queueMetrics = queueMetrics;
  }

  quit(cb: ICallback<void>): void {
    this.redisClient.halt(cb);
  }

  static createInstance(config: IConfig, cb: ICallback<QueueManager>): void {
    const cfg = getConfiguration(config);
    const redis = cfg.redis;
    RedisClient.getNewInstance(redis, (err, client) => {
      if (err) cb(err);
      else if (!client) cb(new errors.EmptyCallbackReplyError());
      else {
        const loggerCfg = cfg.logger;
        const nsLogger = logger.getNamespacedLogger(loggerCfg, 'queue-manager');
        const namespace = new Namespace(cfg, client, nsLogger);
        const queue = new Queue(cfg, client, nsLogger);
        const queueRateLimit = new QueueRateLimit(cfg, client, nsLogger);
        const queueMetrics = new QueueMetrics(cfg, client, nsLogger);
        cb(
          null,
          new QueueManager(
            client,
            namespace,
            queue,
            queueRateLimit,
            queueMetrics,
          ),
        );
      }
    });
  }
}

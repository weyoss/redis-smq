import { QueueRateLimit } from './queue-rate-limit';
import { Namespace } from './namespace';
import { QueueMetrics } from './queue-metrics';
import { Queue } from './queue';
import {
  createClientInstance,
  errors,
  logger,
  RedisClient,
} from 'redis-smq-common';
import { ICallback } from 'redis-smq-common/dist/types';
import { getConfiguration } from '../../config/configuration';
import { IConfig } from '../../../types';

export class QueueManager {
  protected readonly redisClient;
  readonly namespace;
  readonly queue;
  readonly queueRateLimit;
  readonly queueMetrics;

  protected constructor(
    namespace: Namespace,
    queue: Queue,
    queueRateLimit: QueueRateLimit,
    queueMetrics: QueueMetrics,
    redisClient: RedisClient,
  ) {
    this.namespace = namespace;
    this.queue = queue;
    this.queueRateLimit = queueRateLimit;
    this.queueMetrics = queueMetrics;
    this.redisClient = redisClient;
  }

  quit(cb: ICallback<void>): void {
    this.redisClient.halt(cb);
  }

  static createInstance(config: IConfig, cb: ICallback<QueueManager>): void {
    const cfg = getConfiguration(config);
    const redis = cfg.redis;
    createClientInstance(redis, (err, client) => {
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
            namespace,
            queue,
            queueRateLimit,
            queueMetrics,
            client,
          ),
        );
      }
    });
  }
}

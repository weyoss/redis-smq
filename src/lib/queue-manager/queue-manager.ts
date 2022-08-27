import { QueueRateLimit } from './queue-rate-limit';
import { Namespace } from './namespace';
import { QueueMetrics } from './queue-metrics';
import { Queue } from './queue';
import { createClientInstance, errors, logger } from 'redis-smq-common';
import { ICallback } from 'redis-smq-common/dist/types';
import { getConfiguration } from '../../config/configuration';
import { IConfig, TQueueManager } from '../../../types';
import { QueueExchange } from './queue-exchange';

export class QueueManager {
  static createInstance(config: IConfig, cb: ICallback<TQueueManager>): void {
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
        const queueExchange = new QueueExchange(cfg, client, nsLogger);
        cb(null, {
          namespace,
          queue,
          queueRateLimit,
          queueMetrics,
          queueExchange,
          quit(cb: ICallback<void>): void {
            client.halt(cb);
          },
        });
      }
    });
  }
}

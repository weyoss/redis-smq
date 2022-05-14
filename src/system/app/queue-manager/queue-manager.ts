import { ICallback } from '../../../../types';
import { RedisClient } from '../../common/redis-client/redis-client';
import { EmptyCallbackReplyError } from '../../common/errors/empty-callback-reply.error';
import { QueueRateLimit } from './queue-rate-limit';
import { Namespace } from './namespace';
import { QueueMetrics } from './queue-metrics';
import { Queue } from './queue';

export class QueueManager {
  private static instance: QueueManager | null = null;
  private readonly redisClient: RedisClient;
  public readonly namespace: Namespace;
  public readonly queue: Queue;
  public readonly queueRateLimit: QueueRateLimit;
  public readonly queueMetrics: QueueMetrics;

  private constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;
    this.namespace = new Namespace(redisClient);
    this.queue = new Queue(redisClient);
    this.queueRateLimit = new QueueRateLimit(redisClient);
    this.queueMetrics = new QueueMetrics(redisClient);
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

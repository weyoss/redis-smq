import { RedisClient } from '../../common/redis-client/redis-client';
import {
  ICallback,
  ICompatibleLogger,
  IQueueMetrics,
  TQueueParams,
} from '../../../../types';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { waterfall } from '../../lib/async';
import { getNamespacedLogger } from '../../common/logger';
import { Queue } from './queue';

export class QueueMetrics {
  protected redisClient: RedisClient;
  protected logger: ICompatibleLogger;

  constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;
    this.logger = getNamespacedLogger(this.constructor.name);
  }

  getQueueMetrics(
    queue: string | TQueueParams,
    cb: ICallback<IQueueMetrics>,
  ): void {
    const queueParams = Queue.getQueueParams(queue);
    const queueMetrics: IQueueMetrics = {
      acknowledged: 0,
      pendingWithPriority: 0,
      deadLettered: 0,
      pending: 0,
    };
    const {
      keyQueuePending,
      keyQueuePendingPriorityMessageIds,
      keyQueueDL,
      keyQueueAcknowledged,
    } = redisKeys.getQueueKeys(queueParams);
    waterfall(
      [
        (cb: ICallback<void>) => {
          this.redisClient.llen(keyQueuePending, (err, reply) => {
            if (err) cb(err);
            else {
              queueMetrics.pending = reply ?? 0;
              cb();
            }
          });
        },
        (cb: ICallback<void>) => {
          this.redisClient.llen(keyQueueDL, (err, reply) => {
            if (err) cb(err);
            else {
              queueMetrics.deadLettered = reply ?? 0;
              cb();
            }
          });
        },
        (cb: ICallback<void>) => {
          this.redisClient.llen(keyQueueAcknowledged, (err, reply) => {
            if (err) cb(err);
            else {
              queueMetrics.acknowledged = reply ?? 0;
              cb();
            }
          });
        },
        (cb: ICallback<void>) => {
          this.redisClient.zcard(
            keyQueuePendingPriorityMessageIds,
            (err, reply) => {
              if (err) cb(err);
              else {
                queueMetrics.pendingWithPriority = reply ?? 0;
                cb();
              }
            },
          );
        },
      ],
      (err) => {
        if (err) cb(err);
        else cb(null, queueMetrics);
      },
    );
  }
}

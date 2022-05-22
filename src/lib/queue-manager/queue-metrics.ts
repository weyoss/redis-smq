import { RedisClient } from '../../common/redis-client/redis-client';
import {
  ICallback,
  ICompatibleLogger,
  IQueueMetrics,
  TQueueParams,
} from '../../../types';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { waterfall } from '../../util/async';
import { getNamespacedLogger } from '../../common/logger';
import { Queue } from './queue';
import { EmptyCallbackReplyError } from '../../common/errors/empty-callback-reply.error';

export class QueueMetrics {
  protected redisClient: RedisClient;
  protected logger: ICompatibleLogger;

  constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;
    this.logger = getNamespacedLogger(this.constructor.name);
  }

  getMetrics(queue: string | TQueueParams, cb: ICallback<IQueueMetrics>): void {
    const queueParams = Queue.getParams(queue);
    const queueMetrics: IQueueMetrics = {
      acknowledged: 0,
      deadLettered: 0,
      pending: 0,
    };
    const {
      keyQueuePending,
      keyQueuePendingPriorityMessageWeight,
      keyQueueDL,
      keyQueueAcknowledged,
    } = redisKeys.getQueueKeys(queueParams);
    waterfall(
      [
        (cb: ICallback<boolean>) =>
          Queue.getSettings(this.redisClient, queueParams, (err, settings) => {
            if (err) cb(err);
            if (!settings) cb(new EmptyCallbackReplyError());
            else cb(null, settings.priorityQueuing);
          }),
        (priorityQueuing: boolean, cb: ICallback<void>) => {
          if (priorityQueuing) {
            this.redisClient.zcard(
              keyQueuePendingPriorityMessageWeight,
              (err, reply) => {
                if (err) cb(err);
                else {
                  queueMetrics.pending = reply ?? 0;
                  cb();
                }
              },
            );
          } else {
            this.redisClient.llen(keyQueuePending, (err, reply) => {
              if (err) cb(err);
              else {
                queueMetrics.pending = reply ?? 0;
                cb();
              }
            });
          }
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
      ],
      (err) => {
        if (err) cb(err);
        else cb(null, queueMetrics);
      },
    );
  }
}

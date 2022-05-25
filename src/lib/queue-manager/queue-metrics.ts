import { IQueueMetrics, IRequiredConfig, TQueueParams } from '../../../types';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { async, errors, RedisClient } from 'redis-smq-common';
import { Queue } from './queue';
import { ICallback, ICompatibleLogger } from 'redis-smq-common/dist/types';

export class QueueMetrics {
  protected redisClient: RedisClient;
  protected logger: ICompatibleLogger;
  protected config: IRequiredConfig;

  constructor(
    config: IRequiredConfig,
    redisClient: RedisClient,
    logger: ICompatibleLogger,
  ) {
    this.redisClient = redisClient;
    this.logger = logger;
    this.config = config;
  }

  getMetrics(queue: string | TQueueParams, cb: ICallback<IQueueMetrics>): void {
    const queueParams = Queue.getParams(this.config, queue);
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
    async.waterfall(
      [
        (cb: ICallback<boolean>) =>
          Queue.getSettings(
            this.config,
            this.redisClient,
            queueParams,
            (err, settings) => {
              if (err) cb(err);
              if (!settings) cb(new errors.EmptyCallbackReplyError());
              else cb(null, settings.priorityQueuing);
            },
          ),
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

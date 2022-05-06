import { RedisClient } from '../../common/redis-client/redis-client';
import { ICallback, IQueueMetrics, TQueueParams } from '../../../../types';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { waterfall } from '../../lib/async';

export function getQueueMetrics(
  redisClient: RedisClient,
  queue: TQueueParams,
  cb: ICallback<IQueueMetrics>,
): void {
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
  } = redisKeys.getQueueKeys(queue);
  waterfall(
    [
      (cb: ICallback<void>) => {
        redisClient.llen(keyQueuePending, (err, reply) => {
          if (err) cb(err);
          else {
            queueMetrics.pending = reply ?? 0;
            cb();
          }
        });
      },
      (cb: ICallback<void>) => {
        redisClient.llen(keyQueueDL, (err, reply) => {
          if (err) cb(err);
          else {
            queueMetrics.deadLettered = reply ?? 0;
            cb();
          }
        });
      },
      (cb: ICallback<void>) => {
        redisClient.llen(keyQueueAcknowledged, (err, reply) => {
          if (err) cb(err);
          else {
            queueMetrics.acknowledged = reply ?? 0;
            cb();
          }
        });
      },
      (cb: ICallback<void>) => {
        redisClient.zcard(keyQueuePendingPriorityMessageIds, (err, reply) => {
          if (err) cb(err);
          else {
            queueMetrics.pendingWithPriority = reply ?? 0;
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

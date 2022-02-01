import { RedisClient } from '../../common/redis-client/redis-client';
import { ICallback, TQueueParams } from '../../../../types';
import { ConsumerHeartbeat } from '../consumer/consumer-heartbeat';
import { GenericError } from '../../common/errors/generic.error';
import { Consumer } from '../consumer/consumer';
import { waterfall } from '../../lib/async';

export function validateMessageQueueDeletion(
  redisClient: RedisClient,
  queue: TQueueParams,
  cb: ICallback<void>,
): void {
  const verifyHeartbeats = (consumerIds: string[], cb: ICallback<void>) => {
    if (consumerIds.length) {
      ConsumerHeartbeat.validateHeartbeatsOf(
        redisClient,
        consumerIds,
        (err, reply) => {
          if (err) cb(err);
          else {
            const r = reply ?? {};
            const onlineArr = Object.keys(r).filter((id) => r[id]);
            if (onlineArr.length) {
              cb(
                new GenericError(
                  `The queue is currently in use. Before deleting a queue, shutdown all its consumers. After shutting down all instances, wait a few seconds and try again.`,
                ),
              );
            } else cb();
          }
        },
      );
    } else cb();
  };
  const getOnlineConsumers = (cb: ICallback<string[]>): void => {
    Consumer.getOnlineConsumerIds(redisClient, queue, cb);
  };
  waterfall([getOnlineConsumers, verifyHeartbeats], (err) => cb(err));
}

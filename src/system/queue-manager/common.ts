import { RedisClient } from '../common/redis-client/redis-client';
import { ICallback, TQueueParams } from '../../../types';
import { ConsumerHeartbeat } from '../consumer/consumer-heartbeat';
import { GenericError } from '../common/errors/generic.error';
import { Consumer } from '../consumer/consumer';
import * as async from 'async';
import { LockManager } from '../common/lock-manager/lock-manager';
import { redisKeys } from '../common/redis-keys/redis-keys';

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
  async.waterfall([getOnlineConsumers, verifyHeartbeats], (err) => cb(err));
}

export function lockQueue(
  redisClient: RedisClient,
  queue: TQueueParams,
  cb: ICallback<LockManager>,
): void {
  const { keyLockQueue } = redisKeys.getQueueKeys(queue.name, queue.ns);
  const lockManager = new LockManager(redisClient, keyLockQueue, 30000, false);
  lockManager.acquireLock((err, locked) => {
    if (err) cb(err);
    else if (!locked)
      cb(new GenericError(`Could not acquire a lock. Try again later.`));
    else cb(null, lockManager);
  });
}

export function checkQueueLock(
  redisClient: RedisClient,
  queue: TQueueParams,
  cb: ICallback<boolean>,
): void {
  const { keyLockQueue } = redisKeys.getQueueKeys(queue.name, queue.ns);
  redisClient.exists(keyLockQueue, (err, reply) => {
    if (err) cb(err);
    else if (reply) cb(new GenericError(`Queue is currently locked`));
    else cb();
  });
}

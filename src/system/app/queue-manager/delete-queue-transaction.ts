import { ICallback, TQueueParams, TRedisClientMulti } from '../../../../types';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { waterfall } from '../../lib/async';
import { processingQueue } from '../consumer/consumer-message-handler/processing-queue';
import { RedisClient } from '../../common/redis-client/redis-client';
import { ConsumerHeartbeat } from '../consumer/consumer-heartbeat';
import { GenericError } from '../../common/errors/generic.error';
import { Consumer } from '../consumer/consumer';
import { Queue } from './queue';
import { QueueNotFoundError } from './errors/queue-not-found.error';

function validateMessageQueueDeletion(
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
                  `Before deleting a queue/namespace, make sure it is not used by a message handler. After shutting down all message handlers, wait a few seconds and try again.`,
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

export function initDeleteQueueTransaction(
  redisClient: RedisClient,
  queueParams: TQueueParams,
  multi: TRedisClientMulti | undefined,
  cb: ICallback<TRedisClientMulti>,
): void {
  const {
    keyQueuePending,
    keyQueueDL,
    keyQueueProcessingQueues,
    keyQueuePendingPriorityMessageIds,
    keyQueueAcknowledged,
    keyQueuePendingPriorityMessages,
    keyRateQueueDeadLettered,
    keyRateQueueAcknowledged,
    keyRateQueuePublished,
    keyRateQueueDeadLetteredIndex,
    keyRateQueueAcknowledgedIndex,
    keyRateQueuePublishedIndex,
    keyLockRateQueuePublished,
    keyLockRateQueueAcknowledged,
    keyLockRateQueueDeadLettered,
    keyQueueConsumers,
    keyProcessingQueues,
    keyQueues,
    keyNsQueues,
    keyQueueRateLimitCounter,
    keyQueueSettings,
  } = redisKeys.getQueueKeys(queueParams);
  const keys: string[] = [
    keyQueuePending,
    keyQueueDL,
    keyQueueProcessingQueues,
    keyQueuePendingPriorityMessageIds,
    keyQueueAcknowledged,
    keyQueuePendingPriorityMessages,
    keyRateQueueDeadLettered,
    keyRateQueueAcknowledged,
    keyRateQueuePublished,
    keyRateQueueDeadLetteredIndex,
    keyRateQueueAcknowledgedIndex,
    keyRateQueuePublishedIndex,
    keyLockRateQueuePublished,
    keyLockRateQueueAcknowledged,
    keyLockRateQueueDeadLettered,
    keyQueueConsumers,
    keyQueueRateLimitCounter,
    keyQueueSettings,
  ];
  redisClient.watch(
    [keyQueueConsumers, keyQueueProcessingQueues, keyQueueSettings],
    (err) => {
      if (err) cb(err);
      else {
        waterfall(
          [
            (cb: ICallback<void>): void =>
              Queue.exists(redisClient, queueParams, (err, reply) => {
                if (err) cb(err);
                else if (!reply) cb(new QueueNotFoundError());
                else cb();
              }),
            (cb: ICallback<void>): void =>
              validateMessageQueueDeletion(redisClient, queueParams, cb),
            (cb: ICallback<string[]>) => {
              processingQueue.getQueueProcessingQueues(
                redisClient,
                queueParams,
                (err, reply) => {
                  if (err) cb(err);
                  else {
                    const pQueues = Object.keys(reply ?? {});
                    cb(null, pQueues);
                  }
                },
              );
            },
          ],
          (err?: Error | null, processingQueues?: string[] | null) => {
            if (err) redisClient.unwatch(() => cb(err));
            else {
              const tx = multi || redisClient.multi();
              const str = JSON.stringify(queueParams);
              tx.srem(keyQueues, str);
              tx.srem(keyNsQueues, str);
              const pQueues = processingQueues ?? [];
              if (pQueues.length) {
                keys.push(...pQueues);
                tx.srem(keyProcessingQueues, ...pQueues);
              }
              tx.del(...keys);
              cb(null, tx);
            }
          },
        );
      }
    },
  );
}

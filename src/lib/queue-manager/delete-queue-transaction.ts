import { redisKeys } from '../../common/redis-keys/redis-keys';
import { async, errors, RedisClient } from 'redis-smq-common';
import { processingQueue } from '../consumer/consumer-message-handler/processing-queue';
import { ConsumerHeartbeat } from '../consumer/consumer-heartbeat';
import { Consumer } from '../consumer/consumer';
import { Queue } from './queue';
import { QueueNotFoundError } from './errors/queue-not-found.error';
import { ICallback, IRedisClientMulti } from 'redis-smq-common/dist/types';
import { IRequiredConfig, TQueueParams } from '../../../types';
import { FanOutExchange } from '../exchange/fan-out-exchange';

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
                new errors.GenericError(
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
  async.waterfall([getOnlineConsumers, verifyHeartbeats], (err) => cb(err));
}

export function initDeleteQueueTransaction(
  config: IRequiredConfig,
  redisClient: RedisClient,
  queueParams: TQueueParams,
  multi: IRedisClientMulti | undefined,
  cb: ICallback<IRedisClientMulti>,
): void {
  const {
    keyQueuePending,
    keyQueueDL,
    keyQueueProcessingQueues,
    keyQueuePendingPriorityMessageWeight,
    keyQueueAcknowledged,
    keyQueuePendingPriorityMessages,
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
    keyQueuePendingPriorityMessageWeight,
    keyQueueAcknowledged,
    keyQueuePendingPriorityMessages,
    keyQueueConsumers,
    keyQueueRateLimitCounter,
    keyQueueSettings,
  ];
  let exchange: FanOutExchange | null = null;
  redisClient.watch(
    [keyQueueConsumers, keyQueueProcessingQueues, keyQueueSettings],
    (err) => {
      if (err) cb(err);
      else {
        async.waterfall(
          [
            (cb: ICallback<void>): void =>
              Queue.getSettings(
                config,
                redisClient,
                queueParams,
                (err, reply) => {
                  if (err) cb(err);
                  else if (!reply) cb(new QueueNotFoundError());
                  else {
                    if (reply.exchange) exchange = reply.exchange;
                    cb();
                  }
                },
              ),
            (cb: ICallback<void>): void => {
              validateMessageQueueDeletion(redisClient, queueParams, cb);
            },
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
                tx.srem(keyProcessingQueues, pQueues);
              }
              tx.del(keys);
              if (exchange) tx.srem(exchange.getBindingParams(), str);
              cb(null, tx);
            }
          },
        );
      }
    },
  );
}

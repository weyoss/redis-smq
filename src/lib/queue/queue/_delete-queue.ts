/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { redisKeys } from '../../../common/redis-keys/redis-keys';
import {
  async,
  RedisClient,
  ICallback,
  IRedisTransaction,
} from 'redis-smq-common';
import { processingQueue } from '../../consumer/message-handler/processing-queue';
import { ConsumerHeartbeat } from '../../consumer/consumer-heartbeat';
import { QueueNotFoundError } from '../errors';
import { IQueueParams } from '../../../../types';
import { _getQueueProperties } from './_get-queue-properties';
import { QueueNotEmptyError } from '../errors';
import { QueueHasRunningConsumersError } from '../errors';
import { consumerQueues } from '../../consumer/consumer-queues';

function checkOnlineConsumers(
  redisClient: RedisClient,
  queue: IQueueParams,
  cb: ICallback<void>,
): void {
  const verifyHeartbeats = (consumerIds: string[], cb: ICallback<void>) => {
    if (consumerIds.length) {
      ConsumerHeartbeat.getConsumersHeartbeats(
        redisClient,
        consumerIds,
        (err, reply) => {
          if (err) cb(err);
          else {
            const r = reply ?? {};
            const onlineArr = Object.keys(r).filter((id) => r[id]);
            if (onlineArr.length) cb(new QueueHasRunningConsumersError());
            else cb();
          }
        },
      );
    } else cb();
  };
  const getOnlineConsumers = (cb: ICallback<string[]>): void => {
    consumerQueues.getQueueConsumerIds(redisClient, queue, cb);
  };
  async.waterfall([getOnlineConsumers, verifyHeartbeats], (err) => cb(err));
}

export function _deleteQueue(
  redisClient: RedisClient,
  queueParams: IQueueParams,
  multi: IRedisTransaction | undefined,
  cb: ICallback<IRedisTransaction>,
): void {
  const {
    keyQueuePending,
    keyQueueDL,
    keyQueueProcessingQueues,
    keyPriorityQueuePending,
    keyQueueAcknowledged,
    keyQueuePendingPriorityMessages,
    keyQueueConsumers,
    keyProcessingQueues,
    keyQueues,
    keyNsQueues,
    keyQueueRateLimitCounter,
    keyQueueProperties,
    keyQueueScheduled,
    keyQueueMessages,
  } = redisKeys.getQueueKeys(queueParams);
  const keys: string[] = [
    keyQueuePending,
    keyQueueDL,
    keyQueueProcessingQueues,
    keyPriorityQueuePending,
    keyQueueAcknowledged,
    keyQueuePendingPriorityMessages,
    keyQueueConsumers,
    keyQueueRateLimitCounter,
    keyQueueProperties,
    keyQueueScheduled,
    keyQueueMessages,
  ];
  let exchange: string | null = null;
  redisClient.watch(
    [keyQueueConsumers, keyQueueProcessingQueues, keyQueueProperties],
    (err) => {
      if (err) cb(err);
      else {
        const processingQueues: string[] = [];
        async.waterfall(
          [
            (cb: ICallback<void>): void =>
              _getQueueProperties(redisClient, queueParams, (err, reply) => {
                if (err) cb(err);
                else if (!reply) cb(new QueueNotFoundError());
                else {
                  const messagesCount = reply.messagesCount;
                  if (messagesCount) cb(new QueueNotEmptyError());
                  else {
                    exchange = reply.exchange ?? null;
                    cb();
                  }
                }
              }),
            (cb: ICallback<void>): void => {
              checkOnlineConsumers(redisClient, queueParams, cb);
            },
            (cb: ICallback<void>) => {
              processingQueue.getQueueProcessingQueues(
                redisClient,
                queueParams,
                (err, reply) => {
                  if (err) cb(err);
                  else {
                    processingQueues.push(...Object.keys(reply ?? {}));
                    cb();
                  }
                },
              );
            },
          ],
          (err) => {
            if (err) redisClient.unwatch(() => cb(err));
            else {
              const tx = multi || redisClient.multi();
              const str = JSON.stringify(queueParams);
              tx.srem(keyQueues, str);
              tx.srem(keyNsQueues, str);
              if (processingQueues.length) {
                keys.push(...processingQueues);
                tx.srem(keyProcessingQueues, processingQueues);
              }
              tx.del(keys);
              if (exchange) tx.srem(exchange, str);
              cb(null, tx);
            }
          },
        );
      }
    },
  );
}

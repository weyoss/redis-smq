/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  async,
  ICallback,
  IRedisClient,
  IRedisTransaction,
} from 'redis-smq-common';
import { redisKeys } from '../../../common/redis-keys/redis-keys.js';
import { _getConsumerGroups } from '../../consumer-groups/_/_get-consumer-groups.js';
import { ConsumerHeartbeat } from '../../consumer/consumer-heartbeat/consumer-heartbeat.js';
import { consumerQueues } from '../../consumer/consumer-queues.js';
import { processingQueue } from '../../consumer/message-handler/processing-queue.js';
import {
  QueueQueueHasRunningConsumersError,
  QueueQueueNotEmptyError,
  QueueQueueNotFoundError,
} from '../errors/index.js';
import { EQueueDeliveryModel, IQueueParams } from '../types/index.js';
import { _getQueueProperties } from './_get-queue-properties.js';

function checkOnlineConsumers(
  redisClient: IRedisClient,
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
            if (onlineArr.length) cb(new QueueQueueHasRunningConsumersError());
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
  redisClient: IRedisClient,
  queueParams: IQueueParams,
  multi: IRedisTransaction | undefined,
  cb: ICallback<IRedisTransaction>,
): void {
  const {
    keyQueuePending,
    keyQueueDL,
    keyQueueProcessingQueues,
    keyQueuePriorityPending,
    keyQueueAcknowledged,
    keyQueueConsumers,
    keyQueueRateLimitCounter,
    keyQueueProperties,
    keyQueueScheduled,
    keyQueueMessages,
    keyQueueConsumerGroups,
  } = redisKeys.getQueueKeys(queueParams, null);
  const { keyNamespaceQueues } = redisKeys.getNamespaceKeys(queueParams.ns);
  const { keyProcessingQueues, keyQueues } = redisKeys.getMainKeys();
  const keys: string[] = [
    keyQueuePending,
    keyQueueDL,
    keyQueueProcessingQueues,
    keyQueuePriorityPending,
    keyQueueAcknowledged,
    keyQueueConsumers,
    keyQueueRateLimitCounter,
    keyQueueProperties,
    keyQueueScheduled,
    keyQueueMessages,
    keyQueueConsumerGroups,
  ];
  let exchange: string | null = null;
  let pubSubDelivery = false;
  redisClient.watch(
    [
      keyQueueConsumers,
      keyQueueProcessingQueues,
      keyQueueProperties,
      keyQueueConsumerGroups,
    ],
    (err) => {
      if (err) cb(err);
      else {
        const processingQueues: string[] = [];
        async.waterfall(
          [
            (cb: ICallback<void>): void =>
              _getQueueProperties(redisClient, queueParams, (err, reply) => {
                if (err) cb(err);
                else if (!reply) cb(new QueueQueueNotFoundError());
                else {
                  const messagesCount = reply.messagesCount;
                  if (messagesCount) cb(new QueueQueueNotEmptyError());
                  else {
                    exchange = reply.exchange ?? null;
                    pubSubDelivery =
                      reply.deliveryModel === EQueueDeliveryModel.PUB_SUB;
                    cb();
                  }
                }
              }),
            (cb: ICallback<void>) => {
              if (pubSubDelivery) {
                _getConsumerGroups(redisClient, queueParams, (err, groups) => {
                  if (err) cb(err);
                  else {
                    async.eachOf(
                      groups ?? [],
                      (groupId, _, cb) => {
                        const { keyQueuePriorityPending, keyQueuePending } =
                          redisKeys.getQueueKeys(queueParams, groupId);
                        keys.push(keyQueuePending, keyQueuePriorityPending);
                        cb();
                      },
                      cb,
                    );
                  }
                });
              } else cb();
            },
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
              tx.srem(keyNamespaceQueues, str);
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

/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
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
import { redisKeys } from '../../common/redis/redis-keys/redis-keys.js';
import { _getConsumerGroups } from '../../consumer-groups/_/_get-consumer-groups.js';
import { ConsumerHeartbeat } from '../../consumer/consumer-heartbeat/consumer-heartbeat.js';
import {
  QueueHasBoundExchangesError,
  QueueManagerActiveConsumersError,
  QueueNotEmptyError,
  QueueNotFoundError,
} from '../../errors/index.js';
import { Exchange } from '../../exchange/index.js';
import { EQueueDeliveryModel, IQueueParams } from '../types/index.js';
import { _getQueueConsumerIds } from './_get-queue-consumer-ids.js';
import { _getQueueProperties } from './_get-queue-properties.js';
import { processingQueue } from '../../consumer/message-handler/consume-message/processing-queue.js';

function checkOnlineConsumers(
  redisClient: IRedisClient,
  queue: IQueueParams,
  cb: ICallback<void>,
): void {
  _getQueueConsumerIds(redisClient, queue, (err, consumerIds) => {
    if (err) cb(err);
    else if (!consumerIds || !consumerIds.length) cb();
    else {
      ConsumerHeartbeat.isConsumerListAlive(
        redisClient,
        consumerIds,
        (err, aliveMap) => {
          if (err) cb(err);
          else {
            const online = aliveMap
              ? Object.values(aliveMap).some((i) => i)
              : false;
            if (online) cb(new QueueManagerActiveConsumersError());
            else cb();
          }
        },
      );
    }
  });
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
  } = redisKeys.getQueueKeys(queueParams.ns, queueParams.name, null);
  const { keyNamespaceQueues } = redisKeys.getNamespaceKeys(queueParams.ns);
  const { keyQueues } = redisKeys.getMainKeys();
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
        async.series(
          [
            (cb: ICallback<void>): void =>
              _getQueueProperties(redisClient, queueParams, (err, reply) => {
                if (err) cb(err);
                else if (!reply) cb(new QueueNotFoundError());
                else {
                  const messagesCount = reply.messagesCount;
                  if (messagesCount) cb(new QueueNotEmptyError());
                  else {
                    pubSubDelivery =
                      reply.deliveryModel === EQueueDeliveryModel.PUB_SUB;
                    cb();
                  }
                }
              }),
            (cb: ICallback) => {
              const exchange = new Exchange();
              exchange.getQueueBoundExchanges(queueParams, (err, reply) => {
                if (err) return cb(err);
                if (reply?.length) return cb(new QueueHasBoundExchangesError());
                cb();
              });
            },
            (cb: ICallback<void>) => {
              if (pubSubDelivery) {
                _getConsumerGroups(redisClient, queueParams, (err, groups) => {
                  if (err) cb(err);
                  else {
                    async.eachOf(
                      groups ?? [],
                      (groupId, _, cb) => {
                        const { keyQueuePriorityPending, keyQueuePending } =
                          redisKeys.getQueueKeys(
                            queueParams.ns,
                            queueParams.name,
                            groupId,
                          );
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
              }
              tx.del(keys);
              cb(null, tx);
            }
          },
        );
      }
    },
  );
}

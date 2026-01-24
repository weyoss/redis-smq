/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { async, ICallback, IRedisClient } from 'redis-smq-common';
import { redisKeys } from '../../common/redis/redis-keys/redis-keys.js';
import { _getConsumerGroups } from '../../consumer-groups/_/_get-consumer-groups.js';
import {
  ConsumerSetMismatchError,
  QueueHasBoundExchangesError,
  QueueManagerActiveConsumersError,
  QueueNotEmptyError,
  QueueNotFoundError,
  UnexpectedScriptReplyError,
} from '../../errors/index.js';
import { EQueueProperty, IQueueParams } from '../types/index.js';
import { _getQueueConsumerIds } from './_get-queue-consumer-ids.js';
import { processingQueue } from '../../consumer/message-handler/consume-message/processing-queue.js';
import { ERedisScriptName } from '../../common/redis/scripts.js';

export function _deleteQueue(
  redisClient: IRedisClient,
  queueParams: IQueueParams,
  cb: ICallback<void>,
): void {
  let consumerIds: string[] = [];
  let consumerGroups: string[] = [];
  let processingQueues: string[] = [];

  async.series(
    [
      // Step 1: Get consumer IDs for the queue.
      (cb: ICallback<void>) => {
        _getQueueConsumerIds(redisClient, queueParams, (err, reply) => {
          if (err) cb(err);
          else {
            consumerIds = reply ?? [];
            cb();
          }
        });
      },

      // Step 2: Get consumer groups for the queue.
      (cb: ICallback<void>) => {
        _getConsumerGroups(redisClient, queueParams, (err, reply) => {
          if (err) cb(err);
          else {
            consumerGroups = reply ?? [];
            cb();
          }
        });
      },

      // Step 3: Get processing queues.
      (cb: ICallback<void>) => {
        processingQueue.getQueueProcessingQueues(
          redisClient,
          queueParams,
          (err, reply) => {
            if (err) cb(err);
            else {
              processingQueues = Object.keys(reply ?? {});
              cb();
            }
          },
        );
      },
    ],
    (err) => {
      if (err) return cb(err);

      // All dynamic keys have been discovered. Now, generate all keys for the script.

      const { keyQueues } = redisKeys.getMainKeys();
      const { keyNamespaceQueues } = redisKeys.getNamespaceKeys(queueParams.ns);
      const {
        keyQueueProperties,
        keyQueuePending,
        keyQueueDL,
        keyQueueProcessingQueues,
        keyQueuePriorityPending,
        keyQueueAcknowledged,
        keyQueueConsumers,
        keyQueueRateLimitCounter,
        keyQueueScheduled,
        keyQueueDelayed,
        keyQueueRequeued,
        keyQueueMessages,
        keyQueueMessageIds,
        keyQueueConsumerGroups,
        keyQueueWorkerClusterLock,
        keyQueueExchangeBindings,
      } = redisKeys.getQueueKeys(queueParams.ns, queueParams.name, null);

      // Keys for consumer heartbeats
      const heartbeatKeys = consumerIds.map(
        (id) => redisKeys.getConsumerKeys(id).keyConsumerHeartbeat,
      );

      // Keys for consumer group queues
      const consumerGroupKeys = consumerGroups.flatMap((groupId) => {
        const { keyQueuePriorityPending, keyQueuePending } =
          redisKeys.getQueueKeys(queueParams.ns, queueParams.name, groupId);
        return [keyQueuePending, keyQueuePriorityPending];
      });

      // A set is used to ensure all keys are unique before passing them to the script.
      const keysToDelete = new Set([
        keyQueueProperties,
        keyQueuePending,
        keyQueueDL,
        keyQueueProcessingQueues,
        keyQueuePriorityPending,
        keyQueueAcknowledged,
        keyQueueConsumers,
        keyQueueRateLimitCounter,
        keyQueueScheduled,
        keyQueueDelayed,
        keyQueueRequeued,
        keyQueueMessages,
        keyQueueMessageIds,
        keyQueueConsumerGroups,
        keyQueueWorkerClusterLock,
        keyQueueExchangeBindings,
        ...consumerGroupKeys,
        ...processingQueues,
      ]);

      const scriptKeys = [
        // Fixed position keys for script logic
        keyQueues, // KEYS[1]
        keyNamespaceQueues, // KEYS[2]
        keyQueueProperties, // KEYS[3]
        keyQueueExchangeBindings, // KEYS[4]
        keyQueueConsumers, // KEYS[5]

        // Dynamic keys for checks
        ...heartbeatKeys,

        // All other keys to be deleted (excluding those already in fixed positions)
        ...Array.from(keysToDelete).filter(
          (k) =>
            k !== keyQueueProperties &&
            k !== keyQueueExchangeBindings &&
            k !== keyQueueConsumers,
        ),
      ];

      const queueParamsStr = JSON.stringify(queueParams);
      const scriptArgs = [
        queueParamsStr,
        EQueueProperty.MESSAGES_COUNT,
        String(heartbeatKeys.length),
        ...consumerIds,
      ];

      redisClient.runScript(
        ERedisScriptName.DELETE_QUEUE,
        scriptKeys,
        scriptArgs,
        (err, reply) => {
          if (err) cb(err);
          else if (reply !== 'OK') {
            if (reply === 'QUEUE_NOT_FOUND') cb(new QueueNotFoundError());
            else if (reply === 'QUEUE_NOT_EMPTY') cb(new QueueNotEmptyError());
            else if (reply === 'QUEUE_HAS_ACTIVE_CONSUMERS')
              cb(new QueueManagerActiveConsumersError());
            else if (reply === 'QUEUE_HAS_BOUND_EXCHANGE')
              cb(new QueueHasBoundExchangesError());
            else if (reply === 'CONSUMER_SET_MISMATCH')
              cb(new ConsumerSetMismatchError());
            else cb(new UnexpectedScriptReplyError({ metadata: { reply } }));
          } else cb();
        },
      );
    },
  );
}

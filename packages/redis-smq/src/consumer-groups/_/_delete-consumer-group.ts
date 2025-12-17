/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { async, EventBus, ICallback, IRedisClient } from 'redis-smq-common';
import { TRedisSMQEvent } from '../../common/index.js';
import { ELuaScriptName } from '../../common/redis/redis-client/scripts/scripts.js';
import { redisKeys } from '../../common/redis/redis-keys/redis-keys.js';
import {
  EQueueProperty,
  EQueueType,
  IQueueParams,
} from '../../queue-manager/index.js';
import {
  ConsumerGroupNotEmptyError,
  ConsumerGroupsError,
  QueueNotFoundError,
} from '../../errors/index.js';

export function _deleteConsumerGroup(
  redisClient: IRedisClient,
  eventBus: EventBus<TRedisSMQEvent>,
  queue: IQueueParams,
  groupId: string,
  cb: ICallback,
) {
  async.waterfall(
    [
      (cb: ICallback) => {
        const {
          keyQueueConsumerGroups,
          keyQueuePending,
          keyQueuePriorityPending,
          keyQueueProperties,
        } = redisKeys.getQueueKeys(queue.ns, queue.name, groupId);
        redisClient.runScript(
          ELuaScriptName.DELETE_CONSUMER_GROUP,
          [
            keyQueueConsumerGroups,
            keyQueuePending,
            keyQueuePriorityPending,
            keyQueueProperties,
          ],
          [EQueueProperty.QUEUE_TYPE, EQueueType.PRIORITY_QUEUE, groupId],
          (err, reply) => {
            if (err) cb(err);
            else if (reply !== 'OK') {
              if (reply === 'QUEUE_NOT_FOUND') {
                cb(new QueueNotFoundError());
              } else if (reply === 'CONSUMER_GROUP_NOT_EMPTY') {
                cb(new ConsumerGroupNotEmptyError());
              } else {
                cb(new ConsumerGroupsError());
              }
            } else {
              eventBus.emit('queue.consumerGroupDeleted', queue, groupId);
              cb();
            }
          },
        );
      },
    ],
    cb,
  );
}

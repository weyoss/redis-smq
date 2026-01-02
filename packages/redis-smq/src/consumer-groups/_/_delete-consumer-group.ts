/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { async, ICallback, IRedisClient } from 'redis-smq-common';
import { ELuaScriptName } from '../../common/redis/redis-client/scripts/scripts.js';
import { redisKeys } from '../../common/redis/redis-keys/redis-keys.js';
import {
  EQueueDeliveryModel,
  EQueueProperty,
  EQueueType,
  IQueueParams,
} from '../../queue-manager/index.js';
import {
  ConsumerGroupNotEmptyError,
  ConsumerGroupsNotSupportedError,
  QueueNotFoundError,
  UnexpectedScriptReplyError,
} from '../../errors/index.js';
import { EventMultiplexer } from '../../event-bus/event-multiplexer.js';

export function _deleteConsumerGroup(
  redisClient: IRedisClient,
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
          [
            EQueueProperty.QUEUE_TYPE,
            EQueueType.PRIORITY_QUEUE,
            EQueueProperty.DELIVERY_MODEL,
            EQueueDeliveryModel.PUB_SUB,
            groupId,
          ],
          (err, reply) => {
            if (err) cb(err);
            else if (reply !== 'OK') {
              if (reply === 'QUEUE_NOT_FOUND') {
                cb(new QueueNotFoundError());
              } else if (reply === 'CONSUMER_GROUPS_NOT_SUPPORTED') {
                cb(new ConsumerGroupsNotSupportedError());
              } else if (reply === 'CONSUMER_GROUP_NOT_EMPTY') {
                cb(new ConsumerGroupNotEmptyError());
              } else {
                cb(new UnexpectedScriptReplyError({ metadata: { reply } }));
              }
            } else {
              EventMultiplexer.publish(
                'queue.consumerGroupDeleted',
                queue,
                groupId,
              );
              cb();
            }
          },
        );
      },
    ],
    cb,
  );
}

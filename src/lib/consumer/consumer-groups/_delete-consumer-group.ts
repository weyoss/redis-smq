/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { EQueueProperty, EQueueType, IQueueParams } from '../../../../types';
import { ICallback, RedisClient } from 'redis-smq-common';
import { ELuaScriptName } from '../../../common/redis-client/redis-client';
import { ConsumerGroupDeleteError } from '../errors';
import { redisKeys } from '../../../common/redis-keys/redis-keys';
import { ConsumerGroupEventEmitter } from './consumer-group-event-emitter';

export function _deleteConsumerGroup(
  redisClient: RedisClient,
  queue: IQueueParams,
  groupId: string,
  cb: ICallback<void>,
) {
  const {
    keyQueueConsumerGroups,
    keyQueuePending,
    keyQueuePriorityPending,
    keyQueueProperties,
  } = redisKeys.getQueueKeys(queue, groupId);
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
      EQueueType.LIFO_QUEUE,
      EQueueType.FIFO_QUEUE,
      groupId,
    ],
    (err, reply) => {
      if (err) cb(err);
      else if (reply !== 'OK') cb(new ConsumerGroupDeleteError(String(reply)));
      else {
        const eventEmitter = new ConsumerGroupEventEmitter(
          redisClient,
          redisClient,
        );
        eventEmitter.emit('consumerGroupDeleted', queue, groupId);
        cb();
      }
    },
  );
}

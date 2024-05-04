/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback, IEventBus, IRedisClient } from 'redis-smq-common';
import { TRedisSMQEvent } from '../../../common/index.js';
import { redisKeys } from '../../../common/redis-keys/redis-keys.js';
import { IQueueParams } from '../../queue/index.js';
import { ConsumerGroupsInvalidGroupIdError } from '../errors/consumer-groups-invalid-group-id.error.js';

export function _saveConsumerGroup(
  redisClient: IRedisClient,
  eventBus: IEventBus<TRedisSMQEvent>,
  queue: IQueueParams,
  groupId: string,
  cb: ICallback<number>,
): void {
  const gid = redisKeys.validateRedisKey(groupId);
  if (gid instanceof Error) cb(new ConsumerGroupsInvalidGroupIdError());
  else {
    const { keyQueueConsumerGroups } = redisKeys.getQueueKeys(queue, gid);
    redisClient.sadd(keyQueueConsumerGroups, gid, (err, reply) => {
      if (err) cb(err);
      else {
        if (reply) eventBus.emit('queue.consumerGroupCreated', queue, groupId);
        cb(null, reply);
      }
    });
  }
}

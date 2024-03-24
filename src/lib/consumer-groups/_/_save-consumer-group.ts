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
import { ConsumerInvalidGroupIdError } from '../../consumer/index.js';
import { IQueueParams } from '../../queue/index.js';

function validateGroupId(groupId: string): string | false {
  const lowerCase = groupId.toLowerCase();
  const filtered = lowerCase.replace(
    /(?:[a-z][a-z0-9]?)+(?:[-_]?[a-z0-9])*/,
    '',
  );
  if (filtered.length) {
    return false;
  }
  return lowerCase;
}

export function _saveConsumerGroup(
  redisClient: IRedisClient,
  eventBus: IEventBus<TRedisSMQEvent>,
  queue: IQueueParams,
  groupId: string,
  cb: ICallback<number>,
): void {
  const gid = validateGroupId(groupId);
  if (!gid) cb(new ConsumerInvalidGroupIdError());
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

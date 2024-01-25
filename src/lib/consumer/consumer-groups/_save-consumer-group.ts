/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IQueueParams } from '../../../../types';
import { ICallback, RedisClient } from 'redis-smq-common';
import { redisKeys } from '../../../common/redis-keys/redis-keys';
import { ConsumerInvalidGroupIdError } from '../errors';
import { ConsumerGroupEventEmitter } from './consumer-group-event-emitter';

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
  redisClient: RedisClient,
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
        if (reply) {
          const eventEmitter = new ConsumerGroupEventEmitter(
            redisClient,
            redisClient,
          );
          eventEmitter.emit('consumerGroupCreated', queue, groupId);
        }
        cb(null, reply);
      }
    });
  }
}

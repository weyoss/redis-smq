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
  CallbackEmptyReplyError,
  EventBus,
  ICallback,
  IRedisClient,
} from 'redis-smq-common';
import { TRedisSMQEvent } from '../../common/index.js';
import { redisKeys } from '../../common/redis/redis-keys/redis-keys.js';
import { _getQueueProperties } from '../../queue-manager/_/_get-queue-properties.js';
import {
  EQueueDeliveryModel,
  IQueueParams,
} from '../../queue-manager/index.js';
import {
  ConsumerGroupsNotSupportedError,
  InvalidConsumerGroupIdError,
} from '../../errors/index.js';

export function _saveConsumerGroup(
  redisClient: IRedisClient,
  eventBus: EventBus<TRedisSMQEvent>,
  queue: IQueueParams,
  groupId: string,
  cb: ICallback<number>,
): void {
  const gid = redisKeys.validateRedisKey(groupId);
  if (gid instanceof Error) cb(new InvalidConsumerGroupIdError());
  else {
    async.waterfall(
      [
        (cb: ICallback<void>) =>
          _getQueueProperties(redisClient, queue, (err, properties) => {
            if (err) cb(err);
            else if (!properties) cb(new CallbackEmptyReplyError());
            else if (properties.deliveryModel !== EQueueDeliveryModel.PUB_SUB)
              cb(new ConsumerGroupsNotSupportedError());
            else cb();
          }),
        (_, cb: ICallback<number>) => {
          const { keyQueueConsumerGroups } = redisKeys.getQueueKeys(queue, gid);
          redisClient.sadd(keyQueueConsumerGroups, gid, (err, reply) => {
            if (err) cb(err);
            else {
              if (reply)
                eventBus.emit('queue.consumerGroupCreated', queue, groupId);
              cb(null, reply);
            }
          });
        },
      ],
      cb,
    );
  }
}

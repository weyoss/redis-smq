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
  CallbackEmptyReplyError,
  ICallback,
  IRedisClient,
} from 'redis-smq-common';
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
import { EventMultiplexer } from '../../event-bus/event-multiplexer.js';
import { _validateOperation } from '../../queue-operation-validator/_/_validate-operation.js';
import { EQueueOperation } from '../../queue-operation-validator/index.js';

export function _saveConsumerGroup(
  redisClient: IRedisClient,
  queue: IQueueParams,
  groupId: string,
  cb: ICallback<number>,
): void {
  const gid = redisKeys.validateRedisKey(groupId);
  if (gid instanceof Error) cb(new InvalidConsumerGroupIdError());
  else {
    async.series(
      [
        (cb: ICallback<void>) =>
          _validateOperation(
            redisClient,
            queue,
            EQueueOperation.CREATE_CONSUMER_GROUP,
            cb,
          ),
        (cb: ICallback<void>) =>
          _getQueueProperties(redisClient, queue, (err, properties) => {
            if (err) cb(err);
            else if (!properties) cb(new CallbackEmptyReplyError());
            else if (properties.deliveryModel !== EQueueDeliveryModel.PUB_SUB)
              cb(new ConsumerGroupsNotSupportedError());
            else cb();
          }),
        (cb: ICallback<number>) => {
          const { keyQueueConsumerGroups } = redisKeys.getQueueKeys(
            queue.ns,
            queue.name,
            gid,
          );
          redisClient.sadd(keyQueueConsumerGroups, gid, (err, reply) => {
            if (err) cb(err);
            else {
              if (reply)
                EventMultiplexer.publish(
                  'queue.consumerGroupCreated',
                  queue,
                  groupId,
                );
              cb(null, reply);
            }
          });
        },
      ],
      (err, result) => cb(err, result?.[2]),
    );
  }
}

/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback, IRedisClient } from 'redis-smq-common';
import { ERedisScriptName } from '../../common/redis/scripts.js';
import { redisKeys } from '../../common/redis/redis-keys/redis-keys.js';
import {
  EQueueDeliveryModel,
  EQueueOperationalState,
  EQueueProperty,
  EQueueType,
  IQueueParams,
} from '../../queue-manager/index.js';
import {
  ConsumerGroupNotEmptyError,
  ConsumerGroupsNotSupportedError,
  QueueLockedError,
  QueueNotFoundError,
  UnexpectedScriptReplyError,
} from '../../errors/index.js';
import { EventMultiplexer } from '../../event-bus/event-multiplexer.js';

export function _deleteConsumerGroup(
  redisClient: IRedisClient,
  queueParams: IQueueParams,
  groupId: string,
  cb: ICallback<void>,
): void {
  const {
    keyQueueConsumerGroups,
    keyQueuePending,
    keyQueuePriorityPending,
    keyQueueProperties,
  } = redisKeys.getQueueKeys(queueParams.ns, queueParams.name, groupId);

  const argv: (string | number)[] = [
    EQueueProperty.QUEUE_TYPE,
    EQueueType.PRIORITY_QUEUE,
    EQueueProperty.DELIVERY_MODEL,
    EQueueDeliveryModel.PUB_SUB,
    groupId,
    EQueueProperty.OPERATIONAL_STATE,
    EQueueOperationalState.LOCKED,
    EQueueProperty.LOCK_ID,
    '',
  ];

  redisClient.runScript(
    ERedisScriptName.DELETE_CONSUMER_GROUP,
    [
      keyQueueConsumerGroups,
      keyQueuePending,
      keyQueuePriorityPending,
      keyQueueProperties,
    ],
    argv,
    (err, reply) => {
      if (err) return cb(err);

      const replyStr = String(reply);

      // Handle queue state errors
      if (replyStr === 'QUEUE_LOCKED') {
        return cb(
          new QueueLockedError({
            metadata: {
              queue: queueParams,
            },
          }),
        );
      }

      // Handle other error cases
      if (replyStr === 'QUEUE_NOT_FOUND') {
        return cb(new QueueNotFoundError());
      }

      if (replyStr === 'CONSUMER_GROUPS_NOT_SUPPORTED') {
        return cb(new ConsumerGroupsNotSupportedError());
      }

      if (replyStr === 'CONSUMER_GROUP_NOT_EMPTY') {
        return cb(new ConsumerGroupNotEmptyError());
      }

      if (replyStr !== 'OK') {
        return cb(
          new UnexpectedScriptReplyError({
            message: `Unexpected reply from DELETE_CONSUMER_GROUP script: ${replyStr}`,
            metadata: { reply },
          }),
        );
      }

      EventMultiplexer.publish(
        'queue.consumerGroupDeleted',
        queueParams,
        groupId,
      );
      cb();
    },
  );
}

/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { CallbackEmptyReplyError, ICallback, ILogger } from 'redis-smq-common';
import { _getQueueProperties } from '../../../queue-manager/_/_get-queue-properties.js';
import {
  EQueueDeliveryModel,
  IQueueParsedParams,
} from '../../../queue-manager/index.js';
import { ConsumerGroups } from '../../../consumer-groups/index.js';
import { ConsumerGroupsNotSupportedError } from '../../../errors/index.js';
import { RedisConnectionPool } from '../../../common/redis/redis-connection-pool/redis-connection-pool.js';
import { ERedisConnectionAcquisitionMode } from '../../../common/redis/redis-connection-pool/types/connection-pool.js';
import { _generateEphemeralConsumerGroupId } from './_generate-ephemeral-consumer-group-id.js';

export function _prepareConsumerGroup(
  queueParams: IQueueParsedParams,
  consumerId: string,
  cb: ICallback<string>,
  logger?: ILogger,
): void {
  RedisConnectionPool.getInstance().acquire(
    ERedisConnectionAcquisitionMode.SHARED,
    (err, redisClient) => {
      if (err) return cb(err);
      if (!redisClient) return cb(new CallbackEmptyReplyError());

      _getQueueProperties(
        redisClient,
        queueParams.queueParams,
        (err, props) => {
          if (err) return cb(err);
          if (!props) return cb(new CallbackEmptyReplyError());

          if (props.deliveryModel === EQueueDeliveryModel.PUB_SUB) {
            const consumerGroups = new ConsumerGroups();
            let effectiveGroupId = queueParams.groupId;
            if (!effectiveGroupId) {
              logger?.debug(
                `PUB_SUB queue without provided consumer group. Creating ephemeral group '${consumerId}'...`,
              );
              // Use consumer ID as group ID
              effectiveGroupId = _generateEphemeralConsumerGroupId(consumerId);
            }
            return consumerGroups.saveConsumerGroup(
              queueParams.queueParams,
              effectiveGroupId,
              (saveErr) => {
                if (saveErr) return cb(saveErr);
                cb(null, effectiveGroupId);
              },
            );
          }
          // POINT_TO_POINT
          if (queueParams.groupId) {
            logger?.error(
              'Consumer group ID not supported for point-to-point delivery model',
            );
            return cb(new ConsumerGroupsNotSupportedError());
          }
          cb();
        },
      );
    },
  );
}

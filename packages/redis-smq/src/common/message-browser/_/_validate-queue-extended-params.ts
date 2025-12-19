/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback, IRedisClient } from 'redis-smq-common';
import { _getQueueProperties } from '../../../queue-manager/_/_get-queue-properties.js';
import {
  EQueueDeliveryModel,
  IQueueParsedParams,
} from '../../../queue-manager/index.js';
import {
  ConsumerGroupRequiredError,
  ConsumerGroupsNotSupportedError,
} from '../../../errors/index.js';

export function _validateQueueExtendedParams(
  redisClient: IRedisClient,
  queue: IQueueParsedParams,
  requireGroupId: boolean,
  cb: ICallback<void>,
) {
  const { queueParams, groupId } = queue;
  _getQueueProperties(redisClient, queueParams, (err, properties) => {
    if (err) cb(err);
    else {
      if (
        requireGroupId &&
        properties?.deliveryModel === EQueueDeliveryModel.PUB_SUB &&
        !groupId
      ) {
        cb(new ConsumerGroupRequiredError());
      } else if (
        properties?.deliveryModel === EQueueDeliveryModel.POINT_TO_POINT &&
        groupId
      ) {
        cb(new ConsumerGroupsNotSupportedError());
      } else cb();
    }
  });
}

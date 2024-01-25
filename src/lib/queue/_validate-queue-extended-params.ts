/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { _getCommonRedisClient } from '../../common/_get-common-redis-client';
import { CallbackEmptyReplyError, ICallback } from 'redis-smq-common';
import { _getQueueProperties } from './queue/_get-queue-properties';
import { EQueueDeliveryModel, IQueueParsedParams } from '../../../types';
import {
  ConsumerGroupIdNotSupportedError,
  ConsumerGroupIdRequiredError,
} from '../consumer/errors';

export function _validateQueueExtendedParams(
  queue: IQueueParsedParams,
  requireGroupId: boolean,
  cb: ICallback<void>,
) {
  const { queueParams, groupId } = queue;
  _getCommonRedisClient((err, client) => {
    if (err) cb(err);
    else if (!client) cb(new CallbackEmptyReplyError());
    else {
      _getQueueProperties(client, queueParams, (err, properties) => {
        if (err) cb(err);
        else {
          if (
            requireGroupId &&
            properties?.deliveryModel === EQueueDeliveryModel.PUB_SUB &&
            !groupId
          ) {
            cb(new ConsumerGroupIdRequiredError());
          } else if (
            properties?.deliveryModel === EQueueDeliveryModel.POINT_TO_POINT &&
            groupId
          ) {
            cb(new ConsumerGroupIdNotSupportedError());
          } else cb();
        }
      });
    }
  });
}

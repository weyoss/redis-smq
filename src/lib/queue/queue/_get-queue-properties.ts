/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  EQueueDeliveryModel,
  EQueueProperty,
  EQueueType,
  IQueueParams,
  IQueueProperties,
} from '../../../../types';
import { ICallback, PanicError, RedisClient } from 'redis-smq-common';
import { redisKeys } from '../../../common/redis-keys/redis-keys';
import { QueueNotFoundError } from '../errors';

function parseProperties(raw: Record<string, string>): IQueueProperties {
  const properties: IQueueProperties = {
    deliveryModel: EQueueDeliveryModel.POINT_TO_POINT,
    queueType: EQueueType.LIFO_QUEUE,
    exchange: null,
    rateLimit: null,
    messagesCount: 0,
  };
  for (const key in raw) {
    const keyNum = Number(key);
    if (keyNum === EQueueProperty.QUEUE_TYPE) {
      properties.queueType = Number(raw[key]);
    } else if (keyNum === EQueueProperty.RATE_LIMIT) {
      properties.rateLimit = JSON.parse(raw[key]);
    } else if (keyNum === EQueueProperty.EXCHANGE) {
      properties.exchange = raw[key];
    } else if (keyNum === EQueueProperty.MESSAGES_COUNT) {
      properties.messagesCount = Number(raw[key]);
    } else if (keyNum === EQueueProperty.DELIVERY_MODEL) {
      properties.deliveryModel = Number(raw[key]);
    } else {
      throw new PanicError(`Unsupported queue settings type [${key}]`);
    }
  }
  return properties;
}

export function _getQueueProperties(
  redisClient: RedisClient,
  queueParams: IQueueParams,
  cb: ICallback<IQueueProperties>,
): void {
  const { keyQueueProperties } = redisKeys.getQueueKeys(queueParams, null);
  redisClient.hgetall(keyQueueProperties, (err, reply) => {
    if (err) cb(err);
    else if (!reply || !Object.keys(reply).length) cb(new QueueNotFoundError());
    else {
      const queueProperties = parseProperties(reply);
      cb(null, queueProperties);
    }
  });
}

/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback, IRedisClient, PanicError } from 'redis-smq-common';
import { redisKeys } from '../../common/redis-keys/redis-keys.js';
import { QueueQueueNotFoundError } from '../errors/index.js';
import {
  EQueueDeliveryModel,
  EQueueProperty,
  EQueueType,
  IQueueParams,
  IQueueProperties,
} from '../types/index.js';

function parseProperties(
  raw: Record<string, string>,
): IQueueProperties | PanicError {
  const properties: IQueueProperties = {
    deliveryModel: EQueueDeliveryModel.POINT_TO_POINT,
    queueType: EQueueType.LIFO_QUEUE,
    fanoutExchange: null,
    rateLimit: null,
    messagesCount: 0,
    acknowledgedMessagesCount: 0,
    deadLetteredMessagesCount: 0,
    pendingMessagesCount: 0,
    scheduledMessagesCount: 0,
    processingMessagesCount: 0,
    delayedMessagesCount: 0,
    requeuedMessagesCount: 0,
  };
  for (const key in raw) {
    const keyNum = Number(key);
    const value = raw[key];
    switch (keyNum) {
      case EQueueProperty.QUEUE_TYPE:
        properties.queueType = Number(value);
        break;
      case EQueueProperty.DELIVERY_MODEL:
        properties.deliveryModel = Number(value);
        break;
      case EQueueProperty.RATE_LIMIT:
        properties.rateLimit = value ? JSON.parse(value) : null;
        break;
      case EQueueProperty.FANOUT_EXCHANGE:
        properties.fanoutExchange = value ? value : null;
        break;
      case EQueueProperty.MESSAGES_COUNT:
        properties.messagesCount = Number(value);
        break;
      case EQueueProperty.ACKNOWLEDGED_MESSAGES_COUNT:
        properties.acknowledgedMessagesCount = Number(value);
        break;
      case EQueueProperty.DEAD_LETTERED_MESSAGES_COUNT:
        properties.deadLetteredMessagesCount = Number(value);
        break;
      case EQueueProperty.SCHEDULED_MESSAGES_COUNT:
        properties.scheduledMessagesCount = Number(value);
        break;
      case EQueueProperty.PROCESSING_MESSAGES_COUNT:
        properties.processingMessagesCount = Number(value);
        break;
      case EQueueProperty.PENDING_MESSAGES_COUNT:
        properties.pendingMessagesCount = Number(value);
        break;
      case EQueueProperty.DELAYED_MESSAGES_COUNT:
        properties.delayedMessagesCount = Number(value);
        break;
      case EQueueProperty.REQUEUED_MESSAGES_COUNT:
        properties.requeuedMessagesCount = Number(value);
        break;
      default:
        return new PanicError(`Unsupported queue property type [${key}]`);
    }
  }
  return properties;
}

export function _getQueueProperties(
  redisClient: IRedisClient,
  queueParams: IQueueParams,
  cb: ICallback<IQueueProperties>,
): void {
  const { keyQueueProperties } = redisKeys.getQueueKeys(queueParams, null);
  redisClient.hgetall(keyQueueProperties, (err, reply) => {
    if (err) cb(err);
    else if (!reply || !Object.keys(reply).length)
      cb(new QueueQueueNotFoundError());
    else {
      const queueProperties = parseProperties(reply);
      if (queueProperties instanceof Error) cb(queueProperties);
      else cb(null, queueProperties);
    }
  });
}

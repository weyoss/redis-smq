/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  EMessageProperty,
  EMessagePropertyStatus,
  EQueueProperty,
  EQueueType,
  IQueueParams,
} from '../../../types';
import { CallbackEmptyReplyError, ICallback } from 'redis-smq-common';
import { _getCommonRedisClient } from '../../common/_get-common-redis-client';
import { _getMessage } from '../message/_get-message';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { ELuaScriptName } from '../../common/redis-client/redis-client';
import { QueueMessageRequeueError } from './errors';

export function _requeueMessage(
  queue: string | IQueueParams,
  messageId: string,
  messageStatus:
    | EMessagePropertyStatus.ACKNOWLEDGED
    | EMessagePropertyStatus.DEAD_LETTERED,
  cb: ICallback<void>,
): void {
  _getCommonRedisClient((err, client) => {
    if (err) cb(err);
    else if (!client) cb(new CallbackEmptyReplyError());
    else {
      _getMessage(client, messageId, (err, message) => {
        if (err) cb(err);
        else if (!message) cb(new CallbackEmptyReplyError());
        else if (messageStatus !== message.getStatus())
          cb(new QueueMessageRequeueError('INVALID_OPERATION'));
        else {
          message.getMessageState().reset(); // resetting all system parameters
          const {
            keyQueueProperties,
            keyQueuePending,
            keyQueuePriorityPending,
            keyQueueAcknowledged,
            keyQueueDL,
          } = redisKeys.getQueueKeys(
            message.getDestinationQueue(),
            message.getConsumerGroupId(),
          );
          const messageId = message.getId();
          const { keyMessage } = redisKeys.getMessageKeys(messageId);
          const status = message.getStatus();
          const sourceKey =
            status === EMessagePropertyStatus.DEAD_LETTERED
              ? keyQueueDL
              : keyQueueAcknowledged;
          client.runScript(
            ELuaScriptName.REQUEUE_MESSAGE,
            [
              sourceKey,
              keyQueueProperties,
              keyQueuePriorityPending,
              keyQueuePending,
              keyMessage,
            ],
            [
              EQueueProperty.QUEUE_TYPE,
              EQueueType.PRIORITY_QUEUE,
              EQueueType.LIFO_QUEUE,
              EQueueType.FIFO_QUEUE,
              EMessageProperty.STATUS,
              EMessagePropertyStatus.PENDING,
              EMessageProperty.STATE,
              messageId,
              message.producibleMessage.getPriority() ?? '',
              JSON.stringify(message.getMessageState()),
            ],
            (err, reply) => {
              if (err) cb(err);
              else if (reply !== 'OK')
                cb(new QueueMessageRequeueError(String(reply)));
              else cb();
            },
          );
        }
      });
    }
  });
}

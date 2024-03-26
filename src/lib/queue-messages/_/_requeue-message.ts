/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  CallbackEmptyReplyError,
  ICallback,
  IRedisClient,
} from 'redis-smq-common';
import { ELuaScriptName } from '../../../common/redis-client/scripts/scripts.js';
import { redisKeys } from '../../../common/redis-keys/redis-keys.js';
import { _getMessage } from '../../message/_/_get-message.js';
import {
  EMessageProperty,
  EMessagePropertyStatus,
} from '../../message/index.js';
import { _parseQueueParams } from '../../queue/_/_parse-queue-params.js';
import { EQueueProperty, EQueueType, IQueueParams } from '../../queue/index.js';
import { MessageRequeueError } from '../errors/index.js';

export function _requeueMessage(
  redisClient: IRedisClient,
  queue: string | IQueueParams,
  messageId: string,
  messageStatus:
    | EMessagePropertyStatus.ACKNOWLEDGED
    | EMessagePropertyStatus.DEAD_LETTERED,
  cb: ICallback<void>,
): void {
  const queueParams = _parseQueueParams(queue);
  if (queueParams instanceof Error) cb(queueParams);
  else {
    _getMessage(redisClient, messageId, (err, message) => {
      if (err) cb(err);
      else if (!message) cb(new CallbackEmptyReplyError());
      else if (messageStatus !== message.getStatus())
        cb(new MessageRequeueError('INVALID_OPERATION'));
      else {
        const destinationQueue = message.getDestinationQueue();
        if (
          queueParams.name !== destinationQueue.name ||
          queueParams.ns !== destinationQueue.ns
        ) {
          cb(new MessageRequeueError('INVALID_OPERATION'));
        } else {
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
          redisClient.runScript(
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
                cb(new MessageRequeueError(String(reply)));
              else cb();
            },
          );
        }
      }
    });
  }
}

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
import { EQueueProperty, EQueueType } from '../../queue/index.js';
import {
  EMessageProperty,
  EMessagePropertyStatus,
  MessageError,
  MessageInvalidParametersError,
  MessageMessageNotFoundError,
  MessageMessageNotRequeuableError,
} from '../index.js';
import { _getMessage } from './_get-message.js';

export function _requeueMessage(
  redisClient: IRedisClient,
  messageId: string,
  cb: ICallback<void>,
): void {
  _getMessage(redisClient, messageId, (err, message) => {
    if (err) cb(err);
    else if (!message) cb(new CallbackEmptyReplyError());
    else if (
      ![
        EMessagePropertyStatus.ACKNOWLEDGED,
        EMessagePropertyStatus.DEAD_LETTERED,
      ].includes(message.getStatus())
    )
      cb(new MessageMessageNotRequeuableError());
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
          else if (reply !== 'OK') {
            if (reply === 'MESSAGE_NOT_FOUND')
              cb(new MessageMessageNotFoundError());
            else if (reply === 'INVALID_PARAMETERS')
              cb(new MessageInvalidParametersError());
            else cb(new MessageError());
          } else cb();
        },
      );
    }
  });
}

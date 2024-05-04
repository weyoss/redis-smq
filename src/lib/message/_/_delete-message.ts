/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
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
import { ELuaScriptName } from '../../../common/redis-client/scripts/scripts.js';
import { redisKeys } from '../../../common/redis-keys/redis-keys.js';
import { EQueueProperty, EQueueType } from '../../queue/index.js';
import {
  MessageError,
  MessageInvalidParametersError,
  MessageMessageInProcessError,
  MessageMessageNotFoundError,
} from '../errors/index.js';
import { EMessageProperty, EMessagePropertyStatus } from '../types/index.js';
import { _getMessage } from './_get-message.js';

export function _deleteMessage(
  redisClient: IRedisClient,
  messageId: string | string[],
  cb: ICallback<void>,
): void {
  const keys: string[] = [];
  const argv: (string | number)[] = [];
  const ids = typeof messageId === 'string' ? [messageId] : messageId;
  const { keyScheduledMessages, keyDelayedMessages, keyRequeueMessages } =
    redisKeys.getMainKeys();
  keys.push(keyScheduledMessages, keyDelayedMessages, keyRequeueMessages);
  argv.push(
    EQueueProperty.QUEUE_TYPE,
    EQueueProperty.MESSAGES_COUNT,
    EQueueType.PRIORITY_QUEUE,
    EQueueType.LIFO_QUEUE,
    EQueueType.FIFO_QUEUE,
    EMessageProperty.STATUS,
    EMessagePropertyStatus.PROCESSING,
    EMessagePropertyStatus.ACKNOWLEDGED,
    EMessagePropertyStatus.PENDING,
    EMessagePropertyStatus.SCHEDULED,
    EMessagePropertyStatus.DEAD_LETTERED,
    EMessagePropertyStatus.UNACK_DELAYING,
    EMessagePropertyStatus.UNACK_REQUEUING,
  );
  async.each(
    ids,
    (id, _, done) => {
      _getMessage(redisClient, id, (err, message) => {
        if (err) done(err);
        else if (!message) done(new CallbackEmptyReplyError());
        else {
          const {
            keyQueueProperties,
            keyQueueDL,
            keyQueueScheduled,
            keyQueueAcknowledged,
            keyQueuePriorityPending,
            keyQueuePending,
          } = redisKeys.getQueueKeys(
            message.getDestinationQueue(),
            message.getConsumerGroupId(),
          );
          const { keyMessage } = redisKeys.getMessageKeys(id);
          keys.push(
            keyMessage,
            keyQueueProperties,
            keyQueuePending,
            keyQueueDL,
            keyQueueAcknowledged,
            keyQueueScheduled,
            keyQueuePriorityPending,
          );
          argv.push(id);
          done();
        }
      });
    },
    (err) => {
      if (err) cb(err);
      else if (keys.length && argv.length) {
        redisClient.runScript(
          ELuaScriptName.DELETE_MESSAGE,
          keys,
          argv,
          (err, reply) => {
            if (err) cb(err);
            else if (reply !== 'OK') {
              if (reply === 'MESSAGE_NOT_FOUND') {
                cb(new MessageMessageNotFoundError());
              } else if (reply === 'MESSAGE_IN_PROCESS') {
                cb(new MessageMessageInProcessError());
              } else if (reply === 'MESSAGE_NOT_DELETED') {
                cb(new MessageMessageNotFoundError());
              } else if (reply === 'INVALID_PARAMETERS') {
                cb(new MessageInvalidParametersError());
              } else {
                cb(new MessageError());
              }
            } else cb();
          },
        );
      } else cb();
    },
  );
}

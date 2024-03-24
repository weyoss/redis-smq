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
import { _getMessage } from './_get-message.js';
import { MessageDeleteError } from '../errors/index.js';
import { EMessageProperty, EMessagePropertyStatus } from '../types/index.js';

export function _deleteMessage(
  redisClient: IRedisClient,
  messageId: string | string[],
  cb: ICallback<void>,
): void {
  const keys: string[] = [];
  const argv: (string | number)[] = [];
  const ids = typeof messageId === 'string' ? [messageId] : messageId;
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
          const {
            keyScheduledMessages,
            keyDelayedMessages,
            keyRequeueMessages,
          } = redisKeys.getMainKeys();
          const { keyMessage } = redisKeys.getMessageKeys(id);
          keys.push(
            keyScheduledMessages,
            keyDelayedMessages,
            keyRequeueMessages,
            keyMessage,
            keyQueueProperties,
            keyQueuePending,
            keyQueueDL,
            keyQueueAcknowledged,
            keyQueueScheduled,
            keyQueuePriorityPending,
          );
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
            id,
          );
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
            else if (reply !== 'OK')
              cb(new MessageDeleteError(reply ? String(reply) : undefined));
            else cb();
          },
        );
      } else cb();
    },
  );
}

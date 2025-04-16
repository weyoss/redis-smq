/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { async, ICallback, PanicError } from 'redis-smq-common';
import { ELuaScriptName } from '../../../common/redis-client/scripts/scripts.js';
import { redisKeys } from '../../../common/redis-keys/redis-keys.js';
import { _fromMessage } from '../../message/_/_from-message.js';
import { _getMessages } from '../../message/_/_get-message.js';
import {
  EMessageProperty,
  EMessagePropertyStatus,
} from '../../message/index.js';
import { MessageEnvelope } from '../../message/message-envelope.js';
import { MessageState } from '../../message/message-state.js';
import { EQueueProperty, EQueueType } from '../../queue/index.js';
import { IConsumerMessageHandlerWorkerPayload } from '../types/index.js';
import { Worker } from './worker.js';

class PublishScheduledWorker extends Worker {
  work = (cb: ICallback<void>): void => {
    async.waterfall(
      [this.fetchMessageIds, this.fetchMessages, this.enqueueMessages],
      cb,
    );
  };

  protected fetchMessageIds = (cb: ICallback<string[]>): void => {
    const redisClient = this.redisClient.getInstance();
    if (redisClient instanceof Error) {
      cb(redisClient);
      return void 0;
    }
    const { keyQueueScheduled } = redisKeys.getQueueKeys(
      this.queueParsedParams.queueParams,
      this.queueParsedParams.groupId,
    );
    redisClient.zrangebyscore(keyQueueScheduled, 0, Date.now(), 0, 9, cb);
  };

  protected fetchMessages = (
    ids: string[],
    cb: ICallback<MessageEnvelope[]>,
  ): void => {
    const redisClient = this.redisClient.getInstance();
    if (redisClient instanceof Error) {
      cb(redisClient);
      return void 0;
    }
    if (ids.length) _getMessages(redisClient, ids, cb);
    else cb(null, []);
  };

  protected enqueueMessages = (
    messages: MessageEnvelope[],
    cb: ICallback<void>,
  ): void => {
    if (messages.length) {
      const keys: string[] = [];
      const argv: (string | number)[] = [
        EMessageProperty.STATUS,
        EMessagePropertyStatus.PENDING,
        EMessageProperty.STATE,
        EQueueProperty.QUEUE_TYPE,
        EQueueType.PRIORITY_QUEUE,
        EQueueType.LIFO_QUEUE,
        EQueueType.FIFO_QUEUE,
        EQueueProperty.MESSAGES_COUNT,
        EMessageProperty.MESSAGE,
      ];
      async.each(
        messages,
        (msg, _, done) => {
          const ts = Date.now();
          const messagePriority = msg.producibleMessage.getPriority() ?? '';
          const { keyMessage: keyScheduledMessage } = redisKeys.getMessageKeys(
            msg.getId(),
          );
          const nextScheduleTimestamp = msg.getNextScheduledTimestamp();
          const scheduledMessageState = msg.getMessageState();
          const {
            keyQueueProperties,
            keyQueuePending,
            keyQueuePriorityPending,
            keyQueueScheduled,
            keyQueueMessages,
          } = redisKeys.getQueueKeys(
            msg.getDestinationQueue(),
            msg.getConsumerGroupId(),
          );

          let newMessage: MessageEnvelope | null = null;
          let newMessageState: MessageState | null = null;
          let newMessageId: string = '';
          let newKeyMessage: string = '';

          if (nextScheduleTimestamp) {
            newMessage = _fromMessage(msg, null, null);
            newMessage.producibleMessage.resetScheduledParams();
            newMessageState = newMessage
              .getMessageState()
              .setPublishedAt(ts)
              .setScheduledMessageId(msg.getId());
            newMessageId = newMessageState.getId();
            newKeyMessage = redisKeys.getMessageKeys(newMessageId).keyMessage;
            scheduledMessageState.setLastScheduledAt(ts);
          } else {
            scheduledMessageState.setPublishedAt(ts);
          }

          keys.push(
            newKeyMessage,
            keyQueuePending,
            keyQueueMessages,
            keyQueueProperties,
            keyQueuePriorityPending,
            keyQueueScheduled,
            keyScheduledMessage,
          );
          argv.push(
            newMessageId,
            newMessage ? JSON.stringify(newMessage) : '',
            newMessageState ? JSON.stringify(newMessageState) : '',
            messagePriority,
            msg.getId(),
            nextScheduleTimestamp,
            JSON.stringify(scheduledMessageState),
          );
          done();
        },
        (err) => {
          if (err) cb(err);
          else {
            const redisClient = this.redisClient.getInstance();
            if (redisClient instanceof Error) {
              cb(redisClient);
              return void 0;
            }
            redisClient.runScript(
              ELuaScriptName.PUBLISH_SCHEDULED_MESSAGE,
              keys,
              argv,
              (err, reply) => {
                if (err) cb(err);
                else if (reply !== 'OK') cb(new PanicError(String(reply)));
                else cb();
              },
            );
          }
        },
      );
    } else cb();
  };
}

export default (payload: IConsumerMessageHandlerWorkerPayload) =>
  new PublishScheduledWorker(payload);

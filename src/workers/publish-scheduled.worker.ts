/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { redisKeys } from '../common/redis-keys/redis-keys';
import { MessageEnvelope } from '../lib/message/message-envelope';
import { async, RedisClient, Worker, WorkerError } from 'redis-smq-common';
import { ELuaScriptName } from '../common/redis-client/redis-client';
import {
  EMessageProperty,
  EMessagePropertyStatus,
  EQueueProperty,
  EQueueType,
} from '../../types';
import { ICallback } from 'redis-smq-common';
import { _getMessages } from '../lib/message/_get-message';
import { _fromMessage } from '../lib/message/_from-message';
import { MessageState } from '../lib/message/message-state';

export class PublishScheduledWorker extends Worker {
  protected redisClient: RedisClient;

  constructor(redisClient: RedisClient, managed: boolean) {
    super(managed);
    this.redisClient = redisClient;
  }

  protected fetchMessageIds = (cb: ICallback<string[]>): void => {
    const { keyScheduledMessages } = redisKeys.getMainKeys();
    this.redisClient.zrangebyscore(
      keyScheduledMessages,
      0,
      Date.now(),
      0,
      9,
      cb,
    );
  };

  protected fetchMessages = (
    ids: string[],
    cb: ICallback<MessageEnvelope[]>,
  ): void => {
    if (ids.length) _getMessages(this.redisClient, ids, cb);
    else cb(null, []);
  };

  protected enqueueMessages = (
    messages: MessageEnvelope[],
    cb: ICallback<void>,
  ): void => {
    if (messages.length) {
      const { keyScheduledMessages } = redisKeys.getMainKeys();
      const keys: string[] = [keyScheduledMessages];
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
          const queue = msg.getDestinationQueue();
          const { keyMessage: keyScheduledMessage } = redisKeys.getMessageKeys(
            msg.getId(),
          );
          const nextScheduleTimestamp = msg.getNextScheduledTimestamp();
          const scheduledMessageState = msg
            .getMessageState()
            .setLastScheduledAt(ts);
          const {
            keyQueueProperties,
            keyQueuePending,
            keyPriorityQueuePending,
            keyQueueScheduled,
            keyQueueMessages,
          } = redisKeys.getQueueKeys(queue);

          let newMessage: MessageEnvelope | null = null;
          let newMessageState: MessageState | null = null;
          let newMessageId: string = '';
          let newKeyMessage: string = '';

          const hasBeenUnacknowledged =
            msg.producibleMessage.getRetryDelay() > 0 &&
            msg.getMessageState().getAttempts() > 0;

          if (!hasBeenUnacknowledged) {
            newMessage = _fromMessage(msg, null, null);
            newMessage.producibleMessage.resetScheduledParams();
            newMessageState = newMessage
              .getMessageState()
              .setPublishedAt(ts)
              .setScheduledMessageId(msg.getId());
            newMessageId = newMessageState.getId();
            newKeyMessage = redisKeys.getMessageKeys(newMessageId).keyMessage;
          }

          keys.push(
            newKeyMessage,
            keyQueuePending,
            keyQueueProperties,
            keyQueueMessages,
            keyPriorityQueuePending,
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
            this.redisClient.runScript(
              ELuaScriptName.PUBLISH_SCHEDULED_MESSAGE,
              keys,
              argv,
              (err, reply) => {
                if (err) cb(err);
                else if (reply !== 'OK') cb(new WorkerError(String(reply)));
                else cb();
              },
            );
          }
        },
      );
    } else cb();
  };

  work = (cb: ICallback<void>): void => {
    async.waterfall(
      [this.fetchMessageIds, this.fetchMessages, this.enqueueMessages],
      cb,
    );
  };
}

export default PublishScheduledWorker;

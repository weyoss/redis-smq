/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { redisKeys } from '../common/redis-keys/redis-keys';
import {
  async,
  CallbackEmptyReplyError,
  ICallback,
  RedisClient,
  Worker,
  WorkerError,
} from 'redis-smq-common';
import {
  EMessageProperty,
  EMessagePropertyStatus,
  EQueueProperty,
} from '../../types';
import { ELuaScriptName } from '../common/redis-client/redis-client';
import { _getMessage } from '../lib/message/_get-message';

export class DelayUnacknowledgedWorker extends Worker {
  protected redisKeys: ReturnType<(typeof redisKeys)['getMainKeys']>;
  protected redisClient: RedisClient;

  constructor(redisClient: RedisClient, managed: boolean) {
    super(managed);
    this.redisClient = redisClient;
    this.redisKeys = redisKeys.getMainKeys();
  }

  work = (cb: ICallback<void>): void => {
    const { keyDelayedMessages, keyScheduledMessages } =
      redisKeys.getMainKeys();
    this.redisClient.lrange(keyDelayedMessages, 0, 9, (err, reply) => {
      if (err) cb(err);
      else {
        const messageIds = reply ?? [];
        if (messageIds.length) {
          const keys: string[] = [keyScheduledMessages, keyDelayedMessages];
          const args: (string | number)[] = [
            EQueueProperty.QUEUE_TYPE,
            EQueueProperty.MESSAGES_COUNT,
            EMessageProperty.MESSAGE,
            EMessageProperty.STATUS,
            EMessagePropertyStatus.SCHEDULED,
            EMessageProperty.STATE,
            '1',
          ];
          async.each(
            messageIds,
            (messageId, _, done) => {
              _getMessage(this.redisClient, messageId, (err, message) => {
                if (err) done(err);
                else if (!message) cb(new CallbackEmptyReplyError());
                else {
                  const messageId = message.getId();
                  const {
                    keyQueueProperties,
                    keyQueueMessages,
                    keyQueueScheduled,
                  } = redisKeys.getQueueKeys(
                    message.getDestinationQueue(),
                    message.getConsumerGroupId(),
                  );
                  const { keyMessage } = redisKeys.getMessageKeys(messageId);
                  keys.push(
                    keyQueueMessages,
                    keyQueueProperties,
                    keyMessage,
                    keyQueueScheduled,
                  );
                  args.push(messageId, '');
                  const delay = message.producibleMessage.getRetryDelay();
                  const messageState = message.getMessageState();
                  messageState.incrAttempts();
                  messageState.setNextRetryDelay(delay);
                  const timestamp = message.getNextScheduledTimestamp();
                  args.push(timestamp, JSON.stringify(messageState));
                  done();
                }
              });
            },
            (err) => {
              if (err) cb(err);
              else {
                this.redisClient.runScript(
                  ELuaScriptName.SCHEDULE_MESSAGE,
                  keys,
                  args,
                  (err, reply) => {
                    if (err) cb(err);
                    else if (!reply) cb(new CallbackEmptyReplyError());
                    else if (reply !== 'OK') cb(new WorkerError(String(reply)));
                    else cb();
                  },
                );
              }
            },
          );
        } else cb();
      }
    });
  };
}

export default DelayUnacknowledgedWorker;

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
  PanicError,
} from 'redis-smq-common';
import { ELuaScriptName } from '../../../common/redis-client/scripts/scripts.js';
import { redisKeys } from '../../../common/redis-keys/redis-keys.js';
import { IRedisSMQConfigRequired } from '../../../config/index.js';
import { _getMessage } from '../../message/_/_get-message.js';
import {
  EMessageProperty,
  EMessagePropertyStatus,
} from '../../message/index.js';
import { EQueueProperty } from '../../queue/index.js';
import { Worker } from './worker.js';

class DelayUnacknowledgedWorker extends Worker {
  work = (cb: ICallback<void>): void => {
    const { keyDelayedMessages, keyScheduledMessages } =
      redisKeys.getMainKeys();
    const redisClient = this.redisClient.getInstance();
    if (redisClient instanceof Error) {
      cb(redisClient);
      return void 0;
    }
    redisClient.lrange(keyDelayedMessages, 0, 9, (err, reply) => {
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
              _getMessage(redisClient, messageId, (err, message) => {
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
                redisClient.runScript(
                  ELuaScriptName.SCHEDULE_MESSAGE,
                  keys,
                  args,
                  (err, reply) => {
                    if (err) cb(err);
                    else if (!reply) cb(new CallbackEmptyReplyError());
                    else if (reply !== 'OK') cb(new PanicError(String(reply)));
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

export default (config: IRedisSMQConfigRequired) =>
  new DelayUnacknowledgedWorker(config);

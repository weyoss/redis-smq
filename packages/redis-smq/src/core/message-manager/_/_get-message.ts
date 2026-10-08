/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
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
import { keys } from '../../common/redis/keys/keys.js';
import { MessageEnvelope } from '../../message/message-envelope.js';
import { _parseMessage } from './_parse-message.js';
import { MessageNotFoundError } from '../../errors/index.js';

export function _getMessage(
  redisClient: IRedisClient,
  messageId: string,
  cb: ICallback<MessageEnvelope>,
): void {
  const { keyMessage } = keys.getMessageKeys(messageId);
  redisClient.hgetall(keyMessage, (err, reply) => {
    if (err) cb(err);
    else if (!reply || !Object.keys(reply).length)
      cb(new MessageNotFoundError());
    else cb(null, _parseMessage(reply));
  });
}

export function _getMessages(
  redisClient: IRedisClient,
  messageIds: string[],
  cb: ICallback<MessageEnvelope[]>,
): void {
  // Pre-size the result array and assign by input index so the output
  // order is deterministic regardless of the order in which the
  // concurrent Redis reads complete. The public contract for
  // IMessageManager.getMessagesByIds guarantees that the nth result
  // corresponds to the nth input ID.
  const messages = new Array<MessageEnvelope>(messageIds.length);
  async.eachOf(
    messageIds,
    (id, index, done) => {
      _getMessage(redisClient, id, (err, message) => {
        if (err) return done(err);
        if (!message) return done(new CallbackEmptyReplyError());
        messages[index] = message;
        done();
      });
    },
    (err) => {
      if (err) return cb(err);
      cb(null, messages);
    },
  );
}

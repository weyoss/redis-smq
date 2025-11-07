/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { async, ICallback, IRedisClient } from 'redis-smq-common';
import { redisKeys } from '../../common/redis-keys/redis-keys.js';
import { MessageEnvelope } from '../../message/message-envelope.js';
import { _parseMessage } from './_parse-message.js';
import { MessageNotFoundError } from '../../errors/index.js';

export function _getMessage(
  redisClient: IRedisClient,
  messageId: string,
  cb: ICallback<MessageEnvelope>,
): void {
  const { keyMessage } = redisKeys.getMessageKeys(messageId);
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
  const messages: MessageEnvelope[] = [];
  async.eachOf(
    messageIds,
    (id, _, done) => {
      async.withCallback(
        (cb: ICallback<MessageEnvelope>) => _getMessage(redisClient, id, cb),
        (message, cb) => {
          messages.push(message);
          cb();
        },
        done,
      );
    },
    (err) => {
      if (err) cb(err);
      else cb(null, messages);
    },
  );
}

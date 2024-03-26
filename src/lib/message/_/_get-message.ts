/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { async, ICallback, IRedisClient } from 'redis-smq-common';
import { redisKeys } from '../../../common/redis-keys/redis-keys.js';
import { MessageNotFoundError } from '../errors/index.js';
import { MessageEnvelope } from '../message-envelope.js';
import { EMessageProperty } from '../types/index.js';
import { _fromMessage } from './_from-message.js';

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
    else
      cb(
        null,
        _fromMessage(
          reply[EMessageProperty.MESSAGE],
          Number(reply[EMessageProperty.STATUS]),
          reply[EMessageProperty.STATE],
        ),
      );
  });
}

export function _getMessages(
  redisClient: IRedisClient,
  messageIds: string[],
  cb: ICallback<MessageEnvelope[]>,
): void {
  const messages: MessageEnvelope[] = [];
  async.each(
    messageIds,
    (id, index, done) => {
      const { keyMessage } = redisKeys.getMessageKeys(id);
      redisClient.hgetall(keyMessage, (err, reply) => {
        if (err) done(err);
        else if (!reply || !Object.keys(reply).length) {
          done(new MessageNotFoundError());
        } else {
          const msg = _fromMessage(
            reply[EMessageProperty.MESSAGE],
            Number(reply[EMessageProperty.STATUS]),
            reply[EMessageProperty.STATE],
          );
          messages.push(msg);
          done();
        }
      });
    },
    (err) => {
      if (err) cb(err);
      else cb(null, messages);
    },
  );
}

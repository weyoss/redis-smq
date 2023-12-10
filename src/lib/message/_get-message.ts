/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { async, RedisClient, ICallback } from 'redis-smq-common';
import { MessageEnvelope } from './message-envelope';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { EMessageProperty } from '../../../types';
import { _fromMessage } from './_from-message';
import { MessageNotFoundError } from './errors/message-not-found.error';

export function _getMessage(
  redisClient: RedisClient,
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
  redisClient: RedisClient,
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

/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { async, RedisClient, ICallback } from 'redis-smq-common';
import { Message } from '../../message/message';
import { redisKeys } from '../../../common/redis-keys/redis-keys';
import { QueueMessageNotFoundError } from '../errors';
import { EMessageProperty } from '../../../../types';
import { _fromMessage } from '../../message/_from-message';

export function _getMessage(
  redisClient: RedisClient,
  messageId: string,
  cb: ICallback<Message>,
): void {
  const { keyMessage } = redisKeys.getMessageKeys(messageId);
  redisClient.hgetall(keyMessage, (err, reply) => {
    if (err) cb(err);
    else if (!reply || !Object.keys(reply).length)
      cb(new QueueMessageNotFoundError());
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
  cb: ICallback<Message[]>,
): void {
  const messages: Message[] = [];
  async.each(
    messageIds,
    (id, index, done) => {
      const { keyMessage } = redisKeys.getMessageKeys(id);
      redisClient.hgetall(keyMessage, (err, reply) => {
        if (err) done(err);
        else if (!reply || !Object.keys(reply).length) {
          done(new QueueMessageNotFoundError());
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

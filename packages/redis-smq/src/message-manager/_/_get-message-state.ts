/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback, IRedisClient } from 'redis-smq-common';
import { redisKeys } from '../../common/redis/redis-keys/redis-keys.js';
import { MessageState } from '../../message/message-state.js';
import { _parseMessageState } from './_parse-message-state.js';
import { MessageNotFoundError } from '../../errors/index.js';

export function _getMessageState(
  redisClient: IRedisClient,
  messageId: string,
  cb: ICallback<MessageState>,
): void {
  const { keyMessage } = redisKeys.getMessageKeys(messageId);
  redisClient.hgetall(keyMessage, (err, result) => {
    if (err) {
      cb(err);
    } else if (!result || !Object.keys(result).length) {
      cb(new MessageNotFoundError());
    } else {
      const messageState = _parseMessageState(result);
      cb(null, messageState);
    }
  });
}

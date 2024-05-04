/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback, IRedisClient } from 'redis-smq-common';
import { redisKeys } from '../../../common/redis-keys/redis-keys.js';
import { MessageMessageNotFoundError } from '../errors/index.js';
import { EMessageProperty, IMessageStateTransferable } from '../types/index.js';

export function _getMessageState(
  redisClient: IRedisClient,
  messageId: string,
  cb: ICallback<IMessageStateTransferable>,
): void {
  const { keyMessage } = redisKeys.getMessageKeys(messageId);
  redisClient.hget(keyMessage, String(EMessageProperty.STATE), (err, reply) => {
    if (err) cb(err);
    else if (!reply) cb(new MessageMessageNotFoundError());
    else cb(null, JSON.parse(reply));
  });
}

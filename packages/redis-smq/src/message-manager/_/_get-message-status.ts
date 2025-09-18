/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback, IRedisClient } from 'redis-smq-common';
import { redisKeys } from '../../common/redis-keys/redis-keys.js';
import {
  EMessageProperty,
  EMessagePropertyStatus,
} from '../../message/index.js';
import { MessageManagerMessageNotFoundError } from '../errors/index.js';

export function _getMessageStatus(
  redisClient: IRedisClient,
  messageId: string,
  cb: ICallback<EMessagePropertyStatus>,
): void {
  const { keyMessage } = redisKeys.getMessageKeys(messageId);
  redisClient.hget(
    keyMessage,
    String(EMessageProperty.STATUS),
    (err, reply) => {
      if (err) cb(err);
      else if (!reply) cb(new MessageManagerMessageNotFoundError());
      else cb(null, Number(reply));
    },
  );
}

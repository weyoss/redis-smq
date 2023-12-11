/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback, RedisClient } from 'redis-smq-common';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { EMessageProperty, EMessagePropertyStatus } from '../../../types';
import { MessageNotFoundError } from './errors';

export function _getMessageStatus(
  redisClient: RedisClient,
  messageId: string,
  cb: ICallback<EMessagePropertyStatus>,
): void {
  const { keyMessage } = redisKeys.getMessageKeys(messageId);
  redisClient.hget(
    keyMessage,
    String(EMessageProperty.STATUS),
    (err, reply) => {
      if (err) cb(err);
      else if (!reply) cb(new MessageNotFoundError());
      else cb(null, Number(reply));
    },
  );
}

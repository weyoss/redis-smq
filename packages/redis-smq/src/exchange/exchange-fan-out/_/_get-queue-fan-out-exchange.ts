/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  CallbackEmptyReplyError,
  ICallback,
  IRedisClient,
} from 'redis-smq-common';
import { _getQueueProperties } from '../../../queue-manager/_/_get-queue-properties.js';
import { IQueueParams } from '../../../queue-manager/index.js';

export function _getQueueFanOutExchange(
  redisClient: IRedisClient,
  queue: IQueueParams,
  cb: ICallback<string | null>,
): void {
  _getQueueProperties(redisClient, queue, (err, reply) => {
    if (err) cb(err);
    else if (!reply) cb(new CallbackEmptyReplyError());
    else {
      const eName = reply.fanoutExchange;
      cb(null, eName);
    }
  });
}

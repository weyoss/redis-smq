/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
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
import { redisKeys } from '../../common/redis/redis-keys/redis-keys.js';
import { IQueueParams } from '../../queue-manager/index.js';

export function _getNamespaceQueues(
  client: IRedisClient,
  ns: string,
  cb: ICallback<IQueueParams[]>,
): void {
  const { keyNamespaceQueues } = redisKeys.getNamespaceKeys(ns);
  client.sscanAll(keyNamespaceQueues, {}, (err, reply) => {
    if (err) cb(err);
    else if (!reply) cb(new CallbackEmptyReplyError());
    else {
      const queues: IQueueParams[] = reply.map((i) => JSON.parse(i));
      cb(null, queues);
    }
  });
}

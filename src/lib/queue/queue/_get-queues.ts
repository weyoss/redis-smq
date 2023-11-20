/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  RedisClient,
  ICallback,
  CallbackEmptyReplyError,
} from 'redis-smq-common';
import { IQueueParams } from '../../../../types';
import { redisKeys } from '../../../common/redis-keys/redis-keys';

export function _getQueues(
  client: RedisClient,
  cb: ICallback<IQueueParams[]>,
): void {
  const { keyQueues } = redisKeys.getMainKeys();
  client.sscanAll(keyQueues, {}, (err, reply) => {
    if (err) cb(err);
    else if (!reply) cb(new CallbackEmptyReplyError());
    else {
      const queues: IQueueParams[] = reply.map((i) => JSON.parse(i));
      cb(null, queues);
    }
  });
}

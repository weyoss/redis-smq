/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback, IRedisClient } from 'redis-smq-common';
import { redisKeys } from '../../../../common/redis-keys/redis-keys.js';
import { IQueueParams } from '../../../queue/index.js';

export function _getFanOutExchangeQueues(
  redisClient: IRedisClient,
  exchange: string,
  cb: ICallback<IQueueParams[]>,
): void {
  const { keyExchangeBindings } = redisKeys.getFanOutExchangeKeys(exchange);
  redisClient.sscanAll(keyExchangeBindings, {}, (err, reply) => {
    if (err) cb(err);
    else {
      const queues: IQueueParams[] = (reply ?? []).map((i) => JSON.parse(i));
      cb(null, queues);
    }
  });
}

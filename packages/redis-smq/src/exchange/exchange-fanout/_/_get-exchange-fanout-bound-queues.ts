/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback, IRedisClient } from 'redis-smq-common';
import { redisKeys } from '../../../common/redis/redis-keys/redis-keys.js';
import { IQueueParams } from '../../../queue-manager/index.js';
import { IExchangeParams } from '../../types/index.js';

export function _getExchangeFanoutBoundQueues(
  client: IRedisClient,
  exchange: IExchangeParams,
  cb: ICallback<IQueueParams[]>,
) {
  const { keyFanoutQueues } = redisKeys.getExchangeFanoutKeys(
    exchange.ns,
    exchange.name,
  );
  client.sscanAll(keyFanoutQueues, {}, (err, reply) => {
    if (err) return cb(err);
    const queues: IQueueParams[] = (reply || []).map((i) => JSON.parse(i));
    cb(null, queues);
  });
}

/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback, IRedisClient } from 'redis-smq-common';
import { keys } from '../../common/redis/keys/keys.js';
import { IExchangeParams } from '../../../contracts/index.js';
import { IQueueParams } from '../../../contracts/index.js';

export function _getBoundQueues(
  client: IRedisClient,
  exchange: IExchangeParams,
  cb: ICallback<IQueueParams[]>,
) {
  const { keyFanoutQueues } = keys.getExchangeFanoutKeys(
    exchange.ns,
    exchange.name,
  );
  client.sscanAll(keyFanoutQueues, {}, (err, reply) => {
    if (err) return cb(err);
    const queues: IQueueParams[] = (reply || []).map((i) => JSON.parse(i));
    cb(null, queues);
  });
}

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
import { IExchangeParams } from '../types/index.js';
import { IQueueParams } from '../../queue-manager/index.js';
import { keys } from '../../common/redis/keys/keys.js';

export function _getRoutingKeyBoundQueues(
  client: IRedisClient,
  exchange: IExchangeParams,
  routingKey: string,
  cb: ICallback<IQueueParams[]>,
) {
  const { keyRoutingKeyQueues } = keys.getExchangeDirectRoutingKeyKeys(
    exchange.ns,
    exchange.name,
    routingKey,
  );
  client.smembers(keyRoutingKeyQueues, (err, res) => {
    if (err) return cb(err);
    if (!res) return cb(new CallbackEmptyReplyError());

    const queues: IQueueParams[] = [];
    for (const raw of res) {
      const q: IQueueParams = JSON.parse(raw);
      queues.push(q);
    }
    cb(null, queues);
  });
}

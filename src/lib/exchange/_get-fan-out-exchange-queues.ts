/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback, RedisClient } from 'redis-smq-common';
import { ExchangeFanOut } from './exchange-fan-out';
import { IQueueParams } from '../../../types';
import { redisKeys } from '../../common/redis-keys/redis-keys';

export function _getFanOutExchangeQueues(
  redisClient: RedisClient,
  exchange: ExchangeFanOut,
  cb: ICallback<IQueueParams[]>,
): void {
  const { keyExchangeBindings } = redisKeys.getFanOutExchangeKeys(
    exchange.getBindingParams(),
  );
  redisClient.sscanAll(keyExchangeBindings, {}, (err, reply) => {
    if (err) cb(err);
    else {
      const queues: IQueueParams[] = (reply ?? []).map((i) => JSON.parse(i));
      cb(null, queues);
    }
  });
}

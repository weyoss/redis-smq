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
import { ExchangeNotFoundError } from '../../errors/index.js';
import { IQueueParams } from '../../queue-manager/index.js';
import { EExchangeProperty, IExchangeProperties } from '../types/index.js';

export function _getExchangeProperties(
  client: IRedisClient,
  exchange: IQueueParams,
  cb: ICallback<IExchangeProperties>,
) {
  const { keyExchange } = redisKeys.getExchangeKeys(exchange.ns, exchange.name);
  client.hgetall(keyExchange, (err, rawProperties) => {
    if (err) return cb(err);
    if (!rawProperties || !Object.keys(rawProperties).length)
      return cb(new ExchangeNotFoundError());
    const exchangeProperties: IExchangeProperties = {
      type: Number(rawProperties[EExchangeProperty.TYPE]),
      queuePolicy: Number(rawProperties[EExchangeProperty.QUEUE_POLICY]),
    };
    cb(null, exchangeProperties);
  });
}

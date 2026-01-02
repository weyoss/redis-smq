/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { EExchangeProperty, IExchangeParsedParams } from '../types/index.js';
import { ICallback, IRedisClient } from 'redis-smq-common';
import { redisKeys } from '../../common/redis/redis-keys/redis-keys.js';
import {
  ExchangeNotFoundError,
  ExchangeTypeMismatchError,
} from '../../errors/index.js';

export function _validateExchange(
  client: IRedisClient,
  exchange: IExchangeParsedParams,
  required: boolean,
  cb: ICallback,
) {
  const { keyExchange } = redisKeys.getExchangeKeys(exchange.ns, exchange.name);
  client.hget(keyExchange, String(EExchangeProperty.TYPE), (err, reply) => {
    if (err) return cb(err);
    if (reply == null) {
      if (required) return cb(new ExchangeNotFoundError());
      return cb();
    }
    const existingType = Number(reply);
    if (existingType !== exchange.type) {
      return cb(
        new ExchangeTypeMismatchError({
          metadata: { expected: exchange.type, actual: existingType },
        }),
      );
    }
    cb();
  });
}
